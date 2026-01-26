import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ArrowRight, ArrowLeft, Download, FileText, CheckCircle, AlertTriangle, CheckCircle2, Target, TrendingUp, Users, BarChart3, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationExportResult {
  downloadUrl: string;
  filename: string;
}

export function Step12ProblemSolutionValidation() {
  const { sessionId, workflowData, completeStep, goToStep, updateWorkflowData } = useWorkflow();
  const { toast } = useToast();
  const [validationComplete, setValidationComplete] = useState(false);
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");

  // Type cast workflowData for TypeScript
  const data = workflowData as any;

  const validationExportMutation = useMutation({
    mutationFn: async (selectedFormat: "pdf" | "docx") => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/validation-export`, {
        format: selectedFormat
      });
      return res.json() as Promise<ValidationExportResult>;
    },
    onSuccess: (result) => {
      // Mark as validation exported in workflow data
      updateWorkflowData({ hasValidationExported: true });
      
      toast({
        title: "Validation analysis generated successfully!",
        description: `Your Problem-Solution Validation document has been exported as ${format.toUpperCase()}.`,
      });
      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to generate validation document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleValidationExport = () => {
    validationExportMutation.mutate(format);
  };

  const handleComplete = () => {
    setValidationComplete(true);
    completeStep(12, {});
  };

  const handleContinueToFeedback = () => {
    // Mark step 12 as complete before going to feedback
    completeStep(12, {});
    goToStep(13);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              12
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Problem-Solution Validation</CardTitle>
              <p className="text-gray-600">Validate problem severity and solution fit before building</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Problem-Solution Validation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Reduce build risk by validating problem severity, segment fit, message-market resonance, 
                  usability, and willingness-to-pay before MVP build. This step helps you make 
                  Go/Refine/No-Go decisions backed by evidence.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Validation Methodology</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">1. Define Hypotheses</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Convert assumptions into falsifiable hypotheses with success thresholds.
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">2. Recruit Target Users</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Identify 12-20 qualified participants for interviews and surveys.
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">3. Problem Interviews</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Validate frequency, severity, triggers, and current workarounds.
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">4. Micro-Survey</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Rank top pains and estimate frequency and willingness-to-pay.
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">5. Landing Page Test</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Test message-market resonance without building the product.
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">6. Prototype Test</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Validate concept comprehension and core task success.
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Expected Outputs</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Hypothesis Cards with assumptions and success metrics</li>
              <li>Interview notes with Pain/Urgency scoring</li>
              <li>Micro-survey quantitative heatmap</li>
              <li>Landing page metrics (CTR, Signup %, CPS)</li>
              <li>Willingness-to-Pay corridor analysis</li>
              <li>Prototype usability findings</li>
              <li>Validation Readout with Go/Refine/No-Go recommendation</li>
            </ul>
          </div>

          {/* Download Section */}
          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-start gap-3">
                <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                    Download Your Validation Analysis
                  </h3>
                  <p className="text-primary-700 dark:text-primary-300 text-sm mb-3">
                    Get a comprehensive Problem-Solution Validation document that includes:
                  </p>
                  <ul className="text-primary-700 dark:text-primary-300 text-sm space-y-1 ml-4">
                    <li>• Problem definition and validation framework</li>
                    <li>• Solution-market fit analysis</li>
                    <li>• Customer validation summary</li>
                    <li>• Competitive gap analysis</li>
                    <li>• Risk assessment and mitigation strategies</li>
                    <li>• Validation conclusions and next steps</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prerequisites check */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {data?.problemStatement ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-sm">Problem Statement</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {data?.problemStatement ? "Complete" : "Complete Step 1 first"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {data?.icp ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-sm">Customer Profile</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {data?.icp ? "Complete" : "Complete Step 5 first"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {data?.existingSolutions ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-sm">Solution Analysis</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {data?.existingSolutions ? "Complete" : "Complete Step 4 first"}
                  </p>
                </div>
              </div>
            </div>

            {/* Format Selection and Download */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Document Format
                </label>
                <Select value={format} onValueChange={(value: "pdf" | "docx") => setFormat(value)}>
                  <SelectTrigger data-testid="format-selector" className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="docx">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Word Document (DOCX)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  data-testid="button-download-validation"
                  onClick={handleValidationExport}
                  disabled={validationExportMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Validation Analysis ({format.toUpperCase()})
                </Button>
              </div>

              {/* File info */}
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium mb-1">What's included in this download:</p>
                <ul className="space-y-1 text-xs ml-4">
                  <li>• Comprehensive problem definition and validation methodology</li>
                  <li>• Solution-market fit analysis based on your research</li>
                  <li>• Customer validation insights from your ICP work</li>
                  <li>• Competitive gap analysis and differentiation opportunities</li>
                  <li>• Risk assessment with recommended mitigation strategies</li>
                  <li>• Actionable next steps for moving forward</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => goToStep(11)}
              data-testid="button-back-gtm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to GTM Download
            </Button>
            
            {data?.hasValidationExported ? (
              <Button
                onClick={handleContinueToFeedback}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="button-continue-feedback"
              >
                Continue to Feedback
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="button-complete-validation"
              >
                Complete Validation Step
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {validationExportMutation.isPending && (
        <LoadingOverlay message={`Generating your validation analysis as ${format.toUpperCase()}...`} />
      )}
    </div>
  );
}