#!/usr/bin/env node

/**
 * PDBUILDER Environment Variables Checker
 * Run with: node check-env.js
 */

import 'dotenv/config';

const envVars = {
  required: {
    'OPENAI_API_KEY': {
      description: 'OpenAI API key for AI features',
      example: 'sk-proj-...',
      validation: (val) => val?.startsWith('sk-')
    }
  },
  database: {
    'SUPABASE_DATABASE_URL': {
      description: 'Supabase PostgreSQL connection string',
      example: 'postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres',
      validation: (val) => val?.includes('supabase.com')
    },
    'SUPABASE_ANON_KEY': {
      description: 'Supabase anonymous/public API key',
      example: 'eyJ...',
      validation: (val) => val?.startsWith('eyJ')
    },
    'DATABASE_URL': {
      description: 'Standard PostgreSQL connection string',
      example: 'postgresql://user:password@host:port/database',
      validation: (val) => val?.startsWith('postgresql://')
    },
    'NEON_DATABASE_URL': {
      description: 'Neon Database connection string',
      example: 'postgresql://user:password@ep-...neon.tech/database',
      validation: (val) => val?.includes('neon.tech')
    }
  },
  security: {
    'JWT_SECRET': {
      description: 'JWT signing secret (32+ characters)',
      example: 'your-super-secret-jwt-key-minimum-32-chars',
      validation: (val) => val && val.length >= 32
    },
    'ENCRYPTION_KEY': {
      description: 'Data encryption key (32+ characters)',
      example: 'your-encryption-key-minimum-32-characters',
      validation: (val) => val && val.length >= 32
    }
  },
  optional: {
    'SERP_API_KEY': {
      description: 'SerpAPI key for market research',
      example: 'abc123...'
    },
    'BING_SEARCH_API_KEY': {
      description: 'Bing Search API key',
      example: 'def456...'
    },
    'GITHUB_CLIENT_ID': {
      description: 'GitHub OAuth App client ID',
      example: 'Iv1.abc123...'
    },
    'GITHUB_CLIENT_SECRET': {
      description: 'GitHub OAuth App client secret',
      example: 'abc123...'
    },
    'SHOPIFY_DOMAIN': {
      description: 'Shopify shop domain',
      example: 'your-shop.myshopify.com'
    },
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN': {
      description: 'Shopify Storefront API token',
      example: 'shpat_...'
    }
  }
};

function checkEnvironment() {
  console.log('🔍 PDBUILDER Environment Variables Check\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('📋 REQUIRED VARIABLES:');
  for (const [key, config] of Object.entries(envVars.required)) {
    const value = process.env[key];
    const isValid = config.validation ? config.validation(value) : !!value;
    
    if (value && isValid) {
      console.log(`✅ ${key}: Set and valid`);
    } else if (value && !isValid) {
      console.log(`❌ ${key}: Set but invalid format`);
      console.log(`   Expected: ${config.example}`);
      hasErrors = true;
    } else {
      console.log(`❌ ${key}: Missing`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Example: ${config.example}`);
      hasErrors = true;
    }
  }

  // Check database variables
  console.log('\n💾 DATABASE VARIABLES (choose one):');
  const dbVars = ['SUPABASE_DATABASE_URL', 'DATABASE_URL', 'NEON_DATABASE_URL'];
  const hasDatabase = dbVars.some(key => process.env[key]);
  
  if (!hasDatabase) {
    console.log('⚠️  No database configured - will use memory storage');
    hasWarnings = true;
  }

  for (const [key, config] of Object.entries(envVars.database)) {
    const value = process.env[key];
    if (value) {
      const isValid = config.validation ? config.validation(value) : true;
      console.log(`${isValid ? '✅' : '❌'} ${key}: ${isValid ? 'Set and valid' : 'Set but invalid format'}`);
      if (!isValid) {
        console.log(`   Expected format: ${config.example}`);
        hasErrors = true;
      }
    } else {
      console.log(`⚪ ${key}: Not set`);
    }
  }

  // Check security variables
  console.log('\n🔒 SECURITY VARIABLES:');
  for (const [key, config] of Object.entries(envVars.security)) {
    const value = process.env[key];
    const isValid = config.validation ? config.validation(value) : !!value;
    
    if (value && isValid) {
      console.log(`✅ ${key}: Set and valid`);
    } else if (value && !isValid) {
      console.log(`⚠️  ${key}: Set but too short (needs 32+ characters)`);
      hasWarnings = true;
    } else {
      console.log(`⚠️  ${key}: Using development default`);
      hasWarnings = true;
    }
  }

  // Check optional variables
  console.log('\n🔧 OPTIONAL INTEGRATIONS:');
  for (const [key, config] of Object.entries(envVars.optional)) {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.log(`⚪ ${key}: Not configured`);
    }
  }

  // Environment-specific checks
  console.log('\n🌍 ENVIRONMENT:');
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 SESSION_DURATION: ${process.env.SESSION_DURATION || '7d'} (default)`);
  console.log(`🤖 OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4o'} (default)`);

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ SETUP INCOMPLETE - Missing required variables');
    console.log('   Fix the required variables above to run the application');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  SETUP PARTIAL - Some optional features disabled');
    console.log('   App will run but some features may not be available');
  } else {
    console.log('✅ SETUP COMPLETE - All variables configured correctly!');
  }

  console.log('\n📖 For detailed setup instructions, see ENV_VARIABLES.md');
  console.log('🏥 Check system health: curl http://localhost:5000/api/health');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironment();
}

export { checkEnvironment };