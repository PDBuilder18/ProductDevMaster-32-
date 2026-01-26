import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Settings, ArrowRight, ArrowLeft, CheckSquare, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FunctionalRequirement {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string[];
}

interface NonFunctionalRequirement {
  id: string;
  name: string;
  description: string;
  category: "Performance" | "Security" | "Usability" | "Reliability" | "Scalability" | "Compatibility";
  acceptanceCriteria: string[];
}

interface ProductRequirements {
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
}

export function Step7Requirements() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();

  const requirementsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/requirements`, {});
      return res.json() as Promise<ProductRequirements>;
    },
    onSuccess: (requirements) => {
      toast({
        title: "Requirements generated!",
        description: `Created ${requirements.functionalRequirements.length} functional and ${requirements.nonFunctionalRequirements.length} non-functional requirements.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate product requirements. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateRequirements = () => {
    requirementsMutation.mutate();
  };

  const handleContinue = () => {
    completeStep(7, {
      productRequirements: requirementsMutation.data,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(6);
  };

  if (requirementsMutation.isPending) {
    return <LoadingOverlay message="Generating product requirements document..." />;
  }

  const requirements = requirementsMutation.data || workflowData.productRequirements;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "must-have":
        return "bg-red-100 text-red-800";
      case "should-have":
        return "bg-orange-100 text-orange-800";
      case "could-have":
        return "bg-yellow-100 text-yellow-800";
      case "wont-have":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              7
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Create the product requirements</CardTitle>
              <p className="text-gray-600">Convert your use case into detailed product features</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Product Requirements</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Requirements define exactly what your product must do (functional) and how well it must perform (non-functional). 
                  These become the blueprint for developers and the criteria for testing your MVP.
                </p>
              </div>
            </div>
          </div>

          {!requirements && (
            <Button
              onClick={handleGenerateRequirements}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Generate Product Requirements
            </Button>
          )}

          {/* Functional Requirements */}
          {requirements?.functionalRequirements && requirements.functionalRequirements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                Functional Requirements
              </h3>
              <p className="text-sm text-gray-600 mb-4">What the system must do - specific behaviors and functionality</p>
              
              <div className="space-y-3">
                {requirements.functionalRequirements.map((req, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{req.id}</span>
                            <h4 className="font-medium text-gray-900">{req.name}</h4>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{req.description}</p>
                          {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">Acceptance Criteria:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {req.acceptanceCriteria.map((criteria, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2"></span>
                                    {criteria}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Non-Functional Requirements */}
          {requirements?.nonFunctionalRequirements && requirements.nonFunctionalRequirements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Non-Functional Requirements
              </h3>
              <p className="text-sm text-gray-600 mb-4">How the system should perform - quality attributes and constraints</p>
              
              <div className="space-y-3">
                {requirements.nonFunctionalRequirements.map((req, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">{req.id}</span>
                            <h4 className="font-medium text-gray-900">{req.name}</h4>
                            <Badge className="bg-purple-100 text-purple-800">
                              {req.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{req.description}</p>
                          {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">Acceptance Criteria:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {req.acceptanceCriteria.map((criteria, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2"></span>
                                    {criteria}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}




          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {requirements ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Prioritization
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Prioritization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Generate product requirements to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
