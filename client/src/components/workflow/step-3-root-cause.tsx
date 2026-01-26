import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Target, ArrowRight, ArrowLeft, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RootCauseAnalysis {
  causes: Array<{
    level: number;
    question: string;
    answer: string;
  }>;
  primaryCause: string;
}

export function Step3RootCause() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/root-cause`, {});
      return res.json() as Promise<RootCauseAnalysis>;
    },
    onSuccess: () => {
      toast({
        title: "Root cause analysis completed!",
        description: "AI has identified the core issues behind your problem.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Failed to conduct root cause analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    analysisMutation.mutate();
  };

  const handleContinue = () => {
    completeStep(3, {
      rootCause: analysisMutation.data,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(2);
  };

  if (analysisMutation.isPending) {
    return <LoadingOverlay message="Finding root causes using 5 Whys analysis..." />;
  }

  const analysis = analysisMutation.data || (workflowData as any)?.rootCause;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              3
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Find the root cause(s) of the problem</CardTitle>
              <p className="text-gray-600">Using AI-powered "5 Whys" analysis to dig deeper</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Root Cause Analysis</h4>
                <p className="text-sm text-blue-700 mt-1">
                  The "5 Whys" technique helps identify the underlying causes of problems by asking 
                  "why" repeatedly. This ensures your solution addresses the real issue, not just symptoms.
                </p>
              </div>
            </div>
          </div>

          {!analysis && (
            <Button
              onClick={handleAnalyze}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Start Root Cause Analysis
            </Button>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    5 Whys Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.causes.map((cause, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                          {cause.level}
                        </div>
                        <div className="ml-3 flex-1">
                          <h5 className="font-medium text-gray-900">{cause.question}</h5>
                          <p className="text-sm text-gray-700 mt-1">{cause.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-900">Primary Root Cause</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 font-medium">{analysis.primaryCause}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This is the core issue your MVP should address to be most effective.
                  </p>
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
            {analysis ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Existing Solutions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Existing Solutions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Complete root cause analysis to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
