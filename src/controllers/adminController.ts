import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

/* ======================== USERS MANAGEMENT ======================== */

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ message: '✅ Users retrieved successfully', total: users.length, users });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

/**
 * @desc    Update user
 * @route   PATCH /api/admin/users/:id
 * @access  Private (admin only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, address, role, accountStatus } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: '🚫 User not found' });
      return;
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role) user.role = role;
    if (accountStatus) user.accountStatus = accountStatus;

    await user.save();
    res.status(200).json({
      message: '✅ User updated successfully',
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
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: '❌ Server error' });
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
      res.status(404).json({ message: '🚫 User not found' });
      return;
    }
    res.status(200).json({ message: '✅ User deleted successfully', userId: user._id });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

/* ======================== HOSTS MANAGEMENT ======================== */

/**
 * @desc    Admin creates a new host
 * @route   POST /api/admin/create-host
 * @access  Private (admin only)
 */
export const createHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: '🚫 Email already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newHost = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      address,
      role: 'host',
      accountStatus: 'active',
    });

    await newHost.save();

    res.status(201).json({
      message: '✅ Host created successfully',
      host: {
        id: newHost._id,
        firstName: newHost.firstName,
        lastName: newHost.lastName,
        email: newHost.email,
        phone: newHost.phone,
        address: newHost.address,
        role: newHost.role,
        accountStatus: newHost.accountStatus,
      },
    });
  } catch (error) {
    console.error('❌ Error creating host:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

/**
 * @desc    Get all hosts
 * @route   GET /api/admin/hosts
 * @access  Private (admin only)
 */
export const getAllHosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const hosts = await User.find({ role: 'host' }).select('-password');
    res.status(200).json({ message: '✅ Hosts retrieved successfully', total: hosts.length, hosts });
  } catch (error) {
    console.error('❌ Error fetching hosts:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

/**
 * @desc    Update host info
 * @route   PATCH /api/admin/hosts/:id
 * @access  Private (admin only)
 */
export const updateHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, address, accountStatus } = req.body;
    const host = await User.findOne({ _id: req.params.id, role: 'host' });
    if (!host) {
      res.status(404).json({ message: '🚫 Host not found' });
      return;
    }

    if (firstName) host.firstName = firstName;
    if (lastName) host.lastName = lastName;
    if (email) host.email = email;
    if (phone) host.phone = phone;
    if (address) host.address = address;
    if (accountStatus) host.accountStatus = accountStatus;

    await host.save();

    res.status(200).json({
      message: '✅ Host updated successfully',
      host: {
        id: host._id,
        firstName: host.firstName,
        lastName: host.lastName,
        email: host.email,
        phone: host.phone,
        address: host.address,
        accountStatus: host.accountStatus,
      },
    });
  } catch (error) {
    console.error('❌ Error updating host:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

/**
 * @desc    Delete host by ID
 * @route   DELETE /api/admin/hosts/:id
 * @access  Private (admin only)
 */
export const deleteHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const host = await User.findOneAndDelete({ _id: req.params.id, role: 'host' });
    if (!host) {
      res.status(404).json({ message: '🚫 Host not found' });
      return;
    }
    res.status(200).json({ message: '✅ Host deleted successfully', hostId: host._id });
  } catch (error) {
    console.error('❌ Error deleting host:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};
