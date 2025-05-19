"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
/**
 * Middleware to allow access only to specific roles.
 * @param roles Allowed roles for the route
 * @returns Middleware function that checks if the user's role is allowed
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: "❌ Unauthorized: no user in request" });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "❌ Access denied: insufficient permissions" });
            return;
        }
        next();
    };
};
exports.checkRole = checkRole;
