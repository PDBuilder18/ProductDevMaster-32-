import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Bot, CheckCircle, ArrowRight, ArrowLeft, Target, TrendingUp, Users, DollarSign, Calendar, BarChart, Award, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GoToMarketStrategy } from "@shared/schema";

export function Step10GoToMarket() {
  const { sessionId, workflowData, completeStep, goToStep, updateWorkflowData } = useWorkflow();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateGTMMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/go-to-market`, {
        workflowData
      });
      return res.json() as Promise<GoToMarketStrategy>;
    },
    onSuccess: (strategy) => {
      // Update workflow data with the generated strategy
      updateWorkflowData({
        goToMarketStrategy: strategy
      });
      setIsGenerating(false);
      toast({
        title: "Go-to Market Strategy Generated!",
        description: "AI has created a comprehensive GTM strategy based on your MVP.",
      });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate Go-to Market strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateGTMMutation.mutate();
  };

  const handleContinue = () => {
    // Ensure we have the GTM strategy before proceeding
    const currentStrategy = (workflowData as any)?.goToMarketStrategy;
    if (currentStrategy) {
      completeStep(10, {
        goToMarketStrategy: currentStrategy
      });
      // Scroll to top so user sees next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: "Strategy not ready",
        description: "Please generate the Go-to Market strategy first.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    goToStep(9);
  };

  if (isGenerating) {
    return <LoadingOverlay message="Generating your Go-to Market Strategy..." />;
  }

  const strategy = (workflowData as any)?.goToMarketStrategy as GoToMarketStrategy;

  // Check if we have any strategy data to display
  const hasStrategy = !!strategy;
  
  // Check if strategy is complete for enabling continue action
  const hasCompleteStrategy = strategy && 
    strategy.targetMarket?.beachhead && 
    strategy.targetMarket?.marketSize?.serviceableMarket &&
    strategy.valueProposition?.promise && 
    strategy.positioning?.statement &&
    strategy.pricing?.tiers?.length > 0 &&
    strategy.channels?.acquisition?.length > 0 &&
    strategy.programs?.paid?.tactics &&
    strategy.timeline?.phases?.length > 0 &&
    strategy.metrics?.acquisition?.length > 0 &&
    strategy.differentiation?.advantages?.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              10
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Go-to Market Strategy</CardTitle>
              <p className="text-gray-600">AI generates a comprehensive marketing strategy for your MVP</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasStrategy && (
            <div className="text-center py-8">
              <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Generate Your GTM Strategy
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Based on your problem definition, market research, customer profile, and MVP requirements, 
                AI will create a comprehensive go-to-market strategy including positioning, pricing, 
                distribution channels, and launch tactics.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generateGTMMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="button-generate-gtm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Go-to Market Strategy
              </Button>
            </div>
          )}

          {hasStrategy && (
            <div className="space-y-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Your Comprehensive Go-to Market Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* 1. Target Market */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <Users className="h-5 w-5 mr-2" />
                      1. Target Market
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Beachhead Market</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-beachhead">
                          {strategy?.targetMarket?.beachhead || "Beachhead market to be defined"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Serviceable Market</h4>
                          <p className="text-gray-700 bg-white p-3 rounded border text-sm" data-testid="text-serviceable-market">
                            {strategy?.targetMarket?.marketSize?.serviceableMarket || "Market size analysis pending"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Target Audience</h4>
                          <p className="text-gray-700 bg-white p-3 rounded border text-sm" data-testid="text-target-audience">
                            {strategy?.targetMarket?.marketSize?.targetAudience || "Target audience to be researched"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Revenue Projection</h4>
                          <p className="text-gray-700 bg-white p-3 rounded border text-sm" data-testid="text-revenue-projection">
                            {strategy?.targetMarket?.marketSize?.revenueProjection || "Revenue potential to be calculated"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Category Context</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-category-context">
                          {strategy?.targetMarket?.categoryContext || "Market category analysis to be completed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Value Proposition */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <Target className="h-5 w-5 mr-2" />
                      2. Value Proposition
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Core Promise</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-promise">
                          {strategy?.valueProposition?.promise || "Core value promise to be defined"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">MVP Outcomes</h4>
                        <div className="bg-white p-3 rounded border">
                          <ul className="list-disc list-inside text-gray-700 space-y-1" data-testid="list-outcomes">
                            {(strategy?.valueProposition?.outcomes || []).map((outcome, index) => (
                              <li key={index}>{outcome}</li>
                            ))}
                            {(!strategy?.valueProposition?.outcomes || strategy.valueProposition.outcomes.length === 0) && (
                              <li className="text-gray-500 italic">MVP outcomes to be defined</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Result</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-result">
                          {strategy?.valueProposition?.result || "Expected result to be defined"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Positioning & Messaging */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <Award className="h-5 w-5 mr-2" />
                      3. Positioning & Messaging
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Positioning Statement</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-positioning">
                          {strategy?.positioning?.statement || "Market positioning statement to be defined"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Hero Message</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border font-medium" data-testid="text-hero-message">
                          {strategy?.positioning?.heroMessage || "Hero message to be crafted"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Primary CTAs</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="flex gap-2 flex-wrap" data-testid="list-ctas">
                            {(strategy?.positioning?.primaryCTAs || []).map((cta, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{cta}</span>
                            ))}
                            {(!strategy?.positioning?.primaryCTAs || strategy.positioning.primaryCTAs.length === 0) && (
                              <span className="text-gray-500 italic">Primary CTAs to be defined</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Pricing & Packaging */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <DollarSign className="h-5 w-5 mr-2" />
                      4. Pricing & Packaging
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pricing Tiers</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="pricing-tiers">
                          {(strategy?.pricing?.tiers || []).map((tier, index) => (
                            <Card key={index} className="border-2">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{tier?.name || "Pricing Tier"}</CardTitle>
                                <p className="text-2xl font-bold text-blue-600">{tier?.price || "TBD"}</p>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {(tier?.features || []).map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-center">
                                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                  {(!tier?.features || tier.features.length === 0) && (
                                    <li className="text-gray-500 italic">Features to be defined</li>
                                  )}
                                </ul>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Pricing Rationale</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-pricing-rationale">
                          {strategy?.pricing?.rationale || "Pricing strategy rationale to be developed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5. Channels */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      5. Channels
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Acquisition Channels</h4>
                        <div className="bg-white p-3 rounded border">
                          <ul className="list-disc list-inside text-gray-700 space-y-1" data-testid="list-acquisition">
                            {(strategy?.channels?.acquisition || []).map((channel, index) => (
                              <li key={index}>{channel}</li>
                            ))}
                            {(!strategy?.channels?.acquisition || strategy.channels.acquisition.length === 0) && (
                              <li className="text-gray-500 italic">Acquisition channels to be identified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Distribution Channels</h4>
                        <div className="bg-white p-3 rounded border">
                          <ul className="list-disc list-inside text-gray-700 space-y-1" data-testid="list-distribution">
                            {(strategy?.channels?.distribution || []).map((channel, index) => (
                              <li key={index}>{channel}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Core Programs & Tactics */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <BarChart className="h-5 w-5 mr-2" />
                      6. Core Programs & Tactics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Paid Advertising</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Tactics</h5>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {(strategy?.programs?.paid?.tactics || []).map((tactic, index) => (
                                <li key={index}>{tactic}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-1">Creative Strategy</h5>
                            <p className="text-sm text-gray-700">{strategy?.programs?.paid?.creative || "Creative strategy to be developed"}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Content Marketing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Tactics</h5>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {(strategy?.programs?.content?.tactics || []).map((tactic, index) => (
                                <li key={index}>{tactic}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-1">Lead Magnets</h5>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {(strategy?.programs?.content?.leadMagnets || []).map((magnet, index) => (
                                <li key={index}>{magnet}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Institutional</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {(strategy?.programs?.institutional?.tactics || []).map((tactic, index) => (
                              <li key={index}>{tactic}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Referrals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Program</h5>
                            <p className="text-sm text-gray-700">{strategy?.programs?.referrals?.program || "Referral program to be designed"}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-1">Triggers</h5>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {(strategy?.programs?.referrals?.triggers || []).map((trigger, index) => (
                                <li key={index}>{trigger}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 7. Execution Timeline */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <Calendar className="h-5 w-5 mr-2" />
                      7. Execution Timeline
                    </h3>
                    <div className="space-y-4">
                      {(strategy?.timeline?.phases || []).map((phase, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{phase?.name || "Phase"}</CardTitle>
                              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {phase?.duration || "TBD"}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Key Activities</h5>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {(phase?.activities || []).map((activity, aIndex) => (
                                  <li key={aIndex}>{activity}</li>
                                ))}
                                {(!phase?.activities || phase.activities.length === 0) && (
                                  <li className="text-gray-500 italic">Activities to be defined</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-2">Success Milestones</h5>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {(phase?.milestones || []).map((milestone, mIndex) => (
                                  <li key={mIndex} className="flex items-center">
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                    {milestone}
                                  </li>
                                ))}
                                {(!phase?.milestones || phase.milestones.length === 0) && (
                                  <li className="text-gray-500 italic">Milestones to be defined</li>
                                )}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* 8. Metrics (AARRR) */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <BarChart className="h-5 w-5 mr-2" />
                      8. Metrics (AARRR Framework)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Card className="text-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-blue-600">Acquisition</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {(strategy?.metrics?.acquisition || []).map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-green-600">Activation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {(strategy?.metrics?.activation || []).map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-yellow-600">Retention</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {(strategy?.metrics?.retention || []).map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-purple-600">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {(strategy?.metrics?.revenue || []).map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-red-600">Referral</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {(strategy?.metrics?.referral || []).map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 9. Differentiation */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center border-b border-gray-200 pb-2">
                      <Award className="h-5 w-5 mr-2" />
                      9. Differentiation & Competitive Advantage
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Key Advantages</h4>
                        <div className="bg-white p-3 rounded border">
                          <ul className="list-disc list-inside text-gray-700 space-y-1" data-testid="list-advantages">
                            {(strategy?.differentiation?.advantages || []).map((advantage, index) => (
                              <li key={index}>{advantage}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Defensibility Strategy</h4>
                        <p className="text-gray-700 bg-white p-3 rounded border" data-testid="text-defensibility">
                          {strategy?.differentiation?.defensibility || "Market defensibility analysis to be developed"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {hasCompleteStrategy && (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="button-continue"
              >
                Continue to GTM Download
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}