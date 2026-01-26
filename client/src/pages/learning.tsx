import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  PenTool, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  HelpCircle,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RootCauseTree } from "@/components/visualization/RootCauseTree";
import type { 
  StageDef, 
  LearningStageState, 
  LearningStageId, 
  RequiredField, 
  LearningData,
  StageGrade,
  StageArtifact
} from "@shared/learningStages";

const STAGES_ORDER: LearningStageId[] = [
  'problem-definition', 'market-research', 'root-cause', 'existing-solutions', 'customer-profile',
  'use-case', 'requirements', 'prioritization', 'export-document', 'feedback'
];

type SafeStageDef = Omit<StageDef, 'ai_output_spec'>;

function LearningNav({ 
  stages, 
  currentStageId, 
  learningData 
}: { 
  stages: SafeStageDef[]; 
  currentStageId: string;
  learningData: LearningData;
}) {
  const [, setLocation] = useLocation();
  
  const getStatusIcon = (stageId: string) => {
    const state = learningData[stageId];
    if (!state || state.status === 'not-started') return null;
    if (state.status === 'mastered' || state.status === 'generated') 
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (state.status === 'graded') 
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <PenTool className="h-4 w-4 text-blue-500" />;
  };

  const getStageOrder = (stageId: string) => {
    return STAGES_ORDER.indexOf(stageId as LearningStageId) + 1;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {stages.sort((a, b) => getStageOrder(a.id) - getStageOrder(b.id)).map((stage) => (
        <Button
          key={stage.id}
          variant={stage.id === currentStageId ? "default" : "outline"}
          size="sm"
          onClick={() => setLocation(`/learning/${stage.id}`)}
          className="flex items-center gap-1"
        >
          <span className="text-xs">{getStageOrder(stage.id)}</span>
          <span className="hidden sm:inline">{stage.title.split(':')[0].trim()}</span>
          {getStatusIcon(stage.id)}
        </Button>
      ))}
    </div>
  );
}

