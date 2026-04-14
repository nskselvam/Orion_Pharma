import express from 'express';
import { login, logout, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);

// Protected route - Get current user info
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;
