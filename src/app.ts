import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// =============== Route Imports ===============
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import adminBookingRoutes from "./routes/adminBookingRoutes";
import adminPropertyRoutes from "./routes/adminPropertyRoutes";
import tourRoutes from "./routes/tourPackageRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import hostBookingRoutes from "./routes/hostBookingRoutes";
import userRoutes from "./routes/userRoutes";
import hostPropertyRoutes from "./routes/hostPropertyRoutes";
import hostTourRoutes from "./routes/hostTourRoutes";
import publicPropertyRoutes from "./routes/publicPropertyRoutes";
import publicTourRoutes from "./routes/publicTourRoutes";


// Load environment variables from .env file
dotenv.config();

const app = express();

// =============== Global Middlewares ===============
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests
app.use("/uploads", express.static("uploads")); // Serve uploaded images if needed

// =============== Route Mounting ===============

// Public routes - accessible to all users (visitors, users, hosts, admins)
app.use("/api/properties", publicPropertyRoutes); // GET public properties
app.use("/api/tours", publicTourRoutes);          // GET public tour packages

// Auth routes - registration, login, password recovery
app.use("/api/auth", authRoutes);

// Admin routes - for managing users, properties, tours, and bookings
app.use("/api/admin", adminRoutes);               // Admin-only: users & hosts
app.use("/api/admin", adminBookingRoutes);        // Admin-only: bookings CRUD and filtering
app.use("/api/admin", adminPropertyRoutes);       // Admin-only: properties
app.use("/api/admin", tourRoutes);                // Admin & Host: tour packages

// General booking routes - used by user, host, and admin
app.use("/api/bookings", bookingRoutes);          // Booking CRUD and filtering

// Host-specific routes - to manage own content
app.use("/api/host", hostBookingRoutes);          // Host: bookings & filters
app.use("/api/host", hostPropertyRoutes);         // Host: properties CRUD
app.use("/api/host", hostTourRoutes);             // Host: tour packages CRUD

// User-specific routes - profile, preferences, etc.
app.use("/api/users", userRoutes);                // Update profile, fetch user info

export default app;
