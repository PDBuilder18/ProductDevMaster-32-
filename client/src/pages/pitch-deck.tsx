import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileText, 
  Download, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Plus,
  Trash2,
  Upload
} from "lucide-react";

interface PitchDeckSlide {
  id: number;
  deckId: number;
  slideType: string;
  position: number;
  titleOverride?: string;
  content: any;
  aiDraft?: any;
}

interface PitchDeck {
  id: number;
  sessionId: string;
  title: string;
  status: string;
  slides: PitchDeckSlide[];
}

const slideConfig = {
  problem: { title: "Problem", icon: "🔴", description: "What pain are you solving?" },
  solution: { title: "Solution", icon: "✅", description: "How are you solving it?" },
  "why-now": { title: "Why Now", icon: "⏰", description: "Why is this the right time?" },
  "market-size": { title: "Market Size", icon: "📊", description: "How big is the opportunity?" },
  product: { title: "Product", icon: "🚀", description: "How does it work?" },
  "business-model": { title: "Business Model", icon: "💰", description: "How do you make money?" },
  competition: { title: "Competition", icon: "⚔️", description: "Who else is in the space?" },
  team: { title: "Team", icon: "👥", description: "Who's building it?" },
  financials: { title: "Financials", icon: "📈", description: "What's your traction?" },
  vision: { title: "Vision & Ask", icon: "🎯", description: "What's next?" }
};

