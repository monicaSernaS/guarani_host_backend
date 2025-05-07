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
    const { firstName, lastName, email, password, phone, address, role } = req.body;

    // 1. Verificar campos obligatorios
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "❗All fields are required" });
    }

    // 2. Verificar si ya existe el usuario
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❗Email already in use" });
    }

    // 3. Crear el nuevo usuario
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role: role?.toLowerCase() || "user",
      accountStatus: "pending_verification",
    });

    await newUser.save();

    // 4. Generar JWT
    const token = generateToken(newUser._id.toString());

    // 5. Enviar respuesta
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
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

    // Verificar que haya datos
    if (!email || !password) {
      return res.status(400).json({ message: "❗Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "❗Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "❗Invalid credentials" });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({ message: "🚫Account is suspended" });
    }

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
