import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sessions, feedback, type Session, type InsertSession, type InsertFeedback, type Feedback } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { IStorage } from '../storage';

/**
 * Real Supabase storage that actually writes to the database
 */
export class RealSupabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    console.log('🔗 Connecting to real Supabase database with HTTP driver...');
    
    try {
      // Use neon HTTP driver which handles URLs better
      this.sql = neon(connectionString);
      this.db = drizzle(this.sql);
      console.log('✅ Real Supabase connection established');
      
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      console.log('📝 Creating session in Supabase:', sessionData.sessionId);
      
      const result = await this.db
        .insert(sessions)
        .values({
          sessionId: sessionData.sessionId,
          currentStage: sessionData.currentStage || "problem-discovery",
          completedStages: sessionData.completedStages || [],
          conversationHistory: sessionData.conversationHistory || [],
          data: sessionData.data || {},
        })
        .returning();

      console.log('✅ Session created in Supabase with ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
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

      console.log('✅ Session updated in Supabase:', sessionId);
      return result[0];
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
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
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    try {
      console.log('💬 Creating feedback in Supabase database:', feedbackData);
      
      const result = await this.db
        .insert(feedback)
        .values(feedbackData)
        .returning();

      console.log('✅ Feedback saved to Supabase with ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
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
      console.error('Error getting all feedback:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test connection
      await this.db.select().from(sessions).limit(1);
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}