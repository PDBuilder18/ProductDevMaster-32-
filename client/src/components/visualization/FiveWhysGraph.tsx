import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface FiveWhysGraphProps {
  data: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      level?: number;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
    }>;
  };
  className?: string;
}

export function FiveWhysGraph({ data, className = "" }: FiveWhysGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeCytoscape = () => {
    if (!containerRef.current || !data.nodes.length) return;

    // Clear existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Convert data to Cytoscape format
    const elements = [
      ...data.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          level: node.level
        }
      })),
      ...data.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label
        }
      }))
    ];

    // Initialize Cytoscape
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
            'text-max-width': '180px',
            'font-size': '11px',
            'width': 120,
            'height': 120,
            'border-width': 3,
            'border-color': '#1E40AF',
            'padding': '10px'
          }
        },
        {
          selector: 'node[type="problem"]',
          style: {
            'background-color': '#DC2626',
            'border-color': '#B91C1C',
            'width': 140,
            'height': 140,
            'text-max-width': '200px',
            'font-size': '12px'
          }
        },
        {
          selector: 'node[type="root_cause"]',
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
          selector: 'node[type="why"]',
          style: {
            'background-color': '#7C3AED',
            'border-color': '#5B21B6',
            'width': 130,
            'height': 130,
            'text-max-width': '190px'
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
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-margin-x': 0,
            'text-margin-y': -10
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        roots: data.nodes.filter(n => n.type === 'problem').map(n => n.id),
        padding: 50,
        spacingFactor: 2.0
      }
    });

    // Add click events
    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      console.log('Node clicked:', nodeData);
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'breadthfirst',
        directed: true,
        roots: data.nodes.filter(n => n.type === 'problem').map(n => n.id),
        padding: 50,
        spacingFactor: 2.0
      }).run();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'five-whys-analysis.png';
      link.href = png64;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    initializeCytoscape();
    
    const handleResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Five Whys Analysis Graph
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportGraph}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-700"></div>
              <span>Problem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-purple-700"></div>
              <span>Why Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-green-700"></div>
              <span>Root Cause</span>
            </div>
          </div>
          <div 
            ref={containerRef}
            className="w-full h-96 border border-gray-200 rounded-lg"
            style={{ minHeight: '400px' }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading graph...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}