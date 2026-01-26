import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface IntegrationInfo {
  enabled: boolean;
  features: string[];
  status: string;
}

interface IntegrationsData {
  github: IntegrationInfo;
  shopify: IntegrationInfo;
  openai: IntegrationInfo;
  search: IntegrationInfo;
  database: IntegrationInfo;
  security: IntegrationInfo;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'disabled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'memory-only':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <XCircle className="h-4 w-4 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' ? 'default' : status === 'memory-only' ? 'secondary' : 'destructive';
  return (
    <Badge variant={variant} className="ml-2">
      {status}
    </Badge>
  );
}

export default function IntegrationStatus() {
  const { data: integrations, isLoading } = useQuery<IntegrationsData>({
    queryKey: ['/api/integrations/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!integrations) {
    return null;
  }

  const integrationsList = [
    { key: 'openai', name: 'OpenAI', description: 'AI-powered analysis and conversation' },
    { key: 'github', name: 'GitHub', description: 'Repository integration and issue tracking' },
    { key: 'shopify', name: 'Shopify', description: 'E-commerce platform integration' },
    { key: 'search', name: 'Search APIs', description: 'Market research and competitor analysis' },
    { key: 'database', name: 'Database', description: 'Persistent data storage' },
    { key: 'security', name: 'Security', description: 'Authentication and protection' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Integration Status
          <Badge variant="outline" className="ml-2">
            {integrationsList.filter(item => integrations[item.key as keyof IntegrationsData]?.enabled).length}/
            {integrationsList.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrationsList.map((item) => {
            const integration = integrations[item.key as keyof IntegrationsData];
            return (
              <div key={item.key} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <StatusIcon status={integration.status} />
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium">{item.name}</h4>
                      <StatusBadge status={integration.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                    {integration.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}