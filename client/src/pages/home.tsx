import { useWorkflow } from "@/hooks/use-workflow";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { WorkflowSidebar } from "../components/layout/workflow-sidebar";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { HelpCircle, Save, Menu, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Step components
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

export default function Home() {
  const { currentStep, isLoading, updateWorkflowData, workflowData, resetToStep } = useWorkflow();
  const { toast } = useToast();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return <LoadingOverlay message="Loading your workspace..." />;
  }

  const handleSave = () => {
    // Save current progress - Session is auto-saved
    toast({
      title: "Progress saved",
      description: "Your work has been saved successfully.",
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Problem />;
      case 2:
        return <Step2MarketResearch />;
      case 3:
        return <Step3RootCause />;
      case 4:
        return <Step4ExistingSolutions />;
      case 5:
        return <Step5ICP />;
      case 6:
        return <Step6UseCase />;
      case 7:
        return <Step7Requirements />;
      case 8:
        return <Step8Prioritization />;
      case 9:
        return <Step9Export />;
      case 10:
        return <Step10Feedback />;
      default:
        return <Step1Problem />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 landscape-compact">
      <Header />
      
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 ${isMobile ? 'py-4 landscape-padding' : 'py-8'}`}>
        {isMobile ? (
          // Mobile Layout - Single Column
          <div className="space-y-4">
            {/* Mobile Navigation Bar */}
            <div className="flex gap-2 mb-4">
              <Sheet open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
                <SheetTrigger asChild>
                  <button className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <Menu className="h-4 w-4" />
                    Steps
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 landscape-sidebar">
                  <SheetHeader>
                    <SheetTitle>Workflow Steps</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 landscape-compact">
                    <WorkflowSidebar />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Sheet open={isResourcesOpen} onOpenChange={setIsResourcesOpen}>
                <SheetTrigger asChild>
                  <button className="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <Book className="h-4 w-4" />
                    Resources
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 landscape-sidebar">
                  <SheetHeader>
                    <SheetTitle>Tips & Resources</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 landscape-compact">
                    <Sidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Main Content */}
            <div className="w-full">
              {renderCurrentStep()}
            </div>
          </div>
        ) : (
          // Desktop Layout - Grid
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Workflow Steps */}
            <div className="col-span-3">
              <WorkflowSidebar />
            </div>
            
            {/* Main Content */}
            <div className="col-span-6">
              {renderCurrentStep()}
            </div>
            
            {/* Right Sidebar - Tips & Resources */}
            <div className="col-span-3">
              <Sidebar />
            </div>
          </div>
        )}
      </main>

      {/* Quick Actions - Responsive positioning */}
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} space-y-3 z-40 safe-area-bottom`}>
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogTrigger asChild>
            <button className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Help & Support</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How to use this tool:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Follow the 11-step process in order</li>
                  <li>• Each step builds on the previous one</li>
                  <li>• Use the AI suggestions to improve your answers</li>
                  <li>• Your progress is automatically saved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Step: {currentStep}</h4>
                <p className="text-sm text-gray-600">
                  {currentStep === 1 && "Define the problem you want to solve clearly and specifically."}
                  {currentStep === 2 && "Research the market size, competitors, and trends."}
                  {currentStep === 3 && "Analyze the root causes of the problem."}
                  {currentStep === 4 && "Find and analyze existing solutions in the market."}
                  {currentStep === 5 && "Define your ideal customer profile."}
                  {currentStep === 6 && "Create detailed use case scenarios."}
                  {currentStep === 7 && "List the product requirements and features."}
                  {currentStep === 8 && "Prioritize features for your MVP."}
                  {currentStep === 9 && "Export your completed document."}
                  {currentStep === 10 && "Create your Go-to-Market strategy."}
                  {currentStep === 11 && "Provide feedback on your experience."}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Need more help?</h4>
                <p className="text-sm text-gray-600">
                  Check the helpful tips in the left sidebar or contact support for additional assistance.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Having navigation issues?</h4>
                <p className="text-sm text-gray-600 mb-2">If you're unable to navigate properly, you can reset to an earlier step:</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => resetToStep(9)} 
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    Go to Step 9
                  </button>
                  <button 
                    onClick={() => resetToStep(10)} 
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    Go to Step 10
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <button 
          onClick={handleSave}
          className="w-12 h-12 bg-primary-600 shadow-lg rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
        >
          <Save className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
