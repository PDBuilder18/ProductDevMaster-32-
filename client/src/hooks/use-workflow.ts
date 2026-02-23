import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Session, WorkflowData } from "@shared/schema";
import { nanoid } from "nanoid";

export function useWorkflow() {
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem("pdbuilder-session") || nanoid();
  });
  
  const queryClient = useQueryClient();

  // Store session ID in localStorage
  useEffect(() => {
    localStorage.setItem("pdbuilder-session", sessionId);
  }, [sessionId]);

  // Fetch session data
  const { data: session, isLoading } = useQuery<Session>({
    queryKey: [`/api/sessions/${sessionId}`],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Create session if it doesn't exist
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sessions", {
        sessionId,
        currentStage: "problem-discovery",
        completedStages: [],
        data: {},
      });
      return res.json();
    },
    onSuccess: (newSession: Session) => {
      setSessionId(newSession.sessionId);
      queryClient.setQueryData([`/api/sessions/${newSession.sessionId}`], newSession);
    },
  });

  // Update session
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<Session, 'id' | 'sessionId' | 'createdAt'>>) => {
      const res = await apiRequest("PATCH", `/api/sessions/${sessionId}`, updates);
      return res.json();
    },
    onSuccess: (updatedSession: Session) => {
      queryClient.setQueryData([`/api/sessions/${sessionId}`], updatedSession);
    },
  });

  // Initialize session if it doesn't exist
  useEffect(() => {
    if (!isLoading && !session && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [isLoading, session, createSessionMutation]);

  // Map database stage to step number (based on actual stages in use)
  const stageToStep = {
    "problem-discovery": 1,
    "problem-analysis": 1,  // Alternative name used
    "market-research": 2,
    "root-cause-analysis": 3,
    "existing-solutions": 4,
    "customer-profile": 5,
    "use-case-definition": 6,
    "product-requirements": 7,
    "prioritization": 8,
    "export": 9,
    "feedback": 10
  };
  
  const stepToStage = {
    1: "problem-discovery",
    2: "market-research",
    3: "root-cause-analysis",
    4: "existing-solutions",
    5: "customer-profile",
    6: "use-case-definition",
    7: "product-requirements",
    8: "prioritization",
    9: "export",
    10: "feedback"
  };

  const currentStep = session?.currentStage ? stageToStep[session.currentStage as keyof typeof stageToStep] || 1 : 1;
  
  // Deduplicate completed steps to handle stage aliases mapping to same step number
  const completedSteps = session?.completedStages ? 
    Array.from(new Set(
      session.completedStages
        .map(stage => stageToStep[stage as keyof typeof stageToStep])
        .filter(Boolean)
    )) : [];
  

  const workflowData = session?.data || {};

  const goToStep = (step: number) => {
    const stage = stepToStage[step as keyof typeof stepToStage];
    if (stage) {
      updateSessionMutation.mutate({ currentStage: stage });
    }
  };

  const completeStep = (step: number, data: Partial<WorkflowData>) => {
    const currentStage = stepToStage[step as keyof typeof stepToStage];
    const nextStep = Math.min(step + 1, 10);
    const nextStage = stepToStage[nextStep as keyof typeof stepToStage];
    
    if (!currentStage || !nextStage) {
      console.error(`Invalid step transition: ${step} -> ${nextStep}`);
      return;
    }
    
    const newCompletedStages = [...(session?.completedStages || [])];
    if (currentStage && !newCompletedStages.includes(currentStage)) {
      newCompletedStages.push(currentStage);
    }
    
    // Ensure we have the latest workflow data before updating
    const updatedData = { ...workflowData, ...data };
    
    console.log(`Completing step ${step} (${currentStage}) -> ${nextStep} (${nextStage})`);
    
    updateSessionMutation.mutate({
      currentStage: nextStage,
      completedStages: newCompletedStages,
      data: updatedData,
    });
  };

  const updateWorkflowData = (data: Partial<WorkflowData>) => {
    // Don't change the current stage when just updating data
    updateSessionMutation.mutate({
      data: { ...workflowData, ...data },
    });
  };

  const startNewSession = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("customer_id");

    // Increment used_attempt for the customer before creating new session
    if (customerId) {
      try {
        const incrementRes = await fetch(`/api/customers/${customerId}/increment-attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const incrementResult = await incrementRes.json();
        console.log("Attempt increment result:", incrementResult);

        if (incrementResult.success && incrementResult.data) {
          const data = incrementResult.data;
          if (data.subscription_status === "expired") {
            console.log("Free plan exhausted - redirecting with current params");
            window.location.href = window.location.pathname + "?" + urlParams.toString();
            return;
          }
        }
      } catch (error) {
        console.error("Failed to increment attempt:", error);
      }
    }

    // Generate new session ID
    const newSessionId = nanoid();
    
    // Clear all cached session data
    queryClient.removeQueries({ queryKey: [`/api/sessions/${sessionId}`] });
    queryClient.clear();
    
    // Create the new session immediately
    try {
      const res = await apiRequest("POST", "/api/sessions", {
        sessionId: newSessionId,
        currentStage: "problem-discovery",
        completedStages: [],
        data: {},
      });
      const newSession = await res.json();
      
      // Update localStorage with new session
      localStorage.setItem("pdbuilder-session", newSessionId);
      setSessionId(newSessionId);
      
      // Cache the new session data
      queryClient.setQueryData([`/api/sessions/${newSessionId}`], newSession);
      
      // Reload page while preserving all query parameters (including customer_id)
      window.location.href = window.location.pathname + "?" + urlParams.toString();
    } catch (error) {
      console.error("Failed to create new session:", error);
      // Fallback: still preserve query params
      localStorage.setItem("pdbuilder-session", newSessionId);
      setSessionId(newSessionId);
      queryClient.removeQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      window.location.href = window.location.pathname + "?" + urlParams.toString();
    }
  };

  const resetToStep = (step: number) => {
    const stage = stepToStage[step as keyof typeof stepToStage];
    if (stage) {
      // Reset to the specified step and clear completion beyond that step
      const newCompletedStages = (session?.completedStages || []).filter(completedStage => {
        const completedStep = stageToStep[completedStage as keyof typeof stageToStep];
        return completedStep && completedStep < step;
      });
      
      updateSessionMutation.mutate({
        currentStage: stage,
        completedStages: newCompletedStages
      });
      
      // Force a cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
    }
  };

  return {
    sessionId,
    session,
    currentStep,
    completedSteps,
    workflowData,
    isLoading: isLoading || createSessionMutation.isPending,
    goToStep,
    completeStep,
    updateWorkflowData,
    updateSession: updateSessionMutation.mutate,
    startNewSession,
    resetToStep,
  };
}
