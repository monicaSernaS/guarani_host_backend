import { FileArray } from 'multer';

// Extend the Request interface to include `files`
declare global {
  namespace Express {
    interface Request {
      files?: { images?: Express.Multer.File[] }; 
    }
  }
}
