import mongoose, { Schema, Document } from "mongoose";
import { TourPackageStatus, PaymentStatus } from "../@types/express/enums";

export interface ITourPackage extends Document {
  title: string;
  description: string;
  price: number;
  status: TourPackageStatus;
  imageUrls: string[];
  host: mongoose.Types.ObjectId;
  paymentStatus: PaymentStatus; // Indicates if any user has paid for a booking
  paymentDetails?: string; // Optional note or reference
}

const TourPackageSchema: Schema = new Schema<ITourPackage>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TourPackageStatus),
      default: TourPackageStatus.AVAILABLE,
    },
    imageUrls: { type: [String], required: true },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentDetails: { type: String, trim: true },
  },
  { timestamps: true }
);

export const TourPackage = mongoose.model<ITourPackage>(
  "TourPackage",
  TourPackageSchema
);
