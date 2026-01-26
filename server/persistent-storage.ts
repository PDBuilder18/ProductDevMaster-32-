import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { type Session, type Feedback, type InsertSession, type InsertFeedback } from "@shared/schema";
import { nanoid } from "nanoid";
import { IStorage } from "./storage";

const DATA_DIR = './temp';
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');
const FEEDBACK_FILE = join(DATA_DIR, 'feedback.json');

export class PersistentMemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private feedbacks: Map<number, Feedback>;
  private currentSessionId: number;
  private currentFeedbackId: number;

  constructor() {
    this.sessions = new Map();
    this.feedbacks = new Map();
    this.currentSessionId = 1;
    this.currentFeedbackId = 1;
    this.loadData();
  }

  private loadData() {
    try {
      // Load sessions
      if (existsSync(SESSIONS_FILE)) {
        const sessionsData = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
        sessionsData.forEach((session: any) => {
          this.sessions.set(session.sessionId, {
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt)
          });
          this.currentSessionId = Math.max(this.currentSessionId, session.id + 1);
        });
      }

      // Load feedback
      if (existsSync(FEEDBACK_FILE)) {
        const feedbackData = JSON.parse(readFileSync(FEEDBACK_FILE, 'utf8'));
        feedbackData.forEach((feedback: any) => {
          this.feedbacks.set(feedback.id, {
            ...feedback,
            createdAt: new Date(feedback.createdAt)
          });
          this.currentFeedbackId = Math.max(this.currentFeedbackId, feedback.id + 1);
        });
      }
    } catch (error) {
      console.warn('Could not load persistent data:', error);
    }
  }

  private saveData() {
    try {
      // Save sessions
      const sessionsArray = Array.from(this.sessions.values());
      writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsArray, null, 2));

      // Save feedback
      const feedbackArray = Array.from(this.feedbacks.values());
      writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackArray, null, 2));
    } catch (error) {
      console.warn('Could not save persistent data:', error);
    }
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const session: Session = {
      id: this.currentSessionId++,
      sessionId: sessionData.sessionId,
      currentStage: sessionData.currentStage || "problem-discovery",
      completedStages: sessionData.completedStages || [],
      conversationHistory: sessionData.conversationHistory || [],
      data: sessionData.data || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionData.sessionId, session);
    this.saveData();
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session> {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    const updated: Session = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, updated);
    this.saveData();
    return updated;
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const feedback: Feedback = {
      id: this.currentFeedbackId++,
      ...feedbackData,
      improvements: feedbackData.improvements || null,
      mostValuable: feedbackData.mostValuable || null,
      wouldRecommend: feedbackData.wouldRecommend || null,
      recommendationReason: feedbackData.recommendationReason || null,
      createdAt: new Date(),
    };
    this.feedbacks.set(feedback.id, feedback);
    this.saveData();
    return feedback;
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}