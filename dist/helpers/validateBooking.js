"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBookingData = exports.validateBookingStatus = exports.validatePaymentStatus = exports.validateCheckInOut = void 0;
const enums_1 = require("../@types/express/enums");
/**
 * Validates check-in and check-out dates.
 * Throws an error if validation fails.
 */
const validateCheckInOut = (checkIn, checkOut) => {
    const now = Date.now();
    const inDate = new Date(checkIn).getTime();
    const outDate = new Date(checkOut).getTime();
    if (isNaN(inDate) || isNaN(outDate)) {
        throw new Error("❗ Invalid date format");
    }
    if (inDate < now) {
        throw new Error("❗ Check-in date cannot be in the past");
    }
    if (outDate < now) {
        throw new Error("❗ Check-out date cannot be in the past");
    }
    if (inDate >= outDate) {
        throw new Error("❗ Check-out date must be after check-in date");
    }
};
exports.validateCheckInOut = validateCheckInOut;
/**
 * Validates that a string is a valid PaymentStatus enum value.
 * Throws an error if not.
 */
const validatePaymentStatus = (status) => {
    if (!Object.values(enums_1.PaymentStatus).includes(status)) {
        throw new Error("❗ Invalid payment status value");
    }
};
exports.validatePaymentStatus = validatePaymentStatus;
/**
 * Validates that a string is a valid BookingStatus enum value.
 * Throws an error if not.
 */
const validateBookingStatus = (status) => {
    if (!Object.values(enums_1.BookingStatus).includes(status)) {
        throw new Error("❗ Invalid booking status value");
    }
};
exports.validateBookingStatus = validateBookingStatus;
/**
 * Validates booking data before creation/update
 */
const validateBookingData = (data) => {
    const { checkIn, checkOut, guests, totalPrice, property, tourPackage } = data;
    // Validate dates
    (0, exports.validateCheckInOut)(checkIn, checkOut);
    // Validate guests
    if (!guests || guests <= 0 || guests > 20) {
        throw new Error("❗ Number of guests must be between 1 and 20");
    }
    // Validate total price
    if (!totalPrice || totalPrice <= 0) {
        throw new Error("❗ Total price must be greater than zero");
    }
    // Validate that either property or tourPackage is provided (but not both)
    if (!property && !tourPackage) {
        throw new Error("❗ Either property or tour package must be specified");
    }
    if (property && tourPackage) {
        throw new Error("❗ Cannot book both property and tour package in same booking");
    }
};
exports.validateBookingData = validateBookingData;
