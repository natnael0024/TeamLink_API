import express from 'express';
import authController from '../controllers/AuthController.js'; 
// import { authenticateToken } from '../middleware/authmiddleware.js';
const router = express.Router();

// Public Routes
router.post('/register', authController.register)
router.post('/login', authController.login)

// Protected Route
// router.get('/me', authenticateToken, authController.getCurrentUser); // Example 

export default router