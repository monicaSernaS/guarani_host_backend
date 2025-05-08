import mongoose, { Schema, Document } from "mongoose";

// Enum to define the status of the booking
enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

// Enum to define the payment status
enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
}

interface IBooking extends Document {
  user: mongoose.Schema.Types.ObjectId; // User who made the booking
  property?: mongoose.Schema.Types.ObjectId; // Optional: Property being booked
  tourPackage?: mongoose.Schema.Types.ObjectId; // Optional: Tour package being booked
  checkIn: Date; 
  checkOut: Date;
  status: BookingStatus; // Booking status (pending, confirmed, cancelled)
  guests: number;
  totalPrice: number; 
  paymentStatus: PaymentStatus; // Payment status (pending, paid)
  paymentDetails?: string; // Payment details (transfer reference number, amount)
  paymentImage?: string; // Optional: URL of the payment image (if the user uploads it)
}

const BookingSchema: Schema = new Schema<IBooking>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    tourPackage: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage" },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING },
    guests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    paymentDetails: { type: String }, // Optional: Details of the payment
    paymentImage: { type: String }, // Optional: Image of the payment transfer (Cloudinary URL)
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
