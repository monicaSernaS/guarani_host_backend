"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a JWT token for the given user ID.
 * @param newUserId - The ID of the user to include in the token payload
 * @returns A signed JWT token as a string
 */
const generateToken = (newUserId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("❌ JWT_SECRET is not defined in the environment variables.");
    }
    return jsonwebtoken_1.default.sign({ id: newUserId }, secret, {
        expiresIn: "7d",
    });
};
exports.generateToken = generateToken;
