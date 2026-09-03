import express from "express";

import {
    createUser,
    verifyEmail,
    handleLogIn,
    forgotPassword,
    verifyResetCode,
    resetPassword
} from "../../controllers/user-controller/user-controller.js";


const router = express.Router();


// =========================
// SIGN UP
// =========================

router
    .route("/user/save")
    .post(createUser);


// =========================
// VERIFY EMAIL
// =========================

router
    .route("/verify/email")
    .post(verifyEmail);


// =========================
// LOGIN
// =========================

router
    .route("/login")
    .post(handleLogIn);


// =========================
// FORGOT PASSWORD
// =========================

router
    .route("/forgot-password")
    .post(forgotPassword);


// =========================
// VERIFY RESET CODE
// =========================

router
    .route("/verify-reset-code")
    .post(verifyResetCode);


// =========================
// RESET PASSWORD
// =========================

router
    .route("/reset-password")
    .post(resetPassword);


export default router;

