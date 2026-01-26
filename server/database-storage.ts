import { db } from './db';
import { sessions, feedback, customers, roadmaps, milestones, pitchDecks, pitchDeckSlides, type Session, type InsertSession, type InsertFeedback, type Feedback, type Customer, type InsertCustomer, type RoadmapSelect, type MilestoneSelect, type InsertRoadmap, type InsertMilestone, type PitchDeckSelect, type PitchDeckSlideSelect, type InsertPitchDeck, type InsertPitchDeckSlide } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { IStorage } from './storage';
import { ensureTablesExist } from './migrations/migrate';

export class DatabaseStorage implements IStorage {
  
  constructor() {
    // Ensure database tables exist on initialization
    if (process.env.DATABASE_URL) {
      ensureTablesExist(process.env.DATABASE_URL).catch((err) => {
        console.error('Failed to create database tables:', err);
      });
    }
  }
  
  // Session management
  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session || undefined;
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    return session;
  }

  async getAllSessions(): Promise<Session[]> {
    return await db.select().from(sessions);
  }

  // Feedback
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [createdFeedback] = await db
      .insert(feedback)
      .values({
        ...feedbackData,
        createdAt: new Date(),
      })
      .returning();
    return createdFeedback;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback);
  }

  // Customer management
  async getCustomer(customerId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.customerId, customerId));
    return customer || undefined;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Use atomic upsert to prevent race conditions
    const [customer] = await db
      .insert(customers)
      .values({
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customers.customerId,
        set: {
          customerEmail: customerData.customerEmail,
          updatedAt: new Date(),
        },
      })
      .returning();
    return customer;
  }

  async updateCustomer(customerId: string, updates: Partial<Pick<Customer, 'customerEmail'>>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(customers.customerId, customerId))
      .returning();
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  // Roadmap management
  async getRoadmap(sessionId: string): Promise<RoadmapSelect | undefined> {
    const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.sessionId, sessionId));
    return roadmap || undefined;
  }

  async createRoadmap(roadmapData: InsertRoadmap): Promise<RoadmapSelect> {
    const [roadmap] = await db
      .insert(roadmaps)
      .values({
        ...roadmapData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return roadmap;
  }

  async updateRoadmap(roadmapId: number, updates: Partial<Pick<RoadmapSelect, 'name' | 'layout'>>): Promise<RoadmapSelect> {
    const [roadmap] = await db
      .update(roadmaps)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(roadmaps.id, roadmapId))
      .returning();
    
    if (!roadmap) {
      throw new Error('Roadmap not found');
    }
    
    return roadmap;
  }

  async deleteRoadmap(roadmapId: number): Promise<void> {
    // Delete milestones first (though CASCADE should handle this)
    await db.delete(milestones).where(eq(milestones.roadmapId, roadmapId));
    // Delete roadmap
    await db.delete(roadmaps).where(eq(roadmaps.id, roadmapId));
  }

  // Milestone management
  async getMilestones(roadmapId: number): Promise<MilestoneSelect[]> {
    return await db.select().from(milestones).where(eq(milestones.roadmapId, roadmapId));
  }

  async createMilestone(milestoneData: InsertMilestone): Promise<MilestoneSelect> {
    const [milestone] = await db
      .insert(milestones)
      .values({
        ...milestoneData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return milestone;
  }

  async updateMilestone(milestoneId: number, updates: Partial<Omit<MilestoneSelect, 'id' | 'roadmapId' | 'createdAt' | 'updatedAt'>>): Promise<MilestoneSelect> {
    const [milestone] = await db
      .update(milestones)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();
    
    if (!milestone) {
      throw new Error('Milestone not found');
    }
    
    return milestone;
  }

  async deleteMilestone(milestoneId: number): Promise<void> {
    await db.delete(milestones).where(eq(milestones.id, milestoneId));
  }

  async reorderMilestones(milestoneUpdates: { id: number; bucket: string; sortIndex: number }[]): Promise<void> {
    // Use a transaction to update all milestones atomically
    await db.transaction(async (tx) => {
      for (const update of milestoneUpdates) {
        await tx
          .update(milestones)
          .set({
            bucket: update.bucket,
            sortIndex: update.sortIndex,
            updatedAt: new Date(),
          })
          .where(eq(milestones.id, update.id));
      }
    });
  }

  // Pitch deck management
  async getPitchDeck(sessionId: string): Promise<PitchDeckSelect | undefined> {
    const [pitchDeck] = await db.select().from(pitchDecks).where(eq(pitchDecks.sessionId, sessionId));
    return pitchDeck || undefined;
  }

  async createPitchDeck(pitchDeckData: InsertPitchDeck): Promise<PitchDeckSelect> {
    const [pitchDeck] = await db
      .insert(pitchDecks)
      .values({
        ...pitchDeckData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return pitchDeck;
  }

  async updatePitchDeck(deckId: number, updates: Partial<Pick<PitchDeckSelect, 'title' | 'status'>>): Promise<PitchDeckSelect> {
    const [pitchDeck] = await db
      .update(pitchDecks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(pitchDecks.id, deckId))
      .returning();
    
    if (!pitchDeck) {
      throw new Error('Pitch deck not found');
    }
    
    return pitchDeck;
  }

  async deletePitchDeck(deckId: number): Promise<void> {
    await db.delete(pitchDecks).where(eq(pitchDecks.id, deckId));
  }

  // Pitch deck slide management
  async getPitchDeckSlides(deckId: number): Promise<PitchDeckSlideSelect[]> {
    return await db.select().from(pitchDeckSlides).where(eq(pitchDeckSlides.deckId, deckId));
  }

  async createPitchDeckSlide(slideData: InsertPitchDeckSlide): Promise<PitchDeckSlideSelect> {
    const [slide] = await db
      .insert(pitchDeckSlides)
      .values({
        ...slideData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return slide;
  }

  async updatePitchDeckSlide(slideId: number, updates: Partial<Omit<PitchDeckSlideSelect, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>>): Promise<PitchDeckSlideSelect> {
    const [slide] = await db
      .update(pitchDeckSlides)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(pitchDeckSlides.id, slideId))
      .returning();
    
    if (!slide) {
      throw new Error('Pitch deck slide not found');
    }
    
    return slide;
  }

  async deletePitchDeckSlide(slideId: number): Promise<void> {
    await db.delete(pitchDeckSlides).where(eq(pitchDeckSlides.id, slideId));
  }

  async reorderPitchDeckSlides(slideUpdates: { id: number; position: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const update of slideUpdates) {
        await tx
          .update(pitchDeckSlides)
          .set({
            position: update.position,
            updatedAt: new Date(),
          })
          .where(eq(pitchDeckSlides.id, update.id));
      }
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await db.select().from(sessions).limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}