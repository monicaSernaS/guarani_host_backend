import multer from "multer";
import path from "path";

// Configure the storage engine for multer (saving images to disk temporarily)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Path to save the images temporarily
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

// Filter to accept only image files
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image file!"), false);
  }
};

// Initialize multer with storage and file filter
const upload = multer({ storage, fileFilter });

export { upload };
