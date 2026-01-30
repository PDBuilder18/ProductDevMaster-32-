import OpenAI from "openai";
import type { 
  ProblemStatement, 
  RootCause, 
  ICP, 
  UseCase, 
  ProductRequirements,
  Prioritization,
  GoToMarketStrategy,
  WorkflowData
} from "@shared/schema";

// Using direct OpenAI API
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// GPT-4o model for reliable structured responses
const GPT_MODEL = "gpt-4o";

// Helper function to extract JSON from AI responses (may include markdown)
function extractJSON(text: string): any {
  // Try to parse directly first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  }
}

interface ProblemAnalysis {
  refined: string;
  aiSuggestions: string[];
}

export class OpenAIService {
  async analyzeProblemStatement(problemStatement: string): Promise<ProblemAnalysis & { clarifyingQuestions?: string[] }> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product development expert. Analyze problem statements and provide refined versions with suggestions.

IMPORTANT: Respond with ONLY valid JSON, no explanations or markdown. Use this exact format:
{"refined": "A clear problem statement", "aiSuggestions": ["Suggestion 1", "Suggestion 2"], "clarifyingQuestions": ["Question 1?", "Question 2?", "Question 3?"]}

Guidelines:
- If the problem is vague, provide clarifyingQuestions to gather more details
- Only provide refined statement if the problem is already specific and actionable
- Always include 2-3 clarifying questions about target audience, pain points, and impact`
          },
          {
            role: "user",
            content: `Analyze this problem statement and provide a refined version with suggestions: "${problemStatement}"`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        refined: result.refined || problemStatement,
        aiSuggestions: result.aiSuggestions || [],
        clarifyingQuestions: result.clarifyingQuestions || []
      };
    } catch (error) {
      console.error('OpenAI problem analysis failed:', error);
      return {
        refined: problemStatement,
        aiSuggestions: [],
        clarifyingQuestions: []
      };
    }
  }

  async handleProblemConversation(
    question: string, 
    answer: string, 
    originalProblem: string, 
    conversationHistory: Array<{ type: 'question' | 'answer'; content: string }>
  ): Promise<{ nextQuestion?: string; refinedProblem?: string; isComplete: boolean }> {
    try {
      const historyText = conversationHistory.map(msg => 
        `${msg.type.toUpperCase()}: ${msg.content}`
      ).join('\n');

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are helping refine a problem statement through conversation. Based on the conversation history and latest answer, decide whether to ask another clarifying question or provide the final refined problem statement.

            Respond with JSON in this format:
            {
              "nextQuestion": "Next clarifying question (if more info needed)",
              "refinedProblem": "Final refined problem statement (if ready to conclude)",
              "isComplete": true/false
            }

            Guidelines:
            - Ask maximum 3-4 questions total
            - Each question should build on previous answers
            - When you have enough information, provide the refined problem statement
            - The refined problem should incorporate insights from all answers`
          },
          {
            role: "user",
            content: `Original problem: "${originalProblem}"
            
Conversation history:
${historyText}

Latest answer: "${answer}"

Should I ask another question or provide the final refined problem statement?`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        nextQuestion: result.nextQuestion,
        refinedProblem: result.refinedProblem,
        isComplete: result.isComplete || false
      };
    } catch (error) {
      console.error('OpenAI conversation handling failed:', error);
      return {
        refinedProblem: originalProblem,
        isComplete: true
      };
    }
  }

  async refineProblemFromConversation(
    originalProblem: string,
    conversationHistory: Array<{ type: 'question' | 'answer'; content: string }>
  ): Promise<string> {
    try {
      const historyText = conversationHistory.map(msg => 
        `${msg.type.toUpperCase()}: ${msg.content}`
      ).join('\n');

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a business analyst expert. Based on the original problem statement and the conversation history with clarifying questions and answers, create a refined, comprehensive problem statement that incorporates all the insights gathered.

            The refined problem should:
            - Be more specific and actionable than the original
            - Incorporate key insights from the conversation
            - Be clear and focused
            - Maintain the core intent while adding clarity and specificity

            Respond with just the refined problem statement, no additional text.`
          },
          {
            role: "user",
            content: `Original problem: "${originalProblem}"
            
Conversation history:
${historyText}

Please provide a refined problem statement that incorporates the insights from this conversation.`
          }
        ]
      });

      return response.choices[0].message.content?.trim() || originalProblem;
    } catch (error) {
      console.error('OpenAI problem refinement failed:', error);
      return originalProblem;
    }
  }

  async conductRootCauseAnalysis(problemStatement: string): Promise<RootCause> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a business analyst expert in root cause analysis. Use the "5 Whys" technique to dig deep into the problem.
            
            Respond with JSON in this format:
            {
              "causes": [
                {"level": 1, "question": "Why does this problem occur?", "answer": "Because..."},
                {"level": 2, "question": "Why does that happen?", "answer": "Because..."},
                ...
              ],
              "primaryCause": "The fundamental root cause identified"
            }
            
            Guidelines:
            - Ask "Why" questions iteratively (typically 3-5 levels)
            - Each answer should lead to the next question
            - Identify the primary root cause that addresses the fundamental issue
            - Be specific and actionable in your analysis`
          },
          {
            role: "user",
            content: `Conduct a root cause analysis for this problem: "${problemStatement}"`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        causes: result.causes || [],
        primaryCause: result.primaryCause || "Root cause analysis incomplete"
      };
    } catch (error) {
      console.error('OpenAI root cause analysis failed:', error);
      return {
        causes: [],
        primaryCause: "Failed to analyze root cause"
      };
    }
  }

  async analyzeGaps(solutions: any[], problemStatement: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a market analysis expert. Analyze existing solutions and identify gaps and opportunities.
            
            Respond with JSON in this format:
            {
              "gaps": ["Gap 1 description", "Gap 2 description", "Gap 3 description"]
            }
            
            Guidelines:
            - Identify what existing solutions are missing
            - Look for underserved market segments
            - Find opportunities for improvement
            - Focus on actionable gaps that could be addressed by a new product`
          },
          {
            role: "user",
            content: `Problem: "${problemStatement}"
            
            Existing solutions: ${JSON.stringify(solutions)}
            
            What gaps and opportunities exist in the market?`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      return result.gaps || [];
    } catch (error) {
      console.error('OpenAI gap analysis failed:', error);
      return [];
    }
  }

  async generateICP(problemStatement: string): Promise<ICP[]> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a customer research expert. Create detailed ideal customer profiles for the given problem.
            
            Respond with JSON in this format:
            {
              "profiles": [
                {
                  "name": "Customer Persona Name",
                  "description": "Brief description of this customer",
                  "demographics": {
                    "age": "Age range",
                    "jobRole": "Job title/role",
                    "income": "Income range",
                    "location": "Geographic location"
                  },
                  "psychographics": {
                    "goals": ["Goal 1", "Goal 2", "Goal 3"],
                    "frustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
                    "values": ["Value 1", "Value 2", "Value 3"]
                  }
                }
              ]
            }
            
            Guidelines:
            - Create 1-2 detailed customer profiles
            - Make them specific and realistic
            - Focus on customers who would benefit most from solving this problem
            - Include both demographic and psychographic information`
          },
          {
            role: "user",
            content: `Create ideal customer profiles for this problem: "${problemStatement}"`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      return result.profiles || [];
    } catch (error) {
      console.error('OpenAI ICP generation failed:', error);
      return [];
    }
  }

  async generateUseCase(problemStatement: string, icp: ICP | undefined): Promise<UseCase> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a UX expert specializing in detailed user journey mapping and comprehensive use case development. Create an extremely detailed, realistic use case scenario that tells a complete story.
            
            Respond with JSON in this format:
            {
              "narrative": "A comprehensive, detailed story (300-500 words) that includes: specific context, user background, emotional state, environment, time constraints, business impact, and detailed interaction flow. Include specific names, times, locations, and realistic details.",
              "steps": [
                {
                  "step": 1, 
                  "action": "Detailed description of exactly what the user does, including specific UI interactions, data they input, decisions they make",
                  "outcome": "Specific results, system responses, emotional reactions, business benefits, time saved, problems solved"
                },
                {"step": 2, "action": "Next detailed action...", "outcome": "Specific outcome..."},
                ...
              ]
            }
            
            Enhanced Guidelines:
            - Create a realistic day-in-the-life scenario with specific context (time, place, situation)
            - Include 8-12 detailed steps in the journey (more comprehensive than basic use cases)
            - Add emotional elements: frustrations, relief, satisfaction
            - Include specific business metrics: time saved, revenue impact, efficiency gains
            - Show pain points and how the solution addresses them
            - Add realistic interruptions, edge cases, and human behavior
            - Include collaboration with other team members or systems
            - Specify exact data types, numbers, and realistic business scenarios
            - Make each step actionable with clear inputs and outputs
            - Show progressive value building throughout the journey`
          },
          {
            role: "user",
            content: `Problem: "${problemStatement}"
            
            Customer Profile: ${icp ? JSON.stringify(icp) : "General user"}
            
            Create an extremely detailed, comprehensive use case that tells a complete story. I need:
            
            1. A rich narrative (300-500 words) with specific context:
               - Exact time/location/situation
               - User's emotional state and business pressures
               - Realistic background details and constraints
               - Specific business goals and metrics they care about
            
            2. Detailed step-by-step journey (8-12 steps) including:
               - Exact actions and UI interactions
               - Specific data they input or review
               - System responses and feedback
               - Emotional reactions at each step
               - Time saved or business value gained
               - Any obstacles or interruptions
               - Collaboration with team members
               - Integration with existing tools/processes
            
            Make this as realistic and specific as possible - include actual numbers, times, names, and business scenarios.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        narrative: result.narrative || "Use case generation incomplete",
        steps: result.steps || []
      };
    } catch (error) {
      console.error('OpenAI use case generation failed:', error);
      return {
        narrative: "Failed to generate use case",
        steps: []
      };
    }
  }

  async generateProductRequirements(useCase: UseCase | undefined, rootCause: RootCause | undefined): Promise<ProductRequirements> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product requirements expert. Convert use cases into structured functional and non-functional requirements.
            
            Respond with JSON in this format:
            {
              "functionalRequirements": [
                {
                  "id": "FR-001",
                  "name": "Requirement name",
                  "description": "What the system must do - specific behavior or functionality",
                  "acceptanceCriteria": ["Testable criteria 1", "Testable criteria 2"]
                }
              ],
              "nonFunctionalRequirements": [
                {
                  "id": "NFR-001",
                  "name": "Requirement name",
                  "description": "How the system should perform - quality attributes, constraints, standards",
                  "category": "Performance" | "Security" | "Usability" | "Reliability" | "Scalability" | "Compatibility",
                  "acceptanceCriteria": ["Measurable criteria 1", "Measurable criteria 2"]
                }
              ]
            }
            
            Guidelines:
            - Functional Requirements: What the system must do (features, behaviors, functions)
            - Non-Functional Requirements: How the system should perform (performance, security, usability)
            - DO NOT include priority levels - prioritization will be done in a separate step
            - Include measurable acceptance criteria
            - Focus on detailed requirements specification
            - Make requirements specific, testable, and unambiguous`
          },
          {
            role: "user",
            content: `Use Case: ${useCase ? JSON.stringify(useCase) : "Not available"}
            
            Root Cause: ${rootCause ? JSON.stringify(rootCause) : "Not available"}
            
            Generate detailed functional and non-functional requirements for the MVP. Focus on specific, testable requirements with clear acceptance criteria. Do not include priority levels.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        functionalRequirements: result.functionalRequirements || [],
        nonFunctionalRequirements: result.nonFunctionalRequirements || []
      };
    } catch (error) {
      console.error('OpenAI requirements generation failed:', error);
      return {
        functionalRequirements: [],
        nonFunctionalRequirements: []
      };
    }
  }

  async prioritizeFeatures(features: any[], method: "RICE" | "ICE" | "MoSCoW"): Promise<any[]> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product prioritization expert. Analyze and score features using the ${method} method, then categorize them into MoSCoW priorities.
            
            ${method === "RICE" ? `
            RICE Scoring:
            - Reach: How many customers will benefit (1-10)
            - Impact: How much will it impact each customer (1-10)
            - Confidence: How confident are you in the estimates (0.1-1.0)
            - Effort: How much effort to implement (1-10, lower is better)
            - Score = (Reach × Impact × Confidence) / Effort
            
            Map RICE scores to MoSCoW:
            - Score ≥ 6: Must Have
            - Score 3-5.9: Should Have  
            - Score 1-2.9: Could Have
            - Score < 1: Won't Have
            ` : method === "ICE" ? `
            ICE Scoring:
            - Impact: How much impact will this have (1-10)
            - Confidence: How confident are you (1-10)
            - Ease: How easy is it to implement (1-10)
            - Score = (Impact + Confidence + Ease) / 3
            
            Map ICE scores to MoSCoW:
            - Score ≥ 7.5: Must Have
            - Score 5-7.4: Should Have
            - Score 2.5-4.9: Could Have
            - Score < 2.5: Won't Have
            ` : `
            MoSCoW Prioritization:
            - Must Have: Critical for MVP launch
            - Should Have: Important but not critical
            - Could Have: Nice to have if time permits
            - Won't Have: Not for this version
            `}
            
            IMPORTANT: Always assign a priority category (must-have, should-have, could-have, or wont-have) to each feature regardless of method used.
            
            Respond with JSON in this format:
            {
              "features": [
                {
                  "name": "Feature name",
                  "description": "Feature description",
                  "reach": 8, // for RICE only
                  "impact": 9, // for RICE/ICE
                  "confidence": 0.8, // for RICE (decimal) or ICE (1-10)
                  "effort": 5, // for RICE only
                  "ease": 7, // for ICE only
                  "score": 11.52, // calculated score
                  "priority": "must-have" // REQUIRED: must-have, should-have, could-have, or wont-have
                }
              ]
            }`
          },
          {
            role: "user",
            content: `Prioritize these features using ${method} method:
            
            ${JSON.stringify(features)}
            
            Provide scores and rationale for each feature.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      return result.features || features;
    } catch (error) {
      console.error('OpenAI feature prioritization failed:', error);
      return features;
    }
  }

  async conductDetailedMarketResearch(problemStatement: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a market research expert with deep knowledge of companies, market sizes, and industry trends. Provide specific, detailed market analysis with real company names and precise data, along with credible sources for verification.
            
            Respond with JSON in this format:
            {
              "marketSize": "Detailed market size with specific numbers, growth rates, and TAM/SAM/SOM breakdown",
              "competitors": [
                "Company Name 1: Their specific solution, pricing model, pros (strength 1, strength 2), cons (weakness 1, weakness 2)",
                "Company Name 2: Their approach, market position, pros (what they do well), cons (their limitations)",
                "Company Name 3: Their unique value proposition, target market, pros and cons"
              ],
              "trends": [
                "Specific trend 1: Growth rate, market impact, timeline",
                "Specific trend 2: Technology adoption, customer behavior change",
                "Specific trend 3: Regulatory/economic factors, future implications"
              ],
              "references": [
                {
                  "source": "Credible source name (e.g., Statista, IBISWorld, McKinsey, PwC, Government reports)",
                  "title": "Report or study title",
                  "relevance": "What specific data this source provides (market size, trends, etc.)"
                }
              ],
              "confidence": 0.8
            }
            
            Guidelines:
            - Include 3-5 credible references from reputable sources like industry reports, research firms, government data, or established consultancies
            - Reference sources should include: Statista, IBISWorld, McKinsey, PwC, Deloitte, BCG, Gartner, Forrester, government agencies, trade associations
            - Each reference should specify what data it supports (market size, growth rates, competitive landscape, etc.)
            - Focus on providing specific company names, actual market numbers, and detailed competitive analysis
            - Ensure data appears credible and cite where similar information could be verified`
          },
          {
            role: "user",
            content: `Conduct comprehensive market research for this problem: "${problemStatement}"
            
            I need specific companies that are solving this problem, their exact solutions, their pros and cons, market size with numbers, and current trends with data.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      return {
        marketSize: result.marketSize || "Market size analysis not available",
        competitors: result.competitors || [],
        trends: result.trends || [],
        references: result.references || [],
        confidence: result.confidence || 0.7
      };
    } catch (error) {
      console.error('OpenAI detailed market research failed:', error);
      return {
        marketSize: "Research recommended: Use industry reports (IBISWorld, Statista), government data, and competitor analysis to determine Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM).",
        competitors: [
          "Direct competitors: Companies solving the exact same problem with similar solutions",
          "Indirect competitors: Companies solving the same problem with different approaches",
          "Substitute solutions: Alternative ways customers currently address this need"
        ],
        trends: [
          "Industry growth rates and market dynamics",
          "Technology adoption patterns affecting customer behavior",
          "Regulatory changes that could impact the market",
          "Investment and funding trends in this sector"
        ],
        confidence: 0.4
      };
    }
  }

  async findExistingSolutions(problemStatement: string): Promise<any[]> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a market research expert specializing in competitive analysis. Provide information about existing solutions, but follow these strict safeguards to prevent hallucination:

            CRITICAL SAFEGUARDS:
            1. ONLY mention real, verifiable companies and products that actually exist
            2. If you are not certain a company exists, do NOT include it
            3. Stay strictly focused on the problem statement provided by the user
            4. Do not invent pricing, features, or company details
            5. Use general descriptions rather than specific claims you cannot verify
            6. Include a confidence disclaimer in each solution description
            
            TOPIC BOUNDARIES:
            - Only analyze solutions directly related to the user's specific problem statement
            - Do not drift into unrelated business tools or general categories
            - Focus on competitors that solve the same or very similar problems
            - If no direct competitors exist, acknowledge this rather than stretching to find solutions
            
            VERIFICATION REQUIREMENTS:
            - Only include well-known, publicly documented companies
            - Use phrases like "appears to offer" or "reportedly provides" for uncertain details
            - Avoid specific pricing unless it's commonly known public information
            - Include disclaimers about the need to verify current information
            
            Respond with JSON in this format:
            {
              "solutions": [
                {
                  "name": "Company/Product Name (if verifiable)",
                  "description": "How they appear to address the specific problem",
                  "pros": ["Generally known strength", "Another documented strength", "Public information advantage"],
                  "cons": ["Potential limitation", "Common concern", "General constraint"],
                  "pricing": "General pricing model (e.g., freemium, subscription-based)",
                  "targetAudience": "Apparent target market",
                  "disclaimer": "Verify all details independently - this is AI analysis",
                  "relevanceScore": 0.8,
                  "verificationLevel": "publicly_known"
                }
              ],
              "topLevelDisclaimer": "This competitive analysis is AI-generated. All company information, features, and pricing should be independently verified before making business decisions."
            }`
          },
          {
            role: "user",
            content: `Find existing competitors and solutions ONLY for this specific problem: "${problemStatement}"
            
            STAY ON TOPIC: Only analyze solutions that directly address this exact problem statement.
            
            VERIFICATION REQUIRED: Before including any company or product:
            1. Ensure it actually exists and is publicly known
            2. Confirm it addresses the specific problem mentioned
            3. Use cautious language with verification disclaimers
            4. If unsure about details, indicate this clearly
            
            FOCUS AREAS (only if relevant to the specific problem):
            - Direct competitors solving the same problem
            - Indirect solutions addressing similar pain points
            - Well-documented alternatives customers currently use
            
            DO NOT include generic business tools unless they specifically solve the stated problem.
            INCLUDE verification disclaimers in all descriptions.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      const solutions = result.solutions || [];
      
      // Enhanced validation and filtering for hallucination prevention
      const validatedSolutions = solutions
        .map((solution: any) => {
          // Ensure required disclaimer field exists
          if (!solution.disclaimer) {
            solution.disclaimer = "Verify all details independently - this is AI analysis";
          }
          
          // Add relevance score if missing
          if (!solution.relevanceScore) {
            solution.relevanceScore = 0.5; // Default to medium relevance
          }
          
          // Sanitize pricing to avoid specific currency amounts
          if (solution.pricing && /\$\d+|\€\d+|\£\d+/.test(solution.pricing)) {
            solution.pricing = "Pricing varies - verify current rates independently";
          }
          
          // Ensure uncertainty language in descriptions
          if (solution.description && !/(appears|reportedly|seems|allegedly|apparently|may|might|could)/.test(solution.description.toLowerCase())) {
            solution.description = "Reportedly " + solution.description.toLowerCase();
          }
          
          return solution;
        })
        // Filter by relevance score - only include reasonably relevant solutions
        .filter((solution: any) => solution.relevanceScore >= 0.6)
        // Limit to maximum 5 solutions to prevent information overload
        .slice(0, 5);
      
      // If no solutions pass validation, return framework guidance
      if (validatedSolutions.length === 0) {
        return [
          {
            name: "No Direct Competitors Found",
            description: "AI analysis found no directly comparable solutions for your specific problem. This may indicate a market opportunity, but requires manual research for verification.",
            pros: [
              "Potential first-mover advantage in underserved market",
              "Opportunity to define new solution category",
              "Less direct competition for initial market entry"
            ],
            cons: [
              "Market validation required to confirm demand exists",
              "Higher risk due to unproven market need",
              "Education costs for new solution category"
            ],
            pricing: "Research needed - no comparable pricing models available",
            targetAudience: "Requires customer development to identify precise segments",
            disclaimer: "No verified competitors found. Conduct thorough market research to confirm market gap.",
            relevanceScore: 1.0,
            verificationLevel: "research_required"
          }
        ];
      }
      
      return validatedSolutions;
    } catch (error) {
      console.error('OpenAI existing solutions research failed:', error);
      return [
        {
          name: "Manual Research Framework",
          description: "AI analysis unavailable. Use this framework to research existing solutions for your specific problem. Conduct independent verification of all competitors and solutions.",
          pros: [
            "Direct control over research quality and accuracy",
            "Ability to verify information from primary sources",
            "Comprehensive understanding through hands-on investigation"
          ],
          cons: [
            "Requires significant manual research effort",
            "Time-intensive process",
            "May require access to paid research databases"
          ],
          pricing: "Research tools: G2 (free/paid), Crunchbase (paid), industry reports (varies) - verify current pricing",
          targetAudience: "Entrepreneurs needing verified competitive analysis",
          disclaimer: "AI analysis failed. All information must be independently researched and verified."
        }
      ];
    }
  }

  async generateGoToMarketStrategy(workflowData: WorkflowData): Promise<GoToMarketStrategy> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a go-to-market strategy expert who helps startups create comprehensive marketing strategies for their MVPs. 

            Create a detailed go-to-market strategy based on the provided product development data including problem statement, target customer, use case, product requirements, and prioritized features.

            Respond with JSON in this exact format:
            {
              "targetMarket": {
                "beachhead": "Primary target customer segment with specific demographics",
                "marketSize": {
                  "serviceableMarket": "Size and scope of addressable market",
                  "targetAudience": "Specific target audience size and characteristics",
                  "revenueProjection": "Revenue potential and projections"
                },
                "categoryContext": "Market category and competitive landscape context"
              },
              "valueProposition": {
                "promise": "Core promise to customers",
                "outcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
                "result": "Overall result and benefit"
              },
              "positioning": {
                "statement": "Clear positioning statement",
                "heroMessage": "Main marketing message/tagline",
                "primaryCTAs": ["CTA 1", "CTA 2"]
              },
              "pricing": {
                "tiers": [
                  {
                    "name": "Tier name",
                    "price": "Price point",
                    "features": ["Feature 1", "Feature 2", "Feature 3"]
                  }
                ],
                "rationale": "Pricing strategy rationale and competitive analysis"
              },
              "channels": {
                "acquisition": ["Acquisition channel 1", "Acquisition channel 2"],
                "distribution": ["Distribution channel 1", "Distribution channel 2"]
              },
              "programs": {
                "paid": {
                  "tactics": ["Paid tactic 1", "Paid tactic 2"],
                  "creative": "Creative strategy approach"
                },
                "content": {
                  "tactics": ["Content tactic 1", "Content tactic 2"],
                  "leadMagnets": ["Lead magnet 1", "Lead magnet 2"]
                },
                "institutional": {
                  "tactics": ["Institutional tactic 1", "Institutional tactic 2"]
                },
                "referrals": {
                  "program": "Referral program description",
                  "triggers": ["Trigger 1", "Trigger 2"]
                }
              },
              "timeline": {
                "phases": [
                  {
                    "name": "Phase name",
                    "duration": "Duration",
                    "activities": ["Activity 1", "Activity 2"],
                    "milestones": ["Milestone 1", "Milestone 2"]
                  }
                ]
              },
              "metrics": {
                "acquisition": ["Metric 1", "Metric 2"],
                "activation": ["Metric 1", "Metric 2"],
                "retention": ["Metric 1", "Metric 2"],
                "revenue": ["Metric 1", "Metric 2"],
                "referral": ["Metric 1", "Metric 2"]
              },
              "differentiation": {
                "advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
                "defensibility": "Long-term defensibility strategy"
              }
            }

            Make it actionable, specific, and tailored to the provided product and market data.`
          },
          {
            role: "user",
            content: `Create a comprehensive go-to-market strategy for this MVP:

            Problem: ${workflowData.problemStatement?.refined || workflowData.problemStatement?.original || 'Product development challenge'}
            
            Target Customer: ${workflowData.icp?.name || 'Primary user'} - ${workflowData.icp?.description || 'Target customer profile'}
            
            Market Research: ${workflowData.marketResearch?.findings ? JSON.stringify(workflowData.marketResearch.findings) : 'Market analysis pending'}
            
            Use Case: ${workflowData.useCase?.narrative || 'Core use case scenario'}
            
            Key Features: ${workflowData.prioritization?.features ? workflowData.prioritization.features.slice(0, 5).map(f => f.name).join(', ') : 'Core MVP features'}
            
            Competitive Landscape: ${workflowData.existingSolutions?.solutions ? workflowData.existingSolutions.solutions.slice(0, 3).map(s => s.name).join(', ') : 'Competitive analysis'}

            Create a go-to-market strategy that leverages these insights to successfully launch and scale the MVP.`
          }
        ],
        
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        targetMarket: result.targetMarket || {
          beachhead: "Primary target customer segment to be defined",
          marketSize: {
            serviceableMarket: "Market size analysis pending",
            targetAudience: "Target audience to be researched",
            revenueProjection: "Revenue potential to be calculated"
          },
          categoryContext: "Market category analysis to be completed"
        },
        valueProposition: result.valueProposition || {
          promise: "Core customer promise to be defined",
          outcomes: ["Key outcome 1", "Key outcome 2", "Key outcome 3"],
          result: "Overall customer benefit to be articulated"
        },
        positioning: result.positioning || {
          statement: "Market positioning statement to be developed",
          heroMessage: "Primary marketing message to be crafted",
          primaryCTAs: ["Primary CTA", "Secondary CTA"]
        },
        pricing: result.pricing || {
          tiers: [
            {
              name: "Free",
              price: "$0/month",
              features: ["Basic features", "Limited usage"]
            },
            {
              name: "Pro",
              price: "TBD/month",
              features: ["Advanced features", "Full access"]
            }
          ],
          rationale: "Pricing strategy to be developed based on market analysis"
        },
        channels: result.channels || {
          acquisition: ["Direct digital", "Content marketing"],
          distribution: ["Web platform", "Mobile app"]
        },
        programs: result.programs || {
          paid: {
            tactics: ["Targeted advertising", "Performance marketing"],
            creative: "Creative strategy to be developed"
          },
          content: {
            tactics: ["Blog content", "Educational resources"],
            leadMagnets: ["Free guides", "Templates"]
          },
          institutional: {
            tactics: ["Partnership programs", "B2B outreach"]
          },
          referrals: {
            program: "Referral program to be designed",
            triggers: ["User milestone", "Satisfaction survey"]
          }
        },
        timeline: result.timeline || {
          phases: [
            {
              name: "Pre-launch",
              duration: "4-6 weeks",
              activities: ["Beta testing", "Marketing preparation"],
              milestones: ["Beta completion", "Go-live decision"]
            },
            {
              name: "Launch",
              duration: "2-4 weeks", 
              activities: ["Public launch", "Marketing campaigns"],
              milestones: ["Launch announcement", "First users"]
            }
          ]
        },
        metrics: result.metrics || {
          acquisition: ["Cost per acquisition", "Conversion rate"],
          activation: ["Time to first value", "Onboarding completion"],
          retention: ["Monthly retention", "Usage frequency"],
          revenue: ["Monthly recurring revenue", "Average revenue per user"],
          referral: ["Referral rate", "Viral coefficient"]
        },
        differentiation: result.differentiation || {
          advantages: ["Unique feature 1", "Market positioning", "User experience"],
          defensibility: "Competitive moat strategy to be developed"
        }
      };
    } catch (error) {
      console.error('OpenAI go-to-market strategy generation failed:', error);
      return {
        targetMarket: {
          beachhead: "Primary target customer segment based on research and market analysis",
          marketSize: {
            serviceableMarket: "Addressable market to be quantified through research",
            targetAudience: "Core customer segment identification pending",
            revenueProjection: "Revenue opportunity to be modeled"
          },
          categoryContext: "Competitive landscape positioning to be developed"
        },
        valueProposition: {
          promise: "Deliver measurable value through streamlined processes and improved efficiency",
          outcomes: ["Reduced operational friction", "Improved productivity", "Better user experience"],
          result: "Significant time savings and enhanced customer satisfaction"
        },
        positioning: {
          statement: "Position as an innovative solution addressing specific customer pain points in underserved market",
          heroMessage: "Transform the way you work with intelligent automation",
          primaryCTAs: ["Start Free Trial", "See Demo"]
        },
        pricing: {
          tiers: [
            {
              name: "Free",
              price: "$0/month",
              features: ["Core functionality", "Basic support", "Limited usage"]
            },
            {
              name: "Professional",
              price: "$29/month",
              features: ["Advanced features", "Priority support", "Unlimited usage", "Analytics"]
            },
            {
              name: "Enterprise",
              price: "Custom pricing",
              features: ["All features", "Dedicated support", "Custom integrations", "SLA"]
            }
          ],
          rationale: "Competitive pricing aligned with customer willingness to pay and market standards"
        },
        channels: {
          acquisition: ["Direct digital sales", "Content marketing", "Strategic partnerships"],
          distribution: ["Web platform", "Mobile applications", "API integrations"]
        },
        programs: {
          paid: {
            tactics: ["Google Ads", "LinkedIn campaigns", "Industry publications"],
            creative: "Focus on ROI and efficiency messaging with customer success stories"
          },
          content: {
            tactics: ["SEO-optimized blog", "Industry whitepapers", "Video tutorials"],
            leadMagnets: ["Industry benchmarks", "Best practices guide", "ROI calculator"]
          },
          institutional: {
            tactics: ["Conference sponsorship", "Thought leadership", "Partner programs"]
          },
          referrals: {
            program: "Customer referral program with incentives for both referrer and referred",
            triggers: ["Post-onboarding survey", "Usage milestones", "Renewal notifications"]
          }
        },
        timeline: {
          phases: [
            {
              name: "Pre-launch",
              duration: "4-6 weeks",
              activities: ["Beta testing with select customers", "Marketing asset creation", "Launch preparation"],
              milestones: ["Beta feedback collected", "Marketing campaigns ready", "Go-live decision"]
            },
            {
              name: "Soft Launch",
              duration: "2-4 weeks",
              activities: ["Limited public availability", "Performance monitoring", "Early user feedback"],
              milestones: ["First paying customers", "System stability confirmed", "User feedback analyzed"]
            },
            {
              name: "Full Launch",
              duration: "4-8 weeks",
              activities: ["Marketing campaign execution", "Sales team activation", "Customer success monitoring"],
              milestones: ["Target user acquisition", "Revenue targets", "Customer satisfaction scores"]
            }
          ]
        },
        metrics: {
          acquisition: ["Customer acquisition cost", "Conversion rate", "Traffic to trial ratio"],
          activation: ["Time to first value", "Onboarding completion rate", "Feature adoption"],
          retention: ["Monthly active users", "Churn rate", "Usage frequency"],
          revenue: ["Monthly recurring revenue", "Average revenue per user", "Lifetime value"],
          referral: ["Net promoter score", "Referral rate", "Viral coefficient"]
        },
        differentiation: {
          advantages: ["Superior user experience", "Unique feature combination", "Strong customer support", "Proven ROI"],
          defensibility: "Build network effects and customer lock-in through integrations and data accumulation"
        }
      };
    }
  }

  // Alias method for backwards compatibility  
  async analyzeProblem(problemStatement: string): Promise<ProblemAnalysis & { clarifyingQuestions?: string[] }> {
    return this.analyzeProblemStatement(problemStatement);
  }

  // Generic chat method for custom prompts
  async chat(messages: Array<{ role: string; content: string }>, options?: { format?: 'json' }): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: messages as any,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error('OpenAI chat failed:', error);
      throw error;
    }
  }

  async gradeLearningAttempt(
    stageDef: { id: string; title: string; concept: string; rubric: Array<{ id: string; label: string; description: string }> },
    attempt: Record<string, any>,
    priorContext: Record<string, any>
  ): Promise<{
    overallScore: number;
    criterionScores: Array<{ criterionId: string; score: number; feedback: string }>;
    strengths: string[];
    improvements: string[];
    missingInfoQuestions: string[];
    readyToGenerate: boolean;
  }> {
    try {
      const rubricText = stageDef.rubric.map(c => `- ${c.id}: ${c.label} - ${c.description}`).join('\n');
      const contextText = Object.keys(priorContext).length > 0 
        ? `Prior stage outputs:\n${JSON.stringify(priorContext, null, 2)}`
        : 'No prior context available.';

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product development coach grading a learner's work on "${stageDef.title}".

CONCEPT: ${stageDef.concept}

RUBRIC (grade each 0-3: 0=missing, 1=weak, 2=good, 3=excellent):
${rubricText}

Respond with ONLY valid JSON in this exact format:
{
  "overallScore": <0-100>,
  "criterionScores": [{"criterionId": "...", "score": <0-3>, "feedback": "..."}],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "missingInfoQuestions": ["question 1?"],
  "readyToGenerate": <true if overallScore >= 60>
}

Guidelines:
- Score each criterion 0-3 and provide specific feedback
- Overall score = average of criterion scores mapped to 0-100
- readyToGenerate = true if score >= 60 and no critical gaps
- missingInfoQuestions: max 5 questions to fill gaps
- Be constructive and specific`
          },
          {
            role: "user",
            content: `${contextText}

User's attempt for "${stageDef.title}":
${JSON.stringify(attempt, null, 2)}

Grade this attempt according to the rubric.`
          }
        ]
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      return {
        overallScore: result.overallScore || 50,
        criterionScores: result.criterionScores || stageDef.rubric.map(c => ({ criterionId: c.id, score: 1, feedback: 'Not evaluated' })),
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        missingInfoQuestions: (result.missingInfoQuestions || []).slice(0, 5),
        readyToGenerate: result.readyToGenerate ?? (result.overallScore >= 60)
      };
    } catch (error) {
      console.error('OpenAI grading failed:', error);
      return {
        overallScore: 50,
        criterionScores: stageDef.rubric.map(c => ({ criterionId: c.id, score: 1, feedback: 'Grading unavailable' })),
        strengths: ['Attempt submitted'],
        improvements: ['Unable to grade - please try again'],
        missingInfoQuestions: [],
        readyToGenerate: true
      };
    }
  }

  async generateLearningArtifact(
    stageDef: { id: string; title: string; concept: string; ai_output_spec: Record<string, any> },
    attempt: Record<string, any>,
    grade: { overallScore: number; improvements: string[] } | null,
    priorContext: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const contextText = Object.keys(priorContext).length > 0 
        ? `Prior stage outputs:\n${JSON.stringify(priorContext, null, 2)}`
        : 'No prior context available.';

      const gradeText = grade 
        ? `Grade feedback: Score ${grade.overallScore}/100. Improvements needed: ${grade.improvements.join(', ')}`
        : 'No grade available - generating based on attempt alone.';

      const outputSpecText = JSON.stringify(stageDef.ai_output_spec, null, 2);

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product development expert generating a polished artifact for "${stageDef.title}".

CONCEPT: ${stageDef.concept}

OUTPUT STRUCTURE (follow this exactly):
${outputSpecText}

Respond with ONLY valid JSON matching the output structure above.

Guidelines:
- Build on the user's attempt but improve and expand it
- Include a "learningNotes" field explaining what you changed and why
- Be specific, actionable, and evidence-based
- Reference prior stage outputs where relevant`
          },
          {
            role: "user",
            content: `${contextText}

${gradeText}

User's attempt:
${JSON.stringify(attempt, null, 2)}

Generate the polished artifact for "${stageDef.title}".`
          }
        ]
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      if (!result.learningNotes) {
        result.learningNotes = "AI-generated artifact based on your input. Review and customize as needed.";
      }
      
      return result;
    } catch (error) {
      console.error('OpenAI artifact generation failed:', error);
      return {
        error: 'Generation failed',
        learningNotes: 'Unable to generate artifact. Please try again.',
        ...attempt
      };
    }
  }

  async gradeAndGenerateLearningStage(
    stageDef: { 
      id: string; 
      title: string; 
      concept: string; 
      rubric: Array<{ id: string; label: string; description: string }>;
      ai_output_spec: Record<string, any>;
    },
    attempt: Record<string, any>,
    priorContext: Record<string, any>
  ): Promise<{
    grade: {
      overallScore: number;
      criterionScores: Array<{ criterionId: string; score: number; feedback: string }>;
      strengths: string[];
      improvements: string[];
      missingInfoQuestions: string[];
      readyToGenerate: boolean;
    };
    artifact: Record<string, any>;
  }> {
    try {
      const rubricText = stageDef.rubric.map(c => `- ${c.id}: ${c.label} - ${c.description}`).join('\n');
      const contextText = Object.keys(priorContext).length > 0 
        ? `Prior stage outputs:\n${JSON.stringify(priorContext, null, 2)}`
        : 'No prior context available.';
      const outputSpecText = JSON.stringify(stageDef.ai_output_spec, null, 2);

      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are a product development coach. You MUST respond ONLY in English. Grade the learner's work AND generate a polished artifact for "${stageDef.title}".

CONCEPT: ${stageDef.concept}

RUBRIC (grade each 0-3: 0=missing, 1=weak, 2=good, 3=excellent):
${rubricText}

ARTIFACT OUTPUT STRUCTURE:
${outputSpecText}

Respond with ONLY valid JSON in this exact format:
{
  "grade": {
    "overallScore": <0-100>,
    "criterionScores": [{"criterionId": "...", "score": <0-3>, "feedback": "..."}],
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1"],
    "missingInfoQuestions": ["question 1?"],
    "readyToGenerate": true
  },
  "artifact": {
    // ... fields matching the artifact output structure above
    "learningNotes": "Explanation of improvements made"
  }
}

Guidelines:
- ALWAYS respond in English regardless of the input language
- Grade each rubric criterion 0-3 with specific feedback
- Overall score = average of criterion scores mapped to 0-100
- readyToGenerate = true if score >= 60
- Build on user's attempt but improve and expand it
- Be specific, actionable, evidence-based`
          },
          {
            role: "user",
            content: `${contextText}

User's attempt for "${stageDef.title}":
${JSON.stringify(attempt, null, 2)}

Grade this attempt and generate the polished artifact.`
          }
        ]
      });

      const result = extractJSON(response.choices[0].message.content || "{}");
      
      if (!result.grade) {
        result.grade = {
          overallScore: 60,
          criterionScores: [],
          strengths: ['Attempt submitted'],
          improvements: ['Add more detail'],
          missingInfoQuestions: [],
          readyToGenerate: true
        };
      }
      
      if (!result.artifact) {
        result.artifact = { ...attempt, learningNotes: 'Generated based on your input.' };
      }
      
      if (!result.artifact.learningNotes) {
        result.artifact.learningNotes = 'AI-generated artifact based on your input.';
      }
      
      return result;
    } catch (error) {
      console.error('OpenAI combined grade/generate failed:', error);
      return {
        grade: {
          overallScore: 50,
          criterionScores: [],
          strengths: ['Attempt submitted'],
          improvements: ['Please try again'],
          missingInfoQuestions: [],
          readyToGenerate: true
        },
        artifact: { ...attempt, learningNotes: 'Generation encountered an issue. Please try again.' }
      };
    }
  }
}

export const openaiService = new OpenAIService();
