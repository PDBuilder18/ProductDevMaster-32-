export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  estimatedTime: string;
  completed: boolean;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "Problem Definition",
    description: "Define your problem.",
    estimatedTime: "3-5 min",
    completed: false,
  },
  {
    id: 2,
    title: "Market Research",
    description: "Research the market",
    estimatedTime: "5-10 min",
    completed: false,
  },
  {
    id: 3,
    title: "Root Cause",
    description: "Find root causes",
    estimatedTime: "3-5 min",
    completed: false,
  },
  {
    id: 4,
    title: "Existing Solutions",
    description: "Analyze competitors",
    estimatedTime: "5-8 min",
    completed: false,
  },
  {
    id: 5,
    title: "Customer Profile",
    description: "Create ideal customer",
    estimatedTime: "4-6 min",
    completed: false,
  },
  {
    id: 6,
    title: "Use Case",
    description: "Define usage scenario",
    estimatedTime: "4-7 min",
    completed: false,
  },
  {
    id: 7,
    title: "Requirements",
    description: "List product features",
    estimatedTime: "5-10 min",
    completed: false,
  },
  {
    id: 8,
    title: "Prioritization",
    description: "Prioritize MVP features",
    estimatedTime: "3-5 min",
    completed: false,
  },
  {
    id: 9,
    title: "Export Document",
    description: "Generate MVP document",
    estimatedTime: "1-2 min",
    completed: false,
  },
  {
    id: 10,
    title: "Feedback",
    description: "Share your experience",
    estimatedTime: "1-2 min",
    completed: false,
  },
];
