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
import hostTourRoutes from "./routes/hostTourRoutes";

dotenv.config();

const app = express();

// ========================= GLOBAL MIDDLEWARES =========================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve static image uploads if needed

// ========================= ROUTE MOUNTING =========================

// Auth routes (register, login, etc.)
app.use("/api/auth", authRoutes);

// Admin routes (manage users, hosts, bookings, properties, tours)
app.use("/api/admin", adminRoutes);               // CRUD for users and hosts
app.use("/api/admin", adminPropertyRoutes);       // CRUD for properties (admin only)
app.use("/api/admin", tourRoutes);                // CRUD for tour packages (admin + host)

// General booking routes (user, host, admin access)
app.use("/api/bookings", bookingRoutes);          // create, update, cancel, summaries

// Host-specific routes (bookings, properties, tours)
app.use("/api/host/bookings", hostBookingRoutes); // host-only booking filters, export
app.use("/api/host", hostPropertyRoutes);         // host property management
app.use("/api/host", hostTourRoutes);             // host tour package management

// User-specific routes (profile update, preferences, etc.)
app.use("/api/users", userRoutes);                // update profile, view info

export default app;
