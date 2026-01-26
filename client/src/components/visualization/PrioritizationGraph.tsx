import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface PrioritizedFeature {
  name: string;
  description: string;
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;
  ease?: number;
  score?: number;
  priority: string;
}

interface PrioritizationData {
  method: "RICE" | "ICE" | "MoSCoW";
  features: PrioritizedFeature[];
}

interface PrioritizationGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: "center" | "feature" | "metric";
    score?: number;
    priority?: string;
    rank?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface PrioritizationGraphProps {
  data: PrioritizationData;
}

function transformPrioritizationDataToGraph(data: PrioritizationData): PrioritizationGraphData {
  const nodes = [
    {
      id: "center",
      label: `${data.method} Prioritization`,
      type: "center" as const
    }
  ];

  const edges = [];

  // Sort features by score
  const sortedFeatures = [...data.features].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Add feature nodes (top 8 features to avoid clutter)
  sortedFeatures.slice(0, 8).forEach((feature, index) => {
    const featureId = `feature-${index}`;
    nodes.push({
      id: featureId,
      label: `#${index + 1} ${feature.name}`,
      type: "feature" as const,
      score: feature.score,
      priority: feature.priority,
      rank: index + 1
    });
    edges.push({
      id: `center-${featureId}`,
      source: "center",
      target: featureId,
      label: feature.score ? `Score: ${feature.score.toFixed(1)}` : feature.priority
    });

    // Add metric breakdown nodes for top 3 features
    if (index < 3 && (data.method === "RICE" || data.method === "ICE")) {
      if (data.method === "RICE") {
        // Add RICE metric nodes
        const reachId = `reach-${index}`;
        const impactId = `impact-${index}`;
        const confidenceId = `confidence-${index}`;
        const effortId = `effort-${index}`;

        nodes.push(
          {
            id: reachId,
            label: `Reach: ${feature.reach || 0}`,
            type: "metric" as const
          },
          {
            id: impactId,
            label: `Impact: ${feature.impact || 0}`,
            type: "metric" as const
          },
          {
            id: confidenceId,
            label: `Confidence: ${feature.confidence || 0}`,
            type: "metric" as const
          },
          {
            id: effortId,
            label: `Effort: ${feature.effort || 0}`,
            type: "metric" as const
          }
        );

        edges.push(
          {
            id: `${featureId}-${reachId}`,
            source: featureId,
            target: reachId,
            label: "R"
          },
          {
            id: `${featureId}-${impactId}`,
            source: featureId,
            target: impactId,
            label: "I"
          },
          {
            id: `${featureId}-${confidenceId}`,
            source: featureId,
            target: confidenceId,
            label: "C"
          },
          {
            id: `${featureId}-${effortId}`,
            source: featureId,
            target: effortId,
            label: "E"
          }
        );
      } else if (data.method === "ICE") {
        // Add ICE metric nodes
        const impactId = `impact-${index}`;
        const confidenceId = `confidence-${index}`;
        const easeId = `ease-${index}`;

        nodes.push(
          {
            id: impactId,
            label: `Impact: ${feature.impact || 0}`,
            type: "metric" as const
          },
          {
            id: confidenceId,
            label: `Confidence: ${feature.confidence || 0}`,
            type: "metric" as const
          },
          {
            id: easeId,
            label: `Ease: ${feature.ease || 0}`,
            type: "metric" as const
          }
        );

        edges.push(
          {
            id: `${featureId}-${impactId}`,
            source: featureId,
            target: impactId,
            label: "I"
          },
          {
            id: `${featureId}-${confidenceId}`,
            source: featureId,
            target: confidenceId,
            label: "C"
          },
          {
            id: `${featureId}-${easeId}`,
            source: featureId,
            target: easeId,
            label: "E"
          }
        );
      }
    }
  });

  return { nodes, edges };
}

export function PrioritizationGraph({ data }: PrioritizationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const graphData = transformPrioritizationDataToGraph(data);

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
          score: node.score,
          priority: node.priority,
          rank: node.rank
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
            'text-max-width': '130px',
            'font-size': '10px',
            'width': 80,
            'height': 80,
            'border-width': 3,
            'border-color': '#1E40AF',
            'padding': '6px'
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
          selector: 'node[type="feature"][rank=1]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#B91C1C',
            'width': 130,
            'height': 130,
            'text-max-width': '190px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="feature"][rank=2]',
          style: {
            'background-color': '#EA580C',
            'border-color': '#C2410C',
            'width': 120,
            'height': 120,
            'text-max-width': '180px',
            'font-size': '11px'
          }
        },
        {
          selector: 'node[type="feature"][rank=3]',
          style: {
            'background-color': '#EAB308',
            'border-color': '#CA8A04',
            'width': 110,
            'height': 110,
            'text-max-width': '170px'
          }
        },
        {
          selector: 'node[type="feature"]:unselected',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 100,
            'height': 100,
            'text-max-width': '160px'
          }
        },
        {
          selector: 'node[type="metric"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#D97706',
            'width': 70,
            'height': 70,
            'text-max-width': '110px',
            'font-size': '9px'
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
            'text-margin-y': -8
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 40,
        nodeOverlap: 200,
        idealEdgeLength: 100,
        edgeElasticity: 150
      }
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Prioritization node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        padding: 40,
        nodeOverlap: 200,
        idealEdgeLength: 100,
        edgeElasticity: 150
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'feature-prioritization.png';
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
          <span>Feature Prioritization Analysis</span>
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
            <div className="text-gray-600">Loading prioritization analysis graph...</div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Red:</strong> #1 Priority • <strong>Orange:</strong> #2 Priority • <strong>Yellow:</strong> #3 Priority • <strong>Purple:</strong> Other Features • <strong>Amber:</strong> Metrics</p>
        </div>
      </CardContent>
    </Card>
  );
}