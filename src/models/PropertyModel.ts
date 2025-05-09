import mongoose, { Schema, Document } from "mongoose";
import { PropertyStatus, PaymentStatus } from "../@types/express/enums";

export interface IProperty extends Document {
  title: string;
  description: string;
  address: string;
  city: string;
  pricePerNight: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  amenities: string[];
  paymentStatus: PaymentStatus;
  paymentDetails?: string;
  status: PropertyStatus;
  host: mongoose.Types.ObjectId;
  imageUrls: string[];
}

const PropertySchema: Schema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pricePerNight: { type: Number, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    amenities: { type: [String], required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentDetails: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(PropertyStatus),
      default: PropertyStatus.AVAILABLE,
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrls: { type: [String], required: true },
  },
  { timestamps: true }
);

export const Property = mongoose.model<IProperty>("Property", PropertySchema);
