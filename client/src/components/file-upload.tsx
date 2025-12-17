import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, File, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface FileUploadResult {
  fileName: string;
  mimeType: string;
  size: number;
  textContent: string;
}

interface FileUploadProps {
  onContentExtracted?: (content: string, fileName: string) => void;
  triggerButton?: React.ReactNode;
}

export function FileUpload({ onContentExtracted, triggerButton }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      
      return response.json() as Promise<FileUploadResult>;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "File processed",
        description: `Successfully extracted text from ${data.fileName}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or TXT file",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleUseContent = () => {
    if (uploadResult && onContentExtracted) {
      onContentExtracted(uploadResult.textContent, uploadResult.fileName);
      setIsOpen(false);
      setUploadResult(null);
    }
  };

  const handleClose = () => {
    setUploadResult(null);
    setIsOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setUploadResult(null);
    }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" data-testid="button-upload-file">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        {!uploadResult && !uploadMutation.isPending && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file-upload"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">
              Drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-browse-files"
            >
              Browse Files
            </Button>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                PDF
              </Badge>
              <Badge variant="outline" className="text-xs">
                <File className="h-3 w-3 mr-1" />
                TXT
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
          </div>
        )}

        {uploadMutation.isPending && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </div>
        )}

        {uploadResult && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500/10 shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" data-testid="text-uploaded-filename">
                        {uploadResult.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {uploadResult.mimeType === "application/pdf" ? "PDF" : "TXT"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(uploadResult.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadResult(null)}
                    data-testid="button-clear-upload"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <p className="text-sm font-medium mb-2">Extracted Content Preview</p>
              <ScrollArea className="h-48 border rounded-md">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap" data-testid="text-extracted-content">
                  {uploadResult.textContent.substring(0, 2000)}
                  {uploadResult.textContent.length > 2000 && "..."}
                </pre>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadResult.textContent.length.toLocaleString()} characters extracted
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          {uploadResult && onContentExtracted && (
            <Button onClick={handleUseContent} data-testid="button-use-content">
              Use Extracted Content
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
