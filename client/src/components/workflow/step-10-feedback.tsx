import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Star, MessageSquare, ArrowLeft, CheckCircle, ThumbsUp, HelpCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(10),
  helpfulness: z.number().min(1).max(10),
  improvements: z.string().optional(),
  mostValuable: z.string().optional(),
  wouldRecommend: z.string().optional(),
  recommendationReason: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export function Step10Feedback() {
  const { sessionId, completeStep, goToStep, startNewSession } = useWorkflow();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStartingNew, setIsStartingNew] = useState(false);

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      helpfulness: 0,
      improvements: "",
      mostValuable: "",
      wouldRecommend: "",
      recommendationReason: "",
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/feedback`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      completeStep(10, {});
      
      // Scroll to top so user sees the congratulations screen
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve PDBUILDER for future users.",
      });
    },
    onError: () => {
      toast({
        title: "Feedback submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackForm) => {
    feedbackMutation.mutate(data);
  };

  const handleBack = () => {
    goToStep(9);
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
              value >= star
                ? "bg-primary-600 border-primary-600 text-white"
                : "border-gray-300 text-gray-400 hover:border-primary-300"
            )}
          >
            {star}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {value === 0 ? "Click to rate" : `${value}/10`}
      </p>
    </div>
  );

  if (feedbackMutation.isPending) {
    return <LoadingOverlay message="Submitting your feedback..." />;
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Congratulations! 🎉
              </h2>
              <p className="text-lg text-green-800 mb-4">
                You've completed the MVP development process!
              </p>
              <p className="text-sm text-green-700 mb-6">
                Thank you for using PDBUILDER. Your feedback helps us improve the experience for future founders.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
                <div className="text-left space-y-2">
                  <div className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Use your MVP document to validate your idea with potential customers
                    </span>
                  </div>
                  <div className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Start building your prioritized features one by one
                    </span>
                  </div>
                  <div className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Share your plan with potential investors or co-founders
                    </span>
                  </div>
                  <div className="flex items-start">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Consider running a new session for additional product ideas
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => {
                    if (isStartingNew) return;
                    setIsStartingNew(true);
                    startNewSession();
                  }}
                  disabled={isStartingNew}
                  className="bg-primary-600 hover:bg-primary-700"
                  data-testid="button-start-new-session"
                >
                  {isStartingNew ? "Starting..." : "Start New Session"}
                </Button>
                <p className="text-xs text-gray-500">
                  Ready to develop another MVP?
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              <span className="text-sm">10</span>
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl font-semibold">Step 10: Share your feedback</CardTitle>
              <p className="text-gray-600 text-sm mt-1">Help us improve PDBUILDER for future founders</p>
              <p className="text-xs text-gray-500 mt-1">Estimated time: 2-3 min</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Step 10 of 10</span>
              <span>100% through workflow</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Why Your Feedback Matters</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your experience helps us improve PDBUILDER for future founders. Share what worked well, 
                  what could be better, and how this process has helped you learn about product development.
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Overall Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      label="Overall Experience (1-10)"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Helpfulness Rating */}
              <FormField
                control={form.control}
                name="helpfulness"
                render={({ field }) => (
                  <FormItem>
                    <StarRating
                      value={field.value}
                      onChange={field.onChange}
                      label="How helpful was this tool? (1-10)"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Improvements */}
              <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What could be improved?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share any suggestions for improvement, features you'd like to see, or issues you encountered..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quick Feedback Questions */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Quick Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Most Valuable Feature */}
                  <FormField
                    control={form.control}
                    name="mostValuable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-blue-900">
                          What was most valuable about this process?
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="structured-approach" id="structured" />
                              <Label htmlFor="structured" className="text-sm text-blue-800">
                                Structured approach to problem analysis
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ai-insights" id="ai" />
                              <Label htmlFor="ai" className="text-sm text-blue-800">
                                AI-powered insights and suggestions
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="market-research" id="market" />
                              <Label htmlFor="market" className="text-sm text-blue-800">
                                Market research and competitor analysis
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="prioritization" id="prioritization" />
                              <Label htmlFor="prioritization" className="text-sm text-blue-800">
                                Feature prioritization framework
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="mvp-document" id="document" />
                              <Label htmlFor="document" className="text-sm text-blue-800">
                                Comprehensive MVP document
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Would Recommend */}
                  <FormField
                    control={form.control}
                    name="wouldRecommend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-blue-900">
                          Would you recommend PDBUILDER to other founders?
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="recommend-yes" />
                              <Label htmlFor="recommend-yes" className="text-sm text-blue-800">
                                Yes, definitely
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="recommend-no" />
                              <Label htmlFor="recommend-no" className="text-sm text-blue-800">
                                No, not really
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recommendation Reason */}
                  {form.watch("wouldRecommend") && (
                    <FormField
                      control={form.control}
                      name="recommendationReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-blue-900">
                            {form.watch("wouldRecommend") === "yes" 
                              ? "Why would you recommend it?" 
                              : "What would need to improve for you to recommend it?"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your thoughts..."
                              rows={3}
                              {...field}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={form.watch("rating") === 0 || form.watch("helpfulness") === 0}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
