import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IntegrationStatus from "@/components/IntegrationStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Shield, Database, Bot, Settings, Activity, Users, MessageSquare, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    api: boolean;
    database: boolean;
    openai: boolean;
    github: boolean;
    shopify: boolean;
    search: boolean;
  };
  database: {
    connected: boolean;
    provider: string;
    type: string;
  };
  missing: string[];
  version: string;
}

export default function AdminPage() {
  const { data: health, isLoading } = useQuery<HealthData>({
    queryKey: ['/api/health'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const activeServices = health ? Object.entries(health.services).filter(([_, active]) => active).length : 0;
  const totalServices = health ? Object.keys(health.services).length : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PDBuilder Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system health, integrations, and configuration status
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/tracking">
          <Card className="cursor-pointer hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">User Tracking</h3>
                    <p className="text-sm text-muted-foreground">View user progress and activity</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/feedback">
          <Card className="cursor-pointer hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">User Feedback</h3>
                    <p className="text-sm text-muted-foreground">View ratings and suggestions</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(health?.status || 'unknown')}`}>
                    {health?.status || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold mt-1">
                  {activeServices}/{totalServices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Service</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${health?.services.openai ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {health?.services.openai ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${health?.services.database ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium">
                    {health?.database?.provider === 'supabase' ? 'Supabase' :
                     health?.database?.provider === 'neon' ? 'Neon DB' :
                     health?.services.database ? 'PostgreSQL' : 'Memory Only'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Warnings */}
      {health?.missing && health.missing.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              <span>Configuration Warnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {health.missing.map((item, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  • {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <IntegrationStatus />

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-mono">{health?.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Health Check</p>
              <p className="text-lg">
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health && Object.entries(health.services).map(([service, active]) => (
              <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium capitalize">{service}</span>
                <Badge variant={active ? "default" : "secondary"}>
                  {active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}