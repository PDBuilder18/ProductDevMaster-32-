import OpenAI from "openai";
import { KnowledgeGraphStage, ConversationMessage, AiConversation } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface StageInfo {
  title: string;
  description: string;
  explanation: string;
  example: string;
  nextStage?: KnowledgeGraphStage;
  questions: string[];
}

const STAGE_DEFINITIONS: Record<KnowledgeGraphStage, StageInfo> = {
  "problem-discovery": {
    title: "Problem Discovery",
    description: "Let's identify the core problem you want to solve",
    explanation: "This stage helps you clearly define what problem you're trying to solve. We'll break this down into focused questions to help you articulate your idea clearly.",
    example: "Instead of 'people need better apps', try 'small restaurant owners waste 2 hours daily on manual inventory tracking, leading to 15% food waste'",
    nextStage: "customer-interviews",
    questions: [
      "Step 1: What area or industry interests you most? (e.g., education, healthcare, finance, productivity)",
      "Step 2: Who is your target audience? Be specific about their role, age, or situation.",
      "Step 3: What specific task or challenge do they struggle with?",
      "Step 4: How much time or money does this problem cost them?",
      "Step 5: What happens if this problem continues unsolved?"
    ]
  },
  "customer-interviews": {
    title: "Customer Interviews",
    description: "Let's understand how to validate your problem with real customers",
    explanation: "Customer interviews help you validate that the problem you've identified is real and significant. You'll learn what customers actually think and feel about the problem.",
    example: "Interview 10-15 potential customers with questions like: 'Tell me about the last time you experienced [problem]' and 'How do you currently solve this?'",
    nextStage: "icp-definition",
    questions: [
      "Have you talked to potential customers about this problem?",
      "What questions would you ask them?",
      "How many people should you interview?",
      "What would convince you the problem is real?"
    ]
  },
  "icp-definition": {
    title: "Ideal Customer Profile",
    description: "Let's define who your perfect customer is",
    explanation: "Your ICP is a detailed description of the person who has the problem most acutely and would benefit most from your solution. This helps you focus your efforts.",
    example: "Sarah, 35, restaurant manager, earns $55k, works 50+ hours/week, frustrated with manual processes, values efficiency and cost savings",
    nextStage: "use-case-definition",
    questions: [
      "Who experiences this problem most intensely?",
      "What are their demographics (age, role, income)?",
      "What are their goals and frustrations?",
      "How do they currently try to solve this problem?"
    ]
  },
  "use-case-definition": {
    title: "Use Case Definition",
    description: "Let's map out how your customer will use your solution",
    explanation: "Use cases describe the specific scenarios where customers will use your product. This helps you understand the context and requirements for your solution.",
    example: "Every Tuesday morning, Sarah opens the app, scans QR codes on food items, the system automatically updates inventory levels and alerts her about items expiring in 2 days",
    nextStage: "market-size-estimation",
    questions: [
      "In what situation would your customer use your solution?",
      "What specific steps would they take?",
      "What would success look like for them?",
      "What obstacles might they face?"
    ]
  },
  "market-size-estimation": {
    title: "Market Size Estimation",
    description: "Let's estimate the size of your market opportunity",
    explanation: "Understanding market size helps you assess the potential of your idea and communicate its value to investors. We'll look at TAM, SAM, and SOM.",
    example: "TAM: $10B global restaurant management software market, SAM: $2B small restaurant segment, SOM: $500M inventory management niche",
    nextStage: "product-requirements",
    questions: [
      "How many people have this problem globally?",
      "What would they pay to solve it?",
      "Who are your main competitors?",
      "What's your realistic market share in 3 years?"
    ]
  },
  "product-requirements": {
    title: "Product Requirements",
    description: "Let's define what your product needs to do",
    explanation: "Product requirements specify the features and capabilities your solution must have. This creates a clear roadmap for development.",
    example: "Must have: QR code scanning, inventory tracking, expiration alerts. Should have: Analytics dashboard, supplier integration",
    nextStage: "mvp-scope",
    questions: [
      "What are the core features your product must have?",
      "What would be nice to have but not essential?",
      "What technical constraints do you have?",
      "How will users interact with your product?"
    ]
  },
  "mvp-scope": {
    title: "MVP Scope",
    description: "Let's define your Minimum Viable Product",
    explanation: "Your MVP is the simplest version of your product that solves the core problem. It helps you validate your solution quickly and cheaply.",
    example: "MVP: Basic inventory scanner app with manual entry, simple dashboard, and basic alerts. Advanced features come later.",
    nextStage: "prototype",
    questions: [
      "What's the smallest version that solves the problem?",
      "What features can you cut for the first version?",
      "How quickly can you build this?",
      "What will you learn from users?"
    ]
  },
  "prototype": {
    title: "Prototype",
    description: "Let's plan your prototype development",
    explanation: "A prototype is a early version of your product that you can test with users. It doesn't need to be perfect - just good enough to validate your ideas.",
    example: "Create clickable wireframes using Figma, or build a simple web app with basic functionality that 10 users can test",
    nextStage: "user-testing",
    questions: [
      "What type of prototype makes sense for your idea?",
      "What tools will you use to build it?",
      "How long will it take to create?",
      "What specific things do you want to test?"
    ]
  },
  "user-testing": {
    title: "User Testing",
    description: "Let's plan how to test your prototype with users",
    explanation: "User testing helps you understand if your solution actually works for real people. You'll discover what works, what doesn't, and what needs improvement.",
    example: "Test with 5-8 users, give them specific tasks, observe their behavior, ask follow-up questions about their experience",
    nextStage: "product-market-fit-check",
    questions: [
      "How many users will you test with?",
      "What specific tasks will you give them?",
      "What metrics will you track?",
      "How will you know if it's working?"
    ]
  },
  "product-market-fit-check": {
    title: "Product-Market Fit Check",
    description: "Let's evaluate if you've achieved product-market fit",
    explanation: "Product-market fit means you've found a strong market for your product. Signs include high user engagement, word-of-mouth growth, and customers who'd be 'very disappointed' without your product.",
    example: "Survey users: 'How would you feel if you could no longer use this product?' If >40% say 'very disappointed', you're getting close to PMF",
    questions: [
      "How engaged are your users?",
      "Are they recommending your product to others?",
      "What percentage would be 'very disappointed' without it?",
      "What do you need to improve to get there?"
    ]
  }
};

