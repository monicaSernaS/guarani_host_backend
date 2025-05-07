import jwt from "jsonwebtoken";

export const generateToken = (newUserId: string): string => {
  return jwt.sign({ id: newUserId }, process.env.JWT_SECRET || "", {
    expiresIn: "7d",
  });
};
