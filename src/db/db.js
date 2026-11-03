// DB Configuration with Serverless & Local Connection Caching

import mongoose from "mongoose";

const DEFAULT_DB_URL =
  "mongodb+srv://testing123:testing123@cluster0.ex87fqp.mongodb.net/?appName=Cluster0";

let cachedPromise = null;

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return await cachedPromise;
  }

  const dbUrl = process.env.DB_URL || DEFAULT_DB_URL;

  try {
    cachedPromise = mongoose.connect(dbUrl, {
      dbName: "testing",
      serverSelectionTimeoutMS: 8000, // Timeout after 8s if cluster unreachable
      connectTimeoutMS: 10000,
    });

    const res = await cachedPromise;
    console.log("Mongo DB connected successfully!");
    return res;
  } catch (error) {
    cachedPromise = null;
    console.error("Something went wrong while connecting DB:", error.message);
    throw error;
  }
};

export default connectDB;
