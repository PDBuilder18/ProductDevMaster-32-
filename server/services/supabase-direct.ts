import { IStorage } from '../storage';
import { Session, Feedback, InsertSession, InsertFeedback } from '@shared/schema';

/**
 * Direct Supabase connection using REST API
 * This bypasses all connection string issues
 */
export class DirectSupabaseStorage implements IStorage {
  private supabaseUrl: string;
  private apiKey: string;

  constructor() {
    // Extract Supabase project details from connection string
    const connectionString = process.env.SUPABASE_DATABASE_URL || '';
    
    // Extract project reference from connection string
    // postgresql://postgres.lewpjdfaapgsjkvpamfe...@aws-0-us-west-1.pooler.supabase.com:6543/postgres
    const match = connectionString.match(/postgres\.([a-z0-9]{20})/);
    if (!match) {
      throw new Error('Could not extract Supabase project reference');
    }
    
    const projectRef = match[1];
    this.supabaseUrl = `https://${projectRef}.supabase.co`;
    
    // You'll need to provide your Supabase anon/service key
    this.apiKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY required');
    }
    
    console.log(`🌐 Using Supabase REST API: ${this.supabaseUrl}`);
  }

  private async makeRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.supabaseUrl}/rest/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.apiKey}`,
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    // Convert snake_case to camelCase for frontend compatibility
    if (Array.isArray(data)) {
      return data.map(item => this.convertToCamelCase(item));
    } else if (typeof data === 'object' && data !== null) {
      return this.convertToCamelCase(data);
    }
    
    return data;
  }

  private convertToCamelCase(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = value;
    }
    return converted;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      const result = await this.makeRequest(`/sessions?session_id=eq.${sessionId}&limit=1`);
      return result[0];
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      console.log('📝 Creating session in Supabase via REST API:', sessionData.sessionId);
      
      const result = await this.makeRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionData.sessionId,
          current_stage: sessionData.currentStage || 'problem-discovery',
          completed_stages: sessionData.completedStages || [],
          conversation_history: sessionData.conversationHistory || [],
          data: sessionData.data || {},
        }),
      });

      console.log('✅ Session created in Supabase with ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session> {
    try {
      // Convert camelCase updates to snake_case for database
      const snakeCaseUpdates: any = {};
      if (updates.currentStage) snakeCaseUpdates.current_stage = updates.currentStage;
      if (updates.completedStages) snakeCaseUpdates.completed_stages = updates.completedStages;
      if (updates.conversationHistory) snakeCaseUpdates.conversation_history = updates.conversationHistory;
      if (updates.data) snakeCaseUpdates.data = updates.data;
      snakeCaseUpdates.updated_at = new Date().toISOString();
      
      const result = await this.makeRequest(`/sessions?session_id=eq.${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(snakeCaseUpdates),
      });

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
      return await this.makeRequest('/sessions?order=created_at.desc');
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    try {
      console.log('💬 Creating feedback in Supabase via REST API:', feedbackData);
      
      // Convert camelCase to snake_case for database
      const snakeCaseFeedback = {
        session_id: feedbackData.sessionId,
        rating: feedbackData.rating,
        helpfulness: feedbackData.helpfulness,
        improvements: feedbackData.improvements,
        most_valuable: feedbackData.mostValuable,
        would_recommend: feedbackData.wouldRecommend,
        recommendation_reason: feedbackData.recommendationReason,
      };
      
      const result = await this.makeRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(snakeCaseFeedback),
      });

      console.log('✅ Feedback saved to Supabase with ID:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  async getAllFeedback(): Promise<Feedback[]> {
    try {
      return await this.makeRequest('/feedback?order=created_at.desc');
    } catch (error) {
      console.error('Error getting all feedback:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test connection
      await this.makeRequest('/sessions?limit=1');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}