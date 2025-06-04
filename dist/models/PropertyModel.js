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
exports.Property = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../@types/express/enums");
/**
 * Property schema definition
 */
const PropertySchema = new mongoose_1.Schema({
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
            validator: function (amenities) {
                return amenities.length <= 20; // Max 20 amenities
            },
            message: 'Cannot have more than 20 amenities'
        },
        guests: {
            type: Number,
            required: [true, 'Maximum number of guests is required'],
            min: [1, 'There must be at least one guest']
        },
    },
    status: {
        type: String,
        enum: {
            values: Object.values(enums_1.PropertyStatus),
            message: 'Invalid property status'
        },
        default: enums_1.PropertyStatus.AVAILABLE,
    },
    host: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Host is required']
    },
    imageUrls: {
        type: [String],
        required: [true, 'At least one image is required'],
        validate: {
            validator: function (urls) {
                return urls.length > 0 && urls.length <= 10; // 1-10 images
            },
            message: 'Property must have 1-10 images'
        }
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
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
PropertySchema.pre('save', function (next) {
    if (this.imageUrls.length === 0) {
        return next(new Error('Property must have at least one image'));
    }
    next();
});
exports.Property = mongoose_1.default.model("Property", PropertySchema);
