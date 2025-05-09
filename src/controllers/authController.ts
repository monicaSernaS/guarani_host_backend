import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken";  

/* ======================== AUTH CONTROLLERS ======================== */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, address, role } = req.body;

    // 1. Verify that all required fields are provided
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      res.status(400).json({ message: "❗ All fields are required" });
      return;
    }

    // 2. Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "❗ Email already in use" });
      return;
    }

    // 3. Create the new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,  
      phone,
      address,
      role: role?.toLowerCase() || "user",  // Default role is 'user' 
      accountStatus: "pending_verification",  
    });

    await newUser.save();

    // 4. Generate JWT token
    const token = generateToken(newUser._id.toString());  

    // 5. Send the response with the new user data and token
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
      token,  // JWT token returned to the user
    });
  } catch (error: any) {
    console.error("❌ Error in register:", error);

    // Handling validation errors
    if (error.name === "ValidationError") {
      res.status(400).json({ message: error.message, errors: error.errors });
      return;
    }

    // Internal server error handling
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Login a user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Verify that both email and password are provided
    if (!email || !password) {
      res.status(400).json({ message: "❗ Email and password are required" });
      return;
    }

    // 2. Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "❗ Invalid credentials" });
      return;
    }

    // 3. Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);  
    if (!isMatch) {
      res.status(401).json({ message: "❗ Invalid credentials" });
      return;
    }

    // 4. Check if the account is suspended
    if (user.accountStatus === "suspended") {
      res.status(403).json({ message: "🚫 Account is suspended" });
      return;
    }

    // 5. Generate JWT token
    const token = generateToken(user._id.toString());  

    // 6. Send the response with the user data and token
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
      token,  // JWT token returned to the user
    });
  } catch (error) {
    console.error("❌ Error in login:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
