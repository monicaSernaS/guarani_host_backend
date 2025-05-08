import express from 'express';
import {
  // Hosts management
  createHost,
  getAllHosts,
  updateHost,
  deleteHost,
  // Users management
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
 */
router.post('/create-host', protect, checkRole('admin'), createHost);

/**
 * @route   GET /api/admin/hosts
 * @desc    Admin retrieves all hosts
 */
router.get('/hosts', protect, checkRole('admin'), getAllHosts);

/**
 * @route   PATCH /api/admin/hosts/:id
 * @desc    Admin updates a host by ID
 */
router.patch('/hosts/:id', protect, checkRole('admin'), updateHost);

/**
 * @route   DELETE /api/admin/hosts/:id
 * @desc    Admin deletes a host by ID
 */
router.delete('/hosts/:id', protect, checkRole('admin'), deleteHost);

/* ========================= USERS ROUTES ========================= */

/**
 * @route   GET /api/admin/users
 * @desc    Admin retrieves all users
 */
router.get('/users', protect, checkRole('admin'), getAllUsers);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Admin updates a user by ID
 */
router.patch('/users/:id', protect, checkRole('admin'), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Admin deletes a user by ID
 */
router.delete('/users/:id', protect, checkRole('admin'), deleteUser);

export default router;
