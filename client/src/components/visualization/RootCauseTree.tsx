import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

cytoscape.use(dagre);

interface RootCauseTreeProps {
  data: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
    }>;
    links: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
  className?: string;
}

export function RootCauseTree({ data, className = "" }: RootCauseTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeCytoscape = () => {
    const nodes = data.nodes || [];
    const links = data.links || [];
    
    if (!containerRef.current || !nodes.length) {
      setIsLoading(false);
      return;
    }

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const nodeElements = nodes.map((node, i) => {
      const id = typeof node === 'string' ? `node-${i}` : (node.id || `node-${i}`);
      const label = typeof node === 'string' ? node : (node.label || '');
      return {
        data: {
          id,
          label,
          type: typeof node === 'string' ? 'why' : (node.type || 'why')
        }
      };
    });

    const nodeIdSet = new Set(nodeElements.map(n => n.data.id));
    const labelToId = new Map(nodeElements.map(n => [n.data.label, n.data.id]));

    const resolveNodeRef = (ref: string): string | null => {
      if (nodeIdSet.has(ref)) return ref;
      if (labelToId.has(ref)) return labelToId.get(ref)!;
      return null;
    };

    const edgeElements = links
      .map((link, i) => {
        const source = resolveNodeRef(link.from || '');
        const target = resolveNodeRef(link.to || '');
        if (!source || !target) return null;
        return {
          data: {
            id: `edge-${i}`,
            source,
            target,
            label: link.label || ''
          }
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    const elements = [...nodeElements, ...edgeElements];

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366F1',
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
            'border-color': '#4338CA',
            'shape': 'round-rectangle',
            'padding': '8px'
          }
        },
        {
          selector: 'node[type="symptom"]',
          style: {
            'background-color': '#EF4444',
            'border-color': '#DC2626',
            'width': 120,
            'height': 60,
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'node[type="why"]',
          style: {
            'background-color': '#8B5CF6',
            'border-color': '#7C3AED',
            'width': 110,
            'height': 55,
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'node[type="root"]',
          style: {
            'background-color': '#10B981',
            'border-color': '#059669',
            'width': 130,
            'height': 65,
            'shape': 'round-rectangle',
            'font-weight': 'bold'
          }
        },
        {
          selector: 'node[type="contributor"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#D97706',
            'width': 100,
            'height': 50,
            'shape': 'round-rectangle'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#9CA3AF',
            'target-arrow-color': '#6B7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'color': '#374151',
            'text-background-color': '#FFFFFF',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px'
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 60,
        rankSep: 80,
        padding: 30
      } as any
    });

    cyRef.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      console.log('Node clicked:', node.data());
    });

    setIsLoading(false);
  };

  const resetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 60,
        rankSep: 80,
        padding: 30
      } as any).run();
      cyRef.current.fit();
    }
  };

  const exportGraph = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ scale: 2, bg: 'white' });
      const link = document.createElement('a');
      link.download = 'root-cause-tree.png';
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
        cyRef.current.fit();
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

  const hasValidNodes = Array.isArray(data?.nodes) && data.nodes.length > 0;
  if (!hasValidNodes) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Root Cause Analysis Tree
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
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-red-500 border border-red-600"></div>
              <span>Symptom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-purple-500 border border-purple-600"></div>
              <span>Why</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-green-500 border border-green-600"></div>
              <span>Root Cause</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded bg-amber-500 border border-amber-600"></div>
              <span>Contributor</span>
            </div>
          </div>
          <div 
            ref={containerRef}
            className="w-full border border-gray-200 rounded-lg bg-gray-50"
            style={{ minHeight: '350px', height: '350px' }}
          />
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
