import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWorkflow } from "@/hooks/use-workflow";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, HelpCircle, Plus, Upload, Menu, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import pdBuilderLogo from "@/assets/pd-builder-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { sessionId, updateSession, currentStep } = useWorkflow();
  const { toast } = useToast();
  const [saveFileUrl, setSaveFileUrl] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const saveFileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/save-file`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setSaveFileUrl(data.saveFilePath);
      
      // Automatically download the save file
      const link = document.createElement('a');
      link.href = data.saveFilePath;
      link.download = `pdbuilder-save-${sessionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Progress saved!",
        description: "Your save file has been downloaded automatically.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to create save file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProgress = () => {
    // Auto-save session data and generate save file
    updateSession({});
    saveFileMutation.mutate();
  };

  const restoreSessionMutation = useMutation({
    mutationFn: async (saveData: any) => {
      const res = await apiRequest("POST", "/api/sessions/restore", { saveData });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Progress restored!",
        description: "Your session has been restored successfully.",
      });
      // Navigate to the restored session
      setLocation(`/?session=${data.sessionId}`);
      window.location.reload(); // Refresh to load the restored session
    },
    onError: () => {
      toast({
        title: "Restore failed",
        description: "Failed to restore progress. Please check your save file.",
        variant: "destructive",
      });
    },
  });

  const handleResumeProgress = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target?.result as string);
        restoreSessionMutation.mutate(saveData);
      } catch (error) {
        toast({
          title: "Invalid file",
          description: "The selected file is not a valid save file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleNewSession = () => {
    // Clear local storage and reload to start fresh
    localStorage.removeItem('pdbuilder-session');
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 landscape-header safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isMobile ? 'h-14 landscape-compact' : 'h-16'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img 
                src={pdBuilderLogo} 
                alt="PD Builder - AI MVP Development Tool" 
                className={`${isMobile ? 'h-8' : 'h-10'} w-auto`}
              />
            </div>
          </div>
          <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"}
              onClick={() => setIsHelpOpen(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HelpCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </Button>
            {isMobile ? (
              <>
                <Button 
                  onClick={() => setLocation('/learning')}
                  size="sm"
                  variant="outline"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleSaveProgress}
                  disabled={saveFileMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setLocation('/learning')}
                  variant="outline"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Product Clarity Sprint
                </Button>
                <Button 
                  onClick={handleNewSession}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
                <Button 
                  onClick={handleSaveProgress}
                  disabled={saveFileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveFileMutation.isPending ? "Saving..." : "Save Progress"}
                </Button>
                {saveFileUrl && (
                  <Button 
                    onClick={handleResumeProgress}
                    disabled={restoreSessionMutation.isPending}
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {restoreSessionMutation.isPending ? "Restoring..." : "Resume Progress"}
                  </Button>
                )}
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
      
      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How to Use PDBUILDER</DialogTitle>
            <DialogDescription>
              Your AI-powered guide to creating investor-ready product requirements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Current Step: Step {currentStep}</h4>
              <p className="text-sm text-gray-600">
                {currentStep === 1 && "Describe the problem you want to solve. AI will analyze and refine your statement."}
                {currentStep === 2 && "AI will research your market, competitors, and trends to validate your idea."}
                {currentStep === 3 && "Discover the root causes of your problem using the 5 Whys technique."}
                {currentStep === 4 && "Explore existing solutions and competitors in your space."}
                {currentStep === 5 && "Define your ideal customer profile (ICP) and target market."}
                {currentStep === 6 && "Create detailed use cases showing how customers will use your product."}
                {currentStep === 7 && "Generate comprehensive product requirements and features."}
                {currentStep === 8 && "Prioritize features using AI-powered analysis and frameworks."}
                {currentStep === 9 && "Export your complete MVP specification as PDF or DOCX."}
                {currentStep === 10 && "Generate a comprehensive go-to-market strategy with AI analysis."}
                {currentStep === 11 && "Download your complete strategy document (MVP + GTM) as PDF or DOCX."}
                {currentStep === 12 && "Plan your product development with drag-and-drop roadmap milestones."}
                {currentStep === 13 && "Share feedback to help us improve PDBUILDER."}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Key Features</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc ml-4">
                <li><strong>Save Progress:</strong> Download your session data as a JSON file</li>
                <li><strong>Resume Progress:</strong> Upload a save file to continue where you left off</li>
                <li><strong>AI Analysis:</strong> Get intelligent insights and refinements at each step</li>
                <li><strong>Export Options:</strong> Generate professional PDF or DOCX documents</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Need More Help?</h4>
              <p className="text-sm text-gray-600">
                Check the "Helpful Tips" and "Resources" sections in the sidebar for step-specific guidance and useful templates.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
