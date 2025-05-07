import { IUser } from '../../models/User';

declare global {
  firstNamespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
