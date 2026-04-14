import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // TODO: Replace with actual database query
    // For now, using mock data with JWT token
    
    // Mock user data - In production, fetch from database
    const mockUsers = [
      {
        user_id: 1,
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Admin User',
        role: 'admin',
        user_status: 1,
      },
      {
        user_id: 2,
        email: 'manufacturer@example.com',
        password: await bcrypt.hash('manufacturer123', 10),
        name: 'Manufacturer User',
        role: 'manufacturer',
        user_status: 1,
      },
      {
        user_id: 3,
        email: 'distributor@example.com',
        password: await bcrypt.hash('distributor123', 10),
        name: 'Distributor User',
        role: 'distributor',
        user_status: 1,
      },
      {
        user_id: 4,
        email: 'pharmacy@example.com',
        password: await bcrypt.hash('pharmacy123', 10),
        name: 'Pharmacy User',
        role: 'pharmacy',
        user_status: 1,
      }
    ];

    // Find user by email
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        user_Success: false 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        user_Success: false 
      });
    }

    // Generate JWT token
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    // Prepare user data (exclude password)
    const userData = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      user_status: user.user_status,
      user_Success: true,
      token: token,
      message: 'Login successful'
    };
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Server error during login' 
    });
  }
};

// Logout controller
export const logout = async (_req: Request, res: Response) => {
  try {
    // TODO: Add actual logout logic (clear sessions, etc.)
    return res.status(200).json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      message: 'Server error during logout' 
    });
  }
};

// Reset password controller
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    
    // Basic validation
    if (!email || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide all required fields' 
      });
    }

    // TODO: Add actual password reset logic
    return res.status(200).json({ 
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      message: 'Server error during password reset' 
    });
  }
};
