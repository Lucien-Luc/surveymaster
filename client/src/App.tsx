import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/auth/auth-guard";
import Navbar from "@/components/layout/navbar";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import SurveyBuilder from "@/pages/survey-builder";
import SurveyView from "@/pages/survey-view";
import SurveyResponsesPage from "@/pages/survey-responses";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public survey view */}
      <Route path="/survey/:id" component={SurveyView} />
      
      {/* Protected routes */}
      <Route path="/" component={() => (
        <AuthGuard>
          <Navbar />
          <Dashboard />
        </AuthGuard>
      )} />
      
      <Route path="/survey/new" component={() => (
        <AuthGuard>
          <Navbar />
          <SurveyBuilder />
        </AuthGuard>
      )} />
      
      <Route path="/survey/:id/edit" component={() => (
        <AuthGuard>
          <Navbar />
          <SurveyBuilder />
        </AuthGuard>
      )} />
      
      <Route path="/survey/:id/responses" component={() => (
        <AuthGuard>
          <Navbar />
          <SurveyResponsesPage />
        </AuthGuard>
      )} />

      <Route path="/analytics" component={() => (
        <AuthGuard>
          <Navbar />
          <Analytics />
        </AuthGuard>
      )} />

      <Route path="/settings" component={() => (
        <AuthGuard>
          <Navbar />
          <Settings />
        </AuthGuard>
      )} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
