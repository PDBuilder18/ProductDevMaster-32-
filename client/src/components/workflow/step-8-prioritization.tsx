import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { BarChart3, ArrowRight, ArrowLeft, Target, Calculator, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function Step8Prioritization() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<"RICE" | "ICE" | "MoSCoW">("MoSCoW");

  const prioritizationMutation = useMutation({
    mutationFn: async (method: "RICE" | "ICE" | "MoSCoW") => {
      const requirements = (workflowData as any)?.productRequirements?.functionalRequirements || [];
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/prioritization`, {
        method,
        features: requirements.map((req: any) => ({
          name: req.name,
          description: req.description,
          id: req.id
        }))
      });
      return res.json() as Promise<PrioritizationData>;
    },
    onSuccess: (data) => {
      toast({
        title: "Prioritization completed!",
        description: `Features prioritized using ${data.method} method.`,
      });
    },
    onError: () => {
      toast({
        title: "Prioritization failed",
        description: "Failed to prioritize features. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrioritize = () => {
    prioritizationMutation.mutate(selectedMethod);
  };

  const handleContinue = () => {
    completeStep(8, {
      prioritization: prioritizationMutation.data,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(7);
  };

  if (prioritizationMutation.isPending) {
    return <LoadingOverlay message={`Prioritizing features using ${selectedMethod} method...`} />;
  }

  const prioritization = prioritizationMutation.data || (workflowData as any)?.prioritization;
  const requirements = (workflowData as any)?.productRequirements?.functionalRequirements || [];

  const getMethodDescription = (method: string) => {
    switch (method) {
      case "RICE":
        return "Reach × Impact × Confidence ÷ Effort - Quantitative scoring framework";
      case "ICE":
        return "Impact + Confidence + Ease ÷ 3 - Simplified scoring method";
      case "MoSCoW":
        return "Must, Should, Could, Won't - Categorical prioritization";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    switch (priority.toLowerCase()) {
      case "must-have":
      case "must have":
        return "bg-red-100 text-red-800";
      case "should-have":
      case "should have":
        return "bg-orange-100 text-orange-800";
      case "could-have":
      case "could have":
        return "bg-yellow-100 text-yellow-800";
      case "wont-have":
      case "won't have":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              8
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Prioritize functional requirements</CardTitle>
              <p className="text-gray-600">Use MoSCoW method to categorize requirements by priority</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Feature Prioritization</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Prioritization frameworks help you decide which features to build first. This ensures your MVP 
                  focuses on the most valuable features that will have the greatest impact on your customers.
                </p>
              </div>
            </div>
          </div>

          {/* Method Selection */}
          {!prioritization && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioritization Method
                </label>
                <Select value={selectedMethod} onValueChange={(value: "RICE" | "ICE" | "MoSCoW") => setSelectedMethod(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a prioritization method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RICE">RICE Framework</SelectItem>
                    <SelectItem value="ICE">ICE Scoring</SelectItem>
                    <SelectItem value="MoSCoW">MoSCoW Method</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {getMethodDescription(selectedMethod)}
                </p>
              </div>

              {/* Method Explanation */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start">
                    <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">{selectedMethod} Method</h4>
                      <div className="text-sm text-blue-700 mt-1">
                        {selectedMethod === "RICE" && (
                          <div className="space-y-1">
                            <p><strong>Reach:</strong> How many customers will benefit (1-10)</p>
                            <p><strong>Impact:</strong> How much will it impact each customer (1-10)</p>
                            <p><strong>Confidence:</strong> How confident are you in estimates (0.1-1.0)</p>
                            <p><strong>Effort:</strong> How much effort to implement (1-10, lower is better)</p>
                            <p><strong>Score:</strong> (Reach × Impact × Confidence) ÷ Effort</p>
                          </div>
                        )}
                        {selectedMethod === "ICE" && (
                          <div className="space-y-1">
                            <p><strong>Impact:</strong> How much impact will this have (1-10)</p>
                            <p><strong>Confidence:</strong> How confident are you (1-10)</p>
                            <p><strong>Ease:</strong> How easy is it to implement (1-10)</p>
                            <p><strong>Score:</strong> (Impact + Confidence + Ease) ÷ 3</p>
                          </div>
                        )}
                        {selectedMethod === "MoSCoW" && (
                          <div className="space-y-1">
                            <p><strong>Must Have:</strong> Critical for MVP launch</p>
                            <p><strong>Should Have:</strong> Important but not critical</p>
                            <p><strong>Could Have:</strong> Nice to have if time permits</p>
                            <p><strong>Won't Have:</strong> Not for this version</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handlePrioritize}
                disabled={requirements.length === 0}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Prioritize Requirements
              </Button>
            </div>
          )}

          {/* Prioritization Results */}
          {prioritization && (
            <div className="space-y-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    Prioritized Features ({prioritization.method})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prioritization.features
                      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
                      .map((feature: any, index: number) => (
                        <Card key={index} className="bg-white border-gray-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                                  <h4 className="font-medium text-gray-900">{feature.name}</h4>
                                  <Badge className={getPriorityColor(feature.priority)}>
                                    {feature.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{feature.description}</p>
                              </div>
                              {feature.score && (
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary-600">
                                    {feature.score.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-gray-500">Score</div>
                                </div>
                              )}
                            </div>

                            {/* Scoring Breakdown */}
                            {(prioritization.method === "RICE" || prioritization.method === "ICE") && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                                {prioritization.method === "RICE" && (
                                  <>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-blue-600">
                                        {feature.reach || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Reach</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-green-600">
                                        {feature.impact || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Impact</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-purple-600">
                                        {feature.confidence || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Confidence</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-red-600">
                                        {feature.effort || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Effort</div>
                                    </div>
                                  </>
                                )}
                                {prioritization.method === "ICE" && (
                                  <>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-green-600">
                                        {feature.impact || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Impact</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-purple-600">
                                        {feature.confidence || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Confidence</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-semibold text-blue-600">
                                        {feature.ease || 0}
                                      </div>
                                      <div className="text-xs text-gray-500">Ease</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* MoSCoW Priority Groups */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Priority Categories (MoSCoW)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: 'must-have', label: 'Must Have', color: 'bg-red-100 text-red-800', description: 'Critical for MVP launch' },
                      { category: 'should-have', label: 'Should Have', color: 'bg-orange-100 text-orange-800', description: 'Important but not critical' },
                      { category: 'could-have', label: 'Could Have', color: 'bg-yellow-100 text-yellow-800', description: 'Nice to have if time permits' },
                      { category: 'wont-have', label: "Won't Have", color: 'bg-gray-100 text-gray-800', description: 'Not for this version' }
                    ].map((group) => {
                      const featuresInCategory = prioritization.features.filter((f: any) => f.priority === group.category);
                      if (featuresInCategory.length === 0) return null;
                      
                      return (
                        <div key={group.category} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={group.color}>{group.label}</Badge>
                            <span className="text-sm text-gray-600">({group.description})</span>
                          </div>
                          <div className="space-y-2">
                            {featuresInCategory.map((feature: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="font-medium">{feature.name}</span>
                                {feature.score && (
                                  <span className="text-sm text-gray-500">Score: {feature.score.toFixed(1)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* MVP Recommendation */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-900">MVP Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-amber-800">
                      Based on the {prioritization.method} analysis, focus your MVP on Must Have features:
                    </p>
                    <ul className="space-y-2">
                      {prioritization.features
                        .filter((f: any) => f.priority === 'must-have')
                        .map((feature: any, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2"></span>
                            <span className="text-sm text-amber-800">
                              <strong>{feature.name}</strong> - Critical for MVP launch
                            </span>
                          </li>
                        ))}
                    </ul>
                    {prioritization.features.filter((f: any) => f.priority === 'should-have').length > 0 && (
                      <>
                        <p className="text-sm text-amber-800 mt-4">
                          Consider adding these Should Have features if time and resources allow:
                        </p>
                        <ul className="space-y-2">
                          {prioritization.features
                            .filter((f: any) => f.priority === 'should-have')
                            .map((feature: any, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="w-2 h-2 bg-amber-400 rounded-full mr-3 mt-2"></span>
                                <span className="text-sm text-amber-700">
                                  <strong>{feature.name}</strong> - Important enhancement
                                </span>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {prioritization ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Export
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Export
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Complete feature prioritization to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
