"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Connects to the MongoDB database using the connection URI from .env.
 */
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in environment variables.");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log("✅ MongoDB connected");
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
