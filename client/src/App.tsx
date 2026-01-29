import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Conversation from "@/pages/conversation";
import LearningPage from "@/pages/learning";
import AdminPage from "@/pages/AdminPage";
import { AdminFeedbackPage } from "@/pages/admin-feedback";
import { FiveWhysDemo } from "@/components/visualization/FiveWhysDemo";
import PitchDeck from "@/pages/pitch-deck";
import TermsOfUse from "@/pages/terms-of-use";
import NotFound from "@/pages/not-found";
import { CustomerAccessGate } from "@/components/CustomerAccessGate";

function RequireTerms({ children }: { children: React.ReactNode }) {
  const termsAccepted = localStorage.getItem('pdbuilder_terms_accepted') === 'true';
  
  if (!termsAccepted) {
    return <Redirect to="/terms" />;
  }
  
  return <>{children}</>;
}

function TermsPage() {
  const termsAccepted = localStorage.getItem('pdbuilder_terms_accepted') === 'true';
  
  if (termsAccepted) {
    return <Redirect to="/" />;
  }
  
  return <TermsOfUse />;
}

function ProtectedHome() {
  return <RequireTerms><Home /></RequireTerms>;
}

function ProtectedConversation() {
  return <RequireTerms><Conversation /></RequireTerms>;
}

function ProtectedLearning() {
  return <RequireTerms><LearningPage /></RequireTerms>;
}

function ProtectedFiveWhys() {
  return <RequireTerms><FiveWhysDemo /></RequireTerms>;
}

function ProtectedPitchDeck() {
  return <RequireTerms><PitchDeck /></RequireTerms>;
}

function Router() {
  return (
    <Switch>
      <Route path="/terms" component={TermsPage} />
      <Route path="/" component={ProtectedHome} />
      <Route path="/conversation" component={ProtectedConversation} />
      <Route path="/learning" component={ProtectedLearning} />
      <Route path="/learning/:stageId" component={ProtectedLearning} />
      <Route path="/five-whys" component={ProtectedFiveWhys} />
      <Route path="/pitch-deck" component={ProtectedPitchDeck} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/feedback" component={AdminFeedbackPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomerAccessGate>
          <Toaster />
          <Router />
        </CustomerAccessGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
