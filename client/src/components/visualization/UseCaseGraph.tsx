import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

cytoscape.use(dagre);

interface UseCase {
  narrative: string;
  steps: Array<{
    step: number;
    action: string;
    outcome: string;
  }>;
}

interface UseCaseGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: "start" | "step" | "outcome" | "end";
    stepNumber?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface UseCaseGraphProps {
  data: UseCase;
}

function transformUseCaseDataToGraph(data: UseCase): UseCaseGraphData {
  const nodes = [
    {
      id: "start",
      label: "Customer Journey Start",
      type: "start" as const
    }
  ];

  const edges = [];
  
  let previousId = "start";

  // Add step and outcome nodes
  data.steps.forEach((step, index) => {
    const stepId = `step-${index}`;
    const outcomeId = `outcome-${index}`;

    // Add step node
    nodes.push({
      id: stepId,
      label: `Step ${step.step}: ${step.action.substring(0, 40) + (step.action.length > 40 ? "..." : "")}`,
      type: "step" as const,
      stepNumber: step.step
    });

    // Add outcome node
    nodes.push({
      id: outcomeId,
      label: step.outcome.substring(0, 50) + (step.outcome.length > 50 ? "..." : ""),
      type: "outcome" as const,
      stepNumber: step.step
    });

    // Connect previous to current step
    edges.push({
      id: `${previousId}-${stepId}`,
      source: previousId,
      target: stepId,
      label: index === 0 ? "Begin" : "Next"
    });

    // Connect step to its outcome
    edges.push({
      id: `${stepId}-${outcomeId}`,
      source: stepId,
      target: outcomeId,
      label: "Result"
    });

    previousId = outcomeId;
  });

  // Add end node
  nodes.push({
    id: "end",
    label: "Journey Complete",
    type: "end" as const
  });

  edges.push({
    id: `${previousId}-end`,
    source: previousId,
    target: "end",
    label: "Finish"
  });

  return { nodes, edges };
}

export function UseCaseGraph({ data }: UseCaseGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const graphData = transformUseCaseDataToGraph(data);

  const initializeCytoscape = () => {
    if (!containerRef.current || !graphData) return;

    setIsLoading(true);

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements = [
      ...graphData.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          stepNumber: node.stepNumber
        }
      })),
      ...graphData.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label
        }
      }))
    ];

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3B82F6',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#FFFFFF',
            'text-wrap': 'wrap',
            'text-max-width': '150px',
            'font-size': '10px',
            'width': 100,
            'height': 100,
            'border-width': 3,
            'border-color': '#1E40AF',
            'padding': '8px'
          }
        },
        {
          selector: 'node[type="start"]',
          style: {
            'background-color': '#059669',
            'border-color': '#047857',
            'width': 120,
            'height': 120,
            'text-max-width': '180px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="end"]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#B91C1C',
            'width': 120,
            'height': 120,
            'text-max-width': '180px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="step"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 130,
            'height': 130,
            'text-max-width': '190px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="outcome"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#D97706',
            'width': 110,
            'height': 110,
            'text-max-width': '170px',
            'font-size': '10px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#6B7280',
            'target-arrow-color': '#6B7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'text-rotation': 'autorotate',
            'text-margin-x': 0,
            'text-margin-y': -12
          }
        }
      ],
      layout: {
        name: 'dagre',
        directed: true,
        padding: 50,
        spacingFactor: 1.5,
        rankDir: 'TB'
      }
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Use case node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'dagre',
        directed: true,
        padding: 50,
        spacingFactor: 1.5,
        rankDir: 'TB'
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'customer-journey.png';
      link.href = png64;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const zoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const zoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  useEffect(() => {
    initializeCytoscape();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Journey Flow</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportGraph}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          style={{ width: '100%', height: '600px' }}
          className="border rounded-lg bg-gray-50"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-gray-600">Loading customer journey graph...</div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Green:</strong> Start • <strong>Purple:</strong> Actions • <strong>Orange:</strong> Outcomes • <strong>Red:</strong> End</p>
        </div>
      </CardContent>
    </Card>
  );
}