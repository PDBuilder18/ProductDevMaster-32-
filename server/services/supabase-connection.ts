import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sessions, feedback, type Session, type InsertSession, type InsertFeedback, type Feedback } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage, MemStorage } from '../storage';

/**
 * Special connection handler for Supabase URLs that may contain problematic characters
 */
function createSupabaseConnection(connectionString: string) {
  console.log('Processing Supabase connection string...');
  
  // Handle the connection string more carefully
  const cleanUrl = connectionString.trim();
  
  try {
    // First try standard URL parsing
    const url = new URL(cleanUrl);
    const originalHost = url.hostname;
    
    console.log('Original hostname:', originalHost);
    
    // If the hostname contains supabase.co, extract the project ID
    if (originalHost.includes('supabase.co')) {
      const hostParts = originalHost.split('.');
      let projectId = hostParts[0];
      
      // Clean up project ID (remove api, aws prefixes)
      if (projectId.includes('-') || projectId === 'api') {
        // For formats like api.xyz123.supabase.co or aws-0-us-east-1.xyz123.supabase.co
        const potentialId = hostParts.find(part => part.length >= 15 && part.match(/^[a-z0-9]+$/));
        if (potentialId) {
          projectId = potentialId;
        } else if (hostParts.length > 1) {
          projectId = hostParts[1] || hostParts[0];
        }
      }
      
      // Force database hostname format
      const dbHostname = `db.${projectId}.supabase.co`;
      console.log(`Fixing hostname: ${originalHost} -> ${dbHostname}`);
      
      // Replace hostname in URL
      const fixedUrl = cleanUrl.replace(originalHost, dbHostname);
      const sql = neon(fixedUrl);
      return drizzle(sql);
    }
    
    // Not a supabase URL, use as-is
    const sql = neon(cleanUrl);
    return drizzle(sql);
    
  } catch (error) {
    console.warn('URL parsing failed, trying manual extraction:', error);
    
    // Fallback: manual regex parsing
    const urlMatch = connectionString.match(/postgresql:\/\/([^:]+):([^@#]+)@([^:\/]+):(\d+)\/([^?]+)(\?.*)?/);
    if (!urlMatch) {
      throw new Error('Invalid PostgreSQL connection string format');
    }
    
    const [, user, password, rawHost, port, database, queryParams] = urlMatch;
  
  // Clean and extract project ID from hostname
  let cleanHost = rawHost.replace(/^[#@]*/, ''); // Remove special chars
  let projectId = cleanHost;
  
  if (cleanHost.includes('.supabase.co')) {
    // Extract project ID from full hostname
    const beforeDot = cleanHost.split('.')[0];
    // Remove any prefixes like api, aws-0-us-east-1, etc
    if (beforeDot.length === 20 && beforeDot.match(/^[a-z0-9]+$/)) {
      // Looks like a pure project ID
      projectId = beforeDot;
    } else {
      // Complex format, extract the actual project ID
      const parts = beforeDot.split('-');
      // Find the 20-character project ID part
      const possibleId = parts.find(part => part.length === 20 && part.match(/^[a-z0-9]+$/));
      projectId = possibleId || beforeDot;
    }
  } else if (cleanHost.length === 20 && cleanHost.match(/^[a-z0-9]+$/)) {
    // Just the project ID
    projectId = cleanHost;
  }
  
  // Force database hostname format
  const dbHostname = `db.${projectId}.supabase.co`;
  
  // Construct clean URL
  const params = queryParams || '?sslmode=require';
  const correctedUrl = `postgresql://${user}:${encodeURIComponent(password)}@${dbHostname}:${port}/${database}${params}`;
  
  console.log(`Fixed Supabase hostname: ${rawHost} -> ${dbHostname}`);
  
  try {
    const sql = neon(correctedUrl);
    return drizzle(sql);
  } catch (error) {
    console.warn('Initial connection failed, trying URL reconstruction:', error);
    
    // Extract components manually for problematic URLs
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@#]+)@#?([^:\/]+):(\d+)\/(.+)/);
    if (match) {
      const [, user, password, host, port, database] = match;
      
      // Clean the hostname of any special characters
      let cleanHost = host.replace(/^[#@]*/, '');
      
      // Fix hostname resolution - Supabase database uses db.* not api.*
      if (cleanHost.includes('supabase.co')) {
        console.log('Processing Supabase hostname:', cleanHost);
        
        if (cleanHost.startsWith('db.')) {
          // Already correct format
          console.log('Hostname already in correct db. format');
        } else if (cleanHost.includes('.supabase.co')) {
          // Replace any api./aws-0-*/etc prefixes with db.
          const originalHost = cleanHost;
          cleanHost = cleanHost.replace(/^[^.]+\./, 'db.');
          console.log(`Fixed hostname from ${originalHost} to ${cleanHost}`);
        } else {
          // Just the project ref, add the full hostname
          cleanHost = `db.${cleanHost}.supabase.co`;
          console.log('Added full hostname:', cleanHost);
        }
      }
      
      // Extract query parameters from database part
      const dbParts = database.split('?');
      const dbName = dbParts[0];
      const queryString = dbParts[1] ? `?${dbParts[1]}` : '?sslmode=require';
      
      // Construct a clean URL with properly encoded password
      const reconstructedUrl = `postgresql://${user}:${encodeURIComponent(password)}@${cleanHost}:${port}/${dbName}${queryString}`;
      console.log('Reconstructed URL with correct hostname:', cleanHost);
      
      const sql = neon(reconstructedUrl);
      return drizzle(sql);
    }
    
    throw new Error('Unable to parse Supabase connection string');
  }
}

export class SupabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private isConnected: boolean = false;
  private fallbackStorage: IStorage;

  constructor(connectionString: string, fallbackStorage?: IStorage) {
    // Use provided fallback or create one
    if (fallbackStorage) {
      this.fallbackStorage = fallbackStorage;
    } else {
      // Dynamic import for ES modules
      import('../persistent-storage.js').then(module => {
        this.fallbackStorage = new module.PersistentMemStorage();
      });
      // Temporary fallback until import completes
      this.fallbackStorage = new MemStorage();
    }
    
    try {
      this.db = createSupabaseConnection(connectionString);
      this.isConnected = true;
      console.log('Supabase connection established');
      
      // Test connection asynchronously without blocking
      this.testConnection().then(success => {
        if (success) {
          console.log('Supabase connection test passed, creating tables...');
          this.ensureTablesExist().then(() => {
            console.log('Supabase tables created successfully - data will be stored in database');
            this.isConnected = true;
          }).catch(err => {
            console.warn('Failed to create tables:', err);
            console.log('Will continue using fallback storage');
            this.isConnected = false;
          });
        } else {
          console.warn('Connection test failed - will use fallback storage for now');
          this.isConnected = false;
          // Retry connection periodically
          this.retryConnection();
        }
      });
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      this.isConnected = false;
    }
  }

  private retryConnection() {
    // Retry connection every 2 minutes (less frequent to reduce log spam)
    setTimeout(() => {
      if (!this.isConnected) {
        console.log('Retrying Supabase connection (silent attempt)...');
        this.testConnection().then(success => {
          if (success) {
            this.isConnected = true;
            console.log('SUCCESS: Supabase connection restored!');
            this.ensureTablesExist().catch(console.warn);
          } else {
            // Retry less frequently and silently
            setTimeout(() => this.retryConnection(), 120000); // 2 minutes
          }
        }).catch(() => {
          // Silent retry on error
          setTimeout(() => this.retryConnection(), 120000);
        });
      }
    }, 5000); // Initial retry after 5 seconds
  }

  private async testConnection(): Promise<boolean> {
    try {
      const result = await this.db.execute('SELECT 1 as test');
      console.log('Supabase connection test successful, result:', result?.length || 'no length');
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      // Log specific error details for debugging
      if (error instanceof Error && 'cause' in error) {
        console.error('Connection error cause:', error.cause);
      }
      return false;
    }
  }

  private async ensureTablesExist(): Promise<void> {
    try {
      console.log('Creating Supabase tables...');
      
      // Create sessions table with Supabase-compatible timestamp format
      await this.db.execute(`
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
      `);

      // Create feedback table with Supabase-compatible timestamp format
      await this.db.execute(`
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
      `);

      // Create indexes for performance
      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_current_stage ON sessions(current_stage);
        CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
      `);

      // Enable RLS and create policies for Supabase
      await this.db.execute(`
        ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
      `);
      
      await this.db.execute(`
        CREATE POLICY IF NOT EXISTS "Allow all operations on sessions" ON sessions FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow all operations on feedback" ON feedback FOR ALL USING (true);
      `);

      console.log('Supabase tables, indexes, and policies created successfully');
    } catch (error) {
      console.error('Failed to create Supabase tables:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    if (!this.isConnected) {
      return this.fallbackStorage.getSession(sessionId);
    }
    
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .limit(1);

      return result[0] || undefined;
    } catch (error) {
      console.error('Supabase error getting session, using fallback:', error);
      return this.fallbackStorage.getSession(sessionId);
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    if (!this.isConnected) {
      return this.fallbackStorage.createSession(sessionData);
    }
    
    try {
      const result = await this.db
        .insert(sessions)
        .values({
          ...sessionData,
          currentStage: sessionData.currentStage || "problem-discovery",
          completedStages: sessionData.completedStages || [],
          conversationHistory: sessionData.conversationHistory || [],
          data: sessionData.data || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Supabase error creating session, using fallback:', error);
      return this.fallbackStorage.createSession(sessionData);
    }
  }

  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session> {
    if (!this.isConnected) {
      return this.fallbackStorage.updateSession(sessionId, updates);
    }
    
    try {
      const result = await this.db
        .update(sessions)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(sessions.sessionId, sessionId))
        .returning();

      if (result.length === 0) {
        throw new Error('Session not found');
      }

      return result[0];
    } catch (error) {
      console.error('Supabase error updating session, using fallback:', error);
      return this.fallbackStorage.updateSession(sessionId, updates);
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    console.log('Creating feedback with data:', feedbackData);
    
    // Always save to fallback storage first to ensure data persistence
    const fallbackResult = await this.fallbackStorage.createFeedback(feedbackData);
    console.log('Feedback saved to fallback storage with ID:', fallbackResult.id);
    
    // Also try to save to Supabase if connected
    if (this.isConnected) {
      try {
        console.log('Attempting to save feedback to Supabase database...');
        const result = await this.db
          .insert(feedback)
          .values({
            ...feedbackData,
            improvements: feedbackData.improvements || null,
            mostValuable: feedbackData.mostValuable || null,
            wouldRecommend: feedbackData.wouldRecommend || null,
            recommendationReason: feedbackData.recommendationReason || null,
          })
          .returning();

        console.log('SUCCESS: Feedback saved to Supabase database with ID:', result[0].id);
        return result[0]; // Return Supabase result if successful
      } catch (error) {
        console.error('Supabase error creating feedback, but fallback succeeded:', error);
        this.isConnected = false; // Mark connection as failed for future requests
      }
    } else {
      console.log('Supabase not connected - feedback only saved to fallback storage');
    }
    
    // Return fallback result if Supabase failed or not connected
    return fallbackResult;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    if (!this.isConnected) {
      return this.fallbackStorage.getAllFeedback();
    }
    
    try {
      const result = await this.db
        .select()
        .from(feedback)
        .orderBy(desc(feedback.createdAt));

      return result;
    } catch (error) {
      console.error('Supabase error getting feedback, using fallback:', error);
      return this.fallbackStorage.getAllFeedback();
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      // Simple health check query
      await this.db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }
  }
}