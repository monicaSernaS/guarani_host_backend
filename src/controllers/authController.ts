import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "❗Email already in use" });
      return;
    }

    const newUser = new User({
      name,
      email,
      password,
      role: User,
      accountStatus: "pending_verification",
    });

    await newUser.save();

    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      message: "✅ User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error in register:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Login a user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "❗Invalid credentials" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "❗Invalid credentials" });
      return;
    }

    if (user.accountStatus === "suspended") {
      res.status(403).json({ message: "🚫Account is suspended" });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: "✅Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error in login:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
