import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

// Role hierarchy: Admin > Manager > Developer > Tester
const ROLE_HIERARCHY = {
  'Admin': 4,
  'Manager': 3,
  'Developer': 2,
  'Tester': 1
};

// Permission definitions
export const PERMISSIONS = {
  // Project permissions
  CREATE_PROJECT: ['Admin', 'Manager'],
  UPDATE_PROJECT: ['Admin', 'Manager'],
  DELETE_PROJECT: ['Admin', 'Manager'],
  VIEW_PROJECT: ['Admin', 'Manager', 'Developer', 'Tester'],
  EXPORT_PROJECT: ['Admin', 'Manager'],

  // User permissions
  CREATE_USER: ['Admin'],
  UPDATE_USER: ['Admin', 'Manager'],
  DELETE_USER: ['Admin'],
  VIEW_USERS: ['Admin', 'Manager'],

  // Test case permissions
  CREATE_TEST_CASE: ['Admin', 'Manager', 'Developer', 'Tester'],
  UPDATE_TEST_CASE: ['Admin', 'Manager', 'Developer', 'Tester'],
  DELETE_TEST_CASE: ['Admin', 'Manager', 'Developer'],
  EXECUTE_TEST_CASE: ['Admin', 'Manager', 'Developer', 'Tester'],
  VIEW_TEST_CASES: ['Admin', 'Manager', 'Developer', 'Tester'],

  // Bug permissions
  CREATE_BUG: ['Admin', 'Manager', 'Developer', 'Tester'],
  UPDATE_BUG: ['Admin', 'Manager', 'Developer'],
  DELETE_BUG: ['Admin', 'Manager', 'Developer'],
  VIEW_BUGS: ['Admin', 'Manager', 'Developer', 'Tester'],
  ASSIGN_BUG: ['Admin', 'Manager', 'Developer'],

  // Module permissions
  CREATE_MODULE: ['Admin', 'Manager', 'Developer'],
  UPDATE_MODULE: ['Admin', 'Manager', 'Developer'],
  DELETE_MODULE: ['Admin', 'Manager', 'Developer'],
  VIEW_MODULES: ['Admin', 'Manager', 'Developer', 'Tester'],

  // Document permissions
  UPLOAD_DOCUMENT: ['Admin', 'Manager', 'Developer', 'Tester'],
  DELETE_DOCUMENT: ['Admin', 'Manager', 'Developer'],
  VIEW_DOCUMENTS: ['Admin', 'Manager', 'Developer', 'Tester'],

  // Report permissions
  VIEW_REPORTS: ['Admin', 'Manager', 'Developer', 'Tester'],
  EXPORT_REPORTS: ['Admin', 'Manager'],

  // Settings permissions
  MANAGE_SETTINGS: ['Admin'],
  VIEW_SETTINGS: ['Admin', 'Manager']
};

export function requirePermission(permission: keyof typeof PERMISSIONS) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const allowedRoles = PERMISSIONS[permission];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
}

export function requireRole(minRole: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userRoleLevel = ROLE_HIERARCHY[req.user.role as keyof typeof ROLE_HIERARCHY];
      const requiredRoleLevel = ROLE_HIERARCHY[minRole as keyof typeof ROLE_HIERARCHY];

      if (!userRoleLevel || userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          message: 'Insufficient role level',
          required: minRole,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error' });
    }
  };
}

// Enhanced authentication middleware
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.session.id;

  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Optionally verify the user still exists and add user info to session
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user details to session for use in API handlers
    req.session.userFirstName = user.firstName;
    req.session.userLastName = user.lastName;
    req.session.userEmail = user.email;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};