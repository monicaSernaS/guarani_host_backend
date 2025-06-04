"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const router = express_1.default.Router();
/* ========================= HOSTS ROUTES ========================= */
/**
 * @route   POST /api/admin/create-host
 * @desc    Admin creates a new host
 * @access  Private (admin only)
 */
router.post('/create-host', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.createHost);
/**
 * @route   GET /api/admin/hosts
 * @desc    Admin retrieves all hosts
 * @access  Private (admin only)
 */
router.get('/hosts', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.getAllHosts);
/**
 * @route   PATCH /api/admin/hosts/:id
 * @desc    Admin updates a host by ID
 * @access  Private (admin only)
 */
router.patch('/hosts/:id', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.updateHost);
/**
 * @route   DELETE /api/admin/hosts/:id
 * @desc    Admin deletes a host by ID
 * @access  Private (admin only)
 */
router.delete('/hosts/:id', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.deleteHost);
/* ========================= USERS ROUTES ========================= */
/**
 * @route   GET /api/admin/users
 * @desc    Admin retrieves all users
 * @access  Private (admin only)
 */
router.get('/users', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.getAllUsers);
/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Admin updates a user by ID
 * @access  Private (admin only)
 */
router.patch('/users/:id', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.updateUser);
/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Admin deletes a user by ID
 * @access  Private (admin only)
 */
router.delete('/users/:id', protect_1.protect, (0, checkRole_1.checkRole)('admin'), adminController_1.deleteUser);
exports.default = router;
