import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Copy, Download, Edit2, Save, X, FileText, Clock, History, RotateCcw, ChevronRight, FileJson, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ValidationPanel } from "@/components/validation-panel";
import type { Document, DocumentVersion } from "@shared/schema";

interface DocumentViewerProps {
  document: Document | null;
  isLoading?: boolean;
  streamingContent?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
  onDocumentUpdate?: (doc: Document) => void;
}

export function DocumentViewer({
  document,
  isLoading = false,
  streamingContent,
  onSave,
  onClose,
  onDocumentUpdate
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const { toast } = useToast();

  const { data: versions = [] } = useQuery<DocumentVersion[]>({
    queryKey: [`/api/documents/${document?.id}/versions`],
    enabled: !!document?.id
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (version: DocumentVersion): Promise<Document> => {
      const res = await apiRequest("PATCH", `/api/documents/${document?.id}`, {
        content: version.content
      });
      return res.json();
    },
    onSuccess: (restoredDoc: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document?.id}/versions`] });
      setShowVersionHistory(false);
      setSelectedVersion(null);
      onDocumentUpdate?.(restoredDoc);
      toast({
        title: "Version restored",
        description: "Document has been reverted to the selected version."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore version.",
        variant: "destructive"
      });
    }
  });

  const content = streamingContent || document?.content || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Document content has been copied."
    });
  };

  const handleDownload = (format: "markdown" | "json" = "markdown") => {
    if (!document) return;
    
    if (format === "json") {
      const jsonContent = JSON.stringify({
        title: document.title,
        content: document.content,
        outputType: document.outputType,
        agentType: document.agentType,
        version: document.version,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      downloadBlob(blob, `${document.title}.json`);
    } else {
      const markdownContent = `# ${document.title}\n\n${document.content}`;
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      downloadBlob(blob, `${document.title}.md`);
    }
  };

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

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave?.(editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    restoreVersionMutation.mutate(version);
  };

  if (!document && !streamingContent && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2" data-testid="text-no-document">No Document Selected</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Select a document from the list or execute an agent to generate new content.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="font-medium text-sm truncate" data-testid="text-document-title">
              {isLoading ? "Generating..." : document?.title || "New Document"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {document?.outputType && (
                <Badge variant="secondary" className="text-xs">
                  {document.outputType}
                </Badge>
              )}
              {document?.version && document.version > 1 && (
                <Badge variant="outline" className="text-xs">
                  v{document.version}
                </Badge>
              )}
              {isLoading && (
                <Badge variant="default" className="text-xs">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Streaming
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isLoading && !isEditing && document && (
            <>
              <Sheet open={showVersionHistory} onOpenChange={setShowVersionHistory}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-version-history"
                    disabled={versions.length === 0}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Version History
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {versions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No previous versions</p>
                        <p className="text-xs mt-1">Edit and save the document to create version history</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="space-y-2 pr-4">
                          <div
                            className={`p-3 rounded-md border cursor-pointer hover-elevate ${
                              !selectedVersion ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedVersion(null)}
                            data-testid="version-current"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">Current</Badge>
                                <span className="text-xs text-muted-foreground">v{document.version}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {document.content.substring(0, 100)}...
                            </p>
                          </div>
                          {versions.map((version) => (
                            <div
                              key={version.id}
                              className={`p-3 rounded-md border cursor-pointer hover-elevate ${
                                selectedVersion?.id === version.id ? "border-primary bg-primary/5" : ""
                              }`}
                              onClick={() => setSelectedVersion(version)}
                              data-testid={`version-${version.version}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">v{version.version}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(version.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {version.content.substring(0, 100)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    {selectedVersion && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            Preview: Version {selectedVersion.version}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleRestoreVersion(selectedVersion)}
                            disabled={restoreVersionMutation.isPending}
                            data-testid="button-restore-version"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </div>
                        <ScrollArea className="h-48 mt-2 border rounded-md">
                          <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                            {selectedVersion.content}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <ValidationPanel document={document} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                data-testid="button-copy-document"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-download-document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload("markdown")} data-testid="menu-download-markdown">
                    <FileCode className="h-4 w-4 mr-2" />
                    Download as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("json")} data-testid="menu-download-json">
                    <FileJson className="h-4 w-4 mr-2" />
                    Download as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                data-testid="button-edit-document"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                data-testid="button-save-document"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-document"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[600px] font-mono text-sm resize-none"
              data-testid="textarea-document-edit"
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="content-document">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted text-foreground p-4 rounded-lg overflow-x-auto">
                {content || (isLoading && (
                  <span className="text-muted-foreground animate-pulse">
                    Generating content...
                  </span>
                ))}
              </pre>
            </div>
          )}
        </div>
      </ScrollArea>

      {document?.createdAt && !isLoading && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-4 p-3 text-xs text-muted-foreground flex-wrap">
            <span>Created: {new Date(document.createdAt).toLocaleString()}</span>
            <div className="flex items-center gap-4">
              {document.updatedAt && document.updatedAt !== document.createdAt && (
                <span>Updated: {new Date(document.updatedAt).toLocaleString()}</span>
              )}
              {versions.length > 0 && (
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  {versions.length} previous {versions.length === 1 ? "version" : "versions"}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