function LearnTab({ stage }: { stage: SafeStageDef }) {
  return (
    <div className="space-y-6">
      {stage.coreConceptDescription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Core Concept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{stage.coreConceptDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Core Concept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{stage.concept}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <ThumbsUp className="h-5 w-5" />
              Good Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">{stage.example_good}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <ThumbsDown className="h-5 w-5" />
              Poor Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">{stage.example_bad}</p>
          </CardContent>
        </Card>
      </div>

      {stage.id === 'problem-definition' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"If you get this right:\n\nYour MVP becomes obvious\n\nYou avoid months of wasted build\n\nYour product becomes easier to explain to developers and investors\n\nIf you get it wrong:\n\nEverything downstream becomes guesswork."}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'market-research' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why It Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most early products fail not because the idea was bad—but because the problem wasn't as painful, urgent, or underserved as assumed.\n\nGood market research helps you:\n\nAvoid building something users already tolerate\n\nFind gaps competitors consistently fail to address\n\nUnderstand what users will actually switch and pay for\n\nEnter mentor and investor conversations with credibility\n\nIn accelerators, this step is often what separates:\n\n\"Interesting idea\"\nfrom\n\"This is grounded in real demand\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'root-cause' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most early products fail because they solve the wrong thing well.\n\nWithout a clear root cause:\n\nYou risk building features that treat symptoms\n\nImprovements won't compound\n\nThe problem reappears under pressure or scale\n\nWith a strong root cause:\n\nYour MVP targets the real lever\n\nMentors and investors can quickly follow your logic\n\nYour solution has a higher chance of sticking once adopted\n\nIn accelerators, this step often separates:\n\n\"They understand the problem\"\nfrom\n\"They understand why the problem exists\"."}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'existing-solutions' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most founders underestimate how hard it is to beat the status quo.\n\nIf you don't understand existing solutions:\n\nYou may build something users won't switch to\n\nYour differentiation stays vague\n\nYour MVP solves a problem users already tolerate\n\nWhen you do this well:\n\nYour MVP is shaped by real constraints\n\nYour positioning becomes credible\n\nMentors and investors can quickly see why now and why you\n\nIn accelerators, this step often answers:\n\n\"Why hasn't someone already solved this?\"."}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'customer-profile' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most early products don't fail because the solution was weak—they fail because the buyer was unclear.\n\nWithout a strong customer profile:\n\nYou don't know who to interview\n\nMessaging stays generic\n\nSales and adoption stall\n\nMVP scope balloons to \"serve everyone\"\n\nWith a clear ICP:\n\nYour MVP is easier to define\n\nValidation becomes faster\n\nMentors can give sharper feedback\n\nGo-to-market decisions become obvious\n\nIn accelerators, this step often answers:\n\n\"Who would actually pay for this—and why?\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'use-case' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Use cases are the bridge between strategy and execution.\n\nWithout clear use cases:\n\nFeatures creep in arbitrarily\n\nRequirements become generic\n\nMVP scope expands uncontrollably\n\nWith strong use cases:\n\nTeams know exactly what to build\n\nRequirements stay focused\n\nValidation becomes measurable\n\nMentors can quickly assess realism\n\nIn accelerators, this step often answers:\n\n\"What will someone actually do with this product?\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'requirements' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most early products fail not because they were poorly built—but because nobody agreed on what success looked like.\n\nWithout strong requirements:\n\nBuilders make assumptions\n\nQA becomes subjective\n\nScope creeps quietly\n\nMVPs balloon or stall\n\nWith strong requirements:\n\nExecution speeds up\n\nValidation becomes objective\n\nTradeoffs are easier to make\n\nTeams stay aligned under pressure\n\nIn accelerators, this step often answers:\n\n\"What exactly are you building in the MVP—and what are you not?\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'prioritization' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Many teams fail not because they chose the wrong idea—but because they tried to do too much at once.\n\nWithout clear prioritization:\n\nMVPs become bloated\n\nTimelines slip\n\nValidation is delayed\n\nTeams burn energy on low-signal work\n\nWith strong prioritization:\n\nTeams ship sooner\n\nFeedback loops tighten\n\nInvestors see discipline\n\nProduct direction stays coherent\n\nIn accelerators, this step often answers:\n\n\"Why is this the right MVP to build first?\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'export-document' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"Most early teams have ideas — very few can explain them clearly.\n\nWithout a strong MVP Requirements document:\n\nMentors give vague feedback\n\nEngineers make assumptions\n\nScope drifts\n\nValidation stalls\n\nWith a strong one:\n\nFeedback becomes sharp and useful\n\nExecution aligns quickly\n\nInvestors see discipline\n\nTeams move faster with less rework\n\nIn accelerators, this step often answers:\n\n\"Can this team actually think and execute end-to-end?\""}</p>
          </CardContent>
        </Card>
      )}

      {stage.id === 'feedback' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Target className="h-5 w-5" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{"The difference between first-time founders and great founders is how fast they learn.\n\nWithout deliberate reflection:\n\nMistakes repeat\n\nConfidence becomes brittle\n\nFeedback feels personal instead of useful\n\nWith strong Founder Mode:\n\nLearning compounds\n\nDecisions improve faster\n\nMentors trust your judgment\n\nYou build conviction without ego\n\nIn accelerators, this step often answers:\n\n\"Is this founder coachable and self-aware?\""}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            How to Know You Nailed It
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {stage.rubric.map((criterion) => (
              <li key={criterion.id} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">{criterion.label}</Badge>
                <span className="text-sm text-muted-foreground">{criterion.description}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function renderFormField(
  field: RequiredField, 
  value: string | string[] | number | undefined, 
  onChange: (val: string | string[]) => void
) {
  const stringValue = Array.isArray(value) ? value.join(', ') : String(value || '');

  switch (field.type) {
    case 'longText':
      return (
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      );
    case 'select':
      return (
        <select
          id={field.id}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'multi':
    case 'links':
      return (
        <Textarea
          id={field.id}
          placeholder={field.placeholder || 'Enter items separated by commas or new lines'}
          value={stringValue}
          onChange={(e) => onChange(e.target.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean))}
          rows={3}
        />
      );
    case 'number':
      return (
        <Input
          id={field.id}
          type="number"
          placeholder={field.placeholder}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <Input
          id={field.id}
          type="text"
          placeholder={field.placeholder}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function DoTab({ 
  stage, 
  sessionId,
  stageState,
  onSubmit
}: { 
  stage: SafeStageDef;
  sessionId: string;
  stageState?: LearningStageState;
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string | string[]>>(
    (stageState?.attempt || {}) as Record<string, string | string[]>
  );
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/sessions/${sessionId}/learning/${stage.id}/submit`, { attempt: formData });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/learning`] });
      toast({
        title: "Submitted!",
        description: `Score: ${data.grade?.overallScore || 0}/100. Check the AI Output tab for your artifact.`,
      });
      onSubmit();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Work</CardTitle>
          <CardDescription>
            Fill in the fields below based on what you learned. Be specific and thoughtful.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage.required_fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="flex items-center gap-1">
                {field.label}
                {field.id === 'functional' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Functional requirements describe what the system must do—specific features, actions, or behaviors the product needs to perform.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {field.id === 'nonFunctional' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Non-functional requirements describe how the system should perform—qualities like speed, security, reliability, and usability.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {field.id === 'method' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold">MoSCoW:</p>
                        <p className="mb-2">Categorizes features as Must-have, Should-have, Could-have, or Won't-have based on necessity.</p>
                        <p className="font-semibold">RICE:</p>
                        <p>Scores features by Reach, Impact, Confidence, and Effort to calculate priority.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {field.minChars && (
                  <span className="text-muted-foreground text-xs ml-2">
                    (min {field.minChars} chars)
                  </span>
                )}
              </Label>
              {renderFormField(field, formData[field.id], (val) => handleFieldChange(field.id, val))}
            </div>
          ))}
        </CardContent>
      </Card>

      {stageState?.grade && (
        <GradeCard grade={stageState.grade} />
      )}

      <div className="flex justify-end">
        <Button 
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          size="lg"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Submit & Generate AI Output
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function GradeCard({ grade }: { grade: StageGrade }) {
  return (
    <Card className={cn(
      "border-2",
      grade.overallScore >= 80 ? "border-green-500" :
      grade.overallScore >= 60 ? "border-yellow-500" : "border-red-500"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Grade</span>
          <Badge variant={grade.overallScore >= 60 ? "default" : "destructive"}>
            {grade.overallScore}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grade.strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {grade.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {grade.improvements.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-600 mb-2">Areas to Improve</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {grade.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {grade.missingInfoQuestions.length > 0 && (
          <div>
            <h4 className="font-medium text-blue-600 mb-2">Questions to Consider</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {grade.missingInfoQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AIOutputTab({ 
  stage, 
  stageState 
}: { 
  stage: SafeStageDef;
  stageState?: LearningStageState;
}) {
  if (!stageState?.artifact) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No AI Output Yet</h3>
          <p className="text-muted-foreground">
            Complete the "Do" tab and submit your work to generate AI-enhanced output.
          </p>
        </CardContent>
      </Card>
    );
  }

  const artifact = stageState.artifact as StageArtifact;

  return (
    <div className="space-y-6">
      {artifact.learningNotes && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Lightbulb className="h-5 w-5" />
              AI Learning Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300">{artifact.learningNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Special visualization for root cause tree */}
      {artifact.rootCauseTree && Array.isArray((artifact.rootCauseTree as any).nodes) && (artifact.rootCauseTree as any).nodes.length > 0 && (
        <RootCauseTree data={artifact.rootCauseTree as any} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generated Artifact</CardTitle>
          <CardDescription>
            Your polished output based on your work and AI enhancements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(artifact)
            .filter(([key]) => key !== 'learningNotes' && key !== 'rootCauseTree')
            .map(([key, value]) => (
              <div key={key} className="border-b pb-3 last:border-0">
                <h4 className="font-medium text-sm text-muted-foreground mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                </h4>
                <div className="text-sm">
                  {(() => {
                    const isUrl = (str: string) => /^https?:\/\//.test(str);
                    const renderValue = (val: any): React.ReactNode => {
                      if (typeof val === 'string') {
                        if (isUrl(val)) {
                          return <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{val}</a>;
                        }
                        return <span className="whitespace-pre-wrap">{val}</span>;
                      }
                      if (Array.isArray(val)) {
                        return val.map((v, i) => (
                          <span key={i}>
                            {typeof v === 'string' && isUrl(v) 
                              ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{v}</a>
                              : String(v)}
                            {i < val.length - 1 && ', '}
                          </span>
                        ));
                      }
                      return String(val || '');
                    };

                    /* Table data like competitorTable, solutionMap */
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-muted">
                                {Object.keys(value[0]).map((col) => (
                                  <th key={col} className="border border-border px-3 py-2 text-left font-medium capitalize">
                                    {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {value.map((row: any, i: number) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                                  {Object.values(row).map((cell: any, j: number) => (
                                    <td key={j} className="border border-border px-3 py-2">
                                      {renderValue(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    /* Simple arrays (strings, numbers) */
                    if (Array.isArray(value)) {
                      return (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((item, i) => (
                            <li key={i}>{renderValue(item)}</li>
                          ))}
                        </ul>
                      );
                    }
                    /* Nested objects */
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                          {Object.entries(value).map(([subKey, subVal]) => (
                            <div key={subKey}>
                              <span className="font-medium capitalize">{subKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: </span>
                              {renderValue(subVal)}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    /* Plain strings/numbers */
                    return renderValue(value);
                  })()}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {stageState.grade && stage.id !== "think-like-a-founder" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Score</span>
              <div className="flex items-center gap-2">
                <Progress value={stageState.grade.overallScore} className="w-32" />
                <Badge>{stageState.grade.overallScore}/100</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {stageState.grade.criterionScores.map((cs) => (
                <div key={cs.criterionId} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{cs.criterionId.replace(/-/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full mr-0.5",
                            i <= cs.score ? "bg-green-500" : "bg-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground">{cs.score}/3</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LearningPage() {
  const params = useParams<{ stageId: string }>();
  const [, setLocation] = useLocation();
  const stageId = params.stageId || 'problem-definition';
  const [activeTab, setActiveTab] = useState('learn');
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(() => {
    const stored = localStorage.getItem('learning_session_id');
    // Clear old numeric IDs (invalid format)
    if (stored && !stored.includes('-')) {
      localStorage.removeItem('learning_session_id');
      return null;
    }
    return stored;
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery<SafeStageDef[]>({
    queryKey: ['/api/learning/stages']
  });

  const { data: learningData = {}, isError: sessionError } = useQuery<LearningData>({
    queryKey: [`/api/sessions/${sessionId}/learning`],
    enabled: !!sessionId,
    retry: false
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/sessions', { mode: 'learning' });
      return res.json();
    },
    onSuccess: (data: any) => {
      localStorage.setItem('learning_session_id', data.sessionId);
      setSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  useEffect(() => {
    // Clear invalid session and create new one
    if (sessionError && sessionId) {
      localStorage.removeItem('learning_session_id');
      setSessionId(null);
    }
  }, [sessionError, sessionId]);

  useEffect(() => {
    if (!sessionId && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [sessionId]);

  const currentStage = stages.find(s => s.id === stageId);
  const currentIndex = STAGES_ORDER.indexOf(stageId as LearningStageId);
  const prevStageId = currentIndex > 0 ? STAGES_ORDER[currentIndex - 1] : null;
  const nextStageId = currentIndex < STAGES_ORDER.length - 1 ? STAGES_ORDER[currentIndex + 1] : null;

  if (stagesLoading || !currentStage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const stageState = learningData[stageId];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="relative mb-8">
          <div className="absolute top-0 right-0">
            <Link href="/">
              <Button variant="outline">PDBuilder</Button>
            </Link>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold">Product Clarity Sprint</h1>
            </div>
            <p className="text-muted-foreground">
              In 10 minutes, you'll leave with a clear MVP direction and what NOT to build
            </p>
          </div>
        </div>

        <LearningNav 
          stages={stages} 
          currentStageId={stageId} 
          learningData={learningData}
        />

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentStage.title}</CardTitle>
                <CardDescription>{currentStage.concept}</CardDescription>
              </div>
              {stageState && (
                <Badge variant={
                  stageState.status === 'generated' || stageState.status === 'mastered' ? 'default' :
                  stageState.status === 'graded' ? 'secondary' :
                  stageState.status === 'attempted' ? 'outline' : 'outline'
                }>
                  {stageState.status.replace('-', ' ')}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="do" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Do
            </TabsTrigger>
            <TabsTrigger value="output" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Output
              {stageState?.artifact && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-6">
            <LearnTab stage={currentStage} />
          </TabsContent>

          <TabsContent value="do" className="mt-6">
            {sessionId ? (
              <DoTab 
                stage={currentStage} 
                sessionId={sessionId}
                stageState={stageState}
                onSubmit={() => setActiveTab('output')}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Creating your learning session...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="output" className="mt-6">
            <AIOutputTab stage={currentStage} stageState={stageState} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => prevStageId && setLocation(`/learning/${prevStageId}`)}
            disabled={!prevStageId}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Stage
          </Button>
          <Button
            onClick={() => nextStageId && setLocation(`/learning/${nextStageId}`)}
            disabled={!nextStageId}
          >
            Next Stage
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; Smartware Advisors - 2026-27. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
