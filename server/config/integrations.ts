// Integration Configuration for PDBuilder
export interface IntegrationConfig {
  github: {
    clientId?: string;
    clientSecret?: string;
    webhookSecret?: string;
    enabled: boolean;
  };
  shopify: {
    domain?: string;
    storefrontAccessToken?: string;
    webhookSecret?: string;
    enabled: boolean;
  };
  openai: {
    apiKey?: string;
    model: string;
    enabled: boolean;
  };
  search: {
    serpApiKey?: string;
    bingApiKey?: string;
    enabled: boolean;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionDuration: string;
  };
  database: {
    url?: string;
    type: 'memory' | 'postgresql';
    provider?: 'supabase' | 'neon' | 'postgresql';
  };
}

export function getIntegrationConfig(): IntegrationConfig {
  return {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    shopify: {
      domain: process.env.SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
      enabled: !!(process.env.SHOPIFY_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      enabled: !!process.env.OPENAI_API_KEY,
    },
    search: {
      serpApiKey: process.env.SERP_API_KEY || process.env.SERPAPI_KEY,
      bingApiKey: process.env.BING_SEARCH_API_KEY || process.env.AZURE_SEARCH_API_KEY,
      enabled: !!(process.env.SERP_API_KEY || process.env.SERPAPI_KEY || process.env.BING_SEARCH_API_KEY || process.env.AZURE_SEARCH_API_KEY),
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
      encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-production',
      sessionDuration: process.env.SESSION_DURATION || '7d',
    },
    database: {
      url: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
      type: (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.SUPABASE_DATABASE_URL) ? 'postgresql' : 'memory',
      provider: process.env.DATABASE_URL?.includes('supabase.co') ? 'supabase' : 
                process.env.SUPABASE_DATABASE_URL ? 'supabase' :
                process.env.NEON_DATABASE_URL ? 'neon' : 'postgresql',
    },
  };
}

export function validateRequiredIntegrations(): { valid: boolean; missing: string[] } {
  const config = getIntegrationConfig();
  const missing: string[] = [];

  // Check required integrations
  if (!config.openai.enabled) {
    missing.push('OpenAI API key (OPENAI_API_KEY)');
  }

  // Warn about optional but recommended integrations
  const warnings: string[] = [];
  if (!config.github.enabled) {
    warnings.push('GitHub integration (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)');
  }
  if (!config.search.enabled) {
    warnings.push('Search API (SERP_API_KEY or BING_SEARCH_API_KEY)');
  }
  if (config.database.type === 'memory') {
    warnings.push('PostgreSQL database (DATABASE_URL) - using in-memory storage');
  }

  if (warnings.length > 0) {
    console.warn('Optional integrations not configured:', warnings.join(', '));
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function getIntegrationStatus() {
  const config = getIntegrationConfig();
  
  return {
    github: {
      enabled: config.github.enabled,
      features: ['Repository Export', 'Issue Creation', 'Collaborative Development'],
      status: config.github.enabled ? 'active' : 'disabled',
    },
    shopify: {
      enabled: config.shopify.enabled,
      features: ['Customer Authentication', 'Embedded App', 'Metafields Storage'],
      status: config.shopify.enabled ? 'active' : 'disabled',
    },
    openai: {
      enabled: config.openai.enabled,
      features: ['AI Conversation', 'Problem Analysis', 'Content Generation'],
      status: config.openai.enabled ? 'active' : 'disabled',
    },
    search: {
      enabled: config.search.enabled,
      features: ['Market Research', 'Competitor Analysis', 'Trend Analysis'],
      status: config.search.enabled ? 'active' : 'disabled',
    },
    database: {
      enabled: config.database.type === 'postgresql',
      features: ['Persistent Storage', 'User Sessions', 'Analytics'],
      status: config.database.type === 'postgresql' ? 'active' : 'memory-only',
    },
    security: {
      enabled: true,
      features: ['Rate Limiting', 'CORS Protection', 'Request Validation', 'JWT Authentication'],
      status: 'active',
    },
  };
}