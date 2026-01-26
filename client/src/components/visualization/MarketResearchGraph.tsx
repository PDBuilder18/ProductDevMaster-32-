import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface MarketResearchFindings {
  marketSize: string;
  competitors: string[];
  trends: string[];
  confidence: number;
}

interface MarketResearchGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: "market" | "competitor" | "trend" | "confidence";
    value?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface MarketResearchGraphProps {
  data: MarketResearchFindings;
}

function transformMarketDataToGraph(data: MarketResearchFindings): MarketResearchGraphData {
  const nodes = [
    {
      id: "market",
      label: data.marketSize.substring(0, 80) + (data.marketSize.length > 80 ? "..." : ""),
      type: "market" as const,
      value: data.confidence
    }
  ];

  const edges = [];

  // Add competitor nodes
  data.competitors.forEach((competitor, index) => {
    const id = `competitor-${index}`;
    nodes.push({
      id,
      label: competitor.substring(0, 50) + (competitor.length > 50 ? "..." : ""),
      type: "competitor" as const
    });
    edges.push({
      id: `market-${id}`,
      source: "market",
      target: id,
      label: "Competitor"
    });
  });

  // Add trend nodes  
  data.trends.forEach((trend, index) => {
    const id = `trend-${index}`;
    nodes.push({
      id,
      label: trend.substring(0, 60) + (trend.length > 60 ? "..." : ""),
      type: "trend" as const
    });
    edges.push({
      id: `market-${id}`,
      source: "market",
      target: id,
      label: "Trend"
    });
  });

  // Add confidence node
  nodes.push({
    id: "confidence",
    label: `Confidence: ${Math.round(data.confidence * 100)}%`,
    type: "confidence" as const,
    value: data.confidence
  });
  edges.push({
    id: "market-confidence",
    source: "market",
    target: "confidence",
    label: "Analysis"
  });

  return { nodes, edges };
}

export function MarketResearchGraph({ data }: MarketResearchGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const graphData = transformMarketDataToGraph(data);

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
          value: node.value
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
            'text-max-width': '160px',
            'font-size': '11px',
            'width': 100,
            'height': 100,
            'border-width': 3,
            'border-color': '#1E40AF',
            'padding': '10px'
          }
        },
        {
          selector: 'node[type="market"]',
          style: {
            'background-color': '#059669',
            'border-color': '#047857',
            'width': 160,
            'height': 160,
            'text-max-width': '220px',
            'font-size': '12px'
          }
        },
        {
          selector: 'node[type="competitor"]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#B91C1C',
            'width': 120,
            'height': 120,
            'text-max-width': '180px'
          }
        },
        {
          selector: 'node[type="trend"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 130,
            'height': 130,
            'text-max-width': '190px'
          }
        },
        {
          selector: 'node[type="confidence"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#D97706',
            'width': 110,
            'height': 110,
            'text-max-width': '170px'
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
        name: 'cose',
        padding: 60,
        nodeOverlap: 400,
        idealEdgeLength: 150,
        edgeElasticity: 200
      }
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Market node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        padding: 60,
        nodeOverlap: 400,
        idealEdgeLength: 150,
        edgeElasticity: 200
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'market-research-analysis.png';
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
          <span>Market Research Visualization</span>
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
          style={{ width: '100%', height: '500px' }}
          className="border rounded-lg bg-gray-50"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-gray-600">Loading market analysis graph...</div>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Green:</strong> Market Size • <strong>Red:</strong> Competitors • <strong>Purple:</strong> Trends • <strong>Orange:</strong> Confidence Level</p>
        </div>
      </CardContent>
    </Card>
  );
}