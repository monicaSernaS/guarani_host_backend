import jwt from "jsonwebtoken";

/**
 * Generates a JWT token for the given user ID.
 * @param newUserId - The ID of the user to include in the token payload
 * @returns A signed JWT token as a string
 */
export const generateToken = (newUserId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("❌ JWT_SECRET is not defined in the environment variables.");
  }

  return jwt.sign({ id: newUserId }, secret, {
    expiresIn: "7d",
  });
};
