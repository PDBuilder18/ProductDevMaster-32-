import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import pg from "pg";
import { storage } from "./storage";
import { optionalAuth, validateSessionAccess, AuthRequest } from "./middleware/auth";
import { aiRateLimitMiddleware } from "./middleware/security";
import { verifyShopifyHmac } from "./middleware/shopify-hmac";

const { Pool } = pg;

// Production database pool for admin tracking (read-only queries)
const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;
let productionPool: pg.Pool | null = null;

if (productionDbUrl) {
  productionPool = new Pool({
    connectionString: productionDbUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000
  });
  console.log("✅ Production database pool initialized for admin tracking");
}
import { 
  insertSessionSchema, 
  insertFeedbackSchema,
  insertCustomerSchema,
  updateCustomerSchema,
  insertRoadmapSchema,
  insertMilestoneSchema,
  insertPitchDeckSchema,
  insertPitchDeckSlideSchema,
  workflowDataSchema,
  problemStatementSchema,
  marketResearchSchema,
  rootCauseSchema,
  existingSolutionsSchema,
  icpSchema,
  useCaseSchema,
  productRequirementsSchema,
  prioritizationSchema,
  goToMarketStrategySchema,
  type KnowledgeGraphStage,
  type ConversationMessage,
  type RoadmapSelect,
  type MilestoneSelect,
  type PitchDeckSelect,
  type PitchDeckSlideSelect
} from "@shared/schema";

// Helper function to normalize snake_case or camelCase request body to camelCase
function normalizeCustomerRequest(body: any) {
  const normalized: any = {};
  
  if (body.customerId !== undefined) normalized.customerId = body.customerId;
  else if (body.customer_id !== undefined) normalized.customerId = body.customer_id;
  
  if (body.email !== undefined) normalized.email = body.email;
  
  if (body.firstName !== undefined) normalized.firstName = body.firstName;
  else if (body.first_name !== undefined) normalized.firstName = body.first_name;
  
  if (body.lastName !== undefined) normalized.lastName = body.lastName;
  else if (body.last_name !== undefined) normalized.lastName = body.last_name;
  
  if (body.subscriptionId !== undefined) normalized.subscriptionId = body.subscriptionId;
  else if (body.subscription_id !== undefined) normalized.subscriptionId = body.subscription_id;
  
  if (body.subscriptionStatus !== undefined) normalized.subscriptionStatus = body.subscriptionStatus;
  else if (body.subscription_status !== undefined) normalized.subscriptionStatus = body.subscription_status;
  
  if (body.subscriptionInterval !== undefined) normalized.subscriptionInterval = body.subscriptionInterval;
  else if (body.subscription_interval !== undefined) normalized.subscriptionInterval = body.subscription_interval;
  
  if (body.planName !== undefined) normalized.planName = body.planName;
  else if (body.plan_name !== undefined) normalized.planName = body.plan_name;
  
  if (body.subscribePlanName !== undefined) normalized.subscribePlanName = body.subscribePlanName;
  else if (body.subscribe_plan_name !== undefined) normalized.subscribePlanName = body.subscribe_plan_name;
  
  if (body.subscriptionPlanPrice !== undefined) normalized.subscriptionPlanPrice = body.subscriptionPlanPrice;
  else if (body.subscription_plan_price !== undefined) normalized.subscriptionPlanPrice = body.subscription_plan_price;
  
  if (body.actualAttempts !== undefined) normalized.actualAttempts = body.actualAttempts;
  else if (body.actual_attempts !== undefined) normalized.actualAttempts = body.actual_attempts;
  
  if (body.usedAttempt !== undefined) normalized.usedAttempt = body.usedAttempt;
  else if (body.used_attempt !== undefined) normalized.usedAttempt = body.used_attempt;
  
  return normalized;
}

// Helper function to convert customer data to snake_case format for response
function customerToSnakeCase(customer: any) {
  return {
    customer_id: customer.customerId,
    email: customer.email,
    first_name: customer.firstName,
    last_name: customer.lastName,
    subscription_id: customer.subscriptionId,
    subscription_status: customer.subscriptionStatus,
    subscription_interval: customer.subscriptionInterval,
    plan_name: customer.planName,
    subscribe_plan_name: customer.subscribePlanName,
    subscription_plan_price: customer.subscriptionPlanPrice,
    actual_attempts: customer.actualAttempts,
    used_attempt: customer.usedAttempt,
  };
}
import { openaiService } from "./services/openai";
import { subscriptionService } from "./services/subscription";
import { searchService } from "./services/search";
import { documentService } from "./services/document";
import { aiConversationService } from "./services/ai-conversation";
import { validateFiveWhys, toGraphView, type FiveWhysAnalysis } from "../lib/five_whys";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  getStageById, 
  getSafeStagesForUI, 
  validateAttempt, 
  buildStageContext, 
  minAttemptSatisfied, 
  getNextStage,
  type LearningStageId, 
  type LearningStageState 
} from "@shared/learningStages";
import fs from "fs";
import path from "path";
import multer from "multer";
import officeParser from "officeparser";

