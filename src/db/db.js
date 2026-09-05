import mongoose from "mongoose";

const connectDB = async () => {
    try {
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