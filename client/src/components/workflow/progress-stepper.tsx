import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WORKFLOW_STEPS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProgressStepper() {
  const { currentStep, completedSteps } = useWorkflow();

  const progressPercentage = (currentStep / WORKFLOW_STEPS.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">MVP Development Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                  currentStep === step.id
                    ? "bg-primary-600 text-white"
                    : completedSteps.includes(step.id)
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step.id}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    currentStep === step.id || completedSteps.includes(step.id)
                      ? "text-gray-900"
                      : "text-gray-500"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "text-xs leading-tight mt-0.5",
                    currentStep === step.id || completedSteps.includes(step.id)
                      ? "text-gray-600"
                      : "text-gray-400"
                  )}
                >
                  {step.description} • {step.estimatedTime}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Step {currentStep} of {WORKFLOW_STEPS.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </CardContent>
    </Card>
  );
}
