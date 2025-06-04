"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// src/config/multerConfig.ts
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Define the folder where files will be stored temporarily
const uploadDir = "uploads";
// Ensure the 'uploads' folder exists before using it
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
    console.log("📁 'uploads/' folder created automatically");
}
// Configure the multer storage engine
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname)); // e.g. 1748000000000.jpg
    },
});
// Accept only image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("❌ Only image files are allowed!"), false);
    }
};
// Export the configured multer instance
exports.upload = (0, multer_1.default)({ storage, fileFilter });
