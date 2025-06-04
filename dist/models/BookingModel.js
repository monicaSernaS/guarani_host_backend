"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../@types/express/enums");
/**
 * Booking schema definition
 */
const BookingSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required']
    },
    property: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Property",
        required: function () {
            return !this.tourPackage;
        }
    },
    tourPackage: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "TourPackage",
        required: function () {
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
            values: Object.values(enums_1.BookingStatus),
            message: 'Invalid booking status'
        },
        default: enums_1.BookingStatus.PENDING
    },
    paymentStatus: {
        type: String,
        enum: {
            values: Object.values(enums_1.PaymentStatus),
            message: 'Invalid payment status'
        },
        default: enums_1.PaymentStatus.PENDING
    },
    paymentDetails: {
        type: String,
        trim: true,
        maxlength: [500, 'Payment details cannot exceed 500 characters']
    },
    paymentImages: {
        type: [String],
        validate: {
            validator: function (images) {
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for better performance
BookingSchema.index({ user: 1 });
BookingSchema.index({ property: 1 });
BookingSchema.index({ tourPackage: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ paymentStatus: 1 });
// Virtual for booking duration in nights
BookingSchema.virtual('nights').get(function () {
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});
// Virtual for total cost per night
BookingSchema.virtual('pricePerNight').get(function () {
    const nights = this.nights;
    return nights > 0 ? this.totalPrice / nights : this.totalPrice;
});
// Pre-save validation
BookingSchema.pre('save', function (next) {
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
BookingSchema.pre(/^find/, function () {
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
exports.Booking = mongoose_1.default.model("Booking", BookingSchema);
