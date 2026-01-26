# PDBUILDER - Render Deployment Guide

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)
1. Fork this repository to your GitHub account
2. Connect your GitHub to Render.com
3. Create a new Web Service and select this repository
4. Render will automatically detect the configuration

### Option 2: Manual Configuration
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:

**Build & Deploy Settings:**
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20

**Required Environment Variables:**
```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_DATABASE_URL=your_supabase_connection_string
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
```

**Auto-Generated Variables (Render will create these):**
```
JWT_SECRET=auto_generated_32_char_string
ENCRYPTION_KEY=auto_generated_32_char_string
```

### Health Check
- **Health Check Path**: `/api/health`
- **Port**: 5000 (auto-detected)

## Required Setup Before Deployment

### 1. Supabase Database
Ensure your Supabase database has the required tables:
```sql
-- Sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    current_stage VARCHAR(100) DEFAULT 'problem-discovery',
    completed_stages TEXT[] DEFAULT '{}',
    conversation_history JSONB DEFAULT '[]',
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table  
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    helpfulness INTEGER NOT NULL CHECK (helpfulness >= 1 AND helpfulness <= 5),
    comments TEXT,
    suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. OpenAI API Key
Get your API key from https://platform.openai.com/api-keys

### 3. Supabase Keys
From your Supabase dashboard:
- **API Settings**: Copy the "anon/public" key
- **Database Settings**: Copy the connection string

## Post-Deployment Verification

After deployment, verify these endpoints:
- `https://your-app.onrender.com/api/health` - Should return system status
- `https://your-app.onrender.com/` - Main application interface

## Troubleshooting

**Common Issues:**
1. **Build fails**: Check Node.js version (requires Node 20+)
2. **Health check fails**: Verify environment variables are set
3. **Database connection fails**: Check Supabase connection string format
4. **AI features don't work**: Verify OpenAI API key has sufficient credits

**Logs:**
Check Render logs for detailed error messages and debugging information.

## Features Enabled
- ✅ AI-powered problem analysis (OpenAI GPT-4)
- ✅ 10-step MVP workflow
- ✅ Persistent data storage (Supabase)
- ✅ Document export (PDF/DOCX)
- ✅ Session management
- ✅ User feedback collection
- ✅ Health monitoring
- ✅ Secure API endpoints
- ✅ Rate limiting protection

## Support
For deployment issues, check:
1. Render build logs
2. Application health endpoint
3. Supabase dashboard for database connectivity
4. OpenAI usage dashboard for API status