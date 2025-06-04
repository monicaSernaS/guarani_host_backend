"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourPackageStatus = exports.PropertyStatus = exports.PaymentStatus = exports.BookingStatus = exports.AccountStatus = void 0;
// Enum for Account Status
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "active";
    AccountStatus["SUSPENDED"] = "suspended";
    AccountStatus["DELETED"] = "deleted";
    AccountStatus["PENDING_VERIFICATION"] = "pending_verification";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
// Enum for Booking Status
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
// Enum for Payment Status
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// Enum for Property Status
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["AVAILABLE"] = "available";
    PropertyStatus["BOOKED"] = "booked";
    PropertyStatus["CANCELLED"] = "cancelled";
    PropertyStatus["CONFIRMED"] = "confirmed";
    PropertyStatus["INACTIVE"] = "inactive";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
// Enum for Tour Package Status
var TourPackageStatus;
(function (TourPackageStatus) {
    TourPackageStatus["AVAILABLE"] = "available";
    TourPackageStatus["SOLD_OUT"] = "sold_out";
    TourPackageStatus["CANCELLED"] = "cancelled";
    TourPackageStatus["UPCOMING"] = "upcoming";
})(TourPackageStatus || (exports.TourPackageStatus = TourPackageStatus = {}));
