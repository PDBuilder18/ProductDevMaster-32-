import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { FileText, ArrowRight, ArrowLeft, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UseCase {
  narrative: string;
  steps: Array<{
    step: number;
    action: string;
    outcome: string;
  }>;
}

export function Step6UseCase() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();

  const useCaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/use-case`, {});
      return res.json() as Promise<UseCase>;
    },
    onSuccess: () => {
      toast({
        title: "Use case generated!",
        description: "Created a detailed customer journey for your solution.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate use case. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateUseCase = () => {
    useCaseMutation.mutate();
  };

  const handleContinue = () => {
    completeStep(6, {
      useCase: useCaseMutation.data,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(5);
  };

  if (useCaseMutation.isPending) {
    return <LoadingOverlay message="Creating customer use case scenario..." />;
  }

  const useCase = useCaseMutation.data || workflowData.useCase;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              6
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Create the use case</CardTitle>
              <p className="text-gray-600">How your customer would solve the problem with your product</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!useCase && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">About Use Cases</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      A use case describes the step-by-step journey your ideal customer takes 
                      when using your product to solve their problem. This helps define exactly 
                      what your MVP needs to do.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateUseCase}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Generate Use Case
              </Button>
            </>
          )}

          {/* Use Case Results */}
          {useCase && (
            <div className="space-y-6">
              {/* Narrative */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-2" />
                    Customer Journey Narrative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{useCase.narrative}</p>
                </CardContent>
              </Card>

              {/* Step-by-step breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step-by-Step Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {useCase.steps.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                            {step.step}
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Action</h5>
                            <p className="text-sm text-gray-700 mb-3">{step.action}</p>
                            <h5 className="font-medium text-gray-900 mb-2">Expected Outcome</h5>
                            <p className="text-sm text-gray-700">{step.outcome}</p>
                          </div>
                        </div>
                        {index < useCase.steps.length - 1 && (
                          <div className="absolute left-4 mt-12 w-0.5 h-8 bg-gray-300"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-900">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-amber-800 space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2"></span>
                      Your MVP should focus on simplifying these {useCase.steps.length} core steps
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2"></span>
                      Each step represents a potential feature or capability needed in your product
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2"></span>
                      The outcomes define the value your product must deliver at each stage
                    </li>
                  </ul>
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
            {useCase ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Requirements
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Requirements
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Generate use case to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