// Helper function to generate initial milestones from workflow data
async function generateInitialMilestones(workflowData: any, roadmapId: number) {
  const milestones = [];

  // Now (0-3 months) milestones
  if (workflowData?.prioritization?.features) {
    const topFeatures = workflowData.prioritization.features
      .filter((f: any) => f.priority === "Must Have" || f.score > 7)
      .slice(0, 2);
    
    if (topFeatures.length > 0) {
      milestones.push({
        bucket: "now" as const,
        title: "MVP Launch",
        description: `Launch with core features: ${topFeatures.map((f: any) => f.name).join(", ")}`,
        category: "Feature" as const,
        status: "Planned" as const,
        dependencies: []
      });
    }
  }

  if (workflowData?.icp) {
    milestones.push({
      bucket: "now",
      title: "Beta Cohort Onboarding",
      description: `Onboard initial users matching ICP: ${workflowData.icp.name}`,
      category: "Growth" as const,
      status: "Planned" as const,
      dependencies: ["MVP Launch"]
    });
  }

  milestones.push({
    bucket: "now",
    title: "Analytics & Feedback Loop Setup",
    description: "Implement user analytics and feedback collection system",
    category: "Tech",
    status: "Planned",
    dependencies: []
  });

  if (workflowData?.rootCause?.primaryCause) {
    milestones.push({
      bucket: "now",
      title: "Address Core Technical Risk",
      description: `Mitigate primary risk: ${workflowData.rootCause.primaryCause}`,
      category: "Tech" as const,
      status: "Planned" as const,
      dependencies: []
    });
  }

  // Next (3-6 months) milestones
  if (workflowData?.productRequirements?.functionalRequirements) {
    const futureFeatures = workflowData.productRequirements.functionalRequirements
      .filter((f: any) => !workflowData?.prioritization?.features?.some((pf: any) => pf.name.includes(f.name)))
      .slice(0, 2);
    
    if (futureFeatures.length > 0) {
      milestones.push({
        bucket: "next" as const,
        title: "Feature Enhancement Phase",
        description: `Add features: ${futureFeatures.map((f: any) => f.name).join(", ")}`,
        category: "Feature" as const,
        status: "Planned" as const,
        dependencies: ["MVP Launch", "Beta Cohort Onboarding"]
      });
    }
  }

  milestones.push({
    bucket: "next",
    title: "Onboarding UX Improvement",
    description: "Optimize user onboarding based on beta feedback",
    category: "Growth",
    status: "Planned",
    dependencies: ["Beta Cohort Onboarding"]
  });

  if (workflowData?.goToMarketStrategy?.channels?.acquisition) {
    milestones.push({
      bucket: "next",
      title: "Marketing Channel Expansion",
      description: `Launch marketing channels: ${workflowData.goToMarketStrategy.channels.acquisition.slice(0, 2).join(", ")}`,
      category: "Growth" as const,
      status: "Planned" as const,
      dependencies: ["MVP Launch"]
    });
  }

  // Later (6-12 months) milestones
  milestones.push({
    bucket: "later",
    title: "Scale & Integrations",
    description: "Add enterprise features and third-party integrations",
    category: "Feature",
    status: "Planned",
    dependencies: ["Feature Enhancement Phase"]
  });

  if (workflowData?.goToMarketStrategy?.pricing?.tiers?.length > 1) {
    milestones.push({
      bucket: "later",
      title: "Paid Plan Rollout",
      description: `Launch paid tiers: ${workflowData.goToMarketStrategy.pricing.tiers.map((t: any) => t.name).join(", ")}`,
      category: "Growth" as const,
      status: "Planned" as const,
      dependencies: ["Marketing Channel Expansion"]
    });
  }

  milestones.push({
    bucket: "later",
    title: "Partnership Development",
    description: "Establish strategic partnerships and distribution channels",
    category: "Ops",
    status: "Planned",
    dependencies: ["Scale & Integrations"]
  });

  return milestones;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session management
  app.post("/api/sessions", async (req, res) => {
    try {
      console.log("Creating session with data:", req.body);
      const body = req.body || {};
      if (!body.sessionId) {
        body.sessionId = crypto.randomUUID();
      }
      const sessionData = insertSessionSchema.parse(body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error: any) {
      console.log("Session creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.sessionId, updates);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Customer management - Public endpoint for Shopify integration
  // Create Customer - POST /api/customers
  // Auto-assigns Free plan if no paid subscription exists
  app.post("/api/customers", async (req, res) => {
    try {
      console.log("Creating customer with data:", req.body?.customerId || req.body?.customer_id || 'unknown');
      
      const requestData = normalizeCustomerRequest(req.body);
      
      // Apply Free plan defaults if no paid subscription is provided
      const dataWithFreePlan = subscriptionService.applyFreePlanIfNeeded(requestData);
      
      const customerData = insertCustomerSchema.parse(dataWithFreePlan);
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomer(customerData.customerId);
      if (existingCustomer) {
        return res.status(409).json({ 
          success: false, 
          error: "Customer already exists" 
        });
      }
      
      const customer = await storage.createCustomer(customerData);
      
      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customerToSnakeCase(customer)
      });
    } catch (error: any) {
      console.error("Customer creation error:", error.message || 'Unknown error');
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Get All Customers - GET /api/customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      
      res.json({
        success: true,
        data: customers.map(customerToSnakeCase)
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Get Single Customer - GET /api/customers/:id
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      
      res.json({
        success: true,
        data: customerToSnakeCase(customer)
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Update Customer - PUT /api/customers/:id
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerId = req.params.id;
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      
      const updateData = normalizeCustomerRequest(req.body);
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      const validatedData = updateCustomerSchema.parse(cleanUpdateData);
      const updatedCustomer = await storage.updateCustomer(customerId, validatedData);
      
      res.json({
        success: true,
        message: "Customer updated successfully",
        data: customerToSnakeCase(updatedCustomer)
      });
    } catch (error: any) {
      console.error("Customer update error:", error.message || 'Unknown error');
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Delete Customer - DELETE /api/customers/:id
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const customerId = req.params.id;
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      
      await storage.deleteCustomer(customerId);
      
      res.json({
        success: true,
        message: "Customer deleted successfully"
      });
    } catch (error: any) {
      console.error("Customer deletion error:", error.message || 'Unknown error');
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // ============================================
  // SUBSCRIPTION & ATTEMPT MANAGEMENT ENDPOINTS
  // ============================================

  // Get Subscription Status - GET /api/customers/:id/subscription-status
  // Returns current subscription status, remaining attempts, and plan info
  // Used by Shopify to determine user access and redirects
  app.get("/api/customers/:id/subscription-status", async (req, res) => {
    try {
      const customerId = req.params.id;
      
      const status = await subscriptionService.getSubscriptionStatus(customerId);
      
      if (!status) {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error("Subscription status error:", error.message || 'Unknown error');
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Complete User Attempt - POST /api/customers/:id/complete-attempt
  // Called when a user completes all 12 workflow steps
  // Increments used_attempt and updates subscription_status if limit reached
  app.post("/api/customers/:id/complete-attempt", async (req, res) => {
    try {
      const customerId = req.params.id;
      
      const result = await subscriptionService.completeUserAttempt(customerId);
      
      res.json({
        success: result.success,
        message: result.message,
        data: {
          subscription_status: result.subscription_status,
          used_attempt: result.used_attempt,
          actual_attempts: result.actual_attempts,
          remaining_attempts: result.remaining_attempts
        }
      });
    } catch (error: any) {
      if (error.message === "Customer not found") {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      console.error("Complete attempt error:", error.message || 'Unknown error');
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Update Paid Subscription - POST /api/customers/:id/subscription
  // Called by Shopify webhook when a paid subscription is created or updated
  // Resets attempt limits and activates subscription
  app.post("/api/customers/:id/subscription", async (req, res) => {
    try {
      const customerId = req.params.id;
      const requestData = normalizeCustomerRequest(req.body);
      
      // Validate required fields for paid subscription
      if (!requestData.subscriptionId || !requestData.planName) {
        return res.status(400).json({
          success: false,
          error: "subscription_id and plan_name are required"
        });
      }
      
      const updatedCustomer = await subscriptionService.updatePaidSubscription(customerId, {
        subscriptionId: requestData.subscriptionId,
        planName: requestData.planName,
        subscriptionInterval: requestData.subscriptionInterval,
        subscriptionPlanPrice: requestData.subscriptionPlanPrice,
        actualAttempts: requestData.actualAttempts,
      });
      
      res.json({
        success: true,
        message: "Subscription updated successfully",
        data: customerToSnakeCase(updatedCustomer)
      });
    } catch (error: any) {
      if (error.message === "Customer not found") {
        return res.status(404).json({ 
          success: false, 
          error: "Customer not found" 
        });
      }
      console.error("Subscription update error:", error.message || 'Unknown error');
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // New AI Conversation API (with rate limiting)
  app.post("/api/sessions/:sessionId/conversation", optionalAuth, validateSessionAccess, aiRateLimitMiddleware, async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Generate AI response
      const aiResponse = await aiConversationService.generateResponse(
        message,
        session.currentStage as KnowledgeGraphStage,
        session.conversationHistory as ConversationMessage[] || [],
        session.data
      );

      // Add user message and AI response to conversation history
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: message,
        stage: session.currentStage,
        timestamp: Date.now()
      };

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: aiResponse.response,
        stage: session.currentStage,
        timestamp: Date.now() + 1
      };

      const updatedConversationHistory = [
        ...(session.conversationHistory || []),
        userMessage,
        assistantMessage
      ];

      // Update session with new conversation history and stage if needed
      const updateData: any = {
        conversationHistory: updatedConversationHistory
      };

      if (aiResponse.stageComplete && aiResponse.suggestedNextStage) {
        updateData.currentStage = aiResponse.suggestedNextStage;
        updateData.completedStages = [...(session.completedStages || []), session.currentStage];
      }

      await storage.updateSession(req.params.sessionId, updateData);

      res.json({
        response: aiResponse.response,
        currentStage: aiResponse.suggestedNextStage || session.currentStage,
        action: aiResponse.action,
        stageComplete: aiResponse.stageComplete
      });
    } catch (error: any) {
      console.error("Conversation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get stage information
  app.get("/api/stages/:stage", async (req, res) => {
    try {
      const stage = req.params.stage as any;
      const stageInfo = aiConversationService.getStageOverview(stage);
      res.json(stageInfo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all stages
  app.get("/api/stages", async (req, res) => {
    try {
      const allStages = aiConversationService.getAllStages();
      res.json(allStages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 1: Problem Analysis with conversation support
  app.post("/api/sessions/:sessionId/problem-analysis", async (req, res) => {
    try {
      const { problem } = req.body;
      const analysis = await openaiService.analyzeProblem(problem.original);
      
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          problemStatement: { ...problem, ...analysis } 
        },
        completedStages: [...(session?.completedStages || []), 'problem-analysis'],
        currentStage: 'market-research',
      });
      
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 1: Problem Conversation
  app.post("/api/sessions/:sessionId/problem-conversation", async (req, res) => {
    try {
      const { question, answer, originalProblem, conversationHistory } = req.body;
      
      // Force completion after 4 or more exchanges (safety mechanism)
      const exchangeCount = conversationHistory.filter(msg => msg.type === 'answer').length + 1;
      console.log(`Conversation exchange count: ${exchangeCount}`);
      
      let conversationResult;
      if (exchangeCount >= 4) {
        // Force completion - too many exchanges, but still refine based on conversation
        console.log('Forcing conversation completion after 4+ exchanges, refining problem statement');
        const refinedProblem = await openaiService.refineProblemFromConversation(
          originalProblem,
          [...conversationHistory, { type: 'answer', content: answer }]
        );
        conversationResult = {
          refinedProblem,
          isComplete: true
        };
      } else {
        conversationResult = await openaiService.handleProblemConversation(
          question, 
          answer, 
          originalProblem, 
          conversationHistory
        );
      }
      
      console.log('Conversation result:', JSON.stringify(conversationResult, null, 2));
      
      const session = await storage.getSession(req.params.sessionId);
      
      // Update session with conversation data and mark stage complete if conversation is done
      if (conversationResult.isComplete && conversationResult.refinedProblem) {
        await storage.updateSession(req.params.sessionId, {
          data: { 
            ...(session?.data as any),
            problemStatement: {
              original: originalProblem,
              refined: conversationResult.refinedProblem,
              aiSuggestions: []
            },
            problemConversation: {
              history: conversationHistory,
              lastAnswer: answer,
              lastQuestion: question,
              completed: true
            }
          },
          completedStages: [...(session?.completedStages || []), 'problem-discovery'],
          currentStage: 'market-research'
        });
      } else {
        await storage.updateSession(req.params.sessionId, {
          data: { 
            ...(session?.data as any),
            problemConversation: {
              history: conversationHistory,
              lastAnswer: answer,
              lastQuestion: question
            }
          }
        });
      }
      
      res.json(conversationResult);
    } catch (error: any) {
      console.error('Problem conversation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Step 2: Market Research
  app.post("/api/sessions/:sessionId/market-research", async (req, res) => {
    try {
      console.log("Market research request body:", req.body);
      const { marketResearch } = req.body;
      let findings = {};
      
      if (marketResearch?.permission) {
        const session = await storage.getSession(req.params.sessionId);
        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }
        
        const problemStatement = (session.data as any)?.problemStatement?.refined || (session.data as any)?.problemStatement?.original;
        
        if (problemStatement) {
          findings = await searchService.conductMarketResearch(problemStatement);
        } else {
          // Provide guidance when no problem statement exists
          findings = {
            marketSize: "Complete step 1 (Problem Analysis) first to enable market research based on your problem statement.",
            competitors: ["Problem statement required for competitor analysis"],
            trends: ["Problem statement required for trend analysis"],
            confidence: 0,
          };
        }
      }
      
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session.data as any),
          marketResearch: { ...marketResearch, findings } 
        },
        completedStages: [...(session.completedStages || []), 'market-research'],
        currentStage: 'root-cause-analysis',
      });
      
      res.json(findings);
    } catch (error: any) {
      console.log("Market research error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Step 3: Root Cause Analysis
  app.post("/api/sessions/:sessionId/root-cause", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const problemStatement = (session?.data as any)?.problemStatement?.refined || (session?.data as any)?.problemStatement?.original;
      
      const rootCauseAnalysis = await openaiService.conductRootCauseAnalysis(problemStatement);
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          rootCause: rootCauseAnalysis 
        },
        completedStages: [...(session?.completedStages || []), 'root-cause-analysis'],
        currentStage: 'existing-solutions',
      });
      
      res.json(rootCauseAnalysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 4: Existing Solutions
  app.post("/api/sessions/:sessionId/existing-solutions", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const problemStatement = (session?.data as any)?.problemStatement?.refined || (session?.data as any)?.problemStatement?.original;
      
      const solutions = await searchService.findExistingSolutions(problemStatement);
      const gapAnalysis = await openaiService.analyzeGaps(solutions, problemStatement);
      
      const existingSolutions = { solutions, gaps: gapAnalysis };
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          existingSolutions 
        },
        completedStages: [...(session?.completedStages || []), 'existing-solutions'],
        currentStage: 'customer-profile',
      });
      
      res.json(existingSolutions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 5: ICP Generation
  app.post("/api/sessions/:sessionId/icp", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const problemStatement = (session?.data as any)?.problemStatement?.refined || (session?.data as any)?.problemStatement?.original;
      
      const icpProfiles = await openaiService.generateICP(problemStatement);
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          icp: icpProfiles[0] // Use first suggested profile
        },
        completedStages: [...(session?.completedStages || []), 'customer-profile'],
        currentStage: 'use-case-definition',
      });
      
      res.json(icpProfiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 6: Use Case Generation
  app.post("/api/sessions/:sessionId/use-case", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const icp = (session?.data as any)?.icp;
      const problemStatement = (session?.data as any)?.problemStatement?.refined || (session?.data as any)?.problemStatement?.original;
      
      const useCase = await openaiService.generateUseCase(problemStatement, icp);
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          useCase 
        },
        completedStages: [...(session?.completedStages || []), 'use-case-definition'],
        currentStage: 'product-requirements',
      });
      
      res.json(useCase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 7: Product Requirements
  app.post("/api/sessions/:sessionId/requirements", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      const useCase = (session?.data as any)?.useCase;
      const rootCause = (session?.data as any)?.rootCause;
      
      const requirements = await openaiService.generateProductRequirements(useCase, rootCause);
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          productRequirements: requirements 
        },
        completedStages: [...(session?.completedStages || []), 'product-requirements'],
        currentStage: 'prioritization',
      });
      
      res.json(requirements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 8: Prioritization
  app.post("/api/sessions/:sessionId/prioritization", async (req, res) => {
    try {
      const { method, features } = prioritizationSchema.parse(req.body);
      const session = await storage.getSession(req.params.sessionId);
      
      const prioritizedFeatures = await openaiService.prioritizeFeatures(features, method);
      
      const prioritization = { method, features: prioritizedFeatures };
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          prioritization 
        },
        completedStages: [...(session?.completedStages || []), 'prioritization'],
        currentStage: 'export',
      });
      
      res.json(prioritization);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 10: Go-to Market Strategy
  app.post("/api/sessions/:sessionId/go-to-market", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const workflowData = session.data as any;
      const gtmStrategy = await openaiService.generateGoToMarketStrategy(workflowData);
      
      await storage.updateSession(req.params.sessionId, {
        data: { 
          ...(session?.data as any),
          goToMarketStrategy: gtmStrategy 
        },
        completedStages: [...(session?.completedStages || []), 'go-to-market'],
        currentStage: 'export',
      });
      
      res.json(gtmStrategy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 9: Document Export
  app.post("/api/sessions/:sessionId/export", async (req, res) => {
    try {
      const { format } = req.body;
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const document = await documentService.generateMVPDocument(session.data as any, format);
      
      // Don't automatically advance workflow - let user manually continue after export
      
      res.json({ downloadUrl: document.url, filename: document.filename });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GTM Complete export (MVP + Go-to-Market Strategy)
  app.post("/api/sessions/:sessionId/gtm-export", optionalAuth, validateSessionAccess, async (req, res) => {
    try {
      const { format } = req.body;
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const document = await documentService.generateCompleteStrategyDocument(session.data as any, format);
      
      res.json({ downloadUrl: document.url, filename: document.filename });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Problem-Solution Validation export
  app.post("/api/sessions/:sessionId/validation-export", optionalAuth, validateSessionAccess, async (req, res) => {
    try {
      const { format } = req.body;
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const document = await documentService.generateValidationDocument(session.data as any, format);
      
      res.json({ downloadUrl: document.url, filename: document.filename });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Step 12: Problem-Solution Validation Routes
  // Auto-seed roadmap from existing PRD/MVP data
  app.post("/api/sessions/:sessionId/roadmap/seed", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const workflowData = session.data as any;
      
      // Check if roadmap already exists
      const existingRoadmap = await storage.getRoadmap(req.params.sessionId);
      if (existingRoadmap) {
        return res.status(400).json({ error: "Roadmap already exists for this session" });
      }

      // Create roadmap
      const roadmap = await storage.createRoadmap({
        sessionId: req.params.sessionId,
        name: "Problem-Solution Validation",
        layout: "now-next-later"
      });

      // Auto-seed milestones based on existing data
      const milestones = await generateInitialMilestones(workflowData, roadmap.id);
      
      // Create milestones
      const createdMilestones = [];
      for (let i = 0; i < milestones.length; i++) {
        const milestone = await storage.createMilestone({
          ...milestones[i],
          roadmapId: roadmap.id,
          sortIndex: i
        });
        createdMilestones.push(milestone);
      }

      // Update session to mark roadmap stage as current
      await storage.updateSession(req.params.sessionId, {
        completedStages: [...(session.completedStages || []), 'gtm-download'],
        currentStage: 'product-roadmap',
      });

      res.json({ 
        roadmap, 
        milestones: createdMilestones,
        message: "Roadmap auto-seeded successfully" 
      });
    } catch (error: any) {
      console.error("Roadmap seeding error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get roadmap for session
  app.get("/api/sessions/:sessionId/roadmap", async (req, res) => {
    try {
      const roadmap = await storage.getRoadmap(req.params.sessionId);
      if (!roadmap) {
        return res.status(404).json({ error: "Roadmap not found" });
      }

      const milestones = await storage.getMilestones(roadmap.id);
      
      res.json({ 
        roadmap, 
        milestones: milestones.sort((a, b) => a.sortIndex - b.sortIndex)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update roadmap
  app.patch("/api/roadmaps/:roadmapId", async (req, res) => {
    try {
      const { name, layout } = req.body;
      const roadmap = await storage.updateRoadmap(parseInt(req.params.roadmapId), { name, layout });
      res.json(roadmap);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create milestone
  app.post("/api/roadmaps/:roadmapId/milestones", async (req, res) => {
    try {
      const milestoneData = insertMilestoneSchema.parse({
        ...req.body,
        roadmapId: parseInt(req.params.roadmapId)
      });
      
      const milestone = await storage.createMilestone(milestoneData);
      res.json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update milestone
  app.patch("/api/milestones/:milestoneId", async (req, res) => {
    try {
      const milestone = await storage.updateMilestone(parseInt(req.params.milestoneId), req.body);
      res.json(milestone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete milestone
  app.delete("/api/milestones/:milestoneId", async (req, res) => {
    try {
      await storage.deleteMilestone(parseInt(req.params.milestoneId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Reorder milestones (for drag and drop)
  app.post("/api/roadmaps/:roadmapId/reorder", async (req, res) => {
    try {
      const { milestoneUpdates } = req.body;
      await storage.reorderMilestones(milestoneUpdates);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Export roadmap
  app.post("/api/sessions/:sessionId/roadmap/export", async (req, res) => {
    try {
      // Validate format with zod
      const formatSchema = z.enum(['pdf', 'csv']);
      const format = formatSchema.parse(req.body.format);
      
      const session = await storage.getSession(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const roadmap = await storage.getRoadmap(req.params.sessionId);
      if (!roadmap) {
        return res.status(404).json({ error: "Roadmap not found" });
      }

      const milestones = await storage.getMilestones(roadmap.id);
      
      // TODO: Implement actual export logic with documentService
      // Generate the actual document using DocumentService
      const document = await documentService.generateRoadmapDocument(roadmap, milestones, format);

      // Update session to track export
      await storage.updateSession(session.sessionId, {
        data: { 
          ...(session.data as any),
          hasRoadmapExported: true 
        }
      });

      res.json({ 
        downloadUrl: document.url,
        filename: document.filename
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pitch Deck Routes
  
  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      console.log('Multer file filter:', file.originalname, file.mimetype);
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        console.log('File accepted by filter');
        cb(null, true);
      } else {
        console.log('File rejected by filter:', file.mimetype, ext);
        cb(new Error('Only PDF and PowerPoint files are allowed'));
      }
    }
  });
  
  // Upload presentation and create pitch deck
  app.post("/api/pitch-decks/upload", (req, res, next) => {
    console.log('Upload endpoint hit');
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      console.log('Upload handler - file:', req.file?.originalname);
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: "No file uploaded" });
      }

      const sessionId = req.body.sessionId;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Parse the uploaded file
      let extractedText = "";
      try {
        extractedText = await officeParser.parseOfficeAsync(req.file.buffer);
      } catch (parseError) {
        console.error("File parsing error:", parseError);
        return res.status(400).json({ error: "Could not parse the presentation file. Please ensure it's a valid PowerPoint or PDF file." });
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: "No text content found in the presentation" });
      }

      // Use AI to convert text into structured slides
      const slidePrompt = `Convert this presentation text into a structured Sequoia pitch deck format with 10 slides.
      
      Text from presentation:
      ${extractedText.substring(0, 10000)} // Limit to 10k chars
      
      Return a JSON array with 10 objects, one for each slide type in this order:
      1. problem: The problem being solved
      2. solution: The solution approach
      3. why-now: Why this is the right time
      4. market-size: Market opportunity
      5. product: Product details
      6. business-model: Revenue model
      7. competition: Competitive landscape
      8. team: Team information
      9. financials: Traction and metrics
      10. vision: Vision and funding ask
      
      Each object should have:
      {
        "slideType": "problem|solution|why-now|...",
        "headline": "Main headline (5-10 words)",
        "bulletPoints": ["point1", "point2", ...],
        "notes": "Additional context"
      }
      
      Extract relevant content from the presentation text and organize it into these 10 slides.`;

      const aiResponse = await openaiService.chat([
        { role: "system", content: "You are a pitch deck expert. Convert presentations into Sequoia Capital format. Always respond with valid JSON." },
        { role: "user", content: slidePrompt }
      ], { format: 'json' });

      let slidesData;
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No JSON array found in response");
        }
        slidesData = JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        console.error("AI response parsing error:", jsonError);
        slidesData = []; // Will create default slides
      }

      // Create the pitch deck
      const pitchDeck = await storage.createPitchDeck({
        sessionId,
        title: req.file.originalname.replace(/\.(pptx?|pdf)$/i, ""),
        status: "draft"
      });

      // Create slides with AI-extracted content
      const slideTypes = ["problem", "solution", "why-now", "market-size", "product", "business-model", "competition", "team", "financials", "vision"];
      
      for (let i = 0; i < slideTypes.length; i++) {
        const aiSlideData = slidesData.find((s: any) => s.slideType === slideTypes[i]) || {};
        await storage.createPitchDeckSlide({
          deckId: pitchDeck.id,
          slideType: slideTypes[i] as any,
          position: i + 1,
          content: {
            headline: aiSlideData.headline || "",
            bulletPoints: aiSlideData.bulletPoints || [],
            notes: aiSlideData.notes || ""
          },
        });
      }

      res.json({ ...pitchDeck, message: "Presentation uploaded and converted successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to process presentation" });
    }
  });
  
  // Create pitch deck for a session
  app.post("/api/pitch-decks", async (req, res) => {
    try {
      const pitchDeckData = insertPitchDeckSchema.parse(req.body);
      const pitchDeck = await storage.createPitchDeck(pitchDeckData);
      
      // Create default 10 slides
      const slideTypes = ["problem", "solution", "why-now", "market-size", "product", "business-model", "competition", "team", "financials", "vision"];
      for (let i = 0; i < slideTypes.length; i++) {
        await storage.createPitchDeckSlide({
          deckId: pitchDeck.id,
          slideType: slideTypes[i] as any,
          position: i + 1,
          content: {},
        });
      }
      
      res.json(pitchDeck);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get pitch deck for a session
  app.get("/api/pitch-decks/:sessionId", async (req, res) => {
    try {
      const pitchDeck = await storage.getPitchDeck(req.params.sessionId);
      if (!pitchDeck) {
        return res.status(404).json({ error: "Pitch deck not found" });
      }
      
      const slides = await storage.getPitchDeckSlides(pitchDeck.id);
      res.json({ ...pitchDeck, slides });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update pitch deck
  app.patch("/api/pitch-decks/:deckId", async (req, res) => {
    try {
      const pitchDeck = await storage.updatePitchDeck(parseInt(req.params.deckId), req.body);
      res.json(pitchDeck);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete pitch deck
  app.delete("/api/pitch-decks/:deckId", async (req, res) => {
    try {
      await storage.deletePitchDeck(parseInt(req.params.deckId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get slides for a deck
  app.get("/api/pitch-decks/:deckId/slides", async (req, res) => {
    try {
      const slides = await storage.getPitchDeckSlides(parseInt(req.params.deckId));
      res.json(slides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new slide
  app.post("/api/pitch-decks/:deckId/slides", async (req, res) => {
    try {
      const slideData = insertPitchDeckSlideSchema.parse({
        ...req.body,
        deckId: parseInt(req.params.deckId),
      });
      const slide = await storage.createPitchDeckSlide(slideData);
      res.json(slide);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a slide
  app.patch("/api/pitch-decks/:deckId/slides/:slideId", async (req, res) => {
    try {
      const slide = await storage.updatePitchDeckSlide(parseInt(req.params.slideId), req.body);
      res.json(slide);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a slide
  app.delete("/api/pitch-decks/:deckId/slides/:slideId", async (req, res) => {
    try {
      await storage.deletePitchDeckSlide(parseInt(req.params.slideId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // AI-generate pitch deck content from session data
  app.post("/api/pitch-decks/:deckId/generate", aiRateLimitMiddleware, async (req, res) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const pitchDeck = await storage.getPitchDeck(req.body.sessionId);
      
      if (!pitchDeck || pitchDeck.id !== deckId) {
        return res.status(404).json({ error: "Pitch deck not found" });
      }

      const session = await storage.getSession(req.body.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // AI generation will be implemented in the service layer
      // For now, return success
      res.json({ success: true, message: "AI generation will be implemented" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export pitch deck to PDF
  app.post("/api/pitch-decks/:deckId/export", async (req, res) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const slides = await storage.getPitchDeckSlides(deckId);
      
      // Export will be implemented with documentService
      // For now, return placeholder
      res.json({ 
        success: true, 
        message: "Export functionality will be implemented",
        downloadUrl: "/placeholder.pdf",
        filename: "pitch-deck.pdf"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== LEARNING MODE ENDPOINTS ==========
  
  // Get all learning stages (safe subset for UI)
  app.get("/api/learning/stages", async (req, res) => {
    try {
      res.json(getSafeStagesForUI());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session learning data
  app.get("/api/sessions/:sessionId/learning", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const learning = (session.data as any)?.learning || {};
      res.json(learning);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save attempt for a learning stage
  app.post("/api/sessions/:sessionId/learning/:stageId/attempt", async (req, res) => {
    try {
      const { sessionId, stageId } = req.params;
      const { attempt } = req.body;
      
      const stage = getStageById(stageId as LearningStageId);
      if (!stage) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const validation = validateAttempt(stageId as LearningStageId, attempt);
      
      const data = session.data as any || {};
      const learning = data.learning || {};
      const currentState: LearningStageState = learning[stageId] || { status: 'not-started', version: 0 };
      
      learning[stageId] = {
        ...currentState,
        attempt,
        status: 'attempted',
        attemptedAt: Date.now(),
        version: currentState.version + 1
      };
      
      await storage.updateSession(sessionId, {
        data: { ...data, learning }
      });
      
      res.json({ 
        success: true, 
        validation,
        stageState: learning[stageId]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Grade an attempt
  app.post("/api/sessions/:sessionId/learning/:stageId/grade", aiRateLimitMiddleware, async (req, res) => {
    try {
      const { sessionId, stageId } = req.params;
      
      const stage = getStageById(stageId as LearningStageId);
      if (!stage) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const data = session.data as any || {};
      const learning = data.learning || {};
      const currentState: LearningStageState = learning[stageId];
      
      if (!currentState?.attempt) {
        return res.status(400).json({ error: "No attempt found. Submit an attempt first." });
      }
      
      if (!minAttemptSatisfied(stageId as LearningStageId, currentState.attempt)) {
        return res.status(400).json({ error: "Attempt does not meet minimum requirements." });
      }
      
      const priorContext = buildStageContext(stageId as LearningStageId, learning);
      const grade = await openaiService.gradeLearningAttempt(stage, currentState.attempt, priorContext);
      
      learning[stageId] = {
        ...currentState,
        grade,
        status: 'graded',
        gradedAt: Date.now(),
        version: currentState.version + 1
      };
      
      await storage.updateSession(sessionId, {
        data: { ...data, learning }
      });
      
      res.json({ 
        success: true, 
        grade,
        stageState: learning[stageId]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate artifact for a stage
  app.post("/api/sessions/:sessionId/learning/:stageId/generate", aiRateLimitMiddleware, async (req, res) => {
    try {
      const { sessionId, stageId } = req.params;
      
      const stage = getStageById(stageId as LearningStageId);
      if (!stage) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const data = session.data as any || {};
      const learning = data.learning || {};
      const currentState: LearningStageState = learning[stageId];
      
      if (!currentState?.attempt) {
        return res.status(400).json({ error: "No attempt found. Submit an attempt first." });
      }
      
      const hasGrade = !!currentState.grade;
      const meetsMinimum = minAttemptSatisfied(stageId as LearningStageId, currentState.attempt);
      
      if (!hasGrade && !meetsMinimum) {
        return res.status(400).json({ error: "Grade required or attempt must meet minimum requirements." });
      }
      
      const priorContext = buildStageContext(stageId as LearningStageId, learning);
      const artifact = await openaiService.generateLearningArtifact(stage, currentState.attempt, currentState.grade || null, priorContext);
      
      const nextStageId = getNextStage(stageId as LearningStageId);
      
      learning[stageId] = {
        ...currentState,
        artifact,
        status: 'generated',
        generatedAt: Date.now(),
        version: currentState.version + 1
      };
      
      const completedStages = session.completedStages || [];
      if (!completedStages.includes(`learning-${stageId}`)) {
        completedStages.push(`learning-${stageId}`);
      }
      
      await storage.updateSession(sessionId, {
        data: { ...data, learning },
        completedStages,
        currentStage: nextStageId ? `learning-${nextStageId}` : session.currentStage
      });
      
      res.json({ 
        success: true, 
        artifact,
        nextStage: nextStageId,
        stageState: learning[stageId]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit attempt, grade, and generate in one call
  app.post("/api/sessions/:sessionId/learning/:stageId/submit", aiRateLimitMiddleware, async (req, res) => {
    try {
      const { sessionId, stageId } = req.params;
      const { attempt } = req.body;
      
      const stage = getStageById(stageId as LearningStageId);
      if (!stage) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }
      
      const validation = validateAttempt(stageId as LearningStageId, attempt);
      if (!validation.valid) {
        return res.status(400).json({ error: "Validation failed", errors: validation.errors });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const data = session.data as any || {};
      const learning = data.learning || {};
      const currentState: LearningStageState = learning[stageId] || { status: 'not-started', version: 0 };
      
      const priorContext = buildStageContext(stageId as LearningStageId, learning);
      
      // Combined grade + artifact in single AI call for speed
      const { grade, artifact } = await openaiService.gradeAndGenerateLearningStage(stage, attempt, priorContext);
      
      const nextStageId = getNextStage(stageId as LearningStageId);
      
      learning[stageId] = {
        attempt,
        grade,
        artifact,
        status: 'generated',
        attemptedAt: Date.now(),
        gradedAt: Date.now(),
        generatedAt: Date.now(),
        version: currentState.version + 1
      };
      
      const completedStages = session.completedStages || [];
      if (!completedStages.includes(`learning-${stageId}`)) {
        completedStages.push(`learning-${stageId}`);
      }
      
      await storage.updateSession(sessionId, {
        data: { ...data, learning },
        completedStages,
        currentStage: nextStageId ? `learning-${nextStageId}` : session.currentStage
      });
      
      res.json({ 
        success: true,
        validation,
        grade,
        artifact,
        nextStage: nextStageId,
        stageState: learning[stageId]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark stage as mastered
  app.post("/api/sessions/:sessionId/learning/:stageId/master", async (req, res) => {
    try {
      const { sessionId, stageId } = req.params;
      
      const stage = getStageById(stageId as LearningStageId);
      if (!stage) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const data = session.data as any || {};
      const learning = data.learning || {};
      const currentState: LearningStageState = learning[stageId];
      
      if (!currentState?.artifact) {
        return res.status(400).json({ error: "Cannot mark as mastered without generated artifact." });
      }
      
      learning[stageId] = {
        ...currentState,
        status: 'mastered',
        masteredAt: Date.now(),
        version: currentState.version + 1
      };
      
      await storage.updateSession(sessionId, {
        data: { ...data, learning }
      });
      
      res.json({ 
        success: true, 
        stageState: learning[stageId]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== END LEARNING MODE ENDPOINTS ==========

  // Step 13: Feedback (updated from Step 12)
  app.post("/api/sessions/:sessionId/feedback", async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId,
      });
      
      const feedback = await storage.createFeedback(feedbackData);
      
      const session = await storage.getSession(req.params.sessionId);
      if (session) {
        await storage.updateSession(req.params.sessionId, {
          completedStages: [...(session.completedStages || []), 'feedback'],
        });
      }
      
      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all feedback for admin view
  app.get("/api/feedback", async (req, res) => {
    try {
      const allFeedback = await storage.getAllFeedback();
      res.json(allFeedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all sessions for admin view
  app.get("/api/sessions", async (req, res) => {
    try {
      const allSessions = await storage.getAllSessions();
      res.json(allSessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save file endpoints
  app.post("/api/sessions/:sessionId/save-file", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const saveFilePath = await objectStorageService.saveSaveFile(req.params.sessionId, {
        sessionId: session.sessionId,
        data: session.data,
        currentStage: session.currentStage,
        completedStages: session.completedStages,
        createdAt: session.createdAt,
        savedAt: new Date().toISOString()
      });

      res.json({ saveFilePath });
    } catch (error: any) {
      console.error("Save file error:", error);
      res.status(500).json({ error: "Failed to save file" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error accessing save file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Save file not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Restore session from save file
  app.post("/api/sessions/restore", async (req, res) => {
    try {
      const { saveData } = req.body;
      
      if (!saveData || !saveData.sessionId) {
        return res.status(400).json({ error: "Invalid save data" });
      }

      // Create or update session with restored data
      const restoredSession = {
        sessionId: saveData.sessionId,
        currentStage: saveData.currentStage || "problem-discovery",
        completedStages: saveData.completedStages || [],
        data: saveData.data || {},
        createdAt: saveData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await storage.createSession(restoredSession);
      res.json({ sessionId: restoredSession.sessionId });
    } catch (error: any) {
      console.error("Restore session error:", error);
      res.status(500).json({ error: "Failed to restore session" });
    }
  });

  // Integration status endpoint
  app.get("/api/integrations/status", async (req, res) => {
    try {
      const { getIntegrationStatus } = await import("./config/integrations");
      const status = getIntegrationStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Failed to get integration status:', error);
      res.status(500).json({ error: 'Failed to get integration status' });
    }
  });

  // Configuration validation endpoint
  app.get("/api/config/validate", async (req, res) => {
    try {
      const { validateRequiredIntegrations } = await import("./config/integrations");
      const validation = validateRequiredIntegrations();
      res.json(validation);
    } catch (error: any) {
      console.error('Failed to validate configuration:', error);
      res.status(500).json({ error: 'Failed to validate configuration' });
    }
  });

  // Render health check endpoint (Step 1 requirement)
  app.get("/healthz", async (req, res) => {
    res.status(200).json({ ok: true });
  });

  // ===== ADMIN TRACKING ENDPOINTS =====
  
  // Canonical stages from learningStages.ts
  const canonicalStages = [
    'think-like-a-founder',
    'problem-definition',
    'market-research',
    'root-cause',
    'existing-solutions',
    'customer-profile',
    'use-case',
    'requirements',
    'prioritization',
    'export-document',
    'feedback'
  ];
  
  // Map legacy stage IDs to canonical IDs (comprehensive mapping)
  const legacyStageMap: Record<string, string> = {
    // Problem-related legacy stages
    'problem-discovery': 'problem-definition',
    'problem-analysis': 'problem-definition',
    'problem': 'problem-definition',
    // Customer-related legacy stages  
    'icp': 'customer-profile',
    'icp-definition': 'customer-profile',
    'customer-interview': 'customer-profile',
    'customer': 'customer-profile',
    // Requirements-related legacy stages
    'product-requirements': 'requirements',
    'mvp-scope': 'requirements',
    'mvp': 'requirements',
    // Other mappings
    'prototype': 'prioritization',
    'user-testing': 'feedback',
    'product-market-fit': 'feedback',
    'export': 'export-document'
  };
  
  function normalizeStage(stage: string): string {
    return legacyStageMap[stage] || stage;
  }
  
  function normalizeCompletedStages(stages: string[]): string[] {
    const normalized = stages.map(normalizeStage);
    return [...new Set(normalized)].filter(s => canonicalStages.includes(s));
  }

  // Get comprehensive user tracking data for admin dashboard (from production DB)
  app.get("/api/admin/tracking", async (req, res) => {
    try {
      // Query production database for real-time data
      if (!productionPool) {
        return res.status(503).json({
          success: false,
          error: "Production database not configured"
        });
      }

      const sessionsResult = await productionPool.query(
        `SELECT session_id, current_stage, completed_stages, conversation_history, data, created_at, updated_at 
         FROM sessions ORDER BY updated_at DESC`
      );
      const customersResult = await productionPool.query(
        `SELECT * FROM customers ORDER BY updated_at DESC`
      );

      const sessions = sessionsResult.rows.map((row: any) => ({
        sessionId: row.session_id,
        currentStage: row.current_stage,
        completedStages: row.completed_stages || [],
        conversationHistory: row.conversation_history || [],
        data: row.data || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      const customers = customersResult.rows;
      
      // Create a map of customer emails to customer data
      const customerMap = new Map(customers.map((c: any) => [c.email, c]));
      
      const allStages = canonicalStages;
      
      // Combine session and customer data for tracking
      const trackingData = sessions.map(session => {
        const normalizedCompleted = normalizeCompletedStages(session.completedStages || []);
        const normalizedCurrent = normalizeStage(session.currentStage || 'problem-definition');
        const completedCount = normalizedCompleted.length;
        const currentStageIndex = allStages.indexOf(normalizedCurrent);
        const progressPercent = Math.round((completedCount / allStages.length) * 100);
        
        return {
          sessionId: session.sessionId,
          currentStage: session.currentStage,
          completedStages: session.completedStages || [],
          progressPercent,
          stagesCompleted: completedCount,
          totalStages: allStages.length,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          lastActivity: session.updatedAt,
          data: session.data || {}
        };
      });
      
      // Calculate summary stats using normalized data
      const totalUsers = sessions.length;
      const activeToday = sessions.filter(s => {
        const updated = new Date(s.updatedAt);
        const today = new Date();
        return updated.toDateString() === today.toDateString();
      }).length;
      // Use normalized completed stages for accurate completion count
      const completedWorkflows = trackingData.filter(t => 
        t.stagesCompleted >= allStages.length
      ).length;
      const avgProgress = totalUsers > 0 
        ? Math.round(trackingData.reduce((sum, t) => sum + t.progressPercent, 0) / totalUsers)
        : 0;
      
      res.json({
        success: true,
        summary: {
          totalUsers,
          activeToday,
          completedWorkflows,
          avgProgress,
          totalCustomers: customers.length
        },
        stages: allStages,
        users: trackingData.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      });
    } catch (error: any) {
      console.error('Admin tracking error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Get detailed tracking for a specific user/session (from production DB)
  app.get("/api/admin/tracking/:sessionId", async (req, res) => {
    try {
      if (!productionPool) {
        return res.status(503).json({
          success: false,
          error: "Production database not configured"
        });
      }

      const result = await productionPool.query(
        `SELECT session_id, current_stage, completed_stages, conversation_history, data, created_at, updated_at 
         FROM sessions WHERE session_id = $1`,
        [req.params.sessionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: "Session not found" 
        });
      }

      const row = result.rows[0];
      const session = {
        sessionId: row.session_id,
        currentStage: row.current_stage,
        completedStages: row.completed_stages || [],
        conversationHistory: row.conversation_history || [],
        data: row.data || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      const allStages = canonicalStages;
      
      const normalizedCompleted = normalizeCompletedStages(session.completedStages || []);
      const normalizedCurrent = normalizeStage(session.currentStage || 'problem-definition');
      const completedCount = normalizedCompleted.length;
      const progressPercent = Math.round((completedCount / allStages.length) * 100);
      
      // Build stage-by-stage detail
      const stageDetails = allStages.map((stage, index) => {
        const isCompleted = normalizedCompleted.includes(stage);
        const isCurrent = normalizedCurrent === stage;
        const stageData = (session.data as any)?.[stage.replace(/-/g, '')] || 
                          (session.data as any)?.[stage] || null;
        
        return {
          stage,
          index: index + 1,
          status: isCompleted ? 'completed' : (isCurrent ? 'in_progress' : 'pending'),
          hasData: stageData !== null,
          data: stageData
        };
      });
      
      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          currentStage: session.currentStage,
          completedStages: session.completedStages || [],
          progressPercent,
          stagesCompleted: completedCount,
          totalStages: allStages.length,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          conversationHistory: session.conversationHistory || [],
          stageDetails,
          workflowData: session.data || {}
        }
      });
    } catch (error: any) {
      console.error('Admin tracking detail error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Get customer tracking with subscription details (from production DB)
  app.get("/api/admin/customers-tracking", async (req, res) => {
    try {
      if (!productionPool) {
        return res.status(503).json({
          success: false,
          error: "Production database not configured"
        });
      }

      const result = await productionPool.query(
        `SELECT * FROM customers ORDER BY updated_at DESC`
      );

      const customers = result.rows.map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        subscriptionId: row.subscription_id,
        subscriptionStatus: row.subscription_status,
        subscriptionInterval: row.subscription_interval,
        planName: row.plan_name,
        subscribePlanName: row.subscribe_plan_name,
        subscriptionPlanPrice: row.subscription_plan_price,
        actualAttempts: row.actual_attempts,
        usedAttempt: row.used_attempt,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      const customerTracking = customers.map((c: any) => ({
        id: c.id,
        customerId: c.customerId,
        email: c.email,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
        subscriptionStatus: c.subscriptionStatus || 'none',
        planName: c.planName || c.subscribePlanName || 'Free',
        attemptsUsed: c.usedAttempt || 0,
        attemptsTotal: c.actualAttempts || 0,
        attemptsRemaining: Math.max(0, (c.actualAttempts || 0) - (c.usedAttempt || 0)),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }));
      
      // Summary stats
      const totalCustomers = customers.length;
      const activeSubscriptions = customers.filter(c => c.subscriptionStatus === 'active').length;
      const exhaustedAttempts = customers.filter(c => 
        (c.usedAttempt || 0) >= (c.actualAttempts || 0) && (c.actualAttempts || 0) > 0
      ).length;
      
      res.json({
        success: true,
        summary: {
          totalCustomers,
          activeSubscriptions,
          exhaustedAttempts,
          pausedSubscriptions: customers.filter(c => c.subscriptionStatus === 'paused').length,
          cancelledSubscriptions: customers.filter(c => c.subscriptionStatus === 'cancelled').length
        },
        customers: customerTracking.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      });
    } catch (error: any) {
      console.error('Admin customers tracking error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // ===== END ADMIN TRACKING ENDPOINTS =====

  // Health check endpoint with detailed service status
  app.get("/api/health", async (req, res) => {
    try {
      const { validateRequiredIntegrations, getIntegrationConfig } = await import("./config/integrations");
      const config = getIntegrationConfig();
      const validation = validateRequiredIntegrations();
      
      // Test database connectivity if available
      let dbHealth = true;
      try {
        if (typeof storage.healthCheck === 'function') {
          dbHealth = await storage.healthCheck();
        }
      } catch (error) {
        dbHealth = false;
      }

      const health = {
        status: validation.valid ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          api: true,
          database: dbHealth,
          openai: config.openai.enabled,
          github: config.github.enabled,
          shopify: config.shopify.enabled,
          search: config.search.enabled,
        },
        database: {
          connected: dbHealth,
          provider: config.database.provider || 'memory',
          type: config.database.type,
        },
        missing: validation.missing,
        version: process.env.npm_package_version || '1.0.0',
      };

      const statusCode = validation.valid && dbHealth ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // FiveWhys Analysis Validation and Graph Conversion
  app.all("/api/fivewhys-validator", async (req, res) => {
    if (req.method === 'GET') {
      return res.json({
        endpoint: "/api/fivewhys-validator",
        methods: ["GET", "POST"],
        description: "Validates FiveWhys analysis data and converts it to graph format",
        usage: {
          url: "POST /api/fivewhys-validator",
          headers: {
            "Content-Type": "application/json"
          },
          body: {
            problem_statement: "string (required)",
            whys: "array of {question, answer, level} (required)", 
            root_cause: "string (required)",
            analysis_id: "string (optional)",
            created_at: "ISO date string (optional)",
            action_items: "array of {action, priority, owner} (optional)"
          }
        },
        response: {
          ok: "boolean",
          graph_view: {
            nodes: "array of graph nodes", 
            edges: "array of graph edges"
          },
          analysis: "validated analysis data"
        },
        example_usage: `curl -X POST http://localhost:5000/api/fivewhys-validator -H "Content-Type: application/json" -d '{"problem_statement":"Test","whys":[{"question":"Why?","answer":"Because","level":1}],"root_cause":"Root cause"}'`
      });
    }

    if (req.method === 'POST') {
      try {
        // Load the schema
        const schemaPath = path.resolve("schemas/five_whys.schema.json");
        if (!fs.existsSync(schemaPath)) {
          return res.status(500).json({ 
            ok: false, 
            error: "FiveWhys schema file not found" 
          });
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
        
        // Validate the request data
        const fiveWhysData = validateFiveWhys(req.body, schema);
        
        // Convert to graph view
        const graphView = toGraphView(fiveWhysData);
        
        return res.json({ 
          ok: true, 
          graph_view: graphView,
          analysis: fiveWhysData
        });
      } catch (error: any) {
        console.error('FiveWhys validation error:', error);
        return res.status(400).json({ 
          ok: false, 
          error: error.message || "Validation failed" 
        });
      }
    }

    res.status(405).json({ error: `Method ${req.method} not allowed` });
  });

  const httpServer = createServer(app);
  return httpServer;
}
