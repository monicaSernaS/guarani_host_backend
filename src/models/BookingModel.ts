import mongoose, { Schema, Document } from "mongoose";
import { BookingStatus, PaymentStatus } from "../@types/express/enums";

// Interface for Booking model
export interface IBooking extends Document {
  user: mongoose.Schema.Types.ObjectId;
  property?: mongoose.Schema.Types.ObjectId;
  tourPackage?: mongoose.Schema.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  guests: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentDetails?: string;
  paymentImages?: string[];
}

const BookingSchema: Schema = new Schema<IBooking>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    tourPackage: { type: mongoose.Schema.Types.ObjectId, ref: "TourPackage" },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    guests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentDetails: { type: String, trim: true },
    paymentImages: { type: [String] },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);