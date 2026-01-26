import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WORKFLOW_STEPS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Rocket, CheckCircle, Circle } from "lucide-react";

export function WorkflowSidebar() {
  const { currentStep, completedSteps } = useWorkflow();

  const progressPercentage = (currentStep / WORKFLOW_STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <Rocket className="h-5 w-5 text-orange-500 mr-2" />
            10-Step MVP Development Workflow
          </CardTitle>
          <p className="text-sm text-gray-600">
            Complete each step to learn how product development works
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Step {currentStep} of 10</span>
              <span>{Math.round(progressPercentage)}% through workflow</span>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3">
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    isCurrent ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-center w-6 h-6 mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {step.id}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-medium leading-tight",
                        isCurrent ? "text-blue-900" : isCompleted ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        "text-xs leading-tight mt-1",
                        isCurrent ? "text-blue-700" : isCompleted ? "text-gray-600" : "text-gray-400"
                      )}
                    >
                      {step.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Est. {step.estimatedTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}