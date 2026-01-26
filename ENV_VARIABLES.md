# PDBUILDER Environment Variables Guide

## Overview
This document lists all environment variables used in the PDBUILDER project, their purposes, and configuration details.

## Required Variables (Essential for App Function)

### 1. OPENAI_API_KEY
- **Purpose**: Powers AI features (problem analysis, content generation, market research)
- **Format**: `sk-...` (starts with "sk-")
- **Where to get**: https://platform.openai.com/api-keys
- **Required**: ✅ YES - App won't start without this
- **Example**: `OPENAI_API_KEY=sk-proj-abc123...`

## Database Variables (Choose One)

### 2. SUPABASE_DATABASE_URL
- **Purpose**: PostgreSQL connection string for Supabase
- **Format**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- **Where to get**: Supabase Dashboard → Settings → Database → Connection string
- **Required**: ⚠️ RECOMMENDED - Falls back to memory storage
- **Example**: `SUPABASE_DATABASE_URL=postgresql://postgres.abcdef:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

### 3. SUPABASE_ANON_KEY  
- **Purpose**: Supabase anonymous/public API key
- **Format**: `eyJ...` (JWT token starting with "eyJ")
- **Where to get**: Supabase Dashboard → Settings → API → anon/public key
- **Required**: ✅ YES (if using Supabase)
- **Example**: `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Alternative Database Options
```bash
# Option 1: Neon Database
NEON_DATABASE_URL=postgresql://user:password@ep-cool-math-123456.us-east-1.aws.neon.tech/neondb

# Option 2: Standard PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/pdbuilder
```

## Security Variables (Required for Production)

### 4. JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Format**: Minimum 32 characters, random string
- **Where to get**: Generate securely (auto-generated on Render)
- **Required**: ✅ YES for production
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars`

### 5. ENCRYPTION_KEY
- **Purpose**: Encrypts sensitive session data
- **Format**: Minimum 32 characters, random string  
- **Where to get**: Generate securely (auto-generated on Render)
- **Required**: ✅ YES for production
- **Example**: `ENCRYPTION_KEY=your-encryption-key-minimum-32-characters`

## Optional Integration Variables

### GitHub Integration (Optional)
```bash
# Enables repository export and issue creation
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret  
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
```
- **Where to get**: GitHub → Settings → Developer settings → OAuth Apps

### Shopify Integration (Optional)
```bash
# Enables e-commerce platform integration
SHOPIFY_DOMAIN=your-shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
```
- **Where to get**: Shopify Partners Dashboard → Apps

### Search APIs (Optional - for market research)
```bash
# Option 1: SerpAPI (recommended)
SERP_API_KEY=your_serpapi_key
# Alternative name:
SERPAPI_KEY=your_serpapi_key

# Option 2: Bing Search API
BING_SEARCH_API_KEY=your_bing_search_api_key
# Alternative name:
AZURE_SEARCH_API_KEY=your_azure_search_api_key
```

### Supabase Service Key (Optional)
```bash
# For admin-level database operations (use carefully)
SUPABASE_SERVICE_KEY=your_service_role_key
```

## Configuration Variables (Optional)

### 6. NODE_ENV
- **Purpose**: Defines application environment
- **Default**: `development`
- **Options**: `development`, `production`
- **Example**: `NODE_ENV=production`

### 7. SESSION_DURATION
- **Purpose**: JWT token expiration time
- **Default**: `7d` (7 days)
- **Format**: Time string (e.g., '1h', '24h', '7d', '30d')
- **Example**: `SESSION_DURATION=24h`

### 8. OPENAI_MODEL
- **Purpose**: Specifies OpenAI model to use
- **Default**: `gpt-4o`
- **Options**: `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`
- **Example**: `OPENAI_MODEL=gpt-4o`

## Replit-Specific Variables (Auto-Set)

### 9. REPLIT_DEV_DOMAIN
- **Purpose**: Development domain for Replit environment
- **Format**: `{repl-name}--{username}.repl.co`
- **Auto-set**: ✅ YES (by Replit)
- **Example**: `REPLIT_DEV_DOMAIN=pdbuilder--username.repl.co`

### 10. REPL_ID
- **Purpose**: Unique identifier for Replit instance
- **Auto-set**: ✅ YES (by Replit)
- **Used in**: Development builds and environment detection

## Environment Files Setup

### Development (.env.local)
```bash
# Required
OPENAI_API_KEY=sk-your-openai-key

# Database (choose one)
SUPABASE_DATABASE_URL=your_supabase_connection_string
SUPABASE_ANON_KEY=your_supabase_anon_key

# Security (development defaults are provided)
JWT_SECRET=dev-jwt-secret-change-in-production
ENCRYPTION_KEY=dev-encryption-key-change-in-production

# Optional integrations
SERP_API_KEY=your_serpapi_key
```

### Production (Render/Deployment)
```bash
# Essential
OPENAI_API_KEY=sk-your-openai-key
SUPABASE_DATABASE_URL=your_supabase_connection_string
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=secure-random-32-plus-character-string
ENCRYPTION_KEY=secure-random-32-plus-character-string
NODE_ENV=production

# Optional but recommended
SERP_API_KEY=your_serpapi_key
SESSION_DURATION=7d
```

## Variable Priority & Fallbacks

### Database Connection (in order of priority):
1. `SUPABASE_DATABASE_URL` (if Supabase keys provided)
2. `DATABASE_URL` (standard PostgreSQL)
3. `NEON_DATABASE_URL` (Neon Database)
4. Memory storage (fallback)

### Search API (first available):
1. `SERP_API_KEY` or `SERPAPI_KEY`
2. `BING_SEARCH_API_KEY` or `AZURE_SEARCH_API_KEY`
3. No search functionality (graceful degradation)

## Validation & Health Check

The app provides endpoints to check environment configuration:

- **Health Check**: `GET /api/health` - Shows all service status
- **Integration Status**: `GET /api/integrations/status` - Lists enabled features
- **Config Validation**: `GET /api/config/validate` - Validates setup

## Security Best Practices

1. **Never commit sensitive keys** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** (especially in production)
4. **Use service keys sparingly** (prefer anon keys when possible)
5. **Monitor API usage** to detect unauthorized access

## Troubleshooting

### Common Issues:

**"OpenAI API error"**: Check `OPENAI_API_KEY` is valid and has credits
**"Database connection failed"**: Verify connection string format and credentials
**"Session creation failed"**: Check `JWT_SECRET` and `ENCRYPTION_KEY` are set
**"Search not working"**: Add `SERP_API_KEY` or `BING_SEARCH_API_KEY`

### Debug Commands:
```bash
# Check environment variables (masks sensitive values)
curl http://localhost:5000/api/health

# Validate configuration
curl http://localhost:5000/api/config/validate
```