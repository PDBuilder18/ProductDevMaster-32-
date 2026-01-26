export type LearningStageId =
  | "think-like-a-founder"
  | "problem-definition"
  | "market-research"
  | "root-cause"
  | "existing-solutions"
  | "customer-profile"
  | "use-case"
  | "requirements"
  | "prioritization"
  | "export-document"
  | "feedback";

export type FieldType = "shortText" | "longText" | "number" | "select" | "multi" | "links";

export interface RequiredField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  minChars?: number;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
}

export interface StageDef {
  id: LearningStageId;
  title: string;
  concept: string;
  coreConceptDescription?: string;
  example_good: string;
  example_bad: string;
  required_fields: RequiredField[];
  rubric: RubricCriterion[];
  ai_output_spec: Record<string, any>;
  depends_on?: LearningStageId[];
}

export interface StageAttempt {
  [fieldId: string]: string | string[] | number;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
  feedback: string;
}

export interface StageGrade {
  overallScore: number;
  criterionScores: CriterionScore[];
  strengths: string[];
  improvements: string[];
  missingInfoQuestions: string[];
  readyToGenerate: boolean;
}

export interface StageArtifact {
  [key: string]: any;
  learningNotes: string;
}

export interface LearningStageState {
  attempt?: StageAttempt;
  grade?: StageGrade;
  artifact?: StageArtifact;
  status: "not-started" | "attempted" | "graded" | "generated" | "mastered";
  attemptedAt?: number;
  gradedAt?: number;
  generatedAt?: number;
  masteredAt?: number;
  version: number;
}

export interface LearningData {
  [stageId: string]: LearningStageState;
}

