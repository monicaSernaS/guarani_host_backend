// Enum for Booking Status
export enum BookingStatus {
  PENDING = "pending",     // The booking is pending and not yet confirmed.
  CONFIRMED = "confirmed", // The booking has been confirmed.
  CANCELLED = "cancelled", // The booking has been cancelled by either the user or the host.
  COMPLETED = "completed", // The booking has been completed successfully (e.g., guest stayed or tour completed).
}

// Enum for Payment Status
export enum PaymentStatus {
  PENDING = "pending",     // The payment is pending, waiting to be processed.
  PAID = "paid",           // The payment has been successfully processed.
  FAILED = "failed",       // The payment has failed and could not be processed.
  REFUNDED = "refunded",   // The payment has been refunded back to the user.
}

// Enum for Property Status
export enum PropertyStatus {
  AVAILABLE = "available",   // The property is available for booking.
  BOOKED = "booked",         // The property has been booked by a guest.
  CANCELLED = "cancelled",   // The booking for the property has been cancelled.
  CONFIRMED = "confirmed",   // The property booking has been confirmed.
  INACTIVE = "inactive",     // The property is temporarily inactive and unavailable for booking.
}

// Enum for Tour Package Status
export enum TourPackageStatus {
  AVAILABLE = "available",   // The tour package is available for booking.
  SOLD_OUT = "sold_out",     // The tour package is sold out and no longer available.
  CANCELLED = "cancelled",   // The tour package has been cancelled.
  UPCOMING = "upcoming",     // The tour package is upcoming and will be available at a future date.
}
