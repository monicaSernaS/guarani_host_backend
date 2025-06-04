"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBookingOwnership = void 0;
const BookingModel_1 = require("../models/BookingModel");
/**
 * Middleware to ensure the user is the owner of the booking or admin.
 * @returns Middleware function that checks if the user is the booking owner or has the admin role.
 */
const checkBookingOwnership = async (req, res, next) => {
    const booking = await BookingModel_1.Booking.findById(req.params.id);
    if (!booking) {
        res.status(404).json({ message: "🚫 Booking not found" });
        return;
    }
    if (req.user?.role !== "admin" &&
        booking.user.toString() !== req.user?._id.toString()) {
        res.status(403).json({ message: "🚫 Not authorized to modify this booking" });
        return;
    }
    next();
};
exports.checkBookingOwnership = checkBookingOwnership;
