"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const protect_1 = require("../middlewares/protect");
const router = express_1.default.Router();
/**
 * @route PATCH /api/users/profile
 * @des Update user`s own profile
 * @access Private
 */
router.patch('/profile', protect_1.protect, userController_1.updateUserProfile);
exports.default = router;
