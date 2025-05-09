import { IUser } from "../../models/User";
import { Multer } from "multer";

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
