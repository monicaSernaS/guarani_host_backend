import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";
import { AccountStatus } from "../@types/express/enums";

/* ======================== AUTH CONTROLLERS ======================== */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, address, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      res.status(400).json({ message: "❗ All fields are required" });
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "❗ Invalid email format" });
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "❗ Email already in use" });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "❗ Password must contain at least 8 characters, one uppercase, one lowercase, and one number.",
      });
      return;
    }

    // Create new user (password will be hashed via pre-save hook)
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone.trim(),
      address: address.trim(),
      role: role?.toLowerCase() || "user",
      accountStatus: AccountStatus.ACTIVE,
    });

    await newUser.save();

    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      message: "✅ User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
      },
      token,
    });
  } catch (error: any) {
    console.error("❌ Error in register:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: "❗ Email and password are required" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "❗ Invalid credentials" });
      return;
    }

    // Compare passwords using model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "❗ Invalid credentials" });
      return;
    }

    // Check account status
    const status = user.accountStatus?.toLowerCase();
    if (status === AccountStatus.SUSPENDED) {
      res.status(403).json({ message: "🚫 Account is suspended" });
      return;
    }
    if (status === AccountStatus.DELETED) {
      res.status(403).json({ message: "🚫 Account has been deleted" });
      return;
    }
    if (status === AccountStatus.PENDING_VERIFICATION) {
      res.status(403).json({ message: "⚠️ Account is pending verification" });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: "✅ Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
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
