import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Save,
  FileJson,
  FileCode,
  File,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContextVariablesEditor } from "@/components/context-variables-editor";
import { DocumentViewer } from "@/components/document-viewer";
import { AgentCardCompact } from "@/components/agent-card";
import { WorkflowTimeline } from "@/components/workflow-execution-panel";
import { agents, type Workflow, type Document, type ExecutionStep, type ContextVariable } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WorkflowDetailPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [streamingContent, setStreamingContent] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { data: workflow, isLoading: workflowLoading } = useQuery<Workflow>({
    queryKey: ["/api/workflows", workflowId],
    enabled: !!workflowId
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/workflows", workflowId, "documents"],
    enabled: !!workflowId
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: Partial<Workflow>) => {
      const res = await apiRequest("PATCH", `/api/workflows/${workflowId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId] });
    }
  });

  const steps: ExecutionStep[] = agents.map((agent, index) => ({
    id: `step-${index}`,
    workflowId: workflowId || "",
    agentType: agent.id,
    status: index < currentStepIndex ? "completed" : index === currentStepIndex && isExecuting ? "running" : "pending"
  }));

  const executeWorkflow = async () => {
    if (!workflow) return;

    setIsExecuting(true);
    setStreamingContent("");
    setCurrentStepIndex(0);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextVariables: workflow.contextVariables
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error("Failed to execute workflow");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.stepIndex !== undefined) {
                setCurrentStepIndex(data.stepIndex);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId] });
                queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "documents"] });
              }
              if (data.document) {
                setSelectedDocument(data.document);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast({
        title: "Specification completed",
        description: "All agents have finished execution."
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast({
          title: "Execution failed",
          description: "Failed to execute specification. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const stopExecution = () => {
    abortControllerRef.current?.abort();
    setIsExecuting(false);
  };

  const resetWorkflow = () => {
    setCurrentStepIndex(-1);
    setStreamingContent("");
    setSelectedDocument(null);
    updateWorkflowMutation.mutate({ status: "draft" });
  };

  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

  const toggleAgentSection = (agentType: string, open: boolean) => {
    setExpandedAgents(prev => ({ ...prev, [agentType]: open }));
  };

  // Group documents by agent type
  const documentsByAgent = documents?.reduce((acc, doc) => {
    const agentType = doc.agentType;
    if (!acc[agentType]) {
      acc[agentType] = [];
    }
    acc[agentType].push(doc);
    return acc;
  }, {} as Record<string, Document[]>) || {};

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportWorkflow = (format: "markdown" | "json" | "html" | "txt") => {
    if (!workflow || !documents || documents.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Execute the specification first to generate documents.",
        variant: "destructive"
      });
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const sanitizedName = workflow.name.replace(/[^a-zA-Z0-9]/g, "_");

    if (format === "json") {
      const jsonData = {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          contextVariables: workflow.contextVariables,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        },
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          agentType: doc.agentType,
          outputType: doc.outputType,
          content: doc.content,
          version: doc.version,
          createdAt: doc.createdAt
        }))
      };
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${sanitizedName}_${timestamp}.json`);
    } else if (format === "html") {
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${workflow.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { color: #555; margin-top: 2rem; }
    .section { margin-bottom: 3rem; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; }
    .agent-badge { display: inline-block; padding: 0.25rem 0.75rem; background: #e0e0e0; border-radius: 4px; font-size: 0.85rem; margin-bottom: 1rem; }
    pre { background: #f0f0f0; padding: 1rem; overflow-x: auto; border-radius: 4px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${workflow.name}</h1>
  ${workflow.description ? `<p>${workflow.description}</p>` : ""}
`;
      for (const agent of agents) {
        const agentDocs = documentsByAgent[agent.id];
        if (agentDocs && agentDocs.length > 0) {
          htmlContent += `  <h2>${agent.name}</h2>\n`;
          for (const doc of agentDocs) {
            htmlContent += `  <div class="section">
    <div class="agent-badge">${doc.outputType}</div>
    <h3>${doc.title}</h3>
    <pre>${doc.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  </div>\n`;
          }
        }
      }
      htmlContent += `</body>\n</html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      downloadBlob(blob, `${sanitizedName}_${timestamp}.html`);
    } else if (format === "txt") {
      let textContent = `${workflow.name}\n${"=".repeat(workflow.name.length)}\n\n`;
      if (workflow.description) {
        textContent += `${workflow.description}\n\n`;
      }
      for (const agent of agents) {
        const agentDocs = documentsByAgent[agent.id];
        if (agentDocs && agentDocs.length > 0) {
          textContent += `\n${agent.name}\n${"-".repeat(agent.name.length)}\n\n`;
          for (const doc of agentDocs) {
            textContent += `[${doc.outputType}] ${doc.title}\n\n${doc.content}\n\n`;
          }
        }
      }
      const blob = new Blob([textContent], { type: "text/plain" });
      downloadBlob(blob, `${sanitizedName}_${timestamp}.txt`);
    } else {
      let markdownContent = `# ${workflow.name}\n\n`;
      if (workflow.description) {
        markdownContent += `${workflow.description}\n\n`;
      }
      markdownContent += `---\n\n`;
      for (const agent of agents) {
        const agentDocs = documentsByAgent[agent.id];
        if (agentDocs && agentDocs.length > 0) {
          markdownContent += `## ${agent.name}\n\n`;
          for (const doc of agentDocs) {
            markdownContent += `### ${doc.title}\n\n`;
            markdownContent += `**Type:** ${doc.outputType}\n\n`;
            markdownContent += `${doc.content}\n\n---\n\n`;
          }
        }
      }
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      downloadBlob(blob, `${sanitizedName}_${timestamp}.md`);
    }

    toast({
      title: "Export complete",
      description: `Specification exported as ${format.toUpperCase()}`
    });
  };

  const saveWorkflow = () => {
    updateWorkflowMutation.mutate({}, {
      onSuccess: () => {
        toast({
          title: "Specification saved",
          description: "Your specification has been saved."
        });
      }
    });
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  if (workflowLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Specification Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">The requested specification does not exist.</p>
          <Link href="/workflows">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Specifications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/workflows">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold truncate" data-testid="text-workflow-name">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-xs text-muted-foreground truncate">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={saveWorkflow} data-testid="button-save-workflow">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-export-workflow">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportWorkflow("markdown")} data-testid="export-markdown">
                <FileText className="h-4 w-4 mr-2" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportWorkflow("json")} data-testid="export-json">
                <FileJson className="h-4 w-4 mr-2" />
                JSON (.json)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportWorkflow("html")} data-testid="export-html">
                <FileCode className="h-4 w-4 mr-2" />
                HTML (.html)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportWorkflow("txt")} data-testid="export-txt">
                <File className="h-4 w-4 mr-2" />
                Plain Text (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-settings">
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Specification Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ContextVariablesEditor
                  variables={workflow.contextVariables || []}
                  onChange={(vars) => updateWorkflowMutation.mutate({ contextVariables: vars })}
                />
              </div>
            </SheetContent>
          </Sheet>
          {isExecuting ? (
            <Button variant="outline" onClick={stopExecution} data-testid="button-stop">
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button onClick={executeWorkflow} data-testid="button-execute-workflow">
              <Play className="h-4 w-4 mr-2" />
              Execute
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Progress</span>
            {isExecuting && (
              <Badge variant="default">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Executing
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{completedSteps}/{steps.length} agents</span>
        </div>
        <Progress value={progress} className="h-2 mb-4" />
        <WorkflowTimeline steps={steps} onStepClick={() => {}} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm">Agent Outputs</h3>
            {documents && documents.length > 0 && (
              <Badge variant="secondary" className="text-xs">{documents.length}</Badge>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {documentsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : documents && documents.length > 0 ? (
                agents.map((agent) => {
                  const agentDocs = documentsByAgent[agent.id] || [];
                  if (agentDocs.length === 0) return null;
                  
                  const isExpanded = expandedAgents[agent.id] !== false;
                  
                  return (
                    <Collapsible 
                      key={agent.id} 
                      open={isExpanded}
                      onOpenChange={(open) => toggleAgentSection(agent.id, open)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between gap-2 w-full p-2 rounded-md hover-elevate" data-testid={`section-${agent.id}`}>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{agentDocs.length}</Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-1">
                        {agentDocs.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocument(doc);
                              setStreamingContent("");
                            }}
                            className={`w-full text-left p-2 rounded-md hover-elevate ${
                              selectedDocument?.id === doc.id ? "bg-muted" : ""
                            }`}
                            data-testid={`button-select-doc-${doc.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium truncate">{doc.title}</span>
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {doc.outputType}
                            </Badge>
                          </button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No documents yet. Execute the specification to generate outputs.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-hidden">
          {streamingContent ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {isExecuting ? "Generating..." : "Output"}
                </span>
                {isExecuting && (
                  <Badge variant="default">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Streaming
                  </Badge>
                )}
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-4xl mx-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-6 rounded-lg" data-testid="content-streaming">
                    {streamingContent}
                    {isExecuting && <span className="animate-pulse">|</span>}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          ) : selectedDocument ? (
            <DocumentViewer
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
              onSave={async (content) => {
                const res = await apiRequest("PATCH", `/api/documents/${selectedDocument.id}`, { content });
                const updatedDoc = await res.json();
                queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "documents"] });
                queryClient.invalidateQueries({ queryKey: [`/api/documents/${selectedDocument.id}/versions`] });
                setSelectedDocument(updatedDoc);
                toast({
                  title: "Document saved",
                  description: "Your changes have been saved."
                });
              }}
              onDocumentUpdate={(doc) => {
                setSelectedDocument(doc);
                queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "documents"] });
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Ready to Execute</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Click "Execute" to run the specification and generate documents across all agents.
                </p>
                <Button onClick={executeWorkflow} data-testid="button-execute-empty">
                  <Play className="h-4 w-4 mr-2" />
                  Execute Specification
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
