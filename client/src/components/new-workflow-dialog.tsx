import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Wand2, Upload, FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { agents, defaultContextVariables, type AgentType, type ContextVariable } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const workflowFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(5000, "Description is too long").optional(),
  startingAgent: z.enum(["decision_author", "analyst", "architect", "scrum_master", "developer"] as const),
  contextVariables: z.array(z.object({
    key: z.string(),
    value: z.string(),
    description: z.string().optional()
  })).optional(),
  uploadedContent: z.string().optional()
});

type WorkflowFormValues = z.infer<typeof workflowFormSchema>;

interface NewWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WorkflowFormValues) => void;
  isLoading?: boolean;
}

export function NewWorkflowDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false
}: NewWorkflowDialogProps) {
  const [contextVarsOpen, setContextVarsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startingAgent: "analyst",
      contextVariables: defaultContextVariables["analyst"],
      uploadedContent: ""
    }
  });

  const startingAgent = form.watch("startingAgent");
  const contextVariables = form.watch("contextVariables") || [];

  const handleAgentChange = (agentId: AgentType) => {
    form.setValue("startingAgent", agentId);
    form.setValue("contextVariables", defaultContextVariables[agentId]);
  };

  const updateContextVariable = (index: number, value: string) => {
    const updated = [...contextVariables];
    updated[index] = { ...updated[index], value };
    form.setValue("contextVariables", updated);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or TXT file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFile({ name: data.fileName, content: data.content });
        form.setValue("uploadedContent", data.content);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    form.setValue("uploadedContent", "");
  };

  const handleSubmit = (values: WorkflowFormValues) => {
    onSubmit(values);
    form.reset();
    setUploadedFile(null);
    setContextVarsOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setUploadedFile(null);
      setContextVarsOpen(false);
    }
    onOpenChange(newOpen);
  };

  const filledVariablesCount = contextVariables.filter(v => v.value.trim() !== "").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Create New Workflow
          </DialogTitle>
          <DialogDescription>
            Configure your Spec-Driven Development workflow with context variables and optional file uploads.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., E-commerce Platform MVP"
                        {...field}
                        data-testid="input-workflow-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startingAgent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Agent</FormLabel>
                    <Select onValueChange={handleAgentChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-starting-agent">
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      The agent that will begin the workflow
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed context about your project, requirements, goals, constraints, and any additional information that will help the AI agents generate better specifications. You can include user stories, technical requirements, business rules, or any other relevant details..."
                        className="resize-none min-h-32"
                        {...field}
                        data-testid="input-workflow-description"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Up to 5,000 characters. Include any context that will help shape the specifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-sm font-medium">File Upload</FormLabel>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {uploadedFile.content.length.toLocaleString()} chars
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeUploadedFile}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1"
                      data-testid="button-upload-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload PDF or TXT File"}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload existing specifications, requirements documents, or reference materials.
                </p>
              </div>

              <Collapsible open={contextVarsOpen} onOpenChange={setContextVarsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    data-testid="button-toggle-context-vars"
                  >
                    <div className="flex items-center gap-2">
                      <span>Context Variables</span>
                      <Badge variant="secondary" className="text-xs">
                        {filledVariablesCount}/{contextVariables.length} filled
                      </Badge>
                    </div>
                    {contextVarsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <p className="text-xs text-muted-foreground">
                    These variables customize the AI agent&apos;s behavior for this workflow.
                  </p>
                  {contextVariables.map((variable, index) => (
                    <div key={variable.key} className="space-y-1">
                      <label className="text-sm font-medium capitalize">
                        {variable.key.replace(/_/g, " ")}
                      </label>
                      <Input
                        placeholder={variable.description || `Enter ${variable.key}`}
                        value={variable.value}
                        onChange={(e) => updateContextVariable(index, e.target.value)}
                        data-testid={`input-context-${variable.key}`}
                      />
                      {variable.description && (
                        <p className="text-xs text-muted-foreground">{variable.description}</p>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} data-testid="button-create-workflow">
                  {isLoading ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create Workflow
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
