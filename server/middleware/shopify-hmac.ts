import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';

// Middleware to verify Shopify HMAC signatures
export function verifyShopifyHmac(req: Request, res: Response, next: NextFunction) {
  try {
    const API_SECRET = process.env.SHOPIFY_API_SECRET;
    
    if (!API_SECRET) {
      return res.status(500).json({ error: "Shopify API secret not configured" });
    }
    
    // Verify HMAC signature
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    if (!hmacHeader) {
      return res.status(401).json({ error: "Missing HMAC signature" });
    }
    
    // Use raw body for HMAC verification (required for Shopify webhooks)
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      return res.status(500).json({ error: "Raw body not available for HMAC verification" });
    }
    
    const expectedHmac = createHmac('sha256', API_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');
    
    // Compare digests securely using timing-safe comparison
    const expectedBuffer = Buffer.from(expectedHmac, 'base64');
    const receivedBuffer = Buffer.from(hmacHeader, 'base64');
    
    if (expectedBuffer.length !== receivedBuffer.length) {
      console.log('HMAC verification failed: length mismatch');
      return res.status(401).json({ error: "Invalid HMAC signature" });
    }
    
    const hmacMatches = require('crypto').timingSafeEqual(expectedBuffer, receivedBuffer);
    
    if (!hmacMatches) {
      console.log('HMAC verification failed for Shopify request');
      return res.status(401).json({ error: "Invalid HMAC signature" });
    }
    
    // HMAC verified successfully
    next();
  } catch (error: any) {
    console.error('HMAC verification error:', error.message || 'Unknown error');
    res.status(500).json({ error: 'HMAC verification failed' });
  }
}