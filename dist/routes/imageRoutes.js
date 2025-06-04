"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protect_1 = require("../middlewares/protect");
const imageController_1 = require("../controllers/imageController");
const router = express_1.default.Router();
/**
 * @route   DELETE /api/uploads
 * @desc    Deletes a Cloudinary image given its public secure URL
 * @access  Private (must be authenticated)
 */
router.delete("/", protect_1.protect, imageController_1.deleteImageHandler);
exports.default = router;
