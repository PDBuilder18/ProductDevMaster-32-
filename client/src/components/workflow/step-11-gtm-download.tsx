import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Download, FileText, ArrowRight, ArrowLeft, CheckCircle, HelpCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GTMExportResult {
  downloadUrl: string;
  filename: string;
}

export function Step11GTMDownload() {
  const { sessionId, workflowData, completeStep, goToStep, updateWorkflowData } = useWorkflow();
  const { toast } = useToast();
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");

  const gtmExportMutation = useMutation({
    mutationFn: async (selectedFormat: "pdf" | "docx") => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/gtm-export`, {
        format: selectedFormat
      });
      return res.json() as Promise<GTMExportResult>;
    },
    onSuccess: (result) => {
      // Mark as GTM exported in workflow data so it persists across navigation
      updateWorkflowData({ hasGTMExported: true });
      
      toast({
        title: "Complete strategy document generated successfully!",
        description: `Your MVP configuration and Go-to-Market strategy have been exported as ${format.toUpperCase()}.`,
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
        description: "Failed to generate complete strategy document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGTMExport = () => {
    gtmExportMutation.mutate(format);
  };

  const handleContinue = () => {
    completeStep(11, {});
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(10);
  };

  // Check if GTM strategy exists
  const gtmStrategy = (workflowData as any)?.goToMarketStrategy;
  const hasExported = (workflowData as any)?.hasExported;

  if (gtmExportMutation.isPending) {
    return <LoadingOverlay message={`Generating your complete strategy document as ${format.toUpperCase()}...`} />;
  }

  return (
    <div className="space-y-6" data-testid="step-11-gtm-download">
      <Card>
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              <span className="text-sm">11</span>
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl font-semibold">Step 11: GTM Download - Complete Strategy Package</CardTitle>
              <p className="text-gray-600 text-sm mt-1">Download your comprehensive MVP and Go-to-Market strategy document</p>
              <p className="text-xs text-gray-500 mt-1">Estimated time: 2-3 min</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Step 11 of 13</span>
              <span>85% through workflow</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introduction */}
          <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                <Package className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Your Complete Strategy Package
                </h3>
                <p className="text-primary-700 dark:text-primary-300 text-sm mb-3">
                  Download a comprehensive document that includes:
                </p>
                <ul className="text-primary-700 dark:text-primary-300 text-sm space-y-1 ml-4">
                  <li>• Complete MVP Configuration (from Step 9)</li>
                  <li>• Detailed Go-to-Market Strategy</li>
                  <li>• Market Analysis & Customer Insights</li>
                  <li>• Implementation Timeline & Metrics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Prerequisites check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {hasExported ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <HelpCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-sm">MVP Export</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hasExported ? "Completed in Step 9" : "Complete Step 9 first"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {gtmStrategy ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <HelpCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-sm">GTM Strategy</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {gtmStrategy ? "Generated in Step 10" : "Complete Step 10 first"}
                </p>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          {gtmStrategy && (
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
                  data-testid="button-download-gtm"
                  onClick={handleGTMExport}
                  disabled={gtmExportMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Complete Strategy ({format.toUpperCase()})
                </Button>
              </div>

              {/* File info */}
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium mb-1">What's included in this download:</p>
                <ul className="space-y-1 text-xs ml-4">
                  <li>• All MVP configuration details from your workflow</li>
                  <li>• Complete Go-to-Market strategy with positioning & messaging</li>
                  <li>• Pricing recommendations and channel strategies</li>
                  <li>• Implementation timeline and success metrics</li>
                  <li>• Target market analysis and competitive insights</li>
                </ul>
              </div>
            </div>
          )}

          {/* Missing prerequisites message */}
          {!gtmStrategy && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Complete Previous Steps First
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    To download your complete strategy package, please ensure you have:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 ml-4 space-y-1">
                    {!hasExported && <li>• Completed the MVP export in Step 9</li>}
                    {!gtmStrategy && <li>• Generated your Go-to-Market strategy in Step 10</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <Button
              data-testid="button-back"
              onClick={handleBack}
              variant="outline"
              className="order-2 sm:order-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Go-to Market Strategy
            </Button>
            
            {gtmStrategy && (
              <Button
                data-testid="button-continue"
                onClick={handleContinue}
                className="order-1 sm:order-2 bg-primary-600 hover:bg-primary-700 ml-auto"
              >
                Continue to Problem-Solution Validation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}