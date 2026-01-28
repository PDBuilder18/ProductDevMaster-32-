import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User sessions for knowledge graph progress
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  currentStage: text("current_stage").notNull().default("problem-discovery"),
  completedStages: text("completed_stages").array().notNull().default([]),
  conversationHistory: jsonb("conversation_history").array().notNull().default([]),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Feedback submissions
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  rating: integer("rating").notNull(),
  helpfulness: integer("helpfulness").notNull(),
  improvements: text("improvements"),
  mostValuable: text("most_valuable"),
  wouldRecommend: text("would_recommend"),
  recommendationReason: text("recommendation_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Comprehensive customers table with subscription management
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  subscriptionId: text("subscription_id"),
  subscriptionStatus: text("subscription_status").$type<"active" | "paused" | "cancelled" | "expired">(),
  subscriptionInterval: text("subscription_interval"),
  planName: text("plan_name"),
  subscribePlanName: text("subscribe_plan_name"),
  subscriptionPlanPrice: integer("subscription_plan_price"),
  actualAttempts: integer("actual_attempts").default(0),
  usedAttempt: integer("used_attempt").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom customer schema with validation
export const subscriptionStatusEnum = z.enum(["active", "paused", "cancelled", "expired"]);

// Roadmaps for product planning
export const roadmaps = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull().default("Problem-Solution Validation"),
  layout: text("layout").notNull().default("now-next-later"), // 'now-next-later' or 'quarterly'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Milestones within roadmaps
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  bucket: text("bucket").notNull(), // 'now' | 'next' | 'later' or 'q1'...'q4'
  sortIndex: integer("sort_index").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Feature"), // 'Feature' | 'Growth' | 'Tech' | 'Ops'
  status: text("status").notNull().default("Planned"), // 'Planned' | 'In Progress' | 'Done'
  owner: text("owner"), // Could be email or name
  dependencies: jsonb("dependencies").default([]),
  dueDate: text("due_date"), // Using text for flexible date formats
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pitch decks for Sequoia-style investor presentations
export const pitchDecks = pgTable("pitch_decks", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull().default("Sequoia Pitch Deck"),
  status: text("status").notNull().default("draft"), // 'draft' | 'complete' | 'exported'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual slides within pitch decks
export const pitchDeckSlides = pgTable("pitch_deck_slides", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => pitchDecks.id, { onDelete: "cascade" }),
  slideType: text("slide_type").notNull(), // 'problem' | 'solution' | 'why-now' | 'market-size' | 'product' | 'business-model' | 'competition' | 'team' | 'financials' | 'vision'
  position: integer("position").notNull(), // 1-10
  titleOverride: text("title_override"),
  content: jsonb("content").notNull().default({}),
  aiDraft: jsonb("ai_draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const roadmapsRelations = relations(roadmaps, ({ many }) => ({
  milestones: many(milestones),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  roadmap: one(roadmaps, {
    fields: [milestones.roadmapId],
    references: [roadmaps.id],
  }),
}));

export const pitchDecksRelations = relations(pitchDecks, ({ many }) => ({
  slides: many(pitchDeckSlides),
}));

export const pitchDeckSlidesRelations = relations(pitchDeckSlides, ({ one }) => ({
  deck: one(pitchDecks, {
    fields: [pitchDeckSlides.deckId],
    references: [pitchDecks.id],
  }),
}));

// Knowledge graph stages
export const knowledgeGraphStages = [
  "problem-discovery",
  "customer-interviews", 
  "icp-definition",
  "use-case-definition",
  "market-size-estimation",
  "product-requirements",
  "mvp-scope",
  "prototype",
  "user-testing",
  "product-market-fit-check"
] as const;

export type KnowledgeGraphStage = typeof knowledgeGraphStages[number];

// Conversation message schema
export const conversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  stage: z.enum(knowledgeGraphStages),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
});

// AI conversation schema
export const aiConversationSchema = z.object({
  message: z.string(),
  stage: z.enum(knowledgeGraphStages).optional(),
  action: z.enum(["continue", "move-to-next", "clarify", "provide-example"]).optional(),
});

// Workflow data types
export const problemStatementSchema = z.object({
  original: z.string().min(10, "Problem description must be at least 10 characters"),
  refined: z.string().optional(),
  aiSuggestions: z.array(z.string()).optional(),
});

