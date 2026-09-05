import express from "express";
import {
  handleSignUp,
  handleVerifyOTP,
  handleLogIn,
  handleSendEmail
} from "../../controllers/user-controller/user-controller.js";

const router = express.Router();

router.route("/signup").post(handleSignUp);
router.route("/verify-otp").post(handleVerifyOTP);
router.route("/login").post(handleLogIn);
router.route("/send/mail").post(handleSendEmail);

export default router;