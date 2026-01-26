import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ExistingSolution {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  pricing?: string;
  targetAudience?: string;
}

interface ExistingSolutionsData {
  solutions: ExistingSolution[];
  gaps: string[];
}

interface SolutionsGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: "center" | "solution" | "strength" | "weakness" | "gap";
    solutionIndex?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface SolutionsGraphProps {
  data: ExistingSolutionsData;
}

function transformSolutionsDataToGraph(data: ExistingSolutionsData): SolutionsGraphData {
  const nodes = [
    {
      id: "center",
      label: "Competitive Landscape",
      type: "center" as const
    }
  ];

  const edges = [];

  // Add solution nodes
  data.solutions.forEach((solution, index) => {
    const solutionId = `solution-${index}`;
    nodes.push({
      id: solutionId,
      label: solution.name,
      type: "solution" as const,
      solutionIndex: index
    });
    edges.push({
      id: `center-${solutionId}`,
      source: "center",
      target: solutionId,
      label: "Competitor"
    });

    // Add top strengths (max 2)
    solution.pros.slice(0, 2).forEach((pro, proIndex) => {
      const strengthId = `strength-${index}-${proIndex}`;
      nodes.push({
        id: strengthId,
        label: pro.substring(0, 40) + (pro.length > 40 ? "..." : ""),
        type: "strength" as const,
        solutionIndex: index
      });
      edges.push({
        id: `${solutionId}-${strengthId}`,
        source: solutionId,
        target: strengthId,
        label: "Strength"
      });
    });

    // Add top weaknesses (max 2)
    solution.cons.slice(0, 2).forEach((con, conIndex) => {
      const weaknessId = `weakness-${index}-${conIndex}`;
      nodes.push({
        id: weaknessId,
        label: con.substring(0, 40) + (con.length > 40 ? "..." : ""),
        type: "weakness" as const,
        solutionIndex: index
      });
      edges.push({
        id: `${solutionId}-${weaknessId}`,
        source: solutionId,
        target: weaknessId,
        label: "Weakness"
      });
    });
  });

  // Add market gaps (max 4)
  data.gaps.slice(0, 4).forEach((gap, index) => {
    const gapId = `gap-${index}`;
    nodes.push({
      id: gapId,
      label: gap.substring(0, 50) + (gap.length > 50 ? "..." : ""),
      type: "gap" as const
    });
    edges.push({
      id: `center-${gapId}`,
      source: "center",
      target: gapId,
      label: "Opportunity"
    });
  });

  return { nodes, edges };
}

export function SolutionsGraph({ data }: SolutionsGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const graphData = transformSolutionsDataToGraph(data);

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
          solutionIndex: node.solutionIndex
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
            'text-max-width': '140px',
            'font-size': '10px',
            'width': 90,
            'height': 90,
            'border-width': 3,
            'border-color': '#1E40AF',
            'padding': '8px'
          }
        },
        {
          selector: 'node[type="center"]',
          style: {
            'background-color': '#059669',
            'border-color': '#047857',
            'width': 140,
            'height': 140,
            'text-max-width': '200px',
            'font-size': '12px'
          }
        },
        {
          selector: 'node[type="solution"]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#B91C1C',
            'width': 110,
            'height': 110,
            'text-max-width': '160px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="strength"]',
          style: {
            'background-color': '#16A34A',
            'border-color': '#15803D',
            'width': 85,
            'height': 85,
            'text-max-width': '130px'
          }
        },
        {
          selector: 'node[type="weakness"]',
          style: {
            'background-color': '#EF4444',
            'border-color': '#DC2626',
            'width': 85,
            'height': 85,
            'text-max-width': '130px'
          }
        },
        {
          selector: 'node[type="gap"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 100,
            'height': 100,
            'text-max-width': '150px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#6B7280',
            'target-arrow-color': '#6B7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-margin-x': 0,
            'text-margin-y': -10
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 50,
        nodeOverlap: 300,
        idealEdgeLength: 120,
        edgeElasticity: 150
      }
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Solutions node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        padding: 50,
        nodeOverlap: 300,
        idealEdgeLength: 120,
        edgeElasticity: 150
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'competitive-analysis.png';
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
          <span>Competitive Analysis Graph</span>
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
          style={{ width: '100%', height: '550px' }}
          className="border rounded-lg bg-gray-50"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-gray-600">Loading competitive analysis graph...</div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Green:</strong> Center/Strengths • <strong>Red:</strong> Solutions/Weaknesses • <strong>Purple:</strong> Market Gaps</p>
        </div>
      </CardContent>
    </Card>
  );
}