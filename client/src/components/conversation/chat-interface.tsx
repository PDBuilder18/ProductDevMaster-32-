import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Bot, ArrowRight } from "lucide-react";
import { KnowledgeGraphStage, ConversationMessage } from "@shared/schema";

interface ChatInterfaceProps {
  sessionId: string;
}

interface StageInfo {
  title: string;
  description: string;
  explanation: string;
  example: string;
  nextStage?: KnowledgeGraphStage;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get session data
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Get current stage info
  const { data: stageInfo } = useQuery<StageInfo>({
    queryKey: ["/api/stages", session?.currentStage],
    enabled: !!session?.currentStage,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/conversation`, { message: messageContent });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      setMessage("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [session?.conversationHistory]);

  const validateMessage = (text: string) => {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length;
    
    if (trimmed.length < 3) {
      return { isValid: false, reason: "Please enter a more detailed message." };
    }
    
    if (wordCount < 2) {
      return { isValid: false, reason: "Please provide more context in your message." };
    }
    
    // Check for very short responses that might need clarification
    const shortResponses = ['yes', 'no', 'ok', 'sure', 'maybe', 'idk', 'dunno', 'fine', 'good'];
    if (shortResponses.includes(trimmed.toLowerCase())) {
      return { isValid: false, reason: "Please provide more detail. Can you elaborate on your response?" };
    }
    
    return { isValid: true };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const validation = validateMessage(message);
    if (!validation.isValid) {
      setValidationError(validation.reason);
      // Clear error after 3 seconds
      setTimeout(() => {
        setValidationError(null);
      }, 3000);
      return;
    }
    
    setValidationError(null);
    sendMessageMutation.mutate(message.trim());
  };

  const formatStageTitle = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stage Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {stageInfo?.title || formatStageTitle(session?.currentStage || "")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {stageInfo?.description || "Let's work on your startup journey"}
              </p>
            </div>
            <Badge variant="secondary">
              Stage {(session?.completedStages?.length || 0) + 1} of 10
            </Badge>
          </div>
        </CardHeader>
        {stageInfo?.explanation && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-2">
              {stageInfo.explanation}
            </p>
            {stageInfo.example && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">
                  <strong>Example:</strong> {stageInfo.example}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {session?.conversationHistory?.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2" />
                  <p>Welcome! I'm here to help you develop your startup idea into an MVP.</p>
                  <p className="text-sm mt-1">Let's start by understanding your problem. What challenge are you trying to solve?</p>
                </div>
              )}
              
              {session?.conversationHistory?.map((msg: ConversationMessage) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <Bot className="h-8 w-8 text-primary-600 bg-primary-50 rounded-full p-1" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-gray-600 bg-gray-100 rounded-full p-1" />
                    </div>
                  )}
                </div>
              ))}
              
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <Bot className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="pt-4">
            {validationError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {validationError}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Next Stage Preview */}
      {stageInfo?.nextStage && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Next up:</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium">
                {formatStageTitle(stageInfo.nextStage)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}