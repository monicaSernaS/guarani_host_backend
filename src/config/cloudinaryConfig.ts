import dotenv from 'dotenv'
dotenv.config()
console.log("🌩️ Cloudinary API KEY loaded:", process.env.CLOUDINARY_API_KEY)


import { v2 as cloudinary } from 'cloudinary';

// Configuring Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,      
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export default cloudinary;
