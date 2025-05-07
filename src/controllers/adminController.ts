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

  