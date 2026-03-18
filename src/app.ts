import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";

import authRoutes from "./routes/authRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import listingRoutes from "./routes/listingRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const publicDir = path.resolve(process.cwd(), "public");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

fs.mkdirSync(path.join(publicDir, "uploads", "listings"), { recursive: true });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/public", express.static(publicDir));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);

app.use(errorHandler);

export default app;
