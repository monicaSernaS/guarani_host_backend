"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Establishes a connection to the MongoDB database using the URI from environment variables.
 * Terminates the process if the connection fails or the URI is missing.
 */
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    // Ensure URI is defined before attempting to connect
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in environment variables.");
        process.exit(1);
    }
    try {
        // Attempt to connect to MongoDB
        await mongoose_1.default.connect(uri);
        console.log("✅ MongoDB connected successfully");
    }
    catch (error) {
        // Handle any connection errors
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
