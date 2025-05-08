import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes and attach authenticated user to the request.
 * Verifies the JWT and fetches user from the database.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as DecodedToken;

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ message: "❌ Unauthorized: user not found" });
        return;
      }

      // Attach user to the request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "❌ Unauthorized: invalid token" });
    }
  } else {
    res.status(401).json({ message: "❌ Unauthorized: token missing" });
  }
};
