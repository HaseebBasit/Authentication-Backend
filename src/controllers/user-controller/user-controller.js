import UserModal from "../../modals/user-modal/user-modal.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// ===================== SIGNUP =====================
const handleSignUp = async (req, res) => {
  try {
    const { userName, email, password, role } = req.body;

    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        status: false,
        message: "All fields are required (userName, email, password, role)",
      });
    }

    // Check if user already exists
    const existingUser = await UserModal.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "Email already registered",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (not verified yet)
    const newUser = await UserModal.create({
      userName,
      email,
      password: hashedPassword,
      role,
      isEmailVerified: false,
      verificationCode: otp,
      verificationCodeExpiry: otpExpiry,
    });

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verify your email - OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2>Email Verification</h2>
          <p>Hello <b>${userName}</b>,</p>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 8px; color: #4f46e5;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return res.status(201).json({
      status: true,
      message: "Signup successful! Please check your email for the OTP.",
    });
  } catch (error) {
    console.log("Signup Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error during signup",
    });
  }
};

// ===================== VERIFY OTP =====================
const handleVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const user = await UserModal.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: false,
        message: "Email is already verified",
      });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    if (user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired",
      });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while verifying OTP",
    });
  }
};

// ===================== LOGIN =====================
const handleLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await UserModal.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User does not exist",
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        status: false,
        message: "Please verify your email first",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: false,
        message: "Incorrect password",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        name: user.userName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_Secret,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error during login",
    });
  }
};

// ===================== RESEND OTP (Optional) =====================
const handleSendEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    const user = await UserModal.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: false,
        message: "Email is already verified",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = otp;
    user.verificationCodeExpiry = otpExpiry;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Resend OTP - Email Verification",
      html: `
        <h2>Your new verification code is:</h2>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    return res.status(200).json({
      status: true,
      message: "New OTP sent successfully",
    });
  } catch (error) {
    console.log("Resend OTP Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error while sending OTP",
    });
  }
};

export { handleSignUp, handleVerifyOTP, handleLogIn, handleSendEmail };