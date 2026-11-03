import UserModal from "../../modals/user-modal/user-modal.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Helper for JWT Secret
const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_Secret || "default_jwt_secret_key";

// ===================== SIGNUP =====================
const handleSignUp = async (req, res) => {
  try {
    const { userName, email, password, role = "student" } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "All fields are required (userName, email, password)",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await UserModal.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "Email already registered. Please login.",
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Optional 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user (verified by default so login works right away)
    const newUser = await UserModal.create({
      userName: userName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toLowerCase() === "trainer" ? "trainer" : "student",
      isEmailVerified: true,
      verificationCode: otp,
      verificationCodeExpiry: otpExpiry,
    });

    // Optionally attempt sending email notification in background (non-blocking)
    if (process.env.EMAIL && process.env.PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        transporter.sendMail({
          from: process.env.EMAIL,
          to: normalizedEmail,
          subject: "Welcome to Our Platform!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Welcome, ${userName}!</h2>
              <p>Your account has been successfully created.</p>
              <p>You can now log in using your email and password.</p>
            </div>
          `,
        }).catch((err) => {
          console.log("Optional email send error:", err.message);
        });
      } catch (mailErr) {
        console.log("Transporter setup error:", mailErr.message);
      }
    }

    return res.status(201).json({
      status: true,
      message: "Signup successful! You can now log in.",
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Server error during signup",
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModal.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // Verify hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
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
    console.error("Login Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Server error during login",
    });
  }
};

// ===================== VERIFY OTP (Optional) =====================
const handleVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModal.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    if (user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired",
      });
    }

    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while verifying OTP",
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModal.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = otp;
    user.verificationCodeExpiry = otpExpiry;
    await user.save();

    if (process.env.EMAIL && process.env.PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: normalizedEmail,
        subject: "Your OTP Code",
        html: `
          <h2>Your verification code is:</h2>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        `,
      });
    }

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error while sending OTP",
    });
  }
};

// ===================== GET CURRENT USER (Optional / Protected) =====================
const handleGetMe = async (req, res) => {
  try {
    const user = await UserModal.findById(req.user?.id).select("-password");
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    return res.status(200).json({ status: true, user });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

export { handleSignUp, handleVerifyOTP, handleLogIn, handleSendEmail, handleGetMe };
