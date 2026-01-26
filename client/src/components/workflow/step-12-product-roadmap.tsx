import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useWorkflow } from "@/hooks/use-workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Download, 
  FileText,
  RotateCcw,
  GripVertical,
  Edit,
  Trash2,
  Sparkles,
  Link
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Milestone {
  id: number;
  bucket: "now" | "next" | "later" | "q1" | "q2" | "q3" | "q4";
  title: string;
  description: string;
  category: "Feature" | "Growth" | "Tech" | "Ops";
  status: "Planned" | "In Progress" | "Done";
  dependencies: string[];
  dueDate?: string;
  sortIndex: number;
}

interface Roadmap {
  id: number;
  sessionId: string;
  name: string;
  layout: "now-next-later" | "quarterly";
}

const milestoneFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["Feature", "Growth", "Tech", "Ops"]),
  status: z.enum(["Planned", "In Progress", "Done"]),
  bucket: z.enum(["now", "next", "later", "q1", "q2", "q3", "q4"]),
  dueDate: z.string().optional(),
  dependencies: z.string().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneFormSchema>;

const SortableMilestone = ({ 
  milestone, 
  onEdit, 
  onDelete 
}: { 
  milestone: Milestone; 
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryColors = {
    Feature: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Growth: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Tech: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Ops: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  const statusColors = {
    Planned: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
      data-testid={`milestone-card-${milestone.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          data-testid={`milestone-drag-handle-${milestone.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-5" data-testid={`milestone-title-${milestone.id}`}>
              {milestone.title}
            </h4>
            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(milestone)}
                className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                data-testid={`milestone-edit-${milestone.id}`}
              >
                <Edit className="h-3.5 w-3.5 text-gray-500 hover:text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(milestone.id)}
                className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                data-testid={`milestone-delete-${milestone.id}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 leading-relaxed" data-testid={`milestone-description-${milestone.id}`}>
            {milestone.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[milestone.category]}`} data-testid={`milestone-category-${milestone.id}`}>
              {milestone.category}
            </Badge>
            <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[milestone.status]}`} data-testid={`milestone-status-${milestone.id}`}>
              {milestone.status}
            </Badge>
          </div>
          
          {(milestone.dependencies.length > 0 || milestone.dueDate) && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
              {milestone.dependencies.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid={`milestone-dependencies-${milestone.id}`}>
                  <Link className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{milestone.dependencies.join(", ")}</span>
                </div>
              )}
              
              {milestone.dueDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid={`milestone-due-date-${milestone.id}`}>
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>{new Date(milestone.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DroppableColumn = ({ 
  bucket, 
  title, 
  milestones, 
  onEdit, 
  onDelete, 
  onAddMilestone 
}: {
  bucket: string;
  title: string;
  milestones: Milestone[];
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: number) => void;
  onAddMilestone: (bucket: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${bucket}`,
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-0">
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-5 transition-all duration-200 border border-gray-200 dark:border-gray-800 ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 border-blue-300 dark:border-blue-600' : ''
      }`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-800 dark:text-gray-200" data-testid={`column-title-${bucket}`}>
            {title}
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {milestones.length}
            </span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddMilestone(bucket)}
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
            data-testid={`add-milestone-${bucket}`}
          >
            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400 hover:text-blue-600" />
          </Button>
        </div>
        
        <SortableContext items={milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3" data-testid={`milestone-list-${bucket}`}>
            {milestones.map((milestone) => (
              <SortableMilestone
                key={milestone.id}
                milestone={milestone}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {milestones.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600 transition-colors" data-testid={`empty-column-${bucket}`}>
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium mb-3">No milestones yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddMilestone(bucket)}
                  className="border-dashed hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  data-testid={`empty-add-milestone-${bucket}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add milestone
                </Button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export function Step12ProductRoadmap() {
  const { sessionId, workflowData, completeStep, goToStep } = useWorkflow();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [newMilestoneBucket, setNewMilestoneBucket] = useState<string>("");
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);
  const [hasAttemptedSeed, setHasAttemptedSeed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Query for roadmap data
  const { data: roadmapData, isLoading } = useQuery<{roadmap: Roadmap, milestones: Milestone[]}>({
    queryKey: [`/api/sessions/${sessionId}/roadmap`],
    enabled: !!sessionId,
  });

  const roadmap: Roadmap | undefined = roadmapData?.roadmap;
  const milestones: Milestone[] = roadmapData?.milestones || [];

  const [layout, setLayout] = useState<"now-next-later" | "quarterly">(roadmap?.layout || "now-next-later");

  // Initialize layout from roadmap data
  useEffect(() => {
    if (roadmap?.layout && roadmap.layout !== layout) {
      setLayout(roadmap.layout);
    }
  }, [roadmap?.layout, layout]);

  // Auto-seed mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      console.log(`Making API request to: /api/sessions/${sessionId}/roadmap/seed`);
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/roadmap/seed`, { action: "seed" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
      toast({
        title: "Roadmap seeded successfully!",
        description: "Initial milestones generated from your MVP data.",
      });
    },
    onError: (error) => {
      console.error("Roadmap seeding error details:", {
        error: error,
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace",
        sessionId: sessionId,
      });
      
      // If roadmap already exists, don't retry
      if (error?.message?.includes("already exists")) {
        console.log("Roadmap already exists, stopping auto-seed attempts");
        return;
      }
      
      setHasAttemptedSeed(false); // Allow retry only for other errors
      toast({
        title: "Seeding failed", 
        description: `Failed to generate initial roadmap: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (milestone: MilestoneFormData) => {
      const dependencies = milestone.dependencies 
        ? milestone.dependencies.split(",").map(d => d.trim()).filter(Boolean)
        : [];
      
      const res = await apiRequest("POST", `/api/roadmaps/${roadmap?.id}/milestones`, {
        ...milestone,
        dependencies,
        roadmapId: roadmap?.id,
        sortIndex: milestones.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({
        title: "Milestone created!",
        description: "New milestone added to your roadmap.",
      });
    },
  });

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, milestone }: { id: number; milestone: MilestoneFormData }) => {
      const dependencies = milestone.dependencies 
        ? milestone.dependencies.split(",").map(d => d.trim()).filter(Boolean)
        : [];
      
      const res = await apiRequest("PATCH", `/api/milestones/${id}`, {
        ...milestone,
        dependencies,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
      setIsEditDialogOpen(false);
      setEditingMilestone(null);
      form.reset();
      toast({
        title: "Milestone updated!",
        description: "Changes saved successfully.",
      });
    },
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/milestones/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
      toast({
        title: "Milestone deleted",
        description: "Milestone removed from roadmap.",
      });
    },
  });

  // Reorder milestones mutation
  const reorderMutation = useMutation({
    mutationFn: async (milestones: Array<{ id: number; bucket: string; sortIndex: number }>) => {
      const res = await apiRequest("POST", `/api/roadmaps/${roadmap?.id}/milestones/reorder`, {
        milestones,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
    },
  });

  // Export roadmap mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'csv') => {
      const res = await apiRequest("POST", `/api/sessions/${sessionId}/roadmap/export`, {
        format,
      });
      return res.json() as Promise<{ downloadUrl: string; filename: string }>;
    },
    onSuccess: (result) => {
      toast({
        title: "Export ready!",
        description: `Your roadmap has been exported successfully.`,
      });
      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export roadmap. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Feature",
      status: "Planned",
      bucket: "now",
      dueDate: "",
      dependencies: "",
    },
  });

  // Auto-seed roadmap when component loads if no roadmap exists
  useEffect(() => {
    if (!isLoading && !roadmap && sessionId && !seedMutation.isPending && !hasAttemptedSeed) {
      console.log("Auto-seeding roadmap for session:", sessionId);
      setHasAttemptedSeed(true);
      seedMutation.mutate();
    }
  }, [isLoading, roadmap, sessionId, hasAttemptedSeed]);

  const handleSeed = () => {
    seedMutation.mutate();
  };

  const handleLayoutChange = (newLayout: "now-next-later" | "quarterly") => {
    if (newLayout === layout) return; // Guard against unchanged value
    
    setLayout(newLayout);
    // Update roadmap layout
    if (roadmap) {
      apiRequest("PATCH", `/api/roadmaps/${roadmap.id}`, { layout: newLayout })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/roadmap`] });
        })
        .catch(() => {
          toast({
            title: "Layout update failed",
            description: "Failed to save layout preference.",
            variant: "destructive",
          });
          setLayout(roadmap.layout); // Revert on error
        });
    }
  };

  const handleAddMilestone = (bucket: string) => {
    setNewMilestoneBucket(bucket);
    setEditingMilestone(null);
    form.reset({
      title: "",
      description: "",
      category: "Feature",
      status: "Planned",
      bucket: bucket as any,
      dueDate: "",
      dependencies: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    form.reset({
      title: milestone.title,
      description: milestone.description,
      category: milestone.category,
      status: milestone.status,
      bucket: milestone.bucket,
      dueDate: milestone.dueDate || "",
      dependencies: milestone.dependencies.join(", "),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteMilestone = (id: number) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMilestoneMutation.mutate(id);
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (!roadmap) {
      toast({
        title: "Export not available",
        description: "Please create a roadmap first.",
        variant: "destructive",
      });
      return;
    }
    exportMutation.mutate(format);
  };

  const onSubmit = (data: MilestoneFormData) => {
    if (editingMilestone) {
      updateMilestoneMutation.mutate({ id: editingMilestone.id, milestone: data });
    } else {
      createMilestoneMutation.mutate(data);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overIdValue = over.id;

    // Find the active milestone
    const activeMilestone = milestones.find(m => m.id === activeId);
    if (!activeMilestone) return;

    // Check if dropped on a column
    if (typeof overIdValue === 'string' && overIdValue.startsWith('column-')) {
      const targetBucket = overIdValue.replace('column-', '') as Milestone['bucket'];
      
      if (activeMilestone.bucket !== targetBucket) {
        // Move to different bucket
        const targetBucketMilestones = milestones.filter(m => m.bucket === targetBucket);
        const updates = [{
          id: activeId,
          bucket: targetBucket,
          sortIndex: targetBucketMilestones.length,
        }];
        
        reorderMutation.mutate(updates);
      }
      return;
    }

    // Dropped on another milestone
    const overMilestone = milestones.find(m => m.id === overIdValue);
    if (!overMilestone || activeId === overIdValue) return;

    // If they're in the same bucket, reorder
    if (activeMilestone.bucket === overMilestone.bucket) {
      const bucketMilestones = milestones.filter(m => m.bucket === activeMilestone.bucket);
      const oldIndex = bucketMilestones.findIndex(m => m.id === activeId);
      const newIndex = bucketMilestones.findIndex(m => m.id === overIdValue);
      
      if (oldIndex !== newIndex) {
        const reorderedMilestones = arrayMove(bucketMilestones, oldIndex, newIndex);
        
        // Update sort indices
        const updates = reorderedMilestones.map((milestone, index) => ({
          id: milestone.id,
          bucket: milestone.bucket,
          sortIndex: index,
        }));
        
        reorderMutation.mutate(updates);
      }
    } else {
      // Move to different bucket, position near the target
      const targetBucketMilestones = milestones.filter(m => m.bucket === overMilestone.bucket);
      const targetIndex = targetBucketMilestones.findIndex(m => m.id === overIdValue);
      
      const updates = [{
        id: activeId,
        bucket: overMilestone.bucket,
        sortIndex: targetIndex + 1,
      }];
      
      reorderMutation.mutate(updates);
    }
  };

  const handleContinue = () => {
    completeStep(12, {
      hasRoadmapExported: true
    });
    
    // Scroll to top so user sees next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    goToStep(11);
  };

  if (isLoading || seedMutation.isPending) {
    return <LoadingOverlay message="Loading your product roadmap..." />;
  }

  // Group milestones by bucket
  const groupedMilestones = milestones.reduce((acc, milestone) => {
    if (!acc[milestone.bucket]) {
      acc[milestone.bucket] = [];
    }
    acc[milestone.bucket].push(milestone);
    return acc;
  }, {} as Record<string, Milestone[]>);

  // Sort milestones within each bucket
  Object.keys(groupedMilestones).forEach(bucket => {
    groupedMilestones[bucket].sort((a, b) => a.sortIndex - b.sortIndex);
  });

  const activeMilestone = milestones.find(m => m.id === activeDragId);

  const buckets = layout === "now-next-later" 
    ? [
        { key: "now", title: "Now" },
        { key: "next", title: "Next" },
        { key: "later", title: "Later" }
      ]
    : [
        { key: "q1", title: "Q1" },
        { key: "q2", title: "Q2" },
        { key: "q3", title: "Q3" },
        { key: "q4", title: "Q4" }
      ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
              12
            </div>
            <div className="ml-4 flex-1">
              <CardTitle className="text-xl">Product Roadmap</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">Plan your product development with drag-and-drop milestones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!roadmap ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No roadmap yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Generate an initial roadmap from your MVP data to get started with planning your product development.
              </p>
              <Button onClick={handleSeed} data-testid="seed-roadmap-button">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Initial Roadmap
              </Button>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap gap-3">
                  <Select value={layout} onValueChange={handleLayoutChange}>
                    <SelectTrigger className="w-52" data-testid="layout-selector">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now-next-later">Now / Next / Later</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={handleSeed} data-testid="regenerate-roadmap-button" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    disabled={exportMutation.isPending}
                    data-testid="export-csv-button"
                    className="hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('pdf')}
                    disabled={exportMutation.isPending}
                    data-testid="export-pdf-button"
                    className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              {/* Roadmap Board */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="roadmap-board">
                  {buckets.map((bucket) => (
                    <DroppableColumn
                      key={bucket.key}
                      bucket={bucket.key}
                      title={bucket.title}
                      milestones={groupedMilestones[bucket.key] || []}
                      onEdit={handleEditMilestone}
                      onDelete={handleDeleteMilestone}
                      onAddMilestone={handleAddMilestone}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {activeMilestone ? (
                    <SortableMilestone
                      milestone={activeMilestone}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Roadmap Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1" data-testid="total-milestones-count">
                      {milestones.length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Milestones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1" data-testid="done-milestones-count">
                      {milestones.filter(m => m.status === "Done").length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1" data-testid="in-progress-milestones-count">
                      {milestones.filter(m => m.status === "In Progress").length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1" data-testid="planned-milestones-count">
                      {milestones.filter(m => m.status === "Planned").length}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Planned</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={handleBack} data-testid="back-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {roadmap && (
              <Button onClick={handleContinue} data-testid="continue-button">
                Continue to Feedback
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Milestone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="milestone-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Milestone title" {...field} data-testid="milestone-title-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="milestone-category-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Feature">Feature</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                          <SelectItem value="Tech">Tech</SelectItem>
                          <SelectItem value="Ops">Ops</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe this milestone..." 
                        rows={3}
                        {...field}
                        data-testid="milestone-description-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bucket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="milestone-bucket-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {layout === "now-next-later" ? (
                            <>
                              <SelectItem value="now">Now</SelectItem>
                              <SelectItem value="next">Next</SelectItem>
                              <SelectItem value="later">Later</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="q1">Q1</SelectItem>
                              <SelectItem value="q2">Q2</SelectItem>
                              <SelectItem value="q3">Q3</SelectItem>
                              <SelectItem value="q4">Q4</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="milestone-status-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          data-testid="milestone-due-date-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dependencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependencies (comma-separated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="MVP Launch, User Testing, etc."
                        {...field}
                        data-testid="milestone-dependencies-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="milestone-cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}
                  data-testid="milestone-save-button"
                >
                  {editingMilestone ? "Save Changes" : "Add Milestone"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}