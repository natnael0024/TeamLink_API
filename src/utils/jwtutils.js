import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET

export const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
}; 