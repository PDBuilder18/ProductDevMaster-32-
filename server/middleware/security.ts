import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: process.env.NODE_ENV === 'development' ? 1000 : 100, // More lenient in development
  duration: 60, // Per 60 seconds
});

const aiRateLimiter = new RateLimiterMemory({
  points: 20, // Number of AI requests
  duration: 60, // Per 60 seconds
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.github.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Replit domains and localhost for development
    const allowedOrigins = [
      /\.replit\.app$/,
      /\.replit\.dev$/,
      /localhost:\d+$/,
      /127\.0\.0\.1:\d+$/,
      // Allow Shopify domains
      /\.myshopify\.com$/,
      /https:\/\/pd-builder\.myshopify\.com$/,
    ];

    // Add additional Shopify domains if configured
    if (process.env.SHOPIFY_DOMAIN) {
      allowedOrigins.push(new RegExp(process.env.SHOPIFY_DOMAIN.replace('.', '\\.')));
    }

    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// General rate limiting middleware
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for static assets and dev server requests in development
  if (process.env.NODE_ENV === 'development') {
    const skipPaths = ['/src/', '/@vite/', '/@fs/', '/node_modules/', '.js', '.css', '.ts', '.tsx', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    if (skipPaths.some(path => req.path.includes(path))) {
      return next();
    }
  }
  
  try {
    const key = req.ip || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: secs
    });
  }
}

// AI endpoint rate limiting
export async function aiRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = `ai_${req.ip || 'unknown'}`;
    await aiRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many AI requests. Please slow down.',
      retryAfter: secs
    });
  }
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Skip validation for workflow endpoints that don't require body data
  const workflowEndpoints = [
    '/root-cause',
    '/existing-solutions', 
    '/icp',
    '/use-case',
    '/requirements',
    '/save-file',
    '/webhooks',  // Shopify webhook endpoint - handles its own validation
    '/upload'     // File upload endpoint - multer handles validation
  ];
  
  // Skip validation for restore endpoint as it needs the saveData in body
  const isRestoreEndpoint = req.path.includes('/restore');
  
  const isWorkflowEndpoint = workflowEndpoints.some(endpoint => req.path.includes(endpoint));
  
  // Skip body validation for endpoints that don't require a request body
  const noBodyRequiredEndpoints = ['/complete-attempt'];
  const isNoBodyEndpoint = noBodyRequiredEndpoints.some(endpoint => req.path.includes(endpoint));
  
  // Skip validation for multipart/form-data requests (file uploads)
  const isMultipartFormData = req.headers['content-type']?.includes('multipart/form-data');
  
  // Basic request validation
  if (req.method === 'POST' || req.method === 'PATCH') {
    if (!isWorkflowEndpoint && !isRestoreEndpoint && !isNoBodyEndpoint && !isMultipartFormData && (!req.body || Object.keys(req.body).length === 0)) {
      return res.status(400).json({ error: 'Request body is required' });
    }
  }

  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
  ];

  const bodyStr = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(bodyStr));

  if (hasSuspiciousContent) {
    console.warn('Suspicious content detected:', req.ip, req.body);
    return res.status(400).json({ error: 'Invalid request content' });
  }

  next();
}

// HMAC signature validation for webhook endpoints
export function validateWebhookSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const crypto = require('crypto');
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const expectedSignature = `sha256=${computedSignature}`;

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  };
}