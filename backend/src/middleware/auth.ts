import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role?: string;
  };
}

// Middleware to verify JWT token
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization as string;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided. Authorization denied.' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Invalid token format. Authorization denied.' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user to request object
    req.user = decoded;

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      message: 'Token is invalid or expired. Authorization denied.' 
    });
  }
};

// Middleware to check user role
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    return next();
  };
};
