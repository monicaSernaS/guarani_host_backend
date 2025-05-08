import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";

// Load environment variables from .env file
dotenv.config();

const app = express();

/* ========================= MIDDLEWARES ========================= */

// Enable CORS for all routes
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

/* ========================= ROUTES ========================= */

// Auth-related routes (login & register)
app.use("/api/auth", authRoutes);

// Admin dashboard routes (users & hosts management)
app.use("/api/admin", adminRoutes);

export default app;

