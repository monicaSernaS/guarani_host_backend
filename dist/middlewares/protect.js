"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
/**
 * Middleware to protect routes and attach authenticated user to the request.
 * Verifies the JWT and fetches user from the database.
 */
const protect = async (req, res, next) => {
    let token;
    // Extract token from Authorization header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "");
            const user = await User_1.User.findById(decoded.id).select("-password");
            if (!user) {
                res.status(401).json({ message: "❌ Unauthorized: user not found" });
                return;
            }
            // Attach user to the request
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401).json({ message: "❌ Unauthorized: invalid token" });
        }
    }
    else {
        res.status(401).json({ message: "❌ Unauthorized: token missing" });
    }
};
exports.protect = protect;
