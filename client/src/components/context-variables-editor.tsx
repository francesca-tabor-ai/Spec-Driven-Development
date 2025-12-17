import { useState } from "react";
import { Info, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import type { ContextVariable } from "@shared/schema";

interface ContextVariablesEditorProps {
  variables: ContextVariable[];
  onChange: (variables: ContextVariable[]) => void;
  readOnly?: boolean;
}

export function ContextVariablesEditor({
  variables,
  onChange,
  readOnly = false
}: ContextVariablesEditorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const updateVariable = (index: number, field: keyof ContextVariable, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addVariable = () => {
    onChange([...variables, { key: "", value: "", description: "" }]);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" data-testid="button-toggle-variables">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium">Context Variables</span>
            <span className="text-xs text-muted-foreground">({variables.length})</span>
          </Button>
        </CollapsibleTrigger>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={addVariable}
            data-testid="button-add-variable"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      <CollapsibleContent className="space-y-3">
        {variables.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">
            No context variables defined
          </div>
        ) : (
          variables.map((variable, index) => (
            <div
              key={index}
              className="p-4 rounded-md bg-muted/50 space-y-3"
              data-testid={`variable-item-${index}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`var-key-${index}`} className="text-xs text-muted-foreground">
                      Variable Name
                    </Label>
                    {variable.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-xs">{variable.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Input
                    id={`var-key-${index}`}
                    value={variable.key}
                    onChange={(e) => updateVariable(index, "key", e.target.value)}
                    placeholder="e.g., target_audience"
                    className="font-mono text-sm"
                    readOnly={readOnly}
                    data-testid={`input-variable-key-${index}`}
                  />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariable(index)}
                    className="mt-6"
                    data-testid={`button-remove-variable-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`var-value-${index}`} className="text-xs text-muted-foreground">
                  Value
                </Label>
                <Textarea
                  id={`var-value-${index}`}
                  value={variable.value}
                  onChange={(e) => updateVariable(index, "value", e.target.value)}
                  placeholder="Enter value..."
                  className="min-h-20 resize-y font-mono text-sm"
                  readOnly={readOnly}
                  data-testid={`input-variable-value-${index}`}
                />
              </div>
            </div>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
