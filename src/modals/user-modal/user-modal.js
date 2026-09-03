import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true,
            enum: ["trainer", "student"]
        },

        // Email verification
        isEmailVerified: {
            type: Boolean,
            default: false
        },

        verificationCode: {
            type: String,
            default: null
        },

        verificationCodeExpiry: {
            type: Date,
            default: null
        },

        // Forgot password
        resetPasswordCode: {
            type: String,
            default: null
        },

        resetPasswordCodeExpiry: {
            type: Date,
            default: null
        }
    },
    {
        collection: "users",
        timestamps: true
    }
);

const UserModal = mongoose.model("users", userSchema);

export default UserModal;

