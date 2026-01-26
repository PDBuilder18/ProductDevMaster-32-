import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Search, ArrowRight, ArrowLeft, CheckCircle, XCircle, CircleDashed, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExistingSolution {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  pricing?: string;
  targetAudience?: string;
  disclaimer?: string;
  relevanceScore?: number;
  verificationLevel?: string;
}

interface ExistingSolutionsData {
  solutions: ExistingSolution[];
  gaps: string[];
}

export function Step4ExistingSolutions() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();

  const solutionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/existing-solutions`, {});
      return res.json() as Promise<ExistingSolutionsData>;
    },
    onSuccess: (data) => {
      toast({
        title: "Solutions analysis completed!",
        description: `Found ${data.solutions.length} existing solutions and ${data.gaps.length} market gaps.`,
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Failed to find existing solutions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFindSolutions = () => {
    solutionsMutation.mutate();
  };

  const handleContinue = () => {
    completeStep(4, {
      existingSolutions: solutionsMutation.data,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(3);
  };

  if (solutionsMutation.isPending) {
    return <LoadingOverlay message="Finding existing solutions and analyzing gaps..." />;
  }

  const data = solutionsMutation.data || workflowData.existingSolutions;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              4
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Find existing solutions</CardTitle>
              <p className="text-gray-600">Research competitors and identify market gaps</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Competitive Analysis</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Understanding existing solutions helps you identify market gaps and differentiation opportunities. 
                  This analysis reveals what customers already use and where your product can add unique value.
                </p>
              </div>
            </div>
          </div>

          {!data && (
            <Button
              onClick={handleFindSolutions}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Find Existing Solutions
            </Button>
          )}

          {/* Existing Solutions */}
          {data?.solutions && data.solutions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Existing Solutions</h3>
              {data.solutions.map((solution: ExistingSolution, index: number) => (
                <Card key={index} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{solution.name}</CardTitle>
                      {solution.pricing && (
                        <Badge variant="secondary">{solution.pricing}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{solution.description}</p>
                    {solution.targetAudience && (
                      <p className="text-xs text-gray-500">Target: {solution.targetAudience}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-900 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Strengths
                        </h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {solution.pros.map((pro: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-2 h-2 bg-green-600 rounded-full mr-2 mt-2"></span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-900 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Weaknesses
                        </h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {solution.cons.map((con: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-2 h-2 bg-red-600 rounded-full mr-2 mt-2"></span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {solution.disclaimer && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 flex items-start">
                          <span className="font-medium mr-1">⚠️ Disclaimer:</span>
                          {solution.disclaimer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Market Gaps */}
          {data?.gaps && data.gaps.length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CircleDashed className="h-5 w-5 text-purple-600 mr-2" />
                  Market Gaps & Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.gaps.map((gap: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mr-3 mt-2"></span>
                      <span className="text-sm text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data?.solutions && data.solutions.length === 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="font-medium text-yellow-900">No Direct Competitors Found</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This could be a great opportunity - you might be solving a problem that hasn't been addressed yet!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {data ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Customer Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Customer Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Complete existing solutions analysis to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
