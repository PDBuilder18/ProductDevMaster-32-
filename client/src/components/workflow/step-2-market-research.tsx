import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Search, ArrowRight, ArrowLeft, TrendingUp, BookOpen, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketResearchFindings {
  marketSize: string;
  competitors: string[];
  trends: string[];
  references?: Array<{
    source: string;
    title: string;
    relevance: string;
    url?: string;
  }>;
  confidence: number;
  dataSource?: 'search-api' | 'ai-generated' | 'fallback';
}

export function Step2MarketResearch() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();
  const [allowSearch, setAllowSearch] = useState(true);
  const [existingData, setExistingData] = useState(
    (workflowData as any).marketResearch?.existingData || ""
  );

  const researchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/market-research`, {
        marketResearch: {
          permission: allowSearch,
          existingData: existingData || undefined,
        }
      });
      return res.json() as Promise<MarketResearchFindings>;
    },
    onSuccess: (findings) => {
      toast({
        title: "Market research completed!",
        description: `Found ${findings.competitors.length} competitors and ${findings.trends.length} trends.`,
      });
    },
    onError: () => {
      toast({
        title: "Research failed",
        description: "Failed to conduct market research. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConductResearch = () => {
    researchMutation.mutate();
  };

  const handleContinue = () => {
    completeStep(2, {
      marketResearch: {
        permission: allowSearch,
        existingData,
        findings: researchMutation.data,
      }
    });
    
    // Scroll to top so user sees Root Cause Analysis step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(1);
  };

  if (researchMutation.isPending) {
    return <LoadingOverlay message="Conducting market research..." />;
  }

  const findings = researchMutation.data || (workflowData as any).marketResearch?.findings;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              2
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Market Research</CardTitle>
              <p className="text-gray-600">Let AI analyze the market for your problem</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-search"
                checked={allowSearch}
                onCheckedChange={(checked) => setAllowSearch(checked === true)}
              />
              <Label htmlFor="allow-search" className="text-sm">
                Allow AI to search online for market data and competitors
              </Label>
            </div>
            
            <p className="text-sm text-gray-600">
              AI will search for market size, competitors, and trends related to your problem.
              This helps validate your idea and understand the competitive landscape.
            </p>
          </div>

          {!allowSearch && (
            <div>
              <Label htmlFor="existing-data">Existing Market Data (Optional)</Label>
              <Textarea
                id="existing-data"
                rows={3}
                value={existingData}
                onChange={(e) => setExistingData(e.target.value)}
                placeholder="Share any market data or competitor information you already know..."
                className="mt-2"
              />
            </div>
          )}

          {!findings && (
            <Button
              onClick={handleConductResearch}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Start Market Research
            </Button>
          )}

          {/* Research Results */}
          {findings && (
            <div className="space-y-4">
              {findings.dataSource === 'ai-generated' && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4" data-testid="disclaimer-ai-generated">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900">AI-Generated Research — Verify Independently</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        This market research was generated by AI based on its training data, not from live web searches. 
                        Market sizes, competitor details, growth rates, and pricing information are <strong>directional estimates</strong> and 
                        may not reflect current reality. Always verify critical data points using independent sources before making business decisions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {findings.dataSource === 'fallback' && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4" data-testid="disclaimer-fallback">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">General Research Framework</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        This research provides a general framework to guide your market analysis. 
                        For specific data, we recommend using sources like Statista, IBISWorld, or Crunchbase.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {findings.dataSource === 'search-api' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="notice-search-api">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Research Based on Live Web Data</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This research was sourced from live web search results. While more current than AI-only analysis, 
                        you should still verify key figures independently before relying on them for major decisions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Market Research Results
                    {findings.dataSource && (
                      <Badge variant="secondary" className="text-xs ml-2" data-testid="badge-data-source">
                        {findings.dataSource === 'search-api' ? 'Web Search' : findings.dataSource === 'ai-generated' ? 'AI Generated' : 'General Framework'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      Market Size
                      {findings.dataSource === 'ai-generated' && (
                        <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded" data-testid="label-estimate">
                          Directional Estimate
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">{findings.marketSize}</p>
                  </div>

                  {findings.competitors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Competitors Found
                        {findings.dataSource === 'ai-generated' && (
                          <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Verify Independently
                          </span>
                        )}
                      </h4>
                      <ul className="text-sm text-gray-700 mt-1 space-y-1">
                        {findings.competitors.map((competitor: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
                            {competitor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {findings.trends.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Market Trends
                        {findings.dataSource === 'ai-generated' && (
                          <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Directional Estimate
                          </span>
                        )}
                      </h4>
                      <ul className="text-sm text-gray-700 mt-1 space-y-1">
                        {findings.trends.map((trend: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-orange-600 rounded-full mr-2 mt-1.5"></span>
                            <span>{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {findings.references && findings.references.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        References & Sources
                      </h4>
                      <div className="text-sm text-gray-700 mt-2 space-y-2">
                        {findings.references.map((ref: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="font-medium text-gray-900">{ref.source}</div>
                              {ref.url && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 underline flex items-center gap-1"
                                  data-testid={`link-citation-${index}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Source
                                </a>
                              )}
                            </div>
                            <div className="text-gray-700 mt-1">{ref.title}</div>
                            <div className="text-gray-600 text-xs mt-1">
                              <span className="font-medium">Provides:</span> {ref.relevance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((findings.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(findings.confidence || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3" data-testid="disclaimer-verify">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Note:</span> All market sizes, growth rates, and financial figures presented here are directional estimates. 
                      They are intended to guide your thinking, not replace thorough independent market validation. 
                      We recommend cross-referencing key data points with sources like Statista, IBISWorld, Crunchbase, or relevant industry reports.
                    </p>
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
            {findings ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Root Cause Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Root Cause Analysis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Complete market research to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
