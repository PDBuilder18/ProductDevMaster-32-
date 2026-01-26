import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { nanoid } from "nanoid";

// Types for Five Whys Analysis
export interface FiveWhysWhy {
  question: string;
  answer: string;
  level: number;
}

export interface FiveWhysActionItem {
  action: string;
  priority: "high" | "medium" | "low";
  owner?: string;
}

export interface FiveWhysAnalysis {
  problem_statement: string;
  analysis_id?: string;
  created_at?: string;
  whys: FiveWhysWhy[];
  root_cause: string;
  action_items?: FiveWhysActionItem[];
}

// Graph types for visualization
export interface GraphNode {
  id: string;
  label: string;
  type: "problem" | "why" | "root_cause" | "action";
  level?: number;
  priority?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface GraphView {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// JSON Schema validation
export function createValidator(schema: any): ValidateFunction {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

export function validateFiveWhys(data: any, schema?: any): FiveWhysAnalysis {
  if (schema) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    
    if (!validate(data)) {
      const errors = validate.errors?.map(err => 
        `${err.instancePath || 'root'}: ${err.message}`
      ).join(', ') || 'Unknown validation error';
      throw new Error(`Validation failed: ${errors}`);
    }
  }

  // Additional business logic validation
  const analysis = data as FiveWhysAnalysis;
  
  // Ensure whys are properly ordered
  const levels = analysis.whys.map(w => w.level).sort((a, b) => a - b);
  for (let i = 0; i < levels.length; i++) {
    if (levels[i] !== i + 1) {
      throw new Error(`Invalid why levels: expected sequential levels starting from 1, got ${levels.join(', ')}`);
    }
  }

  // Validate that we have at least one why
  if (analysis.whys.length === 0) {
    throw new Error('Analysis must contain at least one why question');
  }

  return analysis;
}

export function toGraphView(analysis: FiveWhysAnalysis): GraphView {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add problem statement node
  const problemNode: GraphNode = {
    id: "problem",
    label: analysis.problem_statement,
    type: "problem"
  };
  nodes.push(problemNode);

  // Add why nodes and connect them
  let previousNodeId = "problem";
  
  for (const why of analysis.whys.sort((a, b) => a.level - b.level)) {
    const whyNodeId = `why-${why.level}`;
    
    // Add why question node
    const whyNode: GraphNode = {
      id: whyNodeId,
      label: `Why? ${why.question}`,
      type: "why",
      level: why.level
    };
    nodes.push(whyNode);

    // Add answer node
    const answerNodeId = `answer-${why.level}`;
    const answerNode: GraphNode = {
      id: answerNodeId,
      label: why.answer,
      type: "why",
      level: why.level
    };
    nodes.push(answerNode);

    // Connect previous node to why question
    edges.push({
      id: `edge-${previousNodeId}-${whyNodeId}`,
      source: previousNodeId,
      target: whyNodeId,
      label: "leads to"
    });

    // Connect why question to answer
    edges.push({
      id: `edge-${whyNodeId}-${answerNodeId}`,
      source: whyNodeId,
      target: answerNodeId,
      label: "because"
    });

    previousNodeId = answerNodeId;
  }

  // Add root cause node
  const rootCauseNode: GraphNode = {
    id: "root-cause",
    label: `Root Cause: ${analysis.root_cause}`,
    type: "root_cause"
  };
  nodes.push(rootCauseNode);

  // Connect last answer to root cause
  if (analysis.whys.length > 0) {
    const lastLevel = Math.max(...analysis.whys.map(w => w.level));
    edges.push({
      id: `edge-answer-${lastLevel}-root-cause`,
      source: `answer-${lastLevel}`,
      target: "root-cause",
      label: "reveals"
    });
  }

  // Add action item nodes
  if (analysis.action_items) {
    analysis.action_items.forEach((action, index) => {
      const actionNodeId = `action-${index}`;
      const actionNode: GraphNode = {
        id: actionNodeId,
        label: action.action,
        type: "action",
        priority: action.priority
      };
      nodes.push(actionNode);

      // Connect root cause to action
      edges.push({
        id: `edge-root-cause-${actionNodeId}`,
        source: "root-cause",
        target: actionNodeId,
        label: "requires"
      });
    });
  }

  return { nodes, edges };
}