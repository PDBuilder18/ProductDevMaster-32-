import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Activity, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Target,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface TrackingUser {
  sessionId: string;
  currentStage: string;
  completedStages: string[];
  progressPercent: number;
  stagesCompleted: number;
  totalStages: number;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  data: any;
}

interface TrackingSummary {
  totalUsers: number;
  activeToday: number;
  completedWorkflows: number;
  avgProgress: number;
  totalCustomers: number;
}

interface TrackingData {
  success: boolean;
  summary: TrackingSummary;
  stages: string[];
  users: TrackingUser[];
}

interface CustomerTracking {
  id: number;
  customerId: string;
  email: string;
  name: string;
  subscriptionStatus: string;
  planName: string;
  attemptsUsed: number;
  attemptsTotal: number;
  attemptsRemaining: number;
  createdAt: string;
  updatedAt: string;
}

interface CustomerTrackingData {
  success: boolean;
  summary: {
    totalCustomers: number;
    activeSubscriptions: number;
    exhaustedAttempts: number;
    pausedSubscriptions: number;
    cancelledSubscriptions: number;
  };
  customers: CustomerTracking[];
}

interface SessionDetail {
  sessionId: string;
  currentStage: string;
  completedStages: string[];
  progressPercent: number;
  stagesCompleted: number;
  totalStages: number;
  createdAt: string;
  updatedAt: string;
  conversationHistory: any[];
  stageDetails: {
    stage: string;
    index: number;
    status: string;
    hasData: boolean;
    data: any;
  }[];
  workflowData: any;
}

const stageLabelMap: Record<string, string> = {
  'think-like-a-founder': 'Think Like a Founder',
  'problem-definition': 'Problem Definition',
  'market-research': 'Market Research',
  'root-cause': 'Root Cause Analysis',
  'existing-solutions': 'Existing Solutions',
  'customer-profile': 'Customer Profile',
  'use-case': 'Use Case',
  'requirements': 'Requirements',
  'prioritization': 'Prioritization',
  'export-document': 'Export Document',
  'feedback': 'Feedback',
  'problem-discovery': 'Problem Discovery',
  'problem-analysis': 'Problem Analysis',
  'icp': 'Customer Profile (ICP)',
  'product-requirements': 'Product Requirements',
};

function getStageLabel(stage: string): string {
  return stageLabelMap[stage] || stage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getStageStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    default: return 'bg-gray-300 dark:bg-gray-600';
  }
}

