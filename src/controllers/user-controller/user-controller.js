import UserModal from "../../modals/user-modal/user-modal.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});


// ======================================================
// HELPER - GENERATE OTP
// ======================================================

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


// ======================================================
// HELPER - SEND OTP EMAIL
// ======================================================

const sendOTPEmail = async (email, otp, purpose) => {

    const subject =
        purpose === "verification"
            ? "Email Verification Code"
            : "Password Reset Code";

    const title =
        purpose === "verification"
            ? "Verify Your Email"
            : "Reset Your Password";

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: subject,

        html: `
            <!DOCTYPE html>
            <html>
            <body style="
                margin:0;
                padding:40px 20px;
                background:#f4f7fb;
                font-family:Arial, sans-serif;
            ">

                <div style="
                    max-width:500px;
                    margin:auto;
                    background:white;
                    padding:40px;
                    border-radius:15px;
                    text-align:center;
                ">

                    <h2>${title}</h2>

                    <p>
                        Your verification code is:
                    </p>

                    <h1 style="
                        color:#4f46e5;
                        font-size:38px;
                        letter-spacing:8px;
                    ">
                        ${otp}
                    </h1>

                    <p style="color:#666;">
                        This code will expire in 10 minutes.
                    </p>

                    <p style="
                        color:#999;
                        font-size:13px;
                    ">
                        If you did not request this code,
                        you can safely ignore this email.
                    </p>

                </div>

            </body>
            </html>
        `
    });
};


// ======================================================
// SIGN UP
// ======================================================

