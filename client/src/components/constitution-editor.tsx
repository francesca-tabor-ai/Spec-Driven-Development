import { useState } from "react";
import {
  Save,
  RotateCcw,
  FileText,
  Eye,
  Edit2,
  Download,
  Upload,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CONSTITUTION = `# Project Constitution

## Core Principles

1. **Specification First**: All implementation must trace back to approved specifications.
2. **Explicit Over Implicit**: No assumptions; all decisions must be documented.
3. **Traceability**: Every component, decision, and implementation must be traceable to requirements.
4. **Quality Standards**: All outputs must meet defined quality criteria before proceeding.

## Architectural Constraints

- **Separation of Concerns**: Clear boundaries between components.
- **Single Responsibility**: Each component does one thing well.
- **Dependency Inversion**: Depend on abstractions, not concretions.
- **Open/Closed**: Open for extension, closed for modification.

## Coding Standards

- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Unit test coverage minimum: 80%
- Integration tests for all API endpoints
- Documentation for all public APIs

## Security Requirements

- Input validation on all user inputs
- Authentication required for protected routes
- Authorization checks at service layer
- Secrets management via environment variables
- Regular dependency updates

## Compliance

- GDPR compliance for user data
- Audit logging for sensitive operations
- Data retention policies enforced
- Privacy by design principles

## Review Process

1. All specifications reviewed by stakeholders
2. Architecture reviewed by senior engineers
3. Code reviewed before merge
4. QA verification before release
`;

interface ConstitutionEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  isModified?: boolean;
}

export function ConstitutionEditor({
  content,
  onChange,
  onSave,
  isModified = false
}: ConstitutionEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();

  const handleReset = () => {
    onChange(DEFAULT_CONSTITUTION);
    toast({
      title: "Constitution reset",
      description: "The constitution has been reset to default template."
    });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "constitution.md";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = ".md,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        onChange(text);
        toast({
          title: "Constitution imported",
          description: `Imported from ${file.name}`
        });
      }
    };
    input.click();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Constitution
                {isModified && (
                  <Badge variant="secondary" className="text-xs">Modified</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Standards and principles governing all specifications
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPreview(!isPreview)}
              data-testid="button-toggle-preview"
            >
              {isPreview ? <Edit2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              data-testid="button-download-constitution"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleImport}
              data-testid="button-import-constitution"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {!content && (
          <Alert className="m-4 mb-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No constitution defined. The default template will be used.
              <Button
                variant="link"
                className="h-auto p-0 ml-1"
                onClick={handleReset}
              >
                Load default template
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4">
            {isPreview ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="content-constitution-preview">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                  {content || DEFAULT_CONSTITUTION}
                </pre>
              </div>
            ) : (
              <Textarea
                value={content || DEFAULT_CONSTITUTION}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm resize-none"
                placeholder="Enter your project constitution..."
                data-testid="textarea-constitution"
              />
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between p-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            data-testid="button-reset-constitution"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to Default
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!isModified}
            data-testid="button-save-constitution"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
