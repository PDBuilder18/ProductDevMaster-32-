import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ProductRequirements {
  features: Array<{
    name: string;
    description: string;
    priority: "must-have" | "should-have" | "could-have" | "wont-have";
  }>;
  functions: string[];
  constraints: string[];
}

interface RequirementsGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: "center" | "feature" | "function" | "constraint";
    priority?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface RequirementsGraphProps {
  data: ProductRequirements;
}

function transformRequirementsDataToGraph(data: ProductRequirements): RequirementsGraphData {
  const nodes = [
    {
      id: "center",
      label: "Product Requirements",
      type: "center" as const
    }
  ];

  const edges = [];

  // Add feature nodes
  data.features.forEach((feature, index) => {
    const featureId = `feature-${index}`;
    nodes.push({
      id: featureId,
      label: feature.name,
      type: "feature" as const,
      priority: feature.priority
    });
    edges.push({
      id: `center-${featureId}`,
      source: "center",
      target: featureId,
      label: feature.priority.replace('-', ' ')
    });
  });

  // Add function nodes (max 6)
  data.functions.slice(0, 6).forEach((func, index) => {
    const functionId = `function-${index}`;
    nodes.push({
      id: functionId,
      label: func.substring(0, 40) + (func.length > 40 ? "..." : ""),
      type: "function" as const
    });
    edges.push({
      id: `center-${functionId}`,
      source: "center",
      target: functionId,
      label: "Function"
    });
  });

  // Add constraint nodes (max 4)
  data.constraints.slice(0, 4).forEach((constraint, index) => {
    const constraintId = `constraint-${index}`;
    nodes.push({
      id: constraintId,
      label: constraint.substring(0, 45) + (constraint.length > 45 ? "..." : ""),
      type: "constraint" as const
    });
    edges.push({
      id: `center-${constraintId}`,
      source: "center",
      target: constraintId,
      label: "Constraint"
    });
  });

  return { nodes, edges };
}

export function RequirementsGraph({ data }: RequirementsGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const graphData = transformRequirementsDataToGraph(data);

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
          priority: node.priority
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
            'width': 100,
            'height': 100,
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
          selector: 'node[type="feature"][priority="must-have"]',
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
          selector: 'node[type="feature"][priority="should-have"]',
          style: {
            'background-color': '#EA580C',
            'border-color': '#C2410C',
            'width': 110,
            'height': 110,
            'text-max-width': '170px'
          }
        },
        {
          selector: 'node[type="feature"][priority="could-have"]',
          style: {
            'background-color': '#EAB308',
            'border-color': '#CA8A04',
            'width': 100,
            'height': 100,
            'text-max-width': '160px'
          }
        },
        {
          selector: 'node[type="feature"][priority="wont-have"]',
          style: {
            'background-color': '#6B7280',
            'border-color': '#4B5563',
            'width': 90,
            'height': 90,
            'text-max-width': '140px'
          }
        },
        {
          selector: 'node[type="function"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 105,
            'height': 105,
            'text-max-width': '160px'
          }
        },
        {
          selector: 'node[type="constraint"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#D97706',
            'width': 95,
            'height': 95,
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
        idealEdgeLength: 130,
        edgeElasticity: 200
      }
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Requirements node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        padding: 50,
        nodeOverlap: 300,
        idealEdgeLength: 130,
        edgeElasticity: 200
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'product-requirements.png';
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
          <span>Product Requirements Overview</span>
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
            <div className="text-gray-600">Loading requirements overview graph...</div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Red:</strong> Must-Have • <strong>Orange:</strong> Should-Have • <strong>Yellow:</strong> Could-Have • <strong>Purple:</strong> Functions • <strong>Amber:</strong> Constraints</p>
        </div>
      </CardContent>
    </Card>
  );
}