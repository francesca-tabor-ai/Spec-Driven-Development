import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, Filter, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { WorkflowCard, WorkflowCardSkeleton } from "@/components/workflow-card";
import { NewWorkflowDialog } from "@/components/new-workflow-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workflow, AgentType } from "@shared/schema";

export default function WorkflowsPage() {
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"]
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; startingAgent: AgentType }) => {
      const res = await apiRequest("POST", "/api/workflows", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setShowNewWorkflow(false);
      toast({
        title: "Workflow created",
        description: "Your new workflow is ready to use."
      });
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been removed."
      });
    }
  });

  const duplicateWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/workflows/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow duplicated",
        description: "A copy of the workflow has been created."
      });
    }
  });

  const filteredWorkflows = workflows?.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusCounts = {
    all: workflows?.length || 0,
    draft: workflows?.filter((w) => w.status === "draft").length || 0,
    in_progress: workflows?.filter((w) => w.status === "in_progress").length || 0,
    completed: workflows?.filter((w) => w.status === "completed").length || 0,
    error: workflows?.filter((w) => w.status === "error").length || 0
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your spec-driven development workflows
            </p>
          </div>
          <Button onClick={() => setShowNewWorkflow(true)} data-testid="button-new-workflow">
            <Plus className="h-4 w-4 mr-1.5" />
            New Workflow
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-workflows"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="draft">Draft ({statusCounts.draft})</SelectItem>
              <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
              <SelectItem value="error">Error ({statusCounts.error})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 p-6 pt-0">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <WorkflowCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onDelete={(id) => deleteWorkflowMutation.mutate(id)}
                onDuplicate={(id) => duplicateWorkflowMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || statusFilter !== "all" ? "No workflows found" : "No workflows yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first workflow to get started with spec-driven development."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setShowNewWorkflow(true)} data-testid="button-create-first">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Workflow
                </Button>
              )}
            </div>
          </Card>
        )}
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
