import { verifyToken } from '../utils/jwtutils.js'; 

export const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Get token from header

  if (!token) {
    console.log('Access denied. No token provided.')
    return res.status(401).json({ error: "Access denied. No token provided." }); 
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Add the decoded token (containing userId) to the request 
    next(); // Move to the next middleware/route handler

  } catch (error) {
    console.log('invalid token')
    res.status(403).json({ error: "Invalid token." }); 
  }
};