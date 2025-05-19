import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Route imports
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import adminPropertyRoutes from "./routes/adminPropertyRoutes";
import tourRoutes from "./routes/tourPackageRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import hostBookingRoutes from "./routes/hostBookingRoutes"; 
import userRoutes from "./routes/userRoutes"; 
import hostPropertyRoutes from "./routes/hostPropertyRoutes"; 


dotenv.config();

const app = express();

// ========================= GLOBAL MIDDLEWARES =========================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Optional: serve static files

// ========================= ROUTE MOUNTING =========================

// Auth routes (register, login, etc.)
app.use("/api/auth", authRoutes);

// Admin routes (users, hosts, bookings, export, etc.)
app.use("/api/admin", adminRoutes);           // Handles admins, users, hosts
app.use("/api/admin", adminPropertyRoutes);        // CRUD for properties
app.use("/api/admin", tourRoutes);            // CRUD for tour packages

// Booking routes (user + admin access)
app.use("/api/bookings", bookingRoutes);      // create, update, cancel, get summary

// Host-specific booking routes
app.use("/api/host/bookings", hostBookingRoutes); // host filters, exports, summaries
app.use("/api/host", hostPropertyRoutes); // host property management

// User routes (profile update)
app.use("/api/users", userRoutes);           // update profile, get user info

export default app;