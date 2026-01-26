import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sessions, feedback } from '@shared/schema';

export async function runMigrations(connectionString: string) {
  try {
    console.log('Starting database migrations...');
    
    // Handle Supabase URLs that may have special characters in hostname
    let fixedConnectionString = connectionString;
    
    // Fix hostname with # character by properly URL encoding just the hostname part
    if (connectionString.includes('@#')) {
      fixedConnectionString = connectionString.replace('@#', '@%23');
    }
    
    const sql = neon(fixedConnectionString);
    const db = drizzle(sql);

    // Create tables if they don't exist
    // This is a simplified approach for Supabase compatibility
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        current_stage TEXT NOT NULL DEFAULT 'problem-discovery',
        completed_stages TEXT[] NOT NULL DEFAULT '{}',
        conversation_history JSONB[] NOT NULL DEFAULT '{}',
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
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
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS pitch_decks (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS pitch_deck_slides (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL REFERENCES pitch_decks(id) ON DELETE CASCADE,
        slide_type TEXT NOT NULL,
        position INTEGER NOT NULL,
        title_override TEXT,
        content JSONB NOT NULL DEFAULT '{}',
        ai_draft JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(deck_id, position)
      );
    `;

    // Create indexes for better performance (execute each separately for Neon compatibility)
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_current_stage ON sessions(current_stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pitch_decks_session_id ON pitch_decks(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pitch_deck_slides_deck_id ON pitch_deck_slides(deck_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pitch_deck_slides_position ON pitch_deck_slides(deck_id, position)`;

    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Auto-run migrations when database connection is established
export async function ensureTablesExist(connectionString: string): Promise<boolean> {
  try {
    return await runMigrations(connectionString);
  } catch (error) {
    console.warn('Could not run migrations, tables may need to be created manually:', error);
    return false;
  }
}