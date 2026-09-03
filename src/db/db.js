import mongoose from "mongoose";

const connectDB = async () => {
    try {

        console.log("DB_URL exists:", !!process.env.DB_URL);
        console.log(
            "DB_URL starts with:",
            process.env.DB_URL?.substring(0, 20)
        );

        const res = await mongoose.connect(
            process.env.DB_URL,
            {
                dbName: "testing"
            }
        );

        console.log("Mongo DB connected successfully!");

        return res;

    } catch (error) {

        console.log(
            "Something went wrong while connecting DB:",
            error
        );

        throw error;
    }
};

export default connectDB;