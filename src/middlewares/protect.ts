import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // Obtener el token desde headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as DecodedToken;

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ message: "Unauthorized: user not found" });
        return;
      }

      // Agregar el usuario a la request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized: invalid token" });
      return;
    }
  } else {
    res.status(401).json({ message: "Unauthorized: token missing" });
    return;
  }
};
