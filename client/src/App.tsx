import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import WorkflowsPage from "@/pages/workflows";
import WorkflowDetailPage from "@/pages/workflow-detail";
import ConstitutionPage from "@/pages/constitution";
import AgentPage from "@/pages/agent";
import { useState } from "react";
import { NewWorkflowDialog } from "@/components/new-workflow-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { AgentType } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/workflow/:workflowId" component={WorkflowDetailPage} />
      <Route path="/constitution" component={ConstitutionPage} />
      <Route path="/agent/:agentType" component={AgentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [, setLocation] = useLocation();

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; startingAgent: AgentType }) => {
      const res = await apiRequest("POST", "/api/workflows", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setShowNewWorkflow(false);
      setLocation(`/workflow/${data.id}`);
    }
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem"
  };

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar onNewWorkflow={() => setShowNewWorkflow(true)} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-2 p-2 border-b h-12 shrink-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
      <NewWorkflowDialog
        open={showNewWorkflow}
        onOpenChange={setShowNewWorkflow}
        onSubmit={(values) => createWorkflowMutation.mutate(values)}
        isLoading={createWorkflowMutation.isPending}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
