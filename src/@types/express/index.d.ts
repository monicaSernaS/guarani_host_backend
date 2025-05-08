import { IUser } from "../../models/User";

/**
 * Extend Express Request interface to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
