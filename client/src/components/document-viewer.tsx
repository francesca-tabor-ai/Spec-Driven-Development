import { useState } from "react";
import { Copy, Download, Edit2, Eye, Save, X, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

interface DocumentViewerProps {
  document: Document | null;
  isLoading?: boolean;
  streamingContent?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
}

export function DocumentViewer({
  document,
  isLoading = false,
  streamingContent,
  onSave,
  onClose
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  const content = streamingContent || document?.content || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Document content has been copied."
    });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document?.title || "document"}.md`;
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
            <div className="flex items-center gap-2 mt-0.5">
              {document?.outputType && (
                <Badge variant="secondary" className="text-xs">
                  {document.outputType}
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
          {!isLoading && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                data-testid="button-copy-document"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                data-testid="button-download-document"
              >
                <Download className="h-4 w-4" />
              </Button>
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
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
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
          <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
            <span>Created: {new Date(document.createdAt).toLocaleString()}</span>
            {document.updatedAt !== document.createdAt && (
              <span>Updated: {new Date(document.updatedAt).toLocaleString()}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
