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
exports.TourPackage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../@types/express/enums");
/**
 * Tour Package schema definition
 */
const TourPackageSchema = new mongoose_1.Schema({
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
            validator: function (amenities) {
                return amenities.length <= 30; // Max 30 amenities
            },
            message: 'Cannot have more than 30 amenities'
        }
    },
    status: {
        type: String,
        enum: {
            values: Object.values(enums_1.TourPackageStatus),
            message: 'Invalid tour package status'
        },
        default: enums_1.TourPackageStatus.AVAILABLE,
    },
    host: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Host is required'],
    },
    imageUrls: {
        type: [String],
        required: [true, 'At least one image is required'],
        validate: {
            validator: function (urls) {
                return urls.length > 0 && urls.length <= 15; // 1-15 images
            },
            message: 'Tour package must have 1-15 images'
        }
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
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
TourPackageSchema.virtual('pricePerHour').get(function () {
    return this.duration ? this.price / this.duration : null;
});
// Pre-save middleware to ensure imageUrls is not empty
TourPackageSchema.pre('save', function (next) {
    if (this.imageUrls.length === 0) {
        return next(new Error('Tour package must have at least one image'));
    }
    next();
});
exports.TourPackage = mongoose_1.default.model("TourPackage", TourPackageSchema);
