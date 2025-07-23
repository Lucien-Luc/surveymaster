import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/auth/auth-guard-simple";
import Navbar from "@/components/layout/navbar";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import SurveyBuilder from "@/pages/survey-builder-beast";
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
          <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SurveyFlow</h1>
                <p className="text-gray-600 mb-8">Create and manage surveys with our easy-to-use builder</p>
                <a 
                  href="/survey/new" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First Survey
                </a>
              </div>
            </div>
          </div>
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
