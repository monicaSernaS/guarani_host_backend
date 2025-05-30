import mongoose, { Schema, Document } from "mongoose";
import { PropertyStatus } from "../@types/express/enums";

/**
 * Property interface - Only property-specific fields
 */
export interface IProperty extends Document {
  title: string;
  description: string;
  address: string;
  city: string;
  pricePerNight: number;
  amenities: string[];
  status: PropertyStatus;
  host: mongoose.Types.ObjectId;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Property schema definition
 */
const PropertySchema: Schema = new Schema<IProperty>(
  {
    title: { 
      type: String, 
      required: [true, 'Property title is required'], 
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: { 
      type: String, 
      required: [true, 'Property description is required'], 
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    address: { 
      type: String, 
      required: [true, 'Property address is required'], 
      trim: true 
    },
    city: { 
      type: String, 
      required: [true, 'Property city is required'], 
      trim: true 
    },
    pricePerNight: { 
      type: Number, 
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative']
    },
    amenities: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(amenities: string[]) {
          return amenities.length <= 20; // Max 20 amenities
        },
        message: 'Cannot have more than 20 amenities'
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PropertyStatus),
        message: 'Invalid property status'
      },
      default: PropertyStatus.AVAILABLE,
    },
    host: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, 'Host is required']
    },
    imageUrls: { 
      type: [String], 
      required: [true, 'At least one image is required'],
      validate: {
        validator: function(urls: string[]) {
          return urls.length > 0 && urls.length <= 10; // 1-10 images
        },
        message: 'Property must have 1-10 images'
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
PropertySchema.index({ city: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ host: 1 });
PropertySchema.index({ pricePerNight: 1 });

// Virtual for host information when populated
PropertySchema.virtual('hostInfo', {
  ref: 'User',
  localField: 'host',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to ensure imageUrls is not empty
PropertySchema.pre('save', function(this: IProperty, next) {
  if (this.imageUrls.length === 0) {
    return next(new Error('Property must have at least one image'));
  }
  next();
});

export const Property = mongoose.model<IProperty>("Property", PropertySchema);

