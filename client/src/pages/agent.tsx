import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Play,
  Settings2,
  FileText,
  ChevronRight,
  Loader2,
  Copy,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ContextVariablesEditor } from "@/components/context-variables-editor";
import { DocumentViewer } from "@/components/document-viewer";
import { agents, defaultContextVariables, type AgentType, type ContextVariable, type Document } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AgentPage() {
  const { agentType } = useParams<{ agentType: string }>();
  const [contextVariables, setContextVariables] = useState<ContextVariable[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const agent = agents.find(a => a.id === agentType);

  useEffect(() => {
    if (agentType && defaultContextVariables[agentType as AgentType]) {
      setContextVariables(defaultContextVariables[agentType as AgentType]);
    }
  }, [agentType]);

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", agentType],
    enabled: !!agentType
  });

  const executeAgent = async () => {
    if (!agent) return;

    setIsExecuting(true);
    setStreamingContent("");
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: agent.id,
          contextVariables
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error("Failed to execute agent");
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
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/documents", agentType] });
              }
              if (data.document) {
                setCurrentDocument(data.document);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast({
        title: "Agent executed",
        description: `${agent.name} has completed execution.`
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast({
          title: "Execution failed",
          description: "Failed to execute agent. Please try again.",
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(streamingContent || currentDocument?.content || "");
    toast({
      title: "Copied",
      description: "Content copied to clipboard."
    });
  };

  const handleDownload = () => {
    const content = streamingContent || currentDocument?.content || "";
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${agent?.name || "output"}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Agent Not Found</h2>
          <p className="text-sm text-muted-foreground">The requested agent does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="lg:w-[400px] lg:border-r flex flex-col h-full overflow-hidden">
        <div className="p-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted shrink-0">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold truncate" data-testid="text-agent-name">
                {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {agent.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {agent.outputTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="variables" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="variables" className="flex-1" data-testid="tab-variables">
                  Variables
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1" data-testid="tab-history">
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="variables" className="flex-1 overflow-auto p-6 pt-4 m-0">
              <ContextVariablesEditor
                variables={contextVariables}
                onChange={setContextVariables}
              />
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto p-6 pt-4 m-0">
              {documentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setCurrentDocument(doc);
                        setStreamingContent("");
                      }}
                      className={`w-full text-left p-3 rounded-md border hover-elevate ${
                        currentDocument?.id === doc.id ? "border-primary bg-muted" : ""
                      }`}
                      data-testid={`button-doc-${doc.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{doc.title}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.outputType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No documents generated yet
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t">
            <Button
              className="w-full"
              onClick={isExecuting ? stopExecution : executeAgent}
              variant={isExecuting ? "outline" : "default"}
              data-testid="button-execute-agent"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stop Execution
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Agent
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/30">
        {streamingContent || currentDocument ? (
          <>
            <div className="p-4 border-b bg-background flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-medium text-sm truncate">
                    {isExecuting ? "Generating..." : currentDocument?.title || "Output"}
                  </h2>
                  {isExecuting && (
                    <Badge variant="default" className="text-xs mt-1">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Streaming
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={handleCopy} data-testid="button-copy-output">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload} data-testid="button-download-output">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-4xl mx-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-6 rounded-lg border" data-testid="content-output">
                  {streamingContent || currentDocument?.content}
                  {isExecuting && <span className="animate-pulse">|</span>}
                </pre>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Ready to Execute</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure the context variables and click "Execute Agent" to generate output.
              </p>
              <Button onClick={executeAgent} data-testid="button-execute-empty">
                <Play className="h-4 w-4 mr-2" />
                Execute Agent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
