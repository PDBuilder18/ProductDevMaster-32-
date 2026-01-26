import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-encryption-key';

export interface AuthUser {
  id: string;
  email?: string;
  provider: 'github' | 'shopify' | 'google';
  providerData: any;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

// Encrypt sensitive session data
export function encryptSessionData(data: any): string {
  return crypto.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

// Decrypt sensitive session data
export function decryptSessionData(encryptedData: string): any {
  try {
    const bytes = crypto.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(crypto.enc.Utf8));
  } catch (error) {
    console.error('Failed to decrypt session data:', error);
    return null;
  }
}

// Generate secure JWT token
export function generateAuthToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      provider: user.provider 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      provider: decoded.provider,
      providerData: decoded.providerData || {}
    };
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

// Optional authentication (for public endpoints that benefit from auth)
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = verifyAuthToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

// Session ID validation
export function validateSessionAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = req.params.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  // If user is authenticated, ensure they own the session
  if (req.user) {
    // Session ownership will be validated in the storage layer
    req.sessionId = sessionId;
  }

  next();
}