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
  max: 500, // Reasonable limit for dev/testing
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

server.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Authentication Backend is running successfully!",
    timestamp: new Date().toISOString(),
  });
});

server.use(userRoutes);

// Fallback 404 handler
server.use((req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

server.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  connectDB();
});
