import jwt from 'jsonwebtoken';

export const generateToken = (newUser._id.toString());=> {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || '', {
    expiresIn: '7d',
  });
};
