# Supabase Integration Guide for PDBUILDER

## Quick Setup Instructions

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for database to be ready (2-3 minutes)

### 2. Get Database Connection String
1. In your project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **Transaction pooler** tab (recommended for serverless)
4. Copy the URI that looks like:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Configure Environment Variable
Add the connection string to your Replit Secrets:
```bash
DATABASE_URL=postgresql://postgres.xxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Or use the Supabase-specific variable:
```bash
SUPABASE_DATABASE_URL=postgresql://postgres.xxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### 4. Tables Auto-Creation
The app will automatically create required tables when it first connects:
- `sessions` - User workflow progress
- `feedback` - User feedback and ratings
- Indexes for optimal performance

### 5. Verify Connection
1. Restart your app
2. Check the console logs for: `Using database storage (Supabase)`
3. Visit the admin page to see database connection status
4. Test creating a new session to verify tables are working

## Database Schema

The following tables will be created automatically:

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  current_stage TEXT NOT NULL DEFAULT 'problem-discovery',
  completed_stages TEXT[] NOT NULL DEFAULT '{}',
  conversation_history JSONB[] NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Feedback Table
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  helpfulness INTEGER NOT NULL,
  improvements TEXT,
  most_valuable TEXT,
  would_recommend TEXT,
  recommendation_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Supabase Dashboard Features

Your PDBUILDER data will be visible in the Supabase dashboard:

1. **Table Editor**: View and edit session data directly
2. **SQL Editor**: Run custom queries on your data
3. **Database**: Monitor performance and connections
4. **Auth**: Future integration for user authentication (optional)
5. **Storage**: Future integration for document uploads (optional)

## Troubleshooting

### Connection Issues
- Ensure password is correct in connection string
- Check that connection pooler is enabled in Supabase
- Verify firewall allows connections to Supabase

### Table Creation Issues
- Check Supabase project is fully initialized
- Verify database user has CREATE TABLE permissions
- Review server logs for specific error messages

### Performance Tips
- Use connection pooling (Transaction pooler) for better performance
- Enable Row Level Security (RLS) for production deployments
- Consider enabling real-time subscriptions for live updates

## Migration from Other Databases

If migrating from Neon or other PostgreSQL provider:
1. Export data from current database
2. Set new Supabase connection string
3. Restart app to create tables
4. Import data using Supabase SQL editor or migration scripts

## Next Steps

With Supabase integrated, you can explore:
- Real-time subscriptions for live collaboration
- Built-in authentication system
- File storage for document uploads
- Edge functions for serverless workflows
- Advanced analytics and monitoring