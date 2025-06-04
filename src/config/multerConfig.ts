// src/config/multerConfig.ts
import fs from "fs"
import multer from "multer"
import path from "path"

// Define the folder where files will be stored temporarily
const uploadDir = "uploads"

// Ensure the 'uploads' folder exists before using it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
  console.log("📁 'uploads/' folder created automatically")
}

// Configure the multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // e.g. 1748000000000.jpg
  },
})

// Accept only image files
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("❌ Only image files are allowed!"), false)
  }
}

// Export the configured multer instance
export const upload = multer({ storage, fileFilter })
