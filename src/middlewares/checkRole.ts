import { Request, Response, NextFunction } from "express";

type UserRole = "admin" | "host" | "user";

/**
 * Middleware to allow access only to specific roles.
 * @param roles Allowed roles for the route
 * @returns Middleware function that checks if the user's role is allowed
 */
export const checkRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
