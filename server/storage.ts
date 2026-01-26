import { sessions, feedback, customers, roadmaps, milestones, pitchDecks, pitchDeckSlides, type Session, type InsertSession, type InsertFeedback, type Feedback, type Customer, type InsertCustomer, type RoadmapSelect, type MilestoneSelect, type InsertRoadmap, type InsertMilestone, type PitchDeckSelect, type PitchDeckSlideSelect, type InsertPitchDeck, type InsertPitchDeckSlide } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Session management
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session>;
  getAllSessions(): Promise<Session[]>;
  
  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAllFeedback(): Promise<Feedback[]>;
  
  // Customer management
  getCustomer(customerId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(customerId: string, updates: Partial<Pick<Customer, 'customerEmail'>>): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;
  
  // Roadmap management
  getRoadmap(sessionId: string): Promise<RoadmapSelect | undefined>;
  createRoadmap(roadmap: InsertRoadmap): Promise<RoadmapSelect>;
  updateRoadmap(roadmapId: number, updates: Partial<Pick<RoadmapSelect, 'name' | 'layout'>>): Promise<RoadmapSelect>;
  deleteRoadmap(roadmapId: number): Promise<void>;
  
  // Milestone management
  getMilestones(roadmapId: number): Promise<MilestoneSelect[]>;
  createMilestone(milestone: InsertMilestone): Promise<MilestoneSelect>;
  updateMilestone(milestoneId: number, updates: Partial<Omit<MilestoneSelect, 'id' | 'roadmapId' | 'createdAt' | 'updatedAt'>>): Promise<MilestoneSelect>;
  deleteMilestone(milestoneId: number): Promise<void>;
  reorderMilestones(milestoneUpdates: { id: number; bucket: string; sortIndex: number }[]): Promise<void>;
  
  // Pitch deck management
  getPitchDeck(sessionId: string): Promise<PitchDeckSelect | undefined>;
  createPitchDeck(pitchDeck: InsertPitchDeck): Promise<PitchDeckSelect>;
  updatePitchDeck(deckId: number, updates: Partial<Pick<PitchDeckSelect, 'title' | 'status'>>): Promise<PitchDeckSelect>;
  deletePitchDeck(deckId: number): Promise<void>;
  
  // Pitch deck slide management
  getPitchDeckSlides(deckId: number): Promise<PitchDeckSlideSelect[]>;
  createPitchDeckSlide(slide: InsertPitchDeckSlide): Promise<PitchDeckSlideSelect>;
  updatePitchDeckSlide(slideId: number, updates: Partial<Omit<PitchDeckSlideSelect, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>): Promise<PitchDeckSlideSelect>;
  deletePitchDeckSlide(slideId: number): Promise<void>;
  reorderPitchDeckSlides(slideUpdates: { id: number; position: number }[]): Promise<void>;
  
  // Health check
  healthCheck?(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private feedbacks: Map<number, Feedback>;
  private customers: Map<string, Customer>;
  private roadmaps: Map<number, RoadmapSelect>;
  private milestones: Map<number, MilestoneSelect>;
  private pitchDecksMap: Map<number, PitchDeckSelect>;
  private pitchDeckSlidesMap: Map<number, PitchDeckSlideSelect>;
  private currentSessionId: number;
  private currentFeedbackId: number;
  private currentCustomerId: number;
  private currentRoadmapId: number;
  private currentMilestoneId: number;
  private currentPitchDeckId: number;
  private currentPitchDeckSlideId: number;

  constructor() {
    this.sessions = new Map();
    this.feedbacks = new Map();
    this.customers = new Map();
    this.roadmaps = new Map();
    this.milestones = new Map();
    this.pitchDecksMap = new Map();
    this.pitchDeckSlidesMap = new Map();
    this.currentSessionId = 1;
    this.currentFeedbackId = 1;
    this.currentCustomerId = 1;
    this.currentRoadmapId = 1;
    this.currentMilestoneId = 1;
    this.currentPitchDeckId = 1;
    this.currentPitchDeckSlideId = 1;
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
    return feedback;
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    return this.customers.get(customerId);
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      id: this.currentCustomerId++,
      customerId: customerData.customerId,
      customerEmail: customerData.customerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(customerData.customerId, customer);
    return customer;
  }

  async updateCustomer(customerId: string, updates: Partial<Pick<Customer, 'customerEmail'>>): Promise<Customer> {
    const existing = this.customers.get(customerId);
    if (!existing) {
      throw new Error('Customer not found');
    }

    const updated: Customer = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.customers.set(customerId, updated);
    return updated;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Roadmap management
  async getRoadmap(sessionId: string): Promise<RoadmapSelect | undefined> {
    return Array.from(this.roadmaps.values()).find(r => r.sessionId === sessionId);
  }

  async createRoadmap(roadmapData: InsertRoadmap): Promise<RoadmapSelect> {
    const roadmap: RoadmapSelect = {
      id: this.currentRoadmapId++,
      sessionId: roadmapData.sessionId,
      name: roadmapData.name || "Problem-Solution Validation",
      layout: roadmapData.layout || "now-next-later",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.roadmaps.set(roadmap.id, roadmap);
    return roadmap;
  }

  async updateRoadmap(roadmapId: number, updates: Partial<Pick<RoadmapSelect, 'name' | 'layout'>>): Promise<RoadmapSelect> {
    const existing = this.roadmaps.get(roadmapId);
    if (!existing) {
      throw new Error('Roadmap not found');
    }

    const updated: RoadmapSelect = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.roadmaps.set(roadmapId, updated);
    return updated;
  }

  async deleteRoadmap(roadmapId: number): Promise<void> {
    this.roadmaps.delete(roadmapId);
    // Also delete associated milestones
    Array.from(this.milestones.values())
      .filter(m => m.roadmapId === roadmapId)
      .forEach(m => this.milestones.delete(m.id));
  }

  // Milestone management
  async getMilestones(roadmapId: number): Promise<MilestoneSelect[]> {
    return Array.from(this.milestones.values())
      .filter(m => m.roadmapId === roadmapId)
      .sort((a, b) => a.sortIndex - b.sortIndex);
  }

  async createMilestone(milestoneData: InsertMilestone): Promise<MilestoneSelect> {
    const milestone: MilestoneSelect = {
      id: this.currentMilestoneId++,
      roadmapId: milestoneData.roadmapId,
      bucket: milestoneData.bucket,
      sortIndex: milestoneData.sortIndex || 0,
      title: milestoneData.title,
      description: milestoneData.description || null,
      category: milestoneData.category || "Feature",
      status: milestoneData.status || "Planned",
      owner: milestoneData.owner || null,
      dependencies: milestoneData.dependencies || [],
      dueDate: milestoneData.dueDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.milestones.set(milestone.id, milestone);
    return milestone;
  }

  async updateMilestone(milestoneId: number, updates: Partial<Omit<MilestoneSelect, 'id' | 'roadmapId' | 'createdAt' | 'updatedAt'>>): Promise<MilestoneSelect> {
    const existing = this.milestones.get(milestoneId);
    if (!existing) {
      throw new Error('Milestone not found');
    }

    const updated: MilestoneSelect = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.milestones.set(milestoneId, updated);
    return updated;
  }

  async deleteMilestone(milestoneId: number): Promise<void> {
    this.milestones.delete(milestoneId);
  }

  async reorderMilestones(milestoneUpdates: { id: number; bucket: string; sortIndex: number }[]): Promise<void> {
    for (const update of milestoneUpdates) {
      const existing = this.milestones.get(update.id);
      if (existing) {
        const updated: MilestoneSelect = {
          ...existing,
          bucket: update.bucket,
          sortIndex: update.sortIndex,
          updatedAt: new Date(),
        };
        this.milestones.set(update.id, updated);
      }
    }
  }

  // Pitch deck management
  async getPitchDeck(sessionId: string): Promise<PitchDeckSelect | undefined> {
    return Array.from(this.pitchDecksMap.values()).find(d => d.sessionId === sessionId);
  }

  async createPitchDeck(pitchDeckData: InsertPitchDeck): Promise<PitchDeckSelect> {
    const pitchDeck: PitchDeckSelect = {
      id: this.currentPitchDeckId++,
      sessionId: pitchDeckData.sessionId,
      title: pitchDeckData.title || "Sequoia Pitch Deck",
      status: pitchDeckData.status || "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pitchDecksMap.set(pitchDeck.id, pitchDeck);
    return pitchDeck;
  }

  async updatePitchDeck(deckId: number, updates: Partial<Pick<PitchDeckSelect, 'title' | 'status'>>): Promise<PitchDeckSelect> {
    const existing = this.pitchDecksMap.get(deckId);
    if (!existing) {
      throw new Error('Pitch deck not found');
    }

    const updated: PitchDeckSelect = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.pitchDecksMap.set(deckId, updated);
    return updated;
  }

  async deletePitchDeck(deckId: number): Promise<void> {
    this.pitchDecksMap.delete(deckId);
    // Also delete associated slides
    Array.from(this.pitchDeckSlidesMap.values())
      .filter(s => s.deckId === deckId)
      .forEach(s => this.pitchDeckSlidesMap.delete(s.id));
  }

  // Pitch deck slide management
  async getPitchDeckSlides(deckId: number): Promise<PitchDeckSlideSelect[]> {
    return Array.from(this.pitchDeckSlidesMap.values())
      .filter(s => s.deckId === deckId)
      .sort((a, b) => a.position - b.position);
  }

  async createPitchDeckSlide(slideData: InsertPitchDeckSlide): Promise<PitchDeckSlideSelect> {
    const slide: PitchDeckSlideSelect = {
      id: this.currentPitchDeckSlideId++,
      deckId: slideData.deckId,
      slideType: slideData.slideType,
      position: slideData.position,
      titleOverride: slideData.titleOverride || null,
      content: slideData.content || {},
      aiDraft: slideData.aiDraft || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pitchDeckSlidesMap.set(slide.id, slide);
    return slide;
  }

  async updatePitchDeckSlide(slideId: number, updates: Partial<Omit<PitchDeckSlideSelect, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>): Promise<PitchDeckSlideSelect> {
    const existing = this.pitchDeckSlidesMap.get(slideId);
    if (!existing) {
      throw new Error('Pitch deck slide not found');
    }

    const updated: PitchDeckSlideSelect = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.pitchDeckSlidesMap.set(slideId, updated);
    return updated;
  }

  async deletePitchDeckSlide(slideId: number): Promise<void> {
    this.pitchDeckSlidesMap.delete(slideId);
  }

  async reorderPitchDeckSlides(slideUpdates: { id: number; position: number }[]): Promise<void> {
    for (const update of slideUpdates) {
      const existing = this.pitchDeckSlidesMap.get(update.id);
      if (existing) {
        const updated: PitchDeckSlideSelect = {
          ...existing,
          position: update.position,
          updatedAt: new Date(),
        };
        this.pitchDeckSlidesMap.set(update.id, updated);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // In-memory storage is always "healthy"
  }
}

// Database configuration
import { DatabaseStorage } from './database-storage.js';

let storage: IStorage;

// Use PostgreSQL database if available, otherwise fall back to memory
if (process.env.DATABASE_URL) {
  try {
    console.log('🗄️ Using PostgreSQL database...');
    storage = new DatabaseStorage();
    console.log('✅ PostgreSQL database storage initialized');
  } catch (error) {
    console.error('Database connection failed, falling back to memory storage:', error);
    storage = new MemStorage();
    console.log('Using memory storage (database connection failed)');
  }
} else {
  // No database configured
  storage = new MemStorage();
  console.log('Using memory storage (no database configured)');
}

export { storage };
