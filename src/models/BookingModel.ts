import mongoose, { Schema, Document } from "mongoose";
import { BookingStatus, PaymentStatus } from "../@types/express/enums";

/**
 * Booking interface
 */
export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  tourPackage?: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentDetails?: string;
  paymentImages?: string[];
  cancellationReason?: string;  
  cancelledAt?: Date;           
  createdAt: Date;
  updatedAt: Date;
  // Virtual properties
  nights: number;
  pricePerNight: number;
}

/**
 * Booking schema definition
 */
const BookingSchema: Schema = new Schema<IBooking>(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, 'User is required']
    },
    property: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Property", 
      required: function(this: IBooking) { 
        return !this.tourPackage; 
      } 
    },
    tourPackage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TourPackage", 
      required: function(this: IBooking) { 
        return !this.property; 
      } 
    },
    checkIn: { 
      type: Date, 
      required: [true, 'Check-in date is required'] 
    },
    checkOut: { 
      type: Date, 
      required: [true, 'Check-out date is required'] 
    },
    guests: { 
      type: Number, 
      required: [true, 'Number of guests is required'], 
      min: [1, 'At least 1 guest is required'], 
      max: [20, 'Maximum 20 guests allowed'] 
    },
    totalPrice: { 
      type: Number, 
      required: [true, 'Total price is required'], 
      min: [0, 'Total price cannot be negative'] 
    },
    status: { 
      type: String, 
      enum: { 
        values: Object.values(BookingStatus), 
        message: 'Invalid booking status' 
      }, 
      default: BookingStatus.PENDING
    },
    paymentStatus: { 
      type: String, 
      enum: { 
        values: Object.values(PaymentStatus), 
        message: 'Invalid payment status' 
      }, 
      default: PaymentStatus.PENDING
    },
    paymentDetails: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Payment details cannot exceed 500 characters']
    },
    paymentImages: { 
      type: [String],
      validate: {
        validator: function(images: string[]) {
          return images.length <= 5; 
        },
        message: 'Cannot have more than 5 payment images'
      }
    },
    cancellationReason: { 
      type: String, 
      trim: true, 
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'] 
    },
    cancelledAt: { 
      type: Date 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
BookingSchema.index({ user: 1 });
BookingSchema.index({ property: 1 });
BookingSchema.index({ tourPackage: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ paymentStatus: 1 });

// Virtual for booking duration in nights
BookingSchema.virtual('nights').get(function(this: IBooking) {
  const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for total cost per night
BookingSchema.virtual('pricePerNight').get(function(this: IBooking) {
  const nights = this.nights;
  return nights > 0 ? this.totalPrice / nights : this.totalPrice;
});

// Pre-save validation
BookingSchema.pre('save', function(this: IBooking, next) {
  // Ensure checkout is after checkin
  if (this.checkOut <= this.checkIn) {
    return next(new Error('Check-out date must be after check-in date'));
  }

  // Ensure either property or tourPackage is provided (but not both)
  if (!this.property && !this.tourPackage) {
    return next(new Error('Either property or tour package must be specified'));
  }

  if (this.property && this.tourPackage) {
    return next(new Error('Cannot book both property and tour package in same booking'));
  }

  next();
});

// Pre-find middleware to populate references
BookingSchema.pre(/^find/, function(this: mongoose.Query<any, any>) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email phone'
  }).populate({
    path: 'property',
    select: 'title city address pricePerNight imageUrls'
  }).populate({
    path: 'tourPackage',
    select: 'title description price duration'
  });
});

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);

