import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import tourRoutes from "./routes/tourPackageRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import hostRoutes from "./routes/hostRoutes";


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve local uploads if needed

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", propertyRoutes);
app.use("/api/admin", tourRoutes);
app.use("/api", bookingRoutes); //both admin/host
app.use("/api/host", hostRoutes);

export default app;

