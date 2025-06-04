import { IUser } from "../../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      files?: {
        images?: Express.Multer.File[];
        paymentImage?: Express.Multer.File[];
      };
    }
  }
}

// Esta línea es importante para que TypeScript reconozca este archivo como un module
export {};