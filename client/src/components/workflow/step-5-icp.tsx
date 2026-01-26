import { useMutation } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Users, ArrowRight, ArrowLeft, Target, Heart, DollarSign, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ICP {
  demographics: {
    age: string;
    jobRole: string;
    income: string;
    location?: string;
  };
  psychographics: {
    goals: string[];
    frustrations: string[];
    values: string[];
  };
  name: string;
  description: string;
}

export function Step5ICP() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();

  const icpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/icp`, {});
      return res.json() as Promise<ICP[]>;
    },
    onSuccess: (profiles) => {
      toast({
        title: "Customer profiles generated!",
        description: `Created ${profiles.length} ideal customer profile(s).`,
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate customer profiles. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateICP = () => {
    icpMutation.mutate();
  };

  const handleContinue = () => {
    const selectedICP = icpMutation.data?.[0] || workflowData.icp;
    completeStep(5, {
      icp: selectedICP,
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(4);
  };

  if (icpMutation.isPending) {
    return <LoadingOverlay message="Generating ideal customer profiles..." />;
  }

  const profiles = icpMutation.data || (workflowData.icp ? [workflowData.icp] : []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              5
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Create an Ideal Customer Profile (ICP)</CardTitle>
              <p className="text-gray-600">Define who experiences this problem the most</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Ideal Customer Profiles</h4>
                <p className="text-sm text-blue-700 mt-1">
                  An ICP defines your perfect customer - the person most likely to buy and benefit from your product. 
                  This profile guides all your product decisions, marketing efforts, and business strategy.
                </p>
              </div>
            </div>
          </div>

          {profiles.length === 0 && (
            <Button
              onClick={handleGenerateICP}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Generate Customer Profiles
            </Button>
          )}

          {/* Customer Profiles */}
          {profiles.map((profile, index) => (
            <Card key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-xl text-gray-900">{profile.name}</CardTitle>
                    <p className="text-gray-600">{profile.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Demographics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Demographics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="font-medium text-gray-900">{profile.demographics.age}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-500">Job Role</p>
                      <p className="font-medium text-gray-900">{profile.demographics.jobRole}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-500">Income</p>
                      <p className="font-medium text-gray-900">{profile.demographics.income}</p>
                    </div>
                    {profile.demographics.location && (
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{profile.demographics.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-green-600" />
                    Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.psychographics.goals.map((goal, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Frustrations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-red-600" />
                    Frustrations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.psychographics.frustrations.map((frustration, i) => (
                      <Badge key={i} variant="secondary" className="bg-red-100 text-red-800">
                        {frustration}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-purple-600" />
                    Values
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.psychographics.values.map((value, i) => (
                      <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {profiles.length > 0 ? (
              <Button
                onClick={handleContinue}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Use Case
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  disabled
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Continue to Use Case
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-amber-600">
                  Generate customer profiles to continue
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
