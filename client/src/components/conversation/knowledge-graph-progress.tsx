import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { KnowledgeGraphStage } from "@shared/schema";

interface KnowledgeGraphProgressProps {
  sessionId: string;
}

const STAGE_ORDER: KnowledgeGraphStage[] = [
  "problem-discovery",
  "customer-interviews",
  "icp-definition",
  "use-case-definition",
  "market-size-estimation",
  "product-requirements",
  "mvp-scope",
  "prototype",
  "user-testing",
  "product-market-fit-check"
];

export function KnowledgeGraphProgress({ sessionId }: KnowledgeGraphProgressProps) {
  const { data: session } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: allStages } = useQuery({
    queryKey: ["/api/stages"],
  });

  const formatStageTitle = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCurrentStageIndex = () => {
    return STAGE_ORDER.indexOf(session?.currentStage || "problem-discovery");
  };

  const getStageStatus = (stage: KnowledgeGraphStage) => {
    const completedStages = session?.completedStages || [];
    const currentStage = session?.currentStage || "problem-discovery";
    
    if (completedStages.includes(stage)) {
      return "completed";
    } else if (stage === currentStage) {
      return "current";
    } else {
      return "upcoming";
    }
  };

  const progressPercentage = ((session?.completedStages?.length || 0) / STAGE_ORDER.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Progress</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{session?.completedStages?.length || 0} of {STAGE_ORDER.length} stages</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {STAGE_ORDER.map((stage, index) => {
            const status = getStageStatus(stage);
            const stageInfo = allStages?.[stage];
            
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : status === "current" ? (
                    <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      status === "current" ? "text-primary-600" : 
                      status === "completed" ? "text-green-600" : 
                      "text-gray-600"
                    }`}>
                      {formatStageTitle(stage)}
                    </span>
                    {status === "current" && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  {stageInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stageInfo.description}
                    </p>
                  )}
                </div>
                
                {index < STAGE_ORDER.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}