export default function PitchDeck() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [sessionId] = useState(() => localStorage.getItem("sessionId") || "demo-session");

  // Fetch pitch deck
  const { data: pitchDeck, isLoading } = useQuery<PitchDeck>({
    queryKey: ["/api/pitch-decks", sessionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/pitch-decks/${sessionId}`, undefined);
      return res.json();
    },
  });

  // Create pitch deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pitch-decks", {
        sessionId,
        title: "Sequoia Pitch Deck",
        status: "draft"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pitch-decks", sessionId] });
      toast({
        title: "Pitch deck created",
        description: "Your Sequoia-format pitch deck is ready to edit."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pitch deck",
        variant: "destructive"
      });
    }
  });

  // Upload presentation mutation
  const uploadPresentationMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Starting file upload:", file.name, file.type, file.size);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      
      const res = await fetch("/api/pitch-decks/upload", {
        method: "POST",
        body: formData,
      });
      
      console.log("Upload response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload failed:", errorText);
        throw new Error(errorText || "Upload failed");
      }
      
      return res.json();
    },
    onSuccess: () => {
      console.log("Upload successful");
      queryClient.invalidateQueries({ queryKey: ["/api/pitch-decks", sessionId] });
      toast({
        title: "Presentation uploaded",
        description: "Your presentation has been converted to a pitch deck."
      });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not process your presentation file.",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file?.name, file?.type);
    if (file) {
      uploadPresentationMutation.mutate(file);
    }
  };

  // Update slide mutation
  const updateSlideMutation = useMutation({
    mutationFn: async ({ slideId, updates }: { slideId: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/pitch-decks/${pitchDeck?.id}/slides/${slideId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pitch-decks", sessionId] });
      toast({
        title: "Slide updated",
        description: "Your changes have been saved."
      });
    }
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pitch-decks/${pitchDeck?.id}/export`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export complete",
        description: data.message || "Your pitch deck has been exported."
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pitch deck...</p>
        </div>
      </div>
    );
  }

  if (!pitchDeck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Create Your Pitch Deck
            </CardTitle>
            <CardDescription>
              Build an investor-ready pitch deck in Sequoia Capital format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload existing presentation */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Upload Existing Presentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a PowerPoint (.pptx) or PDF file to convert it into a Sequoia-format pitch deck
              </p>
              <div className="flex justify-center">
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadPresentationMutation.isPending}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPresentationMutation.isPending ? "Processing..." : "Choose File"}
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pptx,.pdf,.ppt"
                  onChange={handleFileUpload}
                  disabled={uploadPresentationMutation.isPending}
                  className="hidden"
                  data-testid="input-upload-file"
                />
              </div>
              {uploadPresentationMutation.isPending && (
                <p className="text-sm text-muted-foreground mt-2">Processing your presentation...</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Create from scratch */}
            <div className="text-center">
              <h3 className="font-semibold mb-2">Start from Scratch</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new pitch deck with pre-structured Sequoia slides
              </p>
              <Button 
                onClick={() => createDeckMutation.mutate()} 
                disabled={createDeckMutation.isPending}
                className="w-full"
                data-testid="button-create-deck"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createDeckMutation.isPending ? "Creating..." : "Create Blank Pitch Deck"}
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={() => navigate("/")} 
              className="w-full"
              data-testid="button-back-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSlide = pitchDeck.slides[currentSlideIndex];
  const slideInfo = slideConfig[currentSlide?.slideType as keyof typeof slideConfig];

  const handleSlideUpdate = (content: any) => {
    if (currentSlide) {
      updateSlideMutation.mutate({
        slideId: currentSlide.id,
        updates: { content }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              data-testid="button-nav-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {pitchDeck.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sequoia Capital Format • 10 Slides
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pitchDeck.status === "complete" ? "default" : "secondary"}>
              {pitchDeck.status}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              data-testid="button-export-deck"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Slide Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {pitchDeck.slides.map((slide, index) => {
                const config = slideConfig[slide.slideType as keyof typeof slideConfig];
                return (
                  <Button
                    key={slide.id}
                    variant={currentSlideIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentSlideIndex(index)}
                    className="flex-shrink-0"
                    data-testid={`button-slide-${index + 1}`}
                  >
                    <span className="mr-1">{config.icon}</span>
                    {index + 1}. {config.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Slide Editor */}
        {currentSlide && slideInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{slideInfo.icon}</span>
                    Slide {currentSlideIndex + 1}: {slideInfo.title}
                  </CardTitle>
                  <CardDescription>{slideInfo.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    data-testid="button-prev-slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSlideIndex(Math.min(pitchDeck.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === pitchDeck.slides.length - 1}
                    data-testid="button-next-slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SlideEditor
                slideType={currentSlide.slideType}
                content={currentSlide.content}
                onUpdate={handleSlideUpdate}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Generic slide editor component
function SlideEditor({ 
  slideType, 
  content, 
  onUpdate 
}: { 
  slideType: string; 
  content: any; 
  onUpdate: (content: any) => void;
}) {
  const [localContent, setLocalContent] = useState(content);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localContent, [field]: value };
    setLocalContent(updated);
  };

  const handleSave = () => {
    onUpdate(localContent);
  };

  // Render different editors based on slide type
  switch (slideType) {
    case "problem":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="impact">Impact Statement</Label>
            <Textarea
              id="impact"
              value={localContent.impact || ""}
              onChange={(e) => handleChange("impact", e.target.value)}
              placeholder="Describe the impact of this problem..."
              rows={3}
              data-testid="input-problem-impact"
            />
          </div>
          <div>
            <Label>Pain Points</Label>
            <Textarea
              value={(localContent.painPoints || []).join("\n")}
              onChange={(e) => handleChange("painPoints", e.target.value.split("\n").filter(Boolean))}
              placeholder="List pain points (one per line)..."
              rows={5}
              data-testid="input-problem-pain-points"
            />
          </div>
          <Button onClick={handleSave} data-testid="button-save-slide">
            Save Changes
          </Button>
        </div>
      );

    case "solution":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Solution Description</Label>
            <Textarea
              id="description"
              value={localContent.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your solution..."
              rows={4}
              data-testid="input-solution-description"
            />
          </div>
          <div>
            <Label>Key Features</Label>
            <Textarea
              value={(localContent.keyFeatures || []).join("\n")}
              onChange={(e) => handleChange("keyFeatures", e.target.value.split("\n").filter(Boolean))}
              placeholder="List key features (one per line)..."
              rows={5}
              data-testid="input-solution-features"
            />
          </div>
          <Button onClick={handleSave} data-testid="button-save-slide">
            Save Changes
          </Button>
        </div>
      );

    case "market-size":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tam">TAM (Total Addressable Market)</Label>
              <Input
                id="tam"
                value={localContent.tam || ""}
                onChange={(e) => handleChange("tam", e.target.value)}
                placeholder="$10B"
                data-testid="input-market-tam"
              />
            </div>
            <div>
              <Label htmlFor="sam">SAM (Serviceable Addressable Market)</Label>
              <Input
                id="sam"
                value={localContent.sam || ""}
                onChange={(e) => handleChange("sam", e.target.value)}
                placeholder="$2B"
                data-testid="input-market-sam"
              />
            </div>
            <div>
              <Label htmlFor="som">SOM (Serviceable Obtainable Market)</Label>
              <Input
                id="som"
                value={localContent.som || ""}
                onChange={(e) => handleChange("som", e.target.value)}
                placeholder="$100M"
                data-testid="input-market-som"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="marketDescription">Market Description</Label>
            <Textarea
              id="marketDescription"
              value={localContent.marketDescription || ""}
              onChange={(e) => handleChange("marketDescription", e.target.value)}
              placeholder="Describe the market opportunity..."
              rows={4}
              data-testid="input-market-description"
            />
          </div>
          <Button onClick={handleSave} data-testid="button-save-slide">
            Save Changes
          </Button>
        </div>
      );

    case "vision":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="vision">Vision Statement</Label>
            <Textarea
              id="vision"
              value={localContent.vision || ""}
              onChange={(e) => handleChange("vision", e.target.value)}
              placeholder="Your long-term vision..."
              rows={3}
              data-testid="input-vision-statement"
            />
          </div>
          <div>
            <Label>Milestones</Label>
            <Textarea
              value={(localContent.milestones || []).join("\n")}
              onChange={(e) => handleChange("milestones", e.target.value.split("\n").filter(Boolean))}
              placeholder="List key milestones (one per line)..."
              rows={4}
              data-testid="input-vision-milestones"
            />
          </div>
          <div>
            <Label htmlFor="askAmount">Funding Ask</Label>
            <Input
              id="askAmount"
              value={localContent.ask?.amount || ""}
              onChange={(e) => handleChange("ask", { ...localContent.ask, amount: e.target.value })}
              placeholder="$5M"
              data-testid="input-vision-ask-amount"
            />
          </div>
          <Button onClick={handleSave} data-testid="button-save-slide">
            Save Changes
          </Button>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div>
            <Label>Slide Content (JSON)</Label>
            <Textarea
              value={JSON.stringify(localContent, null, 2)}
              onChange={(e) => {
                try {
                  setLocalContent(JSON.parse(e.target.value));
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
              className="font-mono text-sm"
              data-testid="input-slide-json"
            />
          </div>
          <Button onClick={handleSave} data-testid="button-save-slide">
            Save Changes
          </Button>
        </div>
      );
  }
}
