import express from 'express';
import {
  createUser,
  createHost,
  getAllHosts,
  updateHost,
  deleteHost,
  getAllUsers,
  updateUser,
  deleteUser,
} from '../controllers/adminController';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/checkRole';

const router = express.Router();

/* ========================= HOSTS ROUTES ========================= */

/**
 * @route   POST /api/admin/create-host
 * @desc    Admin creates a new host
 * @access  Private (admin only)
 */
router.post('/create-host', protect, checkRole('admin'), createHost);

/**
 * @route   GET /api/admin/hosts
 * @desc    Admin retrieves all hosts
 * @access  Private (admin only)
 */
router.get('/hosts', protect, checkRole('admin'), getAllHosts);

/**
 * @route   PATCH /api/admin/hosts/:id
 * @desc    Admin updates a host by ID
 * @access  Private (admin only)
 */
router.patch('/hosts/:id', protect, checkRole('admin'), updateHost);

/**
 * @route   DELETE /api/admin/hosts/:id
 * @desc    Admin deletes a host by ID
 * @access  Private (admin only)
 */
router.delete('/hosts/:id', protect, checkRole('admin'), deleteHost);

/* ========================= USERS ROUTES ========================= */

/**
 * @route   POST /api/admin/users
 * @desc    Admin creates a new user (any role)
 * @access  Private (admin only)
 */
router.post('/users', protect, checkRole('admin'), createUser);

/**
 * @route   GET /api/admin/users
 * @desc    Admin retrieves all users
 * @access  Private (admin only)
 */
router.get('/users', protect, checkRole('admin'), getAllUsers);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Admin updates a user by ID
 * @access  Private (admin only)
 */
router.patch('/users/:id', protect, checkRole('admin'), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Admin deletes a user by ID
 * @access  Private (admin only)
 */
router.delete('/users/:id', protect, checkRole('admin'), deleteUser);

export default router;