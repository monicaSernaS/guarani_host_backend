import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import tourRoutes from "./routes/tourPackageRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import hostBookingRoutes from "./routes/hostBookingRoutes"; 


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Optional: serve static files

// General Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", propertyRoutes);
app.use("/api/admin", tourRoutes);
app.use("/api/bookings", bookingRoutes);          // user + admin
app.use("/api/host/bookings", hostBookingRoutes); // host only

export default app;

