import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);
app.use('/api/admin', adminRoutes);

export default app;
