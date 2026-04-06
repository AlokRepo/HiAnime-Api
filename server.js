import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createApiRoutes } from "./src/routes/apiRoutes.js";

// 1. Initialize environment variables immediately
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4444;
const __filename = fileURLToPath(import.meta.url);
const publicDir = path.join(dirname(__filename), "public");

// 2. Parse origins safely. Defaults to "*" if env is missing to prevent 403 lockouts.
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim()) 
  : ["*"];

// 3. Robust CORS Middleware
// This handles preflight (OPTIONS) and origin validation in one go
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or UptimeRobot)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Blocked: Origin ${origin} not in ${allowedOrigins}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 4. Static Files
app.use(express.static(publicDir, { redirect: false }));

// 5. Response Helpers
const jsonResponse = (res, data, status = 200) =>
  res.status(status).json({ success: true, results: data });

const jsonError = (res, message = "Internal server error", status = 500) =>
  res.status(status).json({ success: false, message });

// 6. Initialize Routes
createApiRoutes(app, jsonResponse, jsonError);

// 7. 404 Handler
app.use((req, res) => {
  const filePath = path.join(publicDir, "404.html");
  if (fs.existsSync(filePath)) {
    res.status(404).sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: "Route not found" });
  }
});

// 8. Start Server
app.listen(PORT, () => {
  console.info(`---------------------------------------`);
  console.info(`🚀 HiAnime API running on port ${PORT}`);
  console.info(`🌍 Allowed Origins: ${allowedOrigins.join(", ")}`);
  console.info(`---------------------------------------`);
});
