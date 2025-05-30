import mongoose, { Schema, Document } from "mongoose";
import { TourPackageStatus } from "../@types/express/enums";

/**
 * Tour Package interface - Only tour package specific fields
 */
export interface ITourPackage extends Document {
  title: string;
  description: string;
  price: number;
  duration?: number; // Duration in hours or days
  maxCapacity?: number; // Maximum number of participants
  location?: string; // Tour location
  amenities?: string[]; // What's included in the tour
  status: TourPackageStatus;
  host: mongoose.Types.ObjectId;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tour Package schema definition
 */
const TourPackageSchema: Schema = new Schema<ITourPackage>(
  {
    title: { 
      type: String, 
      required: [true, 'Tour title is required'], 
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: { 
      type: String, 
      required: [true, 'Tour description is required'], 
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: { 
      type: Number, 
      required: [true, 'Tour price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      min: [0.5, 'Duration must be at least 0.5 hours'],
      max: [168, 'Duration cannot exceed 168 hours (1 week)'] // Max 1 week
    },
    maxCapacity: {
      type: Number,
      min: [1, 'Max capacity must be at least 1'],
      max: [100, 'Max capacity cannot exceed 100 people']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    amenities: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(amenities: string[]) {
          return amenities.length <= 30; // Max 30 amenities
        },
        message: 'Cannot have more than 30 amenities'
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TourPackageStatus),
        message: 'Invalid tour package status'
      },
      default: TourPackageStatus.AVAILABLE,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'Host is required'],
    },
    imageUrls: { 
      type: [String], 
      required: [true, 'At least one image is required'],
      validate: {
        validator: function(urls: string[]) {
          return urls.length > 0 && urls.length <= 15; // 1-15 images
        },
        message: 'Tour package must have 1-15 images'
      }
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
TourPackageSchema.index({ status: 1 });
TourPackageSchema.index({ host: 1 });
TourPackageSchema.index({ price: 1 });
TourPackageSchema.index({ location: 1 });

// Virtual for host information when populated
TourPackageSchema.virtual('hostInfo', {
  ref: 'User',
  localField: 'host',
  foreignField: '_id',
  justOne: true
});

// Virtual for price per hour (if duration is available)
TourPackageSchema.virtual('pricePerHour').get(function(this: ITourPackage) {
  return this.duration ? this.price / this.duration : null;
});

// Pre-save middleware to ensure imageUrls is not empty
TourPackageSchema.pre('save', function(this: ITourPackage, next) {
  if (this.imageUrls.length === 0) {
    return next(new Error('Tour package must have at least one image'));
  }
  next();
});

export const TourPackage = mongoose.model<ITourPackage>("TourPackage", TourPackageSchema);

