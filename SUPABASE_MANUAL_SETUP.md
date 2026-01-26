# Manual Supabase Setup for PDBUILDER

## Issue
The automatic Supabase table creation is failing due to connection string parsing issues. You need to manually create the required tables in your Supabase dashboard.

## Solution: Manual Table Creation

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the Setup SQL
Copy and paste the following SQL code into the editor and click "Run":

```sql
-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  current_stage TEXT NOT NULL DEFAULT 'problem-discovery',
  completed_stages TEXT[] NOT NULL DEFAULT '{}',
  conversation_history JSONB[] NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  helpfulness INTEGER NOT NULL,
  improvements TEXT,
  most_valuable TEXT,
  would_recommend TEXT,
  recommendation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_current_stage ON sessions(current_stage);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on feedback" ON feedback FOR ALL USING (true);
```

### Step 3: Verify Table Creation
Run this query to verify the tables were created successfully:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sessions', 'feedback')
ORDER BY table_name, ordinal_position;
```

### Step 4: Test the Application
After creating the tables manually:

1. Restart your PDBUILDER application
2. Complete a full workflow (Steps 1-10)
3. On Step 10 (Feedback), submit feedback
4. Check your Supabase dashboard -> Table Editor -> "feedback" table
5. You should see the feedback entry with all fields populated

## Expected Result
After Step 10 completion, you should see a new row in the `feedback` table containing:
- `session_id`: The unique session identifier
- `rating`: User's overall rating (1-5)
- `helpfulness`: How helpful the tool was (1-5) 
- `improvements`: User suggestions for improvement
- `most_valuable`: What the user found most valuable
- `would_recommend`: Whether they would recommend the tool
- `recommendation_reason`: Why they would/wouldn't recommend it
- `created_at`: Timestamp of feedback submission

## Connection String Format
Ensure your `DATABASE_URL` follows this format:
```
postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

The connection string should use the **Transaction Pooler** format from Supabase, not the Direct connection.