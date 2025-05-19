"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Route imports
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const propertyRoutes_1 = __importDefault(require("./routes/propertyRoutes"));
const tourPackageRoutes_1 = __importDefault(require("./routes/tourPackageRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const hostBookingRoutes_1 = __importDefault(require("./routes/hostBookingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ========================= GLOBAL MIDDLEWARES =========================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static("uploads")); // Optional: serve static files
// ========================= ROUTE MOUNTING =========================
// Auth routes (register, login, etc.)
app.use("/api/auth", authRoutes_1.default);
// Admin routes (users, hosts, bookings, export, etc.)
app.use("/api/admin", adminRoutes_1.default); // Handles admins, users, hosts
app.use("/api/admin", propertyRoutes_1.default); // CRUD for properties
app.use("/api/admin", tourPackageRoutes_1.default); // CRUD for tour packages
// Booking routes (user + admin access)
app.use("/api/bookings", bookingRoutes_1.default); // create, update, cancel, get summary
// Host-specific booking routes
app.use("/api/host/bookings", hostBookingRoutes_1.default); // host filters, exports, summaries
// User routes (profile update)
app.use("/api/users", userRoutes_1.default); // update profile, get user info
exports.default = app;
