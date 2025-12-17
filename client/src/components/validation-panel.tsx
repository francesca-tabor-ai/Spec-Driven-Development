import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

interface ValidationCategory {
  name: string;
  score: number;
  status: "pass" | "warning" | "fail";
  findings: string[];
}

interface ValidationResult {
  overallScore: number;
  status: "pass" | "warning" | "fail";
  categories: ValidationCategory[];
  suggestions: string[];
  summary: string;
}

interface ValidationPanelProps {
  document: Document;
}

export function ValidationPanel({ document }: ValidationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/documents/${document.id}/validate`);
      return res.json() as Promise<ValidationResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  const handleValidate = () => {
    validateMutation.mutate();
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const getStatusIcon = (status: "pass" | "warning" | "fail") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: "pass" | "warning" | "fail") => {
    switch (status) {
      case "pass":
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Pass</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Warning</Badge>;
      case "fail":
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">Fail</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-validate-document"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Specification Validation
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {!result && !validateMutation.isPending && (
            <div className="text-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Validate Specification</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Analyze this document against quality standards and constitutional requirements.
              </p>
              <Button onClick={handleValidate} data-testid="button-run-validation">
                <Shield className="h-4 w-4 mr-2" />
                Run Validation
              </Button>
            </div>
          )}

          {validateMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Analyzing specification...</p>
            </div>
          )}

          {result && (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                <div className="flex items-center justify-between gap-4 p-4 border rounded-md bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">Overall Score</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" data-testid="text-validation-score">{result.overallScore}</div>
                    <div className="text-xs text-muted-foreground">out of 100</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Category Scores</h4>
                  {result.categories.map((category) => (
                    <Collapsible
                      key={category.name}
                      open={expandedCategories.includes(category.name)}
                      onOpenChange={() => toggleCategory(category.name)}
                    >
                      <div className="border rounded-md">
                        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between gap-2 hover-elevate" data-testid={`category-${category.name.toLowerCase().replace(/\s/g, '-')}`}>
                          <div className="flex items-center gap-3">
                            {getStatusIcon(category.status)}
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-32">
                              <Progress 
                                value={category.score} 
                                className={`h-2 ${getScoreColor(category.score)}`}
                              />
                              <span className="text-xs text-muted-foreground w-8">{category.score}%</span>
                            </div>
                            {expandedCategories.includes(category.name) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                          {category.findings.length > 0 ? (
                            <ul className="space-y-1">
                              {category.findings.map((finding, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-muted-foreground/50">-</span>
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No issues found.</p>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>

                {result.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Suggestions
                    </h4>
                    <div className="space-y-2">
                      {result.suggestions.map((suggestion, i) => (
                        <div key={i} className="p-3 border rounded-md bg-muted/30">
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={handleValidate}
                    disabled={validateMutation.isPending}
                    className="w-full"
                    data-testid="button-revalidate"
                  >
                    {validateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Re-validate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
