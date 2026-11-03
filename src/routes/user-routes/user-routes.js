import express from "express";
import {
  handleSignUp,
  handleVerifyOTP,
  handleLogIn,
  handleSendEmail,
  handleForgotPassword,
  handleResetPassword,
  handleGetMe,
} from "../../controllers/user-controller/user-controller.js";
import { checkAuthenticated } from "../../middleware/custom-middleware.js";

const router = express.Router();

router.route("/signup").post(handleSignUp);
router.route("/verify-otp").post(handleVerifyOTP);
router.route("/login").post(handleLogIn);
router.route("/send/mail").post(handleSendEmail);
router.route("/forgot-password").post(handleForgotPassword);
router.route("/reset-password").post(handleResetPassword);
router.route("/me").get(checkAuthenticated, handleGetMe);

export default router;
