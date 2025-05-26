import { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";

/* ========================= ADMIN ========================= */

/*
 * @desc    Create a new admin (user with role "admin")
 * @route   POST /api/admin/create-admin
 * @access  Private (admin only)
 */
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Admin validation: Only allow creation of admin by an existing admin
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "🚫 Unauthorized: Only admins can create other admins" });
      return;
    }

    // Validating required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      res.status(400).json({ message: "❗ All fields are required" });
      return;
    }

    // Check if the admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      res.status(400).json({ message: "❗ Admin with this email already exists" });
      return;
    }

    // Create new admin (user with 'admin' role)
    const newAdmin = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: "admin", // Assign role as 'admin'
    });

    await newAdmin.save();

      // Generate JWT token
    const token = generateToken(newAdmin._id.toString());

    res.status(201).json({
      message: "✅ Admin created successfully",
      user: newAdmin,
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    res.status(500).json({ message: "❌ Server error while creating admin" });
  }
};

/**
 * @desc    Get all admins (users with role 'admin')
 * @route   GET /api/admin/admins
 * @access  Private (admin only)
 */
export const getAllAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await User.find({ role: "admin" });
    res.status(200).json({
      message: "✅ Admins retrieved successfully",
      admins,
    });
  } catch (error) {
    console.error("❌ Error fetching admins:", error);
    res.status(500).json({ message: "❌ Server error while fetching admins" });
  }
};

/**
 * @desc    Update admin by ID
 * @route   PATCH /api/admin/admins/:id
 * @access  Private (admin only)
 */
export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Validate the existence of required fields
    if (!firstName && !lastName && !email && !phone) {
      res.status(400).json({ message: "❗ No fields provided for update" });
      return;
    }

    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== "admin") {
      res.status(404).json({ message: "🚫 Admin not found" });
      return;
    }

    admin.firstName = firstName || admin.firstName;
    admin.lastName = lastName || admin.lastName;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;

    await admin.save();

    res.status(200).json({
      message: "✅ Admin updated successfully",
      user: admin,
    });
  } catch (error) {
    console.error("❌ Error updating admin:", error);
    res.status(500).json({ message: "❌ Server error while updating admin" });
  }
};

/**
 * @desc    Delete an admin by ID
 * @route   DELETE /api/admin/admins/:id
 * @access  Private (admin only)
 */
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await User.findByIdAndDelete(req.params.id);

    if (!admin || admin.role !== "admin") {
      res.status(404).json({ message: "🚫 Admin not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Admin deleted successfully",
      adminId: admin._id,
    });
  } catch (error) {
    console.error("❌ Error deleting admin:", error);
    res.status(500).json({ message: "❌ Server error while deleting admin" });
  }
};

/* ========================= HOSTS ========================= */

/**
 * @desc    Create a new host (user with role "host")
 * @route   POST /api/admin/create-host
 * @access  Private (admin only)
 */
export const createHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    // Validating required fields
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      res.status(400).json({ message: "❗ All fields are required" });
      return;
    }

    // Check if the host already exists
    const existingHost = await User.findOne({ email });
    if (existingHost) {
      res.status(400).json({ message: "❗ Host with this email already exists" });
      return;
    }

    // Create new host (user with 'host' role)
    const newHost = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role: "host", // Assign role as 'host'
    });
    
    await newHost.save();

     // Generate JWT token
    const token = generateToken(newHost._id.toString());

    res.status(201).json({
      message: "✅ Host created successfully",
      user: newHost,
    });
  } catch (error) {
    console.error("❌ Error creating host:", error);
    res.status(500).json({ message: "❌ Server error while creating host" });
  }
};

/**
 * @desc    Get all hosts (users with role 'host')
 * @route   GET /api/admin/hosts
 * @access  Private (admin only)
 */
export const getAllHosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const hosts = await User.find({ role: "host" });
    res.status(200).json({
      message: "✅ Hosts retrieved successfully",
      hosts,
    });
  } catch (error) {
    console.error("❌ Error fetching hosts:", error);
    res.status(500).json({ message: "❌ Server error while fetching hosts" });
  }
};

/**
 * @desc    Update host by ID (update user role to 'host' if necessary)
 * @route   PATCH /api/admin/hosts/:id
 * @access  Private (admin only)
 */
export const updateHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Validate the existence of required fields
    if (!firstName && !lastName && !email && !phone) {
      res.status(400).json({ message: "❗ No fields provided for update" });
      return;
    }

    const host = await User.findById(req.params.id);

    if (!host || host.role !== "host") {
      res.status(404).json({ message: "🚫 Host not found" });
      return;
    }

    host.firstName = firstName || host.firstName;
    host.lastName = lastName || host.lastName;
    host.email = email || host.email;
    host.phone = phone || host.phone;

    await host.save();

    res.status(200).json({
      message: "✅ Host updated successfully",
      user: host,
    });
  } catch (error) {
    console.error("❌ Error updating host:", error);
    res.status(500).json({ message: "❌ Server error while updating host" });
  }
};

/**
 * @desc    Delete a host by ID (delete user with role 'host')
 * @route   DELETE /api/admin/hosts/:id
 * @access  Private (admin only)
 */
export const deleteHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const host = await User.findByIdAndDelete(req.params.id);

    if (!host || host.role !== "host") {
      res.status(404).json({ message: "🚫 Host not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Host deleted successfully",
      hostId: host._id,
    });
  } catch (error) {
    console.error("❌ Error deleting host:", error);
    res.status(500).json({ message: "❌ Server error while deleting host" });
  }
};

/* ========================= USERS ========================= */

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json({
      message: "✅ Users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "❌ Server error while fetching users" });
  }
};

/**
 * @desc    Update user by ID
 * @route   PATCH /api/admin/users/:id
 * @access  Private (admin only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName && !lastName && !email && !phone) {
      res.status(400).json({ message: "❗ No fields provided for update" });
      return;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: "🚫 User not found" });
      return;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();

    res.status(200).json({
      message: "✅ User updated successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "❌ Server error while updating user" });
  }
};

/**
 * @desc    Delete user by ID
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin only)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ message: "🚫 User not found" });
      return;
    }

    res.status(200).json({
      message: "✅ User deleted successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "❌ Server error while deleting user" });
  }
};