export const marketResearchSchema = z.object({
  permission: z.boolean(),
  existingData: z.string().optional(),
  findings: z.object({
    marketSize: z.string().optional(),
    competitors: z.array(z.string()).optional(),
    trends: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const rootCauseSchema = z.object({
  causes: z.array(z.object({
    level: z.number(),
    question: z.string(),
    answer: z.string(),
  })),
  primaryCause: z.string(),
});

export const existingSolutionsSchema = z.object({
  solutions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    pricing: z.string().optional(),
    targetAudience: z.string().optional(),
  })),
  gaps: z.array(z.string()).optional(),
});

export const icpSchema = z.object({
  demographics: z.object({
    age: z.string(),
    jobRole: z.string(),
    income: z.string(),
    location: z.string().optional(),
  }),
  psychographics: z.object({
    goals: z.array(z.string()),
    frustrations: z.array(z.string()),
    values: z.array(z.string()),
  }),
  name: z.string(),
  description: z.string(),
});

export const useCaseSchema = z.object({
  narrative: z.string(),
  steps: z.array(z.object({
    step: z.number(),
    action: z.string(),
    outcome: z.string(),
  })),
});

export const functionalRequirementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
});

export const nonFunctionalRequirementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["Performance", "Security", "Usability", "Reliability", "Scalability", "Compatibility"]),
  acceptanceCriteria: z.array(z.string()),
});

export const productRequirementsSchema = z.object({
  functionalRequirements: z.array(functionalRequirementSchema),
  nonFunctionalRequirements: z.array(nonFunctionalRequirementSchema),
});

export const prioritizationSchema = z.object({
  method: z.enum(["RICE", "ICE", "MoSCoW"]),
  features: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    reach: z.number().optional(),
    impact: z.number().optional(),
    confidence: z.number().optional(),
    effort: z.number().optional(),
    ease: z.number().optional(),
    score: z.number().optional(),
    priority: z.string().optional(),
  })),
});

export const goToMarketStrategySchema = z.object({
  // 1) Target Market
  targetMarket: z.object({
    beachhead: z.string(),
    marketSize: z.object({
      serviceableMarket: z.string(),
      targetAudience: z.string(),
      revenueProjection: z.string(),
    }),
    categoryContext: z.string(),
  }),
  
  // 2) Value Proposition
  valueProposition: z.object({
    promise: z.string(),
    outcomes: z.array(z.string()),
    result: z.string(),
  }),
  
  // 3) Positioning & Messaging
  positioning: z.object({
    statement: z.string(),
    heroMessage: z.string(),
    primaryCTAs: z.array(z.string()),
  }),
  
  // 4) Pricing & Packaging
  pricing: z.object({
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      features: z.array(z.string()),
    })),
    rationale: z.string(),
  }),
  
  // 5) Channels
  channels: z.object({
    acquisition: z.array(z.string()),
    distribution: z.array(z.string()),
  }),
  
  // 6) Core Programs & Tactics
  programs: z.object({
    paid: z.object({
      tactics: z.array(z.string()),
      creative: z.string(),
    }),
    content: z.object({
      tactics: z.array(z.string()),
      leadMagnets: z.array(z.string()),
    }),
    institutional: z.object({
      tactics: z.array(z.string()),
    }),
    referrals: z.object({
      program: z.string(),
      triggers: z.array(z.string()),
    }),
  }),
  
  // 7) Execution Timeline
  timeline: z.object({
    phases: z.array(z.object({
      name: z.string(),
      duration: z.string(),
      activities: z.array(z.string()),
      milestones: z.array(z.string()),
    })),
  }),
  
  // 8) Metrics (AARRR)
  metrics: z.object({
    acquisition: z.array(z.string()),
    activation: z.array(z.string()),
    retention: z.array(z.string()),
    revenue: z.array(z.string()),
    referral: z.array(z.string()),
  }),
  
  // 9) Differentiation
  differentiation: z.object({
    advantages: z.array(z.string()),
    defensibility: z.string(),
  }),
});

// Pitch Deck Slide Types
export const slideTypes = [
  "problem",
  "solution",
  "why-now",
  "market-size",
  "product",
  "business-model",
  "competition",
  "team",
  "financials",
  "vision"
] as const;

