"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// =============== Route Imports ===============
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const adminBookingRoutes_1 = __importDefault(require("./routes/adminBookingRoutes"));
const adminPropertyRoutes_1 = __importDefault(require("./routes/adminPropertyRoutes"));
const tourPackageRoutes_1 = __importDefault(require("./routes/tourPackageRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const hostBookingRoutes_1 = __importDefault(require("./routes/hostBookingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const hostPropertyRoutes_1 = __importDefault(require("./routes/hostPropertyRoutes"));
const hostTourRoutes_1 = __importDefault(require("./routes/hostTourRoutes"));
const publicPropertyRoutes_1 = __importDefault(require("./routes/publicPropertyRoutes"));
const publicTourRoutes_1 = __importDefault(require("./routes/publicTourRoutes"));
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
// =============== Global Middlewares ===============
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse incoming JSON requests
app.use("/uploads", express_1.default.static("uploads")); // Serve uploaded images if needed
// =============== Route Mounting ===============
// Public routes - accessible to all users (visitors, users, hosts, admins)
app.use("/api/properties", publicPropertyRoutes_1.default); // GET public properties
app.use("/api/tours", publicTourRoutes_1.default); // GET public tour packages
// Auth routes - registration, login, password recovery
app.use("/api/auth", authRoutes_1.default);
// Admin routes - for managing users, properties, tours, and bookings
app.use("/api/admin", adminRoutes_1.default); // Admin-only: users & hosts
app.use("/api/admin", adminBookingRoutes_1.default); // Admin-only: bookings CRUD and filtering
app.use("/api/admin", adminPropertyRoutes_1.default); // Admin-only: properties
app.use("/api/admin", tourPackageRoutes_1.default); // Admin & Host: tour packages
// General booking routes - used by user, host, and admin
app.use("/api/bookings", bookingRoutes_1.default); // Booking CRUD and filtering
// Host-specific routes - to manage own content
app.use("/api/host", hostBookingRoutes_1.default); // Host: bookings & filters
app.use("/api/host", hostPropertyRoutes_1.default); // Host: properties CRUD
app.use("/api/host", hostTourRoutes_1.default); // Host: tour packages CRUD
// User-specific routes - profile, preferences, etc.
app.use("/api/users", userRoutes_1.default); // Update profile, fetch user info
exports.default = app;
