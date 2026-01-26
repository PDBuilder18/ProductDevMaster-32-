import { useEffect } from "react";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

// Import all workflow step components (named exports)
import { Step1Problem } from "@/components/workflow/step-1-problem";
import { Step2MarketResearch } from "@/components/workflow/step-2-market-research";
import { Step3RootCause } from "@/components/workflow/step-3-root-cause";
import { Step4ExistingSolutions } from "@/components/workflow/step-4-existing-solutions";
import { Step5ICP } from "@/components/workflow/step-5-icp";
import { Step6UseCase } from "@/components/workflow/step-6-use-case";
import { Step7Requirements } from "@/components/workflow/step-7-requirements";
import { Step8Prioritization } from "@/components/workflow/step-8-prioritization";
import { Step9Export } from "@/components/workflow/step-9-export";
import { Step10Feedback } from "@/components/workflow/step-10-feedback";
import { ProgressStepper } from "@/components/workflow/progress-stepper";

export default function Conversation() {
  const { session, isLoading, currentStep, completedSteps } = useWorkflow();

  // Auto-create session on page load
  useEffect(() => {
    if (!session && !isLoading) {
      // Session will be created by the useWorkflow hook
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Starting your MVP journey...</p>
        </div>
      </div>
    );
  }



  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">PDBUILDER</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered guide from idea to MVP
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Let's transform your startup idea into a structured, investor-ready product plan
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper />
        </div>

        {/* Workflow Step Content */}
        <div className="max-w-4xl mx-auto">
          {renderCurrentStep(currentStep, session)}
        </div>
      </div>
    </div>
  );
}

// Render the appropriate step component based on current step
function renderCurrentStep(currentStep: number, session: any) {
  const stepComponents = {
    1: <Step1Problem />,
    2: <Step2MarketResearch />,
    3: <Step3RootCause />,
    4: <Step4ExistingSolutions />,
    5: <Step5ICP />,
    6: <Step6UseCase />,
    7: <Step7Requirements />,
    8: <Step8Prioritization />,
    9: <Step9Export />,
    10: <Step10Feedback />
  };

  return stepComponents[currentStep as keyof typeof stepComponents] || stepComponents[1];
}