export type SlideType = typeof slideTypes[number];

// Slide content schemas for each slide type
export const problemSlideSchema = z.object({
  painPoints: z.array(z.string()),
  impact: z.string().optional(),
  whyNow: z.string().optional(),
});

export const solutionSlideSchema = z.object({
  description: z.string(),
  keyFeatures: z.array(z.string()),
  uniqueValue: z.string().optional(),
});

export const whyNowSlideSchema = z.object({
  marketTiming: z.string(),
  trends: z.array(z.string()),
  catalysts: z.array(z.string()).optional(),
});

export const marketSizeSlideSchema = z.object({
  tam: z.string(),
  sam: z.string(),
  som: z.string(),
  marketDescription: z.string().optional(),
});

export const productSlideSchema = z.object({
  description: z.string(),
  screenshots: z.array(z.string()).optional(),
  keyCapabilities: z.array(z.string()),
  demo: z.string().optional(),
});

export const businessModelSlideSchema = z.object({
  revenueStreams: z.array(z.string()),
  pricingModel: z.string(),
  unitEconomics: z.string().optional(),
  customerAcquisition: z.string().optional(),
});

export const competitionSlideSchema = z.object({
  competitors: z.array(z.object({
    name: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  })),
  competitiveAdvantage: z.string(),
  moat: z.string().optional(),
});

export const teamSlideSchema = z.object({
  members: z.array(z.object({
    name: z.string(),
    role: z.string(),
    background: z.string(),
    linkedIn: z.string().optional(),
  })),
  advisors: z.array(z.object({
    name: z.string(),
    background: z.string(),
  })).optional(),
});

export const financialsSlideSchema = z.object({
  revenue: z.array(z.object({
    year: z.string(),
    amount: z.string(),
  })).optional(),
  projections: z.array(z.object({
    year: z.string(),
    revenue: z.string(),
    growth: z.string().optional(),
  })),
  keyMetrics: z.array(z.object({
    metric: z.string(),
    value: z.string(),
  })).optional(),
});

export const visionSlideSchema = z.object({
  vision: z.string(),
  milestones: z.array(z.string()),
  ask: z.object({
    amount: z.string(),
    useOfFunds: z.array(z.object({
      category: z.string(),
      amount: z.string(),
      description: z.string().optional(),
    })),
  }),
});

// Discriminated union for slide content
export const slideContentSchema = z.discriminatedUnion("slideType", [
  z.object({ slideType: z.literal("problem"), data: problemSlideSchema }),
  z.object({ slideType: z.literal("solution"), data: solutionSlideSchema }),
  z.object({ slideType: z.literal("why-now"), data: whyNowSlideSchema }),
  z.object({ slideType: z.literal("market-size"), data: marketSizeSlideSchema }),
  z.object({ slideType: z.literal("product"), data: productSlideSchema }),
  z.object({ slideType: z.literal("business-model"), data: businessModelSlideSchema }),
  z.object({ slideType: z.literal("competition"), data: competitionSlideSchema }),
  z.object({ slideType: z.literal("team"), data: teamSlideSchema }),
  z.object({ slideType: z.literal("financials"), data: financialsSlideSchema }),
  z.object({ slideType: z.literal("vision"), data: visionSlideSchema }),
]);

export const pitchDeckSlideSchema = z.object({
  id: z.number().optional(),
  deckId: z.number().optional(),
  slideType: z.enum(slideTypes),
  position: z.number().min(1).max(10),
  titleOverride: z.string().optional(),
  content: z.record(z.any()),
  aiDraft: z.record(z.any()).optional(),
});

export const pitchDeckSchema = z.object({
  id: z.number().optional(),
  sessionId: z.string().optional(),
  title: z.string().default("Sequoia Pitch Deck"),
  status: z.enum(["draft", "complete", "exported"]).default("draft"),
  slides: z.array(pitchDeckSlideSchema).optional(),
});

// Roadmap and milestone schemas
export const milestoneSchema = z.object({
  id: z.number().optional(),
  roadmapId: z.number().optional(),
  bucket: z.enum(["now", "next", "later", "q1", "q2", "q3", "q4"]),
  sortIndex: z.number().default(0),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["Feature", "Growth", "Tech", "Ops"]).default("Feature"),
  status: z.enum(["Planned", "In Progress", "Done"]).default("Planned"),
  owner: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  dueDate: z.string().optional(),
});

