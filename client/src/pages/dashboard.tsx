import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FileText,
  Zap,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent-card";
import { WorkflowCard, WorkflowCardSkeleton } from "@/components/workflow-card";
import { NewWorkflowDialog } from "@/components/new-workflow-dialog";
import { agents, type Workflow, type AgentType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const { toast } = useToast();

  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"]
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalWorkflows: number;
    completedWorkflows: number;
    documentsGenerated: number;
  }>({
    queryKey: ["/api/stats"]
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; startingAgent: AgentType }) => {
      const res = await apiRequest("POST", "/api/workflows", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowNewWorkflow(false);
      toast({
        title: "Workflow created",
        description: "Your new workflow is ready to use."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been removed."
      });
    }
  });

  const recentWorkflows = workflows?.slice(0, 3) || [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Execute Spec-Driven Development workflows with AI agents
            </p>
          </div>
          <Button onClick={() => setShowNewWorkflow(true)} data-testid="button-new-workflow-header">
            <Plus className="h-4 w-4 mr-1.5" />
            New Workflow
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="stat-total-workflows">
                    {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.totalWorkflows || 0}
                  </div>
                  <span className="text-xs text-muted-foreground">Total Workflows</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="stat-completed-workflows">
                    {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.completedWorkflows || 0}
                  </div>
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="stat-documents-generated">
                    {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.documentsGenerated || 0}
                  </div>
                  <span className="text-xs text-muted-foreground">Documents Generated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 p-6 pt-0 space-y-8">
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">AI Agents</h2>
            </div>
            <Badge variant="secondary">{agents.length} available</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.slice(0, 3).map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => {}}
                onExecute={() => {
                  setShowNewWorkflow(true);
                }}
              />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/agent/decision_author">
              <Button variant="outline" size="sm">
                View All Agents
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Recent Workflows</h2>
            </div>
            <Link href="/workflows">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
          {workflowsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <WorkflowCardSkeleton key={i} />
              ))}
            </div>
          ) : recentWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onDelete={(id) => deleteWorkflowMutation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No workflows yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first workflow to get started with spec-driven development.
                </p>
                <Button onClick={() => setShowNewWorkflow(true)} data-testid="button-create-first-workflow">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Workflow
                </Button>
              </div>
            </Card>
          )}
        </section>
      </div>

      <NewWorkflowDialog
        open={showNewWorkflow}
        onOpenChange={setShowNewWorkflow}
        onSubmit={(values) => createWorkflowMutation.mutate(values)}
        isLoading={createWorkflowMutation.isPending}
      />
    </div>
  );
}
