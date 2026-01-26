import type { Express, Request } from "express";
import { createGitHubService } from "../services/github";
import { createShopifyService } from "../services/shopify";
import { generateAuthToken, authenticateToken, AuthRequest } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/security";
import { createHmac } from "crypto";
import httpx from "axios";

// In-memory token storage (replace with DB in production)
const TOKENS: Record<string, string> = {};

export function registerAuthRoutes(app: Express) {
  // Shopify OAuth authorization endpoint (Step 1 requirement)
  app.get("/auth", async (req, res) => {
    try {
      const { shop, state = "nonce" } = req.query;
      
      if (!shop) {
        return res.status(400).json({ error: "Shop parameter required" });
      }
      
      const API_KEY = process.env.SHOPIFY_API_KEY;
      const SCOPES = process.env.SHOPIFY_SCOPES || "read_products";
      const APP_URL = process.env.APP_URL || `http://localhost:5000`;
      
      if (!API_KEY) {
        return res.status(500).json({ error: "Shopify API key not configured" });
      }
      
      const params = new URLSearchParams({
        client_id: API_KEY,
        scope: SCOPES,
        redirect_uri: `${APP_URL}/auth/callback`,
        state: state as string
      });
      
      const authUrl = `https://${shop}/admin/oauth/authorize?${params}`;
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Shopify auth error:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Shopify authentication failed' });
    }
  });
  
  // Shopify OAuth callback endpoint (Step 1 requirement)
  app.get("/auth/callback", async (req, res) => {
    try {
      const { shop, code, state } = req.query;
      
      if (!shop || !code) {
        return res.status(400).json({ error: "Shop and code parameters required" });
      }
      
      const API_KEY = process.env.SHOPIFY_API_KEY;
      const API_SECRET = process.env.SHOPIFY_API_SECRET;
      
      if (!API_KEY || !API_SECRET) {
        return res.status(500).json({ error: "Shopify credentials not configured" });
      }
      
      const tokenUrl = `https://${shop}/admin/oauth/access_token`;
      const response = await httpx.post(tokenUrl, {
        client_id: API_KEY,
        client_secret: API_SECRET,
        code: code as string
      });
      
      TOKENS[shop as string] = response.data.access_token;
      
      res.json({ installed: true, shop });
    } catch (error: any) {
      console.error('Shopify callback error:', error.message || 'Unknown error');
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  });
  
  // Shopify webhook endpoint (Step 1 requirement)
  app.post("/webhooks", async (req, res) => {
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
      
      // Use raw body for HMAC verification (assumes raw body middleware)
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const expectedHmac = createHmac('sha256', API_SECRET)
        .update(rawBody, 'utf8')
        .digest('base64');
      
      // Compare digests securely
      const hmacMatches = expectedHmac === hmacHeader;
      
      if (!hmacMatches) {
        return res.status(401).json({ error: "Invalid HMAC signature" });
      }
      
      // TODO: Handle webhook topic from headers (e.g., X-Shopify-Topic)
      const topic = req.headers['x-shopify-topic'];
      console.log(`Received Shopify webhook: ${topic || 'unknown'}`);
      
      res.json({ ok: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
  
  // GitHub OAuth integration
  app.get("/api/auth/github/repos", authenticateToken, rateLimitMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user?.provider !== 'github') {
        return res.status(400).json({ error: 'GitHub authentication required' });
      }

      const accessToken = req.headers['x-github-token'] as string;
      if (!accessToken) {
        return res.status(400).json({ error: 'GitHub access token required' });
      }

      const githubService = createGitHubService(accessToken);
      const repos = await githubService.getUserRepositories(accessToken);

      res.json({ repositories: repos });
    } catch (error: any) {
      console.error('GitHub repos fetch failed:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });

  // Export session data to GitHub
  app.post("/api/auth/github/export", authenticateToken, rateLimitMiddleware, async (req: AuthRequest, res) => {
    try {
      const { repositoryConfig, sessionData, filename } = req.body;
      
      if (!repositoryConfig?.owner || !repositoryConfig?.repo) {
        return res.status(400).json({ error: 'Repository configuration required' });
      }

      const accessToken = req.headers['x-github-token'] as string;
      if (!accessToken) {
        return res.status(400).json({ error: 'GitHub access token required' });
      }

      const githubService = createGitHubService(accessToken);
      
      // Verify repository access first
      const hasAccess = await githubService.verifyRepositoryAccess({
        ...repositoryConfig,
        accessToken,
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to specified repository' });
      }

      const result = await githubService.exportToRepository(
        { ...repositoryConfig, accessToken },
        sessionData,
        filename
      );

      res.json({ 
        success: true, 
        export: result,
        message: 'Successfully exported to GitHub repository'
      });
    } catch (error: any) {
      console.error('GitHub export failed:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Failed to export to GitHub' });
    }
  });

  // Create GitHub issues from features
  app.post("/api/auth/github/issues", authenticateToken, rateLimitMiddleware, async (req: AuthRequest, res) => {
    try {
      const { repositoryConfig, features } = req.body;
      
      if (!repositoryConfig?.owner || !repositoryConfig?.repo) {
        return res.status(400).json({ error: 'Repository configuration required' });
      }

      if (!features || !Array.isArray(features)) {
        return res.status(400).json({ error: 'Features array required' });
      }

      const accessToken = req.headers['x-github-token'] as string;
      if (!accessToken) {
        return res.status(400).json({ error: 'GitHub access token required' });
      }

      const githubService = createGitHubService(accessToken);
      const issues = await githubService.createIssuesFromFeatures(
        { ...repositoryConfig, accessToken },
        features
      );

      res.json({ 
        success: true, 
        issues,
        message: `Created ${issues.length} GitHub issues`
      });
    } catch (error: any) {
      console.error('GitHub issues creation failed:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Failed to create GitHub issues' });
    }
  });

  // Shopify customer authentication
  app.post("/api/auth/shopify/validate", rateLimitMiddleware, async (req, res) => {
    try {
      const { customerId, email, shopDomain } = req.body;

      if (!customerId || !shopDomain) {
        return res.status(400).json({ error: 'Customer ID and shop domain required' });
      }

      const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
      if (!storefrontToken) {
        return res.status(500).json({ error: 'Shopify integration not configured' });
      }

      const shopifyService = createShopifyService({
        shopDomain,
        storefrontAccessToken: storefrontToken,
      });

      const customer = await shopifyService.validateCustomerSession(customerId, email);
      if (!customer) {
        return res.status(401).json({ error: 'Invalid Shopify customer session' });
      }

      const user = shopifyService.shopifyCustomerToAuthUser(customer);
      const token = generateAuthToken(user);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          provider: user.provider,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        }
      });
    } catch (error: any) {
      console.error('Shopify validation failed:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Shopify authentication failed' });
    }
  });

  // Generate Shopify embed code
  app.get("/api/auth/shopify/embed-code", async (req, res) => {
    try {
      const { customerId } = req.query;
      
      const shopifyService = createShopifyService({
        shopDomain: process.env.SHOPIFY_DOMAIN || 'your-shop.myshopify.com',
        storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
      });

      const liquidCode = shopifyService.generateLiquidSnippet(customerId as string);

      res.json({
        success: true,
        liquidCode,
        instructions: [
          '1. Copy the Liquid code below',
          '2. Create a new page in your Shopify admin (Online Store > Pages)',
          '3. Paste the code into the page content',
          '4. Save and publish the page',
          '5. Add a link to the page in your customer account navigation'
        ]
      });
    } catch (error: any) {
      console.error('Shopify embed code generation failed:', error.message || 'Unknown error');
      res.status(500).json({ error: 'Failed to generate embed code' });
    }
  });

  // Health check for authentication services
  app.get("/api/auth/health", async (req, res) => {
    const health = {
      github: !!process.env.GITHUB_CLIENT_ID,
      shopify: !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      shopifyOAuth: !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET),
      auth: true,
      timestamp: new Date().toISOString(),
    };

    res.json(health);
  });
}