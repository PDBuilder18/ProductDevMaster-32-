import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sessions, feedback, type Session, type InsertSession, type InsertFeedback, type Feedback } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage } from '../storage';
import { ensureTablesExist } from '../migrations/migrate';

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    // Handle Supabase URLs that may have special characters in hostname
    let fixedConnectionString = connectionString;
    
    // Fix hostname with # character by properly URL encoding just the hostname part
    if (connectionString.includes('@#')) {
      fixedConnectionString = connectionString.replace('@#', '@%23');
    }
    
    const sql = neon(fixedConnectionString);
    this.db = drizzle(sql);
    
    // Ensure tables exist (important for Supabase)
    ensureTablesExist(fixedConnectionString).catch(console.warn);
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .limit(1);

      return result[0] || undefined;
    } catch (error) {
      console.error('Database error getting session:', error);
      throw new Error('Failed to retrieve session');
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
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
      console.error('Database error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session> {
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
      console.error('Database error updating session:', error);
      throw new Error('Failed to update session');
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    try {
      const result = await this.db
        .insert(feedback)
        .values(feedbackData)
        .returning();

      return result[0];
    } catch (error) {
      console.error('Database error creating feedback:', error);
      throw new Error('Failed to create feedback');
    }
  }

  async getAllFeedback(): Promise<Feedback[]> {
    try {
      const result = await this.db
        .select()
        .from(feedback)
        .orderBy(desc(feedback.createdAt));

      return result;
    } catch (error) {
      console.error('Database error getting all feedback:', error);
      return [];
    }
  }

  async getAllSessions(): Promise<Session[]> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .orderBy(desc(sessions.createdAt));

      return result;
    } catch (error) {
      console.error('Database error getting all sessions:', error);
      return [];
    }
  }

  // Additional methods for enhanced functionality

  async getUserSessions(userId: string, limit = 10): Promise<Session[]> {
    try {
      // Note: This assumes we add a userId field to sessions table
      // For now, we'll filter by sessionId pattern if it includes userId
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, `${userId}%`))
        .limit(limit);

      return result;
    } catch (error) {
      console.error('Database error getting user sessions:', error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(sessions)
        .where(eq(sessions.sessionId, sessionId));

      return true;
    } catch (error) {
      console.error('Database error deleting session:', error);
      return false;
    }
  }

  async getSessionsByStage(stage: string): Promise<Session[]> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.currentStage, stage));

      return result;
    } catch (error) {
      console.error('Database error getting sessions by stage:', error);
      return [];
    }
  }

  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    averageRating: number;
    averageHelpfulness: number;
  }> {
    try {
      // This would use SQL aggregation in a real implementation
      const allFeedback = await this.db.select().from(feedback);

      if (allFeedback.length === 0) {
        return { totalFeedback: 0, averageRating: 0, averageHelpfulness: 0 };
      }

      const totalRating = allFeedback.reduce((sum, f) => sum + f.rating, 0);
      const totalHelpfulness = allFeedback.reduce((sum, f) => sum + f.helpfulness, 0);

      return {
        totalFeedback: allFeedback.length,
        averageRating: totalRating / allFeedback.length,
        averageHelpfulness: totalHelpfulness / allFeedback.length,
      };
    } catch (error) {
      console.error('Database error getting feedback stats:', error);
      return { totalFeedback: 0, averageRating: 0, averageHelpfulness: 0 };
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.select().from(sessions).limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Factory function to create storage based on environment
export async function createStorage(): Promise<IStorage> {
  // Support both Neon and Supabase database URLs
  const databaseUrl = process.env.DATABASE_URL || 
                      process.env.NEON_DATABASE_URL || 
                      process.env.SUPABASE_DATABASE_URL;
  
  if (databaseUrl) {
    // Detect database provider for logging
    let provider = 'PostgreSQL';
    if (databaseUrl.includes('neon.tech')) {
      provider = 'Neon Database';
    } else if (databaseUrl.includes('supabase.co')) {
      provider = 'Supabase';
    }
    
    console.log(`Using database storage (${provider})`);
    return new DatabaseStorage(databaseUrl);
  } else {
    console.log('Using in-memory storage (development mode)');
    // Import and return the existing MemStorage
    const { MemStorage } = await import('../storage.js');
    return new MemStorage();
  }
}