export class AIConversationService {
  private getStageInfo(stage: KnowledgeGraphStage): StageInfo | null {
    return STAGE_DEFINITIONS[stage] || null;
  }

  private getNextStage(currentStage: KnowledgeGraphStage): KnowledgeGraphStage | null {
    const stageInfo = this.getStageInfo(currentStage);
    return stageInfo?.nextStage || null;
  }

  async generateResponse(
    userMessage: string,
    currentStage: KnowledgeGraphStage,
    conversationHistory: ConversationMessage[],
    sessionData: any
  ): Promise<{
    response: string;
    suggestedNextStage?: KnowledgeGraphStage;
    action: "continue" | "move-to-next" | "clarify" | "provide-example";
    stageComplete?: boolean;
  }> {
    const stageInfo = this.getStageInfo(currentStage);
    if (!stageInfo) {
      return {
        response: "I'm having trouble with this stage. Let me help you with problem discovery instead.",
        action: "continue",
        stageComplete: false
      };
    }
    const nextStage = this.getNextStage(currentStage);
    
    // Build context from conversation history
    const recentMessages = conversationHistory.slice(-6).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const systemPrompt = `You are a friendly AI assistant helping a first-time startup founder develop their idea into an MVP. You're currently working on the "${stageInfo?.title || 'Problem Discovery'}" stage.

Stage Context:
- Title: ${stageInfo?.title || 'Problem Discovery'}
- Description: ${stageInfo?.description || 'Let\'s identify the core problem you want to solve'}
- Explanation: ${stageInfo?.explanation || 'This stage helps you clearly define what problem you\'re trying to solve.'}
- Example: ${stageInfo?.example || 'Instead of \'people need better apps\', try \'small restaurant owners waste 2 hours daily on manual inventory tracking\''}
- Key Questions for this stage: ${stageInfo?.questions?.join(', ') || 'What specific problem are you trying to solve?'}
- Next Stage: ${nextStage && STAGE_DEFINITIONS[nextStage] ? STAGE_DEFINITIONS[nextStage].title : "Final stage"}

Your personality:
- Friendly and encouraging
- Concise but helpful
- Always ask clarifying questions
- Provide examples when useful
- Be motivating and supportive

IMPORTANT INSTRUCTIONS FOR PROBLEM DISCOVERY:
If this is the Problem Discovery stage, guide users through these 5 specific steps one at a time:
1. Ask about their area/industry of interest first
2. Then ask who their target audience is (be specific about role, age, situation)
3. Then ask what specific task or challenge this audience struggles with
4. Then ask about the cost (time/money) this problem causes
5. Finally ask what happens if the problem continues unsolved

For other stages:
1. If the user has provided detailed, specific information that addresses the key questions for this stage, mark stageComplete as true
2. Only ask clarifying questions if the user's response is vague or incomplete
3. When the user provides comprehensive details (names, numbers, specific scenarios), acknowledge their thoroughness and move forward

Stage completion criteria:
- For Problem Discovery: All 5 steps have been answered with specific details
- For other stages: User has answered the key questions with specific details and concrete examples

Don't rush through the steps - take time to get good answers for each one.

Recent conversation:
${recentMessages}

Session data available: ${JSON.stringify(sessionData)}

Respond with JSON in this format:
{
  "response": "Your conversational response to the user - include a clarifying question only if more information is needed",
  "action": "continue" | "move-to-next" | "clarify" | "provide-example",
  "stageComplete": boolean,
  "suggestedNextStage": "next-stage-name" (only if stageComplete is true)
}`;

    // Check if OpenAI is available
    if (!openai) {
      console.warn('OpenAI API key not available, using fallback response');
      return {
        response: `I'm here to help you with ${stageInfo?.title || 'your startup journey'}. ${stageInfo?.explanation || 'Let me know what you\'d like to work on.'} (Note: AI features are currently unavailable - OpenAI API key needed)`,
        action: "continue",
        stageComplete: false
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        response: result.response || "I'm here to help you with your startup journey. What would you like to work on?",
        action: result.action || "continue",
        stageComplete: result.stageComplete || false,
        suggestedNextStage: result.suggestedNextStage as KnowledgeGraphStage || undefined
      };
    } catch (error) {
      console.error('AI conversation generation failed:', error);
      return {
        response: `I'm here to help you with ${stageInfo?.title || 'your startup journey'}. ${stageInfo?.explanation || 'Let me know what you\'d like to work on.'}`,
        action: "continue",
        stageComplete: false
      };
    }
  }

  getStageOverview(stage: KnowledgeGraphStage): StageInfo | null {
    return this.getStageInfo(stage);
  }

  getAllStages(): Record<KnowledgeGraphStage, StageInfo> {
    return STAGE_DEFINITIONS;
  }
}

export const aiConversationService = new AIConversationService();