const createUser = async (req, res) => {

    try {

        const {
            userName,
            email,
            password,
            role
        } = req.body;


        // Validation

        if (
            !userName ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).send({
                status: false,
                message: "All fields are required!"
            });

        }


        // Check role

        if (
            role !== "trainer" &&
            role !== "student"
        ) {

            return res.status(400).send({
                status: false,
                message: "Invalid role!"
            });

        }


        // Check existing user

        const existingUser =
            await UserModal.findOne({ email });


        if (existingUser) {

            return res.status(400).send({
                status: false,
                message: "Email already exists!"
            });

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Generate verification OTP

        const otp = generateOTP();

        const otpExpiry =
            new Date(Date.now() + 10 * 60 * 1000);


        // Create user

        const newUser = new UserModal({

            userName,

            email,

            password: hashedPassword,

            role,

            isEmailVerified: false,

            verificationCode: otp,

            verificationCodeExpiry: otpExpiry

        });


        await newUser.save();


        // Send verification email

        await sendOTPEmail(
            email,
            otp,
            "verification"
        );


        return res.status(201).send({

            status: true,

            message:
                "Account created. Verification code sent to your email."

        });

    }

    catch (error) {

        console.log(
            "Signup Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmail = async (req, res) => {

    try {

        const {
            email,
            code
        } = req.body;


        if (!email || !code) {

            return res.status(400).send({

                status: false,

                message:
                    "Email and verification code are required!"

            });

        }


        const user =
            await UserModal.findOne({ email });


        if (!user) {

            return res.status(404).send({

                status: false,

                message:
                    "User not found!"

            });

        }


        if (user.isEmailVerified) {

            return res.status(400).send({

                status: false,

                message:
                    "Email is already verified!"

            });

        }


        // Check expiry

        if (
            !user.verificationCodeExpiry ||
            user.verificationCodeExpiry < new Date()
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Verification code has expired!"

            });

        }


        // Check OTP

        if (
            user.verificationCode !== code
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Invalid verification code!"

            });

        }


        // Verify user

        user.isEmailVerified = true;

        user.verificationCode = null;

        user.verificationCodeExpiry = null;

        await user.save();


        return res.status(200).send({

            status: true,

            message:
                "Email verified successfully!"

        });

    }

    catch (error) {

        console.log(
            "Verify Email Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// LOGIN
// ======================================================

const handleLogIn = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).send({

                status: false,

                message:
                    "Email and password are required!"

            });

        }


        const user =
            await UserModal.findOne({ email });


        if (!user) {

            return res.status(401).send({

                status: false,

                message:
                    "Invalid email or password!"

            });

        }


        // Email verification check

        if (!user.isEmailVerified) {

            return res.status(403).send({

                status: false,

                message:
                    "Please verify your email before logging in!"

            });

        }


        // Check password

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).send({

                status: false,

                message:
                    "Invalid email or password!"

            });

        }


        // Generate JWT

        const token = jwt.sign(

            {
                id: user._id,
                name: user.userName,
                email: user.email,
                role: user.role
            },

            process.env.JWT_Secret,

            {
                expiresIn: "1h"
            }

        );


        return res.status(200).send({

            status: true,

            message:
                "Login successful!",

            token,

            user: {

                id: user._id,

                userName: user.userName,

                email: user.email,

                role: user.role

            }

        });

    }

    catch (error) {

        console.log(
            "Login Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// FORGOT PASSWORD - SEND OTP
// ======================================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;


        if (!email) {

            return res.status(400).send({

                status: false,

                message:
                    "Email is required!"

            });

        }


        const user =
            await UserModal.findOne({ email });


        // Don't expose whether email exists

        if (!user) {

            return res.status(200).send({

                status: true,

                message:
                    "If this email exists, a reset code has been sent."

            });

        }


        const otp = generateOTP();

        const otpExpiry =
            new Date(Date.now() + 10 * 60 * 1000);


        user.resetPasswordCode = otp;

        user.resetPasswordCodeExpiry =
            otpExpiry;


        await user.save();


        await sendOTPEmail(
            email,
            otp,
            "reset"
        );


        return res.status(200).send({

            status: true,

            message:
                "Password reset code sent to your email."

        });

    }

    catch (error) {

        console.log(
            "Forgot Password Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// VERIFY RESET CODE
// ======================================================

const verifyResetCode = async (req, res) => {

    try {

        const {
            email,
            code
        } = req.body;


        if (!email || !code) {

            return res.status(400).send({

                status: false,

                message:
                    "Email and code are required!"

            });

        }


        const user =
            await UserModal.findOne({ email });


        if (!user) {

            return res.status(400).send({

                status: false,

                message:
                    "Invalid reset code!"

            });

        }


        if (
            !user.resetPasswordCodeExpiry ||
            user.resetPasswordCodeExpiry < new Date()
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Reset code has expired!"

            });

        }


        if (
            user.resetPasswordCode !== code
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Invalid reset code!"

            });

        }


        return res.status(200).send({

            status: true,

            message:
                "Reset code verified successfully!"

        });

    }

    catch (error) {

        console.log(
            "Verify Reset Code Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {

    try {

        const {
            email,
            code,
            newPassword
        } = req.body;


        if (
            !email ||
            !code ||
            !newPassword
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Email, code and new password are required!"

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).send({

                status: false,

                message:
                    "Password must be at least 6 characters!"

            });

        }


        const user =
            await UserModal.findOne({ email });


        if (!user) {

            return res.status(400).send({

                status: false,

                message:
                    "Invalid reset request!"

            });

        }


        // Check expiry

        if (
            !user.resetPasswordCodeExpiry ||
            user.resetPasswordCodeExpiry < new Date()
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Reset code has expired!"

            });

        }


        // Check OTP

        if (
            user.resetPasswordCode !== code
        ) {

            return res.status(400).send({

                status: false,

                message:
                    "Invalid reset code!"

            });

        }


        // Hash new password

        user.password =
            await bcrypt.hash(
                newPassword,
                10
            );


        // Clear reset code

        user.resetPasswordCode = null;

        user.resetPasswordCodeExpiry = null;


        await user.save();


        return res.status(200).send({

            status: true,

            message:
                "Password reset successfully!"

        });

    }

    catch (error) {

        console.log(
            "Reset Password Error:",
            error
        );

        return res.status(500).send({

            status: false,

            message:
                "Internal server error!"

        });

    }
};


// ======================================================
// EXPORT
// ======================================================

export {
    createUser,
    verifyEmail,
    handleLogIn,
    forgotPassword,
    verifyResetCode,
    resetPassword
};