export const LEARNING_STAGES: StageDef[] = [
  {
    id: "think-like-a-founder",
    title: "Think Like A Founder",
    concept:
      "Before we start — let's reset.\n\nIf you're feeling unsure right now, that's normal.\nMost founders don't fail because they can't build — they fail because they build the wrong thing first.\n\nThis sprint won't give you ideas.\nIt will help you decide what's worth building — and what to ignore — step by step.\n\nYou don't need perfect answers.\nYou just need to be honest.",
    coreConceptDescription:
      "You can't fail this. You can only get clearer.",
    example_bad:
      "I have everything figured out already.",
    example_good:
      "I'm uncertain about my direction, but I'm ready to think through it honestly.",
    required_fields: [
      { id: "mindset", label: "What best describes you right now?", type: "select", required: true, options: ["I have an idea but don't know where to start", "I'm worried I'm building the wrong thing", "I already started building and feel uncertain"] },
    ],
    rubric: [
      { id: "honesty", label: "Honesty", description: "Reflects genuine self-awareness about current state." },
    ],
    ai_output_spec: {
      mindsetAcknowledgment: "string",
      encouragement: "string",
      learningNotes: "string",
    },
  },

  {
    id: "problem-definition",
    title: "Problem Definition",
    concept:
      "Most first-time founders fail before they build anything — because they define problems too vaguely or too broadly. That leads to features no one urgently needs. A strong problem definition does three things: names a specific person who is struggling, describes the moment they feel the pain, and explains what breaks if nothing changes. If this feels hard, that's normal. Clarity comes from narrowing, not knowing everything upfront.",
    coreConceptDescription:
      "You're not here to write the perfect problem statement.\nYou're here to stop guessing what's actually worth building.\n\nMost first-time founders fail before they build anything — because they define problems too vaguely or too broadly. That leads to features no one urgently needs.\n\nA strong problem definition does three things:\n\nNames a specific person who is struggling\n\nDescribes the moment they feel the pain\n\nExplains what breaks if nothing changes\n\nIf this feels hard, that's normal.\nClarity comes from narrowing, not knowing everything upfront.",
    example_bad:
      "We need an app to help people manage tasks better.",
    example_good:
      "Remote startup product teams miss sprint commitments because ownership of decisions is unclear across Slack + docs, causing 2–3 rework loops per sprint and delaying releases by 1–2 weeks.",
    required_fields: [
      { id: "targetUser", label: "Target user (role + context)", type: "shortText", required: true, minChars: 10 },
      { id: "context", label: "When/where does the problem occur?", type: "longText", required: true, minChars: 30 },
      { id: "pain", label: "What goes wrong (symptom)?", type: "longText", required: true, minChars: 30 },
      { id: "consequence", label: "Consequence (time/cost/risk)", type: "longText", required: true, minChars: 20 },
      { id: "workaround", label: "Current workaround", type: "longText", required: true, minChars: 20 },
      { id: "proofSignals", label: "Proof signals you've seen (data/examples)", type: "longText", required: true, minChars: 20 },
      { id: "antiSolution", label: "Describe it without proposing a product/feature", type: "shortText", required: true, minChars: 20 },
    ],
    rubric: [
      { id: "specificity", label: "Specificity", description: "Clear who/when/what; avoids generic phrasing." },
      { id: "userCentered", label: "User-centered", description: "Focuses on user pain vs your idea/solution." },
      { id: "measurable", label: "Measurable impact", description: "Has observable consequences or metrics." },
      { id: "evidence", label: "Evidence signals", description: "Includes proof signals or credible observations." },
      { id: "scope", label: "Scope clarity", description: "Not too broad; one core problem." },
    ],
    ai_output_spec: {
      problemStatement: "string",
      successMetrics: ["string"],
      assumptions: ["string"],
      clarifyingQuestions: ["string"],
      risksIfWrong: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "market-research",
    title: "Market Research",
    concept:
      "Market research is evidence gathering—not idea validation.\n\nAt this stage, you're not trying to prove your solution is better.\nYou're mapping the real landscape your user already lives in:\n\nWhat alternatives exist (tools, workarounds, \"do nothing\")\n\nWhat users like and hate about them\n\nWhat signals show people are willing to pay\n\nStrong market research helps you avoid building in a vacuum and reveals where real opportunities exist.",
    coreConceptDescription:
      "Market research is about understanding behavior, not opinions.\n\nYou are looking for:\n\nDirect competitors (tools that try to solve the same job)\n\nSubstitutes (tools or processes users rely on instead)\n\nStatus quo (manual work, spreadsheets, Slack, \"just deal with it\")\n\nEvidence signals (complaints, pricing patterns, adoption behavior)\n\nYour goal is to identify patterns, not compile a long list.\n\nYou're mapping the terrain—not arguing that your idea should win.",
    example_bad:
      "Competitors exist but our solution is better.",
    example_good:
      "Direct competitors: X/Y/Z; substitutes: spreadsheets/Slack; repeated complaints: handoffs + ownership; buyers pay when cycle-time reduction is provable.",
    required_fields: [
      { id: "competitors", label: "Three direct competitors (names)", type: "multi", required: true },
      { id: "substitutes", label: "Three substitutes/workarounds", type: "multi", required: true },
      { id: "likes", label: "What users like about existing options (bullets)", type: "longText", required: true, minChars: 40 },
      { id: "gaps", label: "What users hate/miss (bullets)", type: "longText", required: true, minChars: 40 },
      { id: "sources", label: "Where did you find this? (links/notes)", type: "links", required: false },
      { id: "winHypothesis", label: "Your differentiation hypothesis: 'We win by ___ for ___'", type: "shortText", required: true, minChars: 20 },
      { id: "permissionToSearch", label: "Allow AI to do web-style search using your search service?", type: "select", required: true, options: ["yes", "no"] },
    ],
    rubric: [
      { id: "coverage", label: "Coverage", description: "Includes competitors + substitutes + status quo." },
      { id: "insight", label: "Insight quality", description: "Identifies patterns, not a list." },
      { id: "evidence", label: "Evidence", description: "Mentions where insights came from." },
      { id: "positioning", label: "Positioning clarity", description: "Clear 'we win by' hypothesis." },
      { id: "realism", label: "Realism", description: "Avoids unsupported claims." },
    ],
    depends_on: ["problem-definition"],
    ai_output_spec: {
      competitorTable: [{ name: "string", type: "direct|adjacent|substitute", strengths: ["string"], weaknesses: ["string"], likelyBuyer: "string", pricingNotes: "string" }],
      keyPatterns: ["string"],
      differentiationOptions: ["string"],
      researchGaps: ["string"],
      nextResearchTasks: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "root-cause",
    title: "Root Cause",
    concept:
      "Symptoms aren't causes. Root causes explain why the problem keeps happening.\n\nA root cause describes the mechanism behind the pain, not just what people complain about.\n\nIf you stop at symptoms, you'll build surface-level fixes, treat the wrong problem, and recreate the same failure in a different form.\n\nStrong founders learn to ask why—until the answer becomes testable.",
    coreConceptDescription:
      "A root cause explains how the problem is produced, not just that it exists.\n\nGood root cause analysis:\n\nGoes beyond labels like \"poor communication\"\n\nExplains the process, incentives, constraints, or missing information\n\nConnects directly to the original problem\n\nIncludes a disproof signal (what would prove you wrong)\n\nA simple way to get there is 5 Whys, but the goal isn't depth for its own sake—it's clarity you can test.\n\nIf you can't explain how the problem happens, you can't design a solution that holds.",
    example_bad:
      "Root cause is poor communication.",
    example_good:
      "Root cause: decision ownership + evidence rules are missing; teams build on assumptions, creating rework loops.",
    required_fields: [
      { id: "topSymptom", label: "Top symptom (one sentence)", type: "shortText", required: true, minChars: 15 },
      { id: "fiveWhys", label: "5 Whys (5 bullets)", type: "longText", required: true, minChars: 50 },
      { id: "contributors", label: "People/Process/Tools/Data contributors (bullets)", type: "longText", required: true, minChars: 50 },
      { id: "rootCauseCandidate", label: "Root cause candidate + why (2–3 sentences)", type: "longText", required: true, minChars: 40 },
      { id: "disproof", label: "What would disprove this root cause?", type: "longText", required: true, minChars: 20 },
    ],
    rubric: [
      { id: "mechanism", label: "Mechanism", description: "Explains how/why the symptom happens." },
      { id: "depth", label: "Depth", description: "Goes beyond surface labels (e.g., 'communication')." },
      { id: "testability", label: "Testability", description: "Includes disproof/validation thinking." },
      { id: "alignment", label: "Alignment", description: "Ties back to original problem." },
      { id: "clarity", label: "Clarity", description: "Readable, structured reasoning." },
    ],
    depends_on: ["problem-definition"],
    ai_output_spec: {
      rootCauseTree: { 
        nodes: [{ id: "string", label: "string", type: "symptom|why|root|contributor" }], 
        links: [{ from: "string", to: "string", label: "string" }] 
      },
      leveragePoints: ["string"],
      validationTests: ["string"],
      risksIfWrong: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "existing-solutions",
    title: "Existing Solutions",
    concept:
      "You don't just compete with products—you compete with how people already cope.\n\nExisting solutions include tools that try to solve the problem, adjacent tools that partially help, DIY workarounds, and doing nothing and living with the pain.\n\nUnderstanding these options shows why the problem still exists and where real opportunity lies.",
    coreConceptDescription:
      "You compete with products and the status quo.\n\nStrong existing-solutions analysis maps:\n\nDirect options (tools built for this job)\n\nAdjacent options (tools repurposed to help)\n\nDIY workarounds (spreadsheets, docs, Slack threads)\n\nDoing nothing (manual effort, tolerance, avoidance)\n\nFor each, you identify why it fails for your ICP—not why it's bad in general.\n\nOpportunity lives where existing solutions consistently break down.",
    example_bad:
      "Competitors are bad and we're better.",
    example_good:
      "Teams choose spreadsheets because it's free; it fails at cross-team dependency visibility, so ownership breaks down.",
    required_fields: [
      { id: "solutions", label: "5 solutions: 2 competitors, 1 adjacent, 1 DIY, 1 status quo", type: "longText", required: true, minChars: 80 },
      { id: "whyChosen", label: "Why people choose them (bullets)", type: "longText", required: true, minChars: 40 },
      { id: "failureModes", label: "Where they break down (bullets)", type: "longText", required: true, minChars: 40 },
      { id: "opportunity", label: "Opportunity statement: 'Build X for Y because Z'", type: "shortText", required: true, minChars: 25 },
    ],
    rubric: [
      { id: "completeness", label: "Completeness", description: "Includes DIY + status quo, not only competitors." },
      { id: "failureAnalysis", label: "Failure analysis", description: "Explains why solutions fail, not just that they do." },
      { id: "specificity", label: "Specificity", description: "Concrete breakdown points." },
      { id: "opportunity", label: "Opportunity clarity", description: "Clear X/Y/Z statement." },
      { id: "requirementsSignal", label: "Signals requirements", description: "Implies must-have constraints/features." },
    ],
    depends_on: ["market-research", "root-cause"],
    ai_output_spec: {
      solutionMap: [{ name: "string", category: "direct|adjacent|diy|statusquo", whyChosen: ["string"], failureModes: ["string"] }],
      failurePatterns: ["string"],
      mustHaveRequirements: ["string"],
      doNotBuildYet: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "customer-profile",
    title: "Customer Profile",
    concept:
      "Your customer profile defines who buys and why now.\n\nA customer profile (ICP) is not a demographic description.\nIt explains who feels the problem strongly enough to act, and what conditions make buying possible today.\n\nIf this step is vague, everything downstream—use cases, requirements, MVP scope—becomes guesswork.",
    coreConceptDescription:
      "An ICP describes buying reality, not just user characteristics.\n\nA strong customer profile includes:\n\nWho buys (role and context)\n\nWhy now (the trigger that creates urgency)\n\nConstraints (budget, time, authority, tool fatigue)\n\nDecision process (who decides, who influences)\n\nSuccess definition (what \"better\" looks like in practice)\n\nThe goal is not to be inclusive—it's to be precise.",
    example_bad:
      "Our customer is anyone who needs productivity.",
    example_good:
      "Buyer: Head of Product at 20–100 person remote SaaS; trigger: scaling teams; constraint: tool fatigue; success: shorter cycle time.",
    required_fields: [
      { id: "buyerUser", label: "Buyer role vs end user role", type: "shortText", required: true, minChars: 15 },
      { id: "companyProfile", label: "Company type + size", type: "shortText", required: true, minChars: 10 },
      { id: "trigger", label: "Trigger event (why now)", type: "longText", required: true, minChars: 20 },
      { id: "topPains", label: "Top 3 pains", type: "longText", required: true, minChars: 30 },
      { id: "constraints", label: "Constraints (budget/time/compliance)", type: "longText", required: true, minChars: 20 },
      { id: "decisionProcess", label: "How they decide + stakeholders", type: "longText", required: true, minChars: 25 },
    ],
    rubric: [
      { id: "targeting", label: "Targeting precision", description: "Clear who; not 'everyone'." },
      { id: "whyNow", label: "Why now", description: "Trigger is credible and specific." },
      { id: "buying", label: "Buying reality", description: "Mentions decision process & objections." },
      { id: "pain", label: "Pain depth", description: "Pains are concrete and tied to outcomes." },
      { id: "constraints", label: "Constraints", description: "Realistic constraints included." },
    ],
    depends_on: ["problem-definition", "existing-solutions"],
    ai_output_spec: {
      primaryICP: { summary: "string", triggers: ["string"], jobsToBeDone: ["string"], pains: ["string"], objections: ["string"], channels: ["string"] },
      secondaryICP: { summary: "string", triggers: ["string"], pains: ["string"] },
      messagingHooks: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "use-case",
    title: "Use Case",
    concept:
      "Use cases turn intent into behavior.\n\nA use case is a repeatable story that shows:\n\nwho is acting,\n\nwhat they're trying to achieve,\n\nthe steps they take,\n\nand what success looks like.\n\nIf your use case is vague, your product requirements will be vague too.",
    coreConceptDescription:
      "Use cases describe real behavior, not features.\n\nA strong use case includes:\n\nActor (who is doing this)\n\nGoal (what they want to accomplish)\n\nSteps (what they do, in order)\n\nSuccess criteria (how they know it worked)\n\nEdge cases (what could go wrong)\n\nUse cases help translate a problem and buyer into something buildable.\n\nIf you can't tell the story step-by-step, the product will feel unclear.",
    example_bad:
      "User uses the app to solve the problem.",
    example_good:
      "As a product lead, I log a blocked decision, assign an owner + due date, attach evidence, and review the top 3 each week to prevent drift.",
    required_fields: [
      { id: "actorGoal", label: "Primary actor + goal", type: "longText", required: true, minChars: 30 },
      { id: "preconditions", label: "Preconditions/assumptions", type: "longText", required: true, minChars: 20 },
      { id: "steps", label: "Primary flow (6–10 steps)", type: "longText", required: true, minChars: 60 },
      { id: "success", label: "Success outcome", type: "longText", required: true, minChars: 20 },
      { id: "edgeCases", label: "Edge cases (3)", type: "longText", required: true, minChars: 30 },
      { id: "timeToValue", label: "Time to value target", type: "shortText", required: true, minChars: 5 },
    ],
    rubric: [
      { id: "flow", label: "Flow completeness", description: "Clear steps with cause/effect." },
      { id: "testability", label: "Testability", description: "Success and edge cases are measurable." },
      { id: "realism", label: "Realism", description: "Steps match real user behavior." },
      { id: "scope", label: "Scope discipline", description: "Not trying to do everything." },
      { id: "alignment", label: "Alignment", description: "Matches ICP + problem + root cause." },
    ],
    depends_on: ["customer-profile"],
    ai_output_spec: {
      narrative: "string",
      primaryFlow: ["string"],
      alternateFlows: ["string"],
      dataInputsOutputs: [{ step: "string", inputs: ["string"], outputs: ["string"] }],
      mvpSlice: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "requirements",
    title: "Requirements",
    concept:
      "Requirements turn stories into something you can actually build.\n\nRequirements define what must be true for the use case to work.\nThey remove ambiguity and force precision—so builders, reviewers, and users all agree on what \"done\" means.\n\nIf requirements are vague, execution drifts and validation becomes impossible.",
    coreConceptDescription:
      "Good requirements are testable statements, not aspirations.\n\nEach requirement should:\n\nBe clear and unambiguous\n\nInclude acceptance criteria\n\nAvoid vague words like \"easy,\" \"fast,\" \"intuitive\" without metrics\n\nTie directly back to a specific use case\n\nRequirements can be functional or non-functional—but every one must be verifiable.\n\nIf you can't test it, it isn't a requirement.",
    example_bad:
      "The system should be user-friendly and fast.",
    example_good:
      "User must assign a decision owner + due date; overdue decisions appear in weekly review; owner is required.",
    required_fields: [
      { id: "functional", label: "5 functional requirements (bullets)", type: "longText", required: true, minChars: 60 },
      { id: "nonFunctional", label: "3 non-functional requirements", type: "longText", required: true, minChars: 30 },
      { id: "tests", label: "How would you test each? (one line each)", type: "longText", required: true, minChars: 40 },
      { id: "constraints", label: "Constraints (tech/legal/business)", type: "longText", required: false },
    ],
    rubric: [
      { id: "testable", label: "Testable", description: "Can verify each requirement." },
      { id: "coverage", label: "Coverage", description: "Functional + non-functional included." },
      { id: "clarity", label: "Clarity", description: "Unambiguous wording." },
      { id: "traceability", label: "Traceability", description: "Ties back to use case." },
      { id: "scope", label: "Scope", description: "Not bloated; distinguishes must vs nice-to-have." },
    ],
    depends_on: ["use-case"],
    ai_output_spec: {
      functionalRequirements: [{ id: "string", statement: "string", acceptanceCriteria: ["string"] }],
      nonFunctionalRequirements: [{ id: "string", statement: "string", metric: "string" }],
      outOfScope: ["string"],
      openQuestions: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "prioritization",
    title: "Prioritization",
    concept:
      "Prioritization is about choosing what creates learning fastest.\n\nYou never have unlimited time, money, or attention.\nPrioritization forces trade-offs so your MVP delivers maximum validation with minimal build.\n\nThis step defines what you will build now—and what you intentionally won't.",
    coreConceptDescription:
      "Prioritization is decision-making under constraints.\n\nStrong prioritization:\n\nFocuses on learning and value, not what's \"cool\"\n\nExplicitly defines the MVP boundary\n\nAcknowledges real limits (time, team, budget)\n\nUses a consistent method (RICE, MoSCoW, etc.)\n\nAn MVP is not the smallest product—it's the smallest learning system.",
    example_bad:
      "We will build all features that users want.",
    example_good:
      "MVP: ownership + due dates + weekly review + export memo. Defer integrations and dashboards.",
    required_fields: [
      { id: "features", label: "List 10 candidate features", type: "longText", required: true, minChars: 80 },
      { id: "method", label: "Method", type: "select", required: true, options: ["MoSCoW", "RICE"] },
      { id: "constraints", label: "Constraint (time/budget/team) + limit", type: "shortText", required: true, minChars: 10 },
      { id: "mvpMustHaves", label: "Your MVP must-haves (3)", type: "longText", required: true, minChars: 20 },
      { id: "defer", label: "What you will NOT build now (kill list)", type: "longText", required: true, minChars: 20 },
    ],
    rubric: [
      { id: "tradeoffs", label: "Trade-offs", description: "Clear MVP boundary and kill list." },
      { id: "method", label: "Method use", description: "Uses RICE/MoSCoW consistently." },
      { id: "constraints", label: "Constraint realism", description: "Matches stated limits." },
      { id: "learning", label: "Learning value", description: "MVP maximizes validation speed." },
      { id: "coherence", label: "Coherence", description: "Aligns with requirements/use case." },
    ],
    depends_on: ["requirements"],
    ai_output_spec: {
      prioritizationTable: [{ feature: "string", score: "number", bucket: "Must|Should|Could|Wont", rationale: "string" }],
      mvpBoundary: { buildNow: ["string"], notNow: ["string"] },
      phasedRoadmap: { mvp: ["string"], v1: ["string"] },
      keyRisks: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "export-document",
    title: "MVP Requirements",
    concept:
      "MVP Requirements turn your thinking into a shareable, build-ready artifact.\n\nThis document is the culmination of your work so far.\nIt translates your problem, evidence, customer, and decisions into a clear MVP brief that others can understand, critique, and execute against.\n\nIf this artifact is unclear, alignment breaks immediately.",
    coreConceptDescription:
      "MVP Requirements are a teachable artifact, not a feature list.\n\nA strong MVP Requirements document:\n\nTells a coherent story from problem → evidence → buyer → behavior → scope\n\nClearly distinguishes facts vs assumptions\n\nDefines the MVP boundary\n\nStates risks and next validation steps\n\nThis is what you hand to a mentor, investor, or engineer and say:\n\"Here's what we're building—and why.\"",
    example_bad:
      "Here is our idea and some features.",
    example_good:
      "A 2–5 page MVP brief with clear assumptions, risks, MVP boundary, and next validation steps.",
    required_fields: [
      { id: "audience", label: "Audience", type: "select", required: true, options: ["Founder", "Team", "Investor"] },
      { id: "format", label: "Format", type: "select", required: true, options: ["Markdown", "DOCX", "PDF"] },
      { id: "sections", label: "Must-include sections (choose 5–7)", type: "longText", required: true, minChars: 30 },
      { id: "tone", label: "Tone", type: "select", required: true, options: ["Concise", "Detailed"] },
    ],
    rubric: [
      { id: "structure", label: "Structure", description: "Sections fit audience and tell a coherent story." },
      { id: "completeness", label: "Completeness", description: "Includes MVP boundary + assumptions." },
      { id: "clarity", label: "Clarity", description: "Readable and actionable." },
      { id: "evidence", label: "Evidence posture", description: "Distinguishes facts vs assumptions." },
      { id: "nextSteps", label: "Next steps", description: "Clear validation plan." },
    ],
    depends_on: ["prioritization"],
    ai_output_spec: {
      executiveSummary: "string",
      documentMarkdown: "string",
      assumptionsAppendix: ["string"],
      nextActions: ["string"],
      learningNotes: "string",
    },
  },

  {
    id: "feedback",
    title: "Founder Mode",
    concept:
      "Founder Mode is where learning turns into leverage.\n\nThis step closes the loop.\nIt forces you to step back, assess your thinking honestly, and decide what to do next.\n\nFounders who skip this step repeat the same mistakes.\nFounders who do it well compound learning across every product they build.",
    coreConceptDescription:
      "Founder Mode converts a project into a repeatable skill.\n\nStrong reflection focuses on:\n\nWhat was strong\n\nWhat was weak\n\nWhat evidence is missing\n\nWhat you'll do next\n\nThe goal isn't perfection — it's self-awareness with action.\n\nProgress accelerates when founders are honest with themselves.",
    example_bad:
      "Looks good.",
    example_good:
      "Strong: clear problem and ICP; Weak: root cause not validated; Missing: customer interview quotes; Next: 3 interviews before finalizing requirements.",
    required_fields: [
      { id: "strengths", label: "Top 3 strengths of your work", type: "longText", required: true, minChars: 30 },
      { id: "weaknesses", label: "Top 3 weaknesses or gaps", type: "longText", required: true, minChars: 30 },
      { id: "missingEvidence", label: "What evidence is still missing?", type: "longText", required: true, minChars: 20 },
      { id: "nextSteps", label: "What will you do next to validate?", type: "longText", required: true, minChars: 20 },
      { id: "learnings", label: "What did you learn from this process?", type: "longText", required: true, minChars: 30 },
    ],
    rubric: [
      { id: "selfAwareness", label: "Self-awareness", description: "Honest about weaknesses." },
      { id: "actionability", label: "Actionability", description: "Next steps are concrete." },
      { id: "evidenceGaps", label: "Evidence gaps", description: "Identifies what's missing." },
      { id: "reflection", label: "Reflection", description: "Shows learning from the process." },
      { id: "improvement", label: "Improvement plan", description: "Clear path forward." },
    ],
    depends_on: ["export-document"],
    ai_output_spec: {
      overallAssessment: "string",
      strengthsAnalysis: ["string"],
      weaknessesAnalysis: ["string"],
      validationPlan: ["string"],
      skillsGained: ["string"],
      recommendedResources: ["string"],
      learningNotes: "string",
    },
  },
];

export function getStageById(stageId: LearningStageId): StageDef | undefined {
  return LEARNING_STAGES.find(s => s.id === stageId);
}

export function getStageIndex(stageId: LearningStageId): number {
  return LEARNING_STAGES.findIndex(s => s.id === stageId);
}

export function getNextStage(stageId: LearningStageId): LearningStageId | null {
  const idx = getStageIndex(stageId);
  if (idx === -1 || idx >= LEARNING_STAGES.length - 1) return null;
  return LEARNING_STAGES[idx + 1].id;
}

export function getPreviousStage(stageId: LearningStageId): LearningStageId | null {
  const idx = getStageIndex(stageId);
  if (idx <= 0) return null;
  return LEARNING_STAGES[idx - 1].id;
}

export function minAttemptSatisfied(stageId: LearningStageId, attempt: StageAttempt | undefined): boolean {
  if (!attempt) return false;
  
  const stage = getStageById(stageId);
  if (!stage) return false;
  
  const vals = Object.values(attempt);
  let filledCount = 0;
  let totalChars = 0;
  
  for (const val of vals) {
    if (Array.isArray(val)) {
      if (val.length > 0) {
        filledCount++;
        totalChars += val.join(' ').length;
      }
    } else if (typeof val === 'string' && val.trim().length > 0) {
      filledCount++;
      totalChars += val.length;
    } else if (typeof val === 'number') {
      filledCount++;
      totalChars += String(val).length;
    }
  }
  
  return filledCount >= 4 || totalChars >= 160;
}

export function validateAttempt(stageId: LearningStageId, attempt: StageAttempt): { valid: boolean; errors: string[] } {
  const stage = getStageById(stageId);
  if (!stage) return { valid: false, errors: ['Stage not found'] };
  
  const errors: string[] = [];
  
  for (const field of stage.required_fields) {
    if (!field.required) continue;
    
    const value = attempt[field.id];
    
    if (value === undefined || value === null) {
      errors.push(`${field.label} is required`);
      continue;
    }
    
    if (typeof value === 'string') {
      if (value.trim().length === 0) {
        errors.push(`${field.label} is required`);
      } else if (field.minChars && value.length < field.minChars) {
        errors.push(`${field.label} must be at least ${field.minChars} characters`);
      }
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push(`${field.label} is required`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function buildStageContext(stageId: LearningStageId, learningData: LearningData): Record<string, StageArtifact> {
  const stage = getStageById(stageId);
  if (!stage) return {};
  
  const context: Record<string, StageArtifact> = {};
  const dependencies = stage.depends_on || [];
  
  for (const depId of dependencies) {
    const depState = learningData[depId];
    if (depState?.artifact) {
      context[depId] = depState.artifact;
    }
  }
  
  return context;
}

export function canAccessStage(stageId: LearningStageId, learningData: LearningData): { canAccess: boolean; blockedBy: LearningStageId[] } {
  const stage = getStageById(stageId);
  if (!stage) return { canAccess: false, blockedBy: [] };
  
  if (!stage.depends_on || stage.depends_on.length === 0) {
    return { canAccess: true, blockedBy: [] };
  }
  
  const blockedBy: LearningStageId[] = [];
  
  for (const depId of stage.depends_on) {
    const depState = learningData[depId];
    if (!depState || depState.status === 'not-started' || depState.status === 'attempted') {
      blockedBy.push(depId);
    }
  }
  
  return { canAccess: blockedBy.length === 0, blockedBy };
}

export function getSafeStagesForUI(): Omit<StageDef, 'ai_output_spec'>[] {
  return LEARNING_STAGES.map(({ ai_output_spec, ...rest }) => rest);
}