function UserDetailView({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery<{ success: boolean; session: SessionDetail }>({
    queryKey: ['/api/admin/tracking', sessionId],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const session = data?.session;
  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm" data-testid="button-back-to-list">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Session Details</h2>
          <p className="text-sm text-muted-foreground font-mono">{session.sessionId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-bold">{session.progressPercent}%</div>
            <Progress value={session.progressPercent} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Stages Completed</div>
            <div className="text-2xl font-bold">{session.stagesCompleted}/{session.totalStages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Current Stage</div>
            <div className="text-lg font-semibold">{getStageLabel(session.currentStage)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Last Activity</div>
            <div className="text-lg font-semibold">{formatRelativeTime(session.updatedAt)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.stageDetails.map((stage, index) => (
              <div 
                key={stage.stage} 
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  stage.status === 'in_progress' ? 'border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700' :
                  stage.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' :
                  'border-gray-200 dark:border-gray-700'
                }`}
                data-testid={`stage-row-${stage.stage}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStageStatusColor(stage.status)}`}>
                  {stage.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    stage.index
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{getStageLabel(stage.stage)}</div>
                  <div className="text-sm text-muted-foreground">
                    {stage.status === 'completed' && 'Completed'}
                    {stage.status === 'in_progress' && 'In Progress'}
                    {stage.status === 'pending' && 'Not Started'}
                    {stage.hasData && ' • Has saved data'}
                  </div>
                </div>
                <Badge variant={stage.status === 'completed' ? 'default' : stage.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {stage.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(session.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(session.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversation Messages</span>
              <span>{session.conversationHistory?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.keys(session.workflowData || {}).length === 0 ? (
                <p className="text-muted-foreground">No workflow data saved yet</p>
              ) : (
                Object.keys(session.workflowData).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{key}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminTrackingPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sessions");

  const { data: trackingData, isLoading: loadingSessions } = useQuery<TrackingData>({
    queryKey: ['/api/admin/tracking'],
    refetchInterval: 30000,
  });

  const { data: customerData, isLoading: loadingCustomers } = useQuery<CustomerTrackingData>({
    queryKey: ['/api/admin/customers-tracking'],
    refetchInterval: 30000,
  });

  if (selectedSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <UserDetailView 
          sessionId={selectedSession} 
          onBack={() => setSelectedSession(null)} 
        />
      </div>
    );
  }

  const isLoading = loadingSessions || loadingCustomers;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Tracking Dashboard</h1>
          <p className="text-muted-foreground">Monitor user progress and subscription status</p>
        </div>
        <Link href="/admin">
          <Button variant="outline" data-testid="link-back-admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin Home
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold">{trackingData?.summary.totalUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <Activity className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold">{trackingData?.summary.activeToday || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{trackingData?.summary.completedWorkflows || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                    <p className="text-2xl font-bold">{trackingData?.summary.avgProgress || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                    <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold">{customerData?.summary.totalCustomers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sessions" data-testid="tab-sessions">
                <Clock className="h-4 w-4 mr-2" />
                Sessions ({trackingData?.users.length || 0})
              </TabsTrigger>
              <TabsTrigger value="customers" data-testid="tab-customers">
                <Users className="h-4 w-4 mr-2" />
                Customers ({customerData?.customers.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!trackingData?.users.length ? (
                    <p className="text-center text-muted-foreground py-8">No sessions found</p>
                  ) : (
                    <div className="space-y-3">
                      {trackingData.users.map(user => (
                        <div 
                          key={user.sessionId}
                          className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                          onClick={() => setSelectedSession(user.sessionId)}
                          data-testid={`session-row-${user.sessionId}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium font-mono text-sm">{user.sessionId.slice(0, 20)}...</p>
                              <p className="text-sm text-muted-foreground">
                                Stage: {getStageLabel(user.currentStage)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Progress value={user.progressPercent} className="w-24 h-2" />
                                <span className="text-sm font-medium w-10">{user.progressPercent}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {user.stagesCompleted}/{user.totalStages} stages
                              </p>
                            </div>
                            
                            <div className="text-right min-w-[100px]">
                              <p className="text-sm">{formatRelativeTime(user.updatedAt)}</p>
                              <p className="text-xs text-muted-foreground">Last active</p>
                            </div>
                            
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{customerData?.summary.activeSubscriptions || 0}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{customerData?.summary.pausedSubscriptions || 0}</p>
                    <p className="text-sm text-muted-foreground">Paused</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{customerData?.summary.cancelledSubscriptions || 0}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{customerData?.summary.exhaustedAttempts || 0}</p>
                    <p className="text-sm text-muted-foreground">No Attempts Left</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!customerData?.customers.length ? (
                    <p className="text-center text-muted-foreground py-8">No customers found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Customer</th>
                            <th className="text-left py-3 px-2">Plan</th>
                            <th className="text-left py-3 px-2">Status</th>
                            <th className="text-left py-3 px-2">Attempts</th>
                            <th className="text-left py-3 px-2">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerData.customers.map(customer => (
                            <tr 
                              key={customer.id} 
                              className="border-b hover:bg-muted/50"
                              data-testid={`customer-row-${customer.id}`}
                            >
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium">{customer.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                                </div>
                              </td>
                              <td className="py-3 px-2">{customer.planName}</td>
                              <td className="py-3 px-2">
                                <Badge className={getStatusColor(customer.subscriptionStatus)}>
                                  {customer.subscriptionStatus}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <span>{customer.attemptsUsed}/{customer.attemptsTotal}</span>
                                  {customer.attemptsRemaining === 0 && customer.attemptsTotal > 0 && (
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-muted-foreground">
                                {formatRelativeTime(customer.updatedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