export const roadmapSchema = z.object({
  id: z.number().optional(),
  sessionId: z.string().optional(),
  name: z.string().default("Problem-Solution Validation"),
  layout: z.enum(["now-next-later", "quarterly"]).default("now-next-later"),
  milestones: z.array(milestoneSchema).default([]),
});

export const workflowDataSchema = z.object({
  problemStatement: problemStatementSchema.optional(),
  marketResearch: marketResearchSchema.optional(),
  rootCause: rootCauseSchema.optional(),
  existingSolutions: existingSolutionsSchema.optional(),
  icp: icpSchema.optional(),
  useCase: useCaseSchema.optional(),
  productRequirements: productRequirementsSchema.optional(),
  prioritization: prioritizationSchema.optional(),
  goToMarketStrategy: goToMarketStrategySchema.optional(),
  roadmap: roadmapSchema.optional(),
  hasExported: z.boolean().optional(), // Track if user has exported document
  hasGTMExported: z.boolean().optional(), // Track if user has exported GTM complete document
  hasRoadmapExported: z.boolean().optional(), // Track if user has exported roadmap
  hasValidationExported: z.boolean().optional(), // Track if user has exported validation analysis
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers, {
  email: z.string().email("Invalid email format"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  subscriptionStatus: subscriptionStatusEnum.optional(),
  subscriptionPlanPrice: z.number().min(0).optional(),
  actualAttempts: z.number().min(0).default(0),
  usedAttempt: z.number().min(0).default(0),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCustomerSchema = insertCustomerSchema.partial().omit({
  customerId: true,
});

export const insertRoadmapSchema = createInsertSchema(roadmaps, {
  layout: z.enum(["now-next-later", "quarterly"]),
  name: z.string().min(1, "Name is required"),
  sessionId: z.string().min(1, "Session ID is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones, {
  bucket: z.enum(["now", "next", "later", "q1", "q2", "q3", "q4"]),
  category: z.enum(["Feature", "Growth", "Tech", "Ops"]),
  status: z.enum(["Planned", "In Progress", "Done"]),
  dependencies: z.array(z.string()),
  title: z.string().min(1, "Title is required"),
  roadmapId: z.number().min(1, "Roadmap ID is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPitchDeckSchema = createInsertSchema(pitchDecks, {
  title: z.string().min(1, "Title is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  status: z.enum(["draft", "complete", "exported"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPitchDeckSlideSchema = createInsertSchema(pitchDeckSlides, {
  slideType: z.enum(slideTypes),
  position: z.number().min(1).max(10),
  deckId: z.number().min(1, "Deck ID is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type WorkflowData = z.infer<typeof workflowDataSchema>;
export type ProblemStatement = z.infer<typeof problemStatementSchema>;
export type MarketResearch = z.infer<typeof marketResearchSchema>;
export type RootCause = z.infer<typeof rootCauseSchema>;
export type ExistingSolutions = z.infer<typeof existingSolutionsSchema>;
export type ICP = z.infer<typeof icpSchema>;
export type UseCase = z.infer<typeof useCaseSchema>;
export type ProductRequirements = z.infer<typeof productRequirementsSchema>;
export type Prioritization = z.infer<typeof prioritizationSchema>;
export type GoToMarketStrategy = z.infer<typeof goToMarketStrategySchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type RoadmapSelect = typeof roadmaps.$inferSelect;
export type MilestoneSelect = typeof milestones.$inferSelect;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type AiConversation = z.infer<typeof aiConversationSchema>;
export type PitchDeck = z.infer<typeof pitchDeckSchema>;
export type PitchDeckSlide = z.infer<typeof pitchDeckSlideSchema>;
export type InsertPitchDeck = z.infer<typeof insertPitchDeckSchema>;
export type InsertPitchDeckSlide = z.infer<typeof insertPitchDeckSlideSchema>;
export type PitchDeckSelect = typeof pitchDecks.$inferSelect;
export type PitchDeckSlideSelect = typeof pitchDeckSlides.$inferSelect;
