import { Request, Response, NextFunction } from "express";

export const checkRole = (role: "admin" | "host" | "user") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
      return;
    }
    next();
  };
};
