import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

/**
 * @desc    Admin creates a new host
 * @route   POST /api/admin/create-host
 * @access  Private (admin only)
 */
export const createHost = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
       res.status(400).json({ message: '🚫 Email already in use' });
       return;
    }

    // 2. Hash password manually (because we create user directly)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create host
    const newHost = new User({
      name,
      email,
      password: hashedPassword,
      role: 'host',
      accountStatus: 'active',
    });

    await newHost.save();

    res.status(201).json({
      message: '✅ Host created successfully',
      host: {
        id: newHost._id,
        name: newHost.name,
        email: newHost.email,
        role: newHost.role,
        accountStatus: newHost.accountStatus,
      },
    });
  } catch (error) {
    console.error(' ❌Error creating host:', error);
    res.status(500).json({ message: '❌Server error' });
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
  
      res.status(200).json({
        message: '✅ Hosts retrieved successfully',
        total: hosts.length,
        hosts,
      });
    } catch (error) {
      console.error('❌ Error fetching hosts:', error);
      res.status(500).json({ message: '❌ Server error' });
    }
  };

  /**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find().select('-password');
  
      res.status(200).json({
        message: '✅ Users retrieved successfully',
        total: users.length,
        users,
      });
    } catch (error) {
      console.error('❌ Error fetching users:', error);
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
  
      res.status(200).json({
        message: '✅ User deleted successfully',
        userId: user._id,
      });
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({ message: '❌ Server error' });
    }
  };
  
  /**
 * @desc    Update user role or account status
 * @route   PATCH /api/admin/users/:id
 * @access  Private (admin only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role, accountStatus } = req.body;
  
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ message: '🚫 User not found' });
        return;
      }
  
      if (role) user.role = role;
      if (accountStatus) user.accountStatus = accountStatus;
  
      await user.save();
  
      res.status(200).json({
        message: '✅ User updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
        },
      });
    } catch (error) {
      console.error('❌ Error updating user:', error);
      res.status(500).json({ message: '❌ Server error' });
    }
  };
  