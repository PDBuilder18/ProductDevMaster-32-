import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Bot, CheckCircle, ArrowRight, MessageCircle, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProblemAnalysis {
  refined: string;
  aiSuggestions: string[];
  clarifyingQuestions?: string[];
}

interface ConversationMessage {
  type: 'question' | 'answer';
  content: string;
}

export function Step1Problem() {
  const { sessionId, workflowData, completeStep, updateWorkflowData } = useWorkflow();
  const { toast } = useToast();
  const [problem, setProblem] = useState(
    (workflowData as any)?.problemStatement?.original || ""
  );
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerStarted) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStarted]);

  // Start timer when component mounts
  useEffect(() => {
    setTimerStarted(true);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const analysisMutation = useMutation({
    mutationFn: async (problemText: string) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/problem-analysis`, {
        problem: { original: problemText }
      });
      return res.json() as Promise<ProblemAnalysis>;
    },
    onSuccess: (analysis) => {
      if (analysis.clarifyingQuestions && analysis.clarifyingQuestions.length > 0) {
        // Start conversation mode with clarifying questions
        setAllQuestions(analysis.clarifyingQuestions);
        setCurrentQuestionIndex(0);
        setIsConversationMode(true);
        setConversation([{
          type: 'question',
          content: analysis.clarifyingQuestions[0]
        }]);
      } else {
        // Direct analysis without questions
        updateWorkflowData({
          problemStatement: {
            original: problem,
            refined: analysis.refined,
            aiSuggestions: analysis.aiSuggestions,
          }
        });
        toast({
          title: "Problem analyzed successfully!",
          description: "AI has refined your problem statement.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze problem statement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const conversationMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; originalProblem: string; conversationHistory: ConversationMessage[] }) => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/problem-conversation`, {
        question: data.question,
        answer: data.answer,
        originalProblem: data.originalProblem,
        conversationHistory: data.conversationHistory
      });
      return res.json() as Promise<{ nextQuestion?: string; refinedProblem?: string; isComplete: boolean }>;
    },
    onSuccess: (response) => {
      // This is only called after all questions are answered
      if (response.refinedProblem) {
        // Conversation complete, update problem statement and proceed to Market Research
        setProblem(response.refinedProblem);
        
        // Complete step 1 and automatically navigate to step 2 (Market Research)
        completeStep(1, {
          problemStatement: {
            original: response.refinedProblem,
            refined: response.refinedProblem,
            aiSuggestions: [],
          }
        });
        
        setIsConversationMode(false);
        setCurrentAnswer("");
        
        // Scroll to top so user sees Market Research step
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        toast({
          title: "Problem refined! Moving to Market Research",
          description: "Your problem statement is complete. Let's research the market.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Conversation failed",
        description: "Failed to process your answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (problem.trim().length < 10) {
      toast({
        title: "Problem too short",
        description: "Please describe your problem in more detail.",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate(problem.trim());
  };

  const handleAnswerSubmit = () => {
    if (currentAnswer.trim().length < 2) {
      toast({
        title: "Answer too short",
        description: "Please provide a more detailed answer.",
        variant: "destructive",
      });
      return;
    }

    // Add the current answer to conversation
    setConversation(prev => [...prev, { type: 'answer', content: currentAnswer.trim() }]);
    
    // Move to next question or finish
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < allQuestions.length) {
      // Show next question
      setCurrentQuestionIndex(nextIndex);
      setConversation(prev => [...prev, { type: 'question', content: allQuestions[nextIndex] }]);
      setCurrentAnswer("");
    } else {
      // All questions answered, send to backend for final processing
      const finalConversation: ConversationMessage[] = [...conversation, { type: 'answer', content: currentAnswer.trim() }];
      conversationMutation.mutate({
        question: allQuestions[currentQuestionIndex],
        answer: currentAnswer.trim(),
        originalProblem: problem,
        conversationHistory: finalConversation
      });
    }
  };

  const handleContinue = () => {
    completeStep(1, {
      problemStatement: {
        original: problem,
        refined: (workflowData as any)?.problemStatement?.refined,
        aiSuggestions: (workflowData as any)?.problemStatement?.aiSuggestions,
      }
    });
  };

  const applySuggestion = (suggestion: string) => {
    setProblem(suggestion);
  };

  if (analysisMutation.isPending) {
    return <LoadingOverlay message="Analyzing your problem statement..." />;
  }

  if (conversationMutation.isPending) {
    return <LoadingOverlay message="Processing your answer..." />;
  }

  const analysis = (workflowData as any)?.problemStatement;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              <span className="text-sm">▶</span>
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl font-semibold">Step 1: Problem Discovery</CardTitle>
              <p className="text-gray-600 text-sm mt-1">AI analyzes and refines your problem statement with clarifying questions</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">Estimated time: 3-5 min</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span data-testid="timer-display">{formatTime(elapsedTime)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '10%'}}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Step 1 of 10</span>
              <span>10% through workflow</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              Start by describing the problem you want to solve. Be specific about who experiences this problem and what impact it has.
            </p>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g., Small restaurants struggle with inventory management, leading to 30% food waste and thousands in lost profits monthly..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Minimum 10 characters required
            </p>
          </div>

          {!analysis?.refined && !isConversationMode && (
            <Button
              onClick={handleAnalyze}
              disabled={problem.trim().length < 10}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Clarifying Questions
            </Button>
          )}

          {/* AI Conversation Mode */}
          {isConversationMode && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                  AI Analysis Question {currentQuestionIndex + 1} of {allQuestions.length}
                </CardTitle>
                <p className="text-sm text-gray-600">Answer this question to help refine your problem statement</p>
                
                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`}}
                  ></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Question */}
                {allQuestions[currentQuestionIndex] && (
                  <div className="bg-blue-100 text-blue-900 p-4 rounded-lg">
                    <p className="font-medium">{allQuestions[currentQuestionIndex]}</p>
                  </div>
                )}

                {/* Answer Input */}
                <div className="flex gap-2">
                  <Input
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={currentAnswer.trim().length < 2}
                    size="sm"
                  >
                    {currentQuestionIndex < allQuestions.length - 1 ? (
                      <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
                    ) : (
                      <>Finish <Send className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                </div>

                {/* Previous answers summary */}
                {currentQuestionIndex > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Answered {currentQuestionIndex} of {allQuestions.length} questions
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Analysis Results */}
          {analysis?.refined && (
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    AI Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Refined Problem Statement:</h4>
                    <p className="text-gray-700 bg-white p-3 rounded border">{analysis.refined}</p>
                  </div>
                  
                  {analysis.aiSuggestions && analysis.aiSuggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Suggestions:</h4>
                      <div className="space-y-2">
                        {analysis.aiSuggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="flex items-start justify-between bg-white p-3 rounded border">
                            <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applySuggestion(suggestion)}
                              className="ml-2 text-xs"
                            >
                              Apply
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Continue Button - Only show when step is completed */}
          {analysis?.refined && !isConversationMode && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Market Research
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {/* Requirement reminder when not completed */}
          {!analysis?.refined && !isConversationMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-amber-800">
                <strong>Complete this step:</strong> Answer all questions and get AI analysis before proceeding to market research.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}