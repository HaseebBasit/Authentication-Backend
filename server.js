import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from mvc-arc directory
config({ path: path.join(__dirname, ".env") });

import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./src/db/db.js";
import userRoutes from "./src/routes/user-routes/user-routes.js";

const port = process.env.PORT || 2707;
const server = express();

const limit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

server.use(compression());
server.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
server.use(morgan("dev"));
server.use(express.json());
server.use(limit);

// Health check endpoint (does not require DB connection)
server.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Authentication Backend is running successfully!",
    timestamp: new Date().toISOString(),
  });
});

// Middleware to guarantee MongoDB is connected before running any database queries
server.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error.message);
    return res.status(500).json({
      status: false,
      message:
        "Database connection failed: " +
        error.message +
        ". Make sure MongoDB Atlas Network Access has 0.0.0.0/0 whitelisted and DB_URL is configured.",
    });
  }
});

server.use(userRoutes);

// Fallback 404 handler
server.use((req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Only listen when running locally / directly (Vercel serverless imports the app)
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
    connectDB().catch((err) =>
      console.error("Initial DB connection warning:", err.message)
    );
  });
}

export default server;
