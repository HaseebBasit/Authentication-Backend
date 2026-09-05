// All user related controller functions are defined here...!

import UserModal from "../../modals/user-modal/user-modal.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodeCache from "node-cache";
import nodemailer from "nodemailer";

// Log in controller...!
const handleLogIn = async (req, res) => {
    try {
        const { email, password } = req?.body;

        if (!email || !password) {
            return res.status(400).send({
                status: false,
                message: "Validation Err"
            });
        };

        const isUserExist = await UserModal.findOne({ email: email });
        if (!isUserExist) {
            return res.status(401).send({
                status: false,
                message: "User does not exist"
            });
        };

        const checkPassword = await bcrypt.compare(password, isUserExist.password);
        if (!checkPassword) {
            return res.status(404).send({
                status: false,
                message: "Password did not match"
            });
        };

        // Generating token:
        const token = jwt.sign(
            {
                name: isUserExist.userName,
                email: isUserExist.email
            },
            process.env.JWT_Secret,
            {
                expiresIn: '1h'
            }
        );

        // 200
        return res.status(200).send({
            status: true,
            message: "You have logged in successfully",
            // data: isUserExist,
            token: token
        });
    }

    catch (error) {
        console.log(`Err while login user: ${error}`);
        return res.status(500).send({
            status: false,
            message: "Err while login user!"
        });
    };
};



const handleSendEmail = async (req, res) => {
    const { userEmail } = req?.body;
    console.log('Email:', userEmail);

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Provider email info...!
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        // Receiver info...!
        const receiverDetails = {
            from: process.env.EMAIL,
            to: userEmail,
            subject: "Email Verification Process",
            // text: 'Your OTP is 1234'
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Verification Code</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb; padding:40px 15px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#4f46e5; padding:30px 20px;">
              <h1 style="margin:0; color:#ffffff; font-size:26px;">
                Verify Your Account
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 35px; text-align:center;">

              <p style="margin:0 0 15px; font-size:16px; line-height:1.6;">
                Hello,
              </p>

              <p style="margin:0 0 30px; font-size:16px; line-height:1.6; color:#4b5563;">
                Use the verification code below to complete your request.
              </p>

              <!-- OTP -->
              <div style="
                display:inline-block;
                background:#f3f4ff;
                border:1px solid #e0e7ff;
                border-radius:12px;
                padding:18px 35px;
                margin-bottom:30px;
              ">
                <span style="
                  font-size:36px;
                  font-weight:bold;
                  letter-spacing:8px;
                  color:#4f46e5;
                ">
                  ${otp}
                </span>
              </div>

              <p style="margin:0 0 10px; font-size:14px; color:#6b7280;">
                This code will expire shortly.
              </p>

              <p style="margin:0; font-size:14px; line-height:1.6; color:#9ca3af;">
                If you didn't request this code, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; background:#f9fafb; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Your Company. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
        };

        const sendEmail = transporter.sendMail(receiverDetails);
        if (sendEmail) {
            console.log('Email send successfully!');
            return res.status(200).send({
                status: true,
                message: "Email send successfully"
            });
        };
    }

    catch (error) {
        console.log('Err while sending email:', error);
    };
};


export {handleLogIn,handleSendEmail};