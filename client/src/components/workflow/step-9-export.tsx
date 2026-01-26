import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Download, FileText, ArrowRight, ArrowLeft, CheckCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportResult {
  downloadUrl: string;
  filename: string;
}

export function Step9Export() {
  const { sessionId, workflowData, completeStep, goToStep, updateWorkflowData } = useWorkflow();
  const { toast } = useToast();
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");

  const exportMutation = useMutation({
    mutationFn: async (selectedFormat: "pdf" | "docx") => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/export`, {
        format: selectedFormat
      });
      return res.json() as Promise<ExportResult>;
    },
    onSuccess: (result) => {
      // Mark as exported in workflow data so it persists across navigation
      updateWorkflowData({ hasExported: true });
      
      toast({
        title: "Document generated successfully!",
        description: `Your MVP configuration has been exported as ${format.toUpperCase()}.`,
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
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate(format);
  };

  const handleContinue = () => {
    completeStep(9, {});
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(8);
  };

  if (exportMutation.isPending) {
    return <LoadingOverlay message={`Generating your MVP document as ${format.toUpperCase()}...`} />;
  }

  // Check if user has exported at least once (persists across navigation)
  const hasEverExported = (workflowData as any)?.hasExported || exportMutation.isSuccess;
  const isCurrentlyExported = exportMutation.isSuccess;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              9
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Export your MVP Configuration</CardTitle>
              <p className="text-gray-600">Generate a comprehensive document with all your work</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About MVP Documentation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your MVP document contains everything you've learned about your market, customers, and product requirements. 
                  Use it to guide development, communicate with stakeholders, and validate your assumptions.
                </p>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                Document Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Problem Statement</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Market Research Results</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Root Cause Analysis</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Competitive Analysis</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Ideal Customer Profile</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Use Case Scenarios</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Product Requirements</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">Prioritized Feature List</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          {!isCurrentlyExported && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Format
                </label>
                <Select value={format} onValueChange={(value: "pdf" | "docx") => setFormat(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF - For easy sharing and printing</SelectItem>
                    <SelectItem value="docx">DOCX - For editing and collaboration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExport}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate & Download {format.toUpperCase()}
              </Button>
            </div>
          )}

          {/* Success State */}
          {isCurrentlyExported && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">
                    Document Generated Successfully!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Your MVP configuration document has been generated and should download automatically.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => exportMutation.mutate(format)}
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Again
                    </Button>
                    <Button
                      onClick={() => exportMutation.mutate(format === "pdf" ? "docx" : "pdf")}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download as {format === "pdf" ? "DOCX" : "PDF"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Sections Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Problem & Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Problem:</span>
                  <p className="text-gray-600 mt-1 line-clamp-2">
                    {(workflowData as any)?.problemStatement?.refined || (workflowData as any)?.problemStatement?.original || "Not defined"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Root Cause:</span>
                  <p className="text-gray-600 mt-1 line-clamp-2">
                    {(workflowData as any)?.rootCause?.primaryCause || "Not analyzed"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Customer & Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Target Customer:</span>
                  <p className="text-gray-600 mt-1">
                    {(workflowData as any)?.icp?.name || "Not defined"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">MVP Features:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(workflowData as any)?.prioritization?.features?.slice(0, 3).map((feature: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature?.name || 'Feature'}
                      </Badge>
                    )) || <span className="text-gray-600">Not prioritized</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {hasEverExported ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Feedback
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Feedback
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Generate and export document to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
