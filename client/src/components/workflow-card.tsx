import { Link } from "wouter";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Workflow } from "@shared/schema";

interface WorkflowCardProps {
  workflow: Workflow;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function WorkflowCard({ workflow, onDelete, onDuplicate }: WorkflowCardProps) {
  const statusConfig = {
    draft: { icon: FileText, label: "Draft", variant: "secondary" as const },
    in_progress: { icon: Loader2, label: "In Progress", variant: "default" as const, animate: true },
    completed: { icon: CheckCircle2, label: "Completed", variant: "default" as const },
    error: { icon: AlertCircle, label: "Error", variant: "destructive" as const }
  };

  const { icon: StatusIcon, label, variant, animate } = statusConfig[workflow.status];

  const variableCount = workflow.contextVariables.length;
  const hasConstitution = !!workflow.constitutionContent;

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-workflow-${workflow.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{workflow.name}</CardTitle>
            {workflow.description && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {workflow.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-workflow-menu-${workflow.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/workflow/${workflow.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(workflow.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(workflow.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {variableCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {variableCount} vars
              </Badge>
            )}
            {hasConstitution && (
              <Badge variant="outline" className="text-xs">
                Constitution
              </Badge>
            )}
            <Badge variant={variant} className="text-xs">
              <StatusIcon className={`h-3 w-3 mr-1 ${animate ? "animate-spin" : ""}`} />
              {label}
            </Badge>
          </div>
        </div>

        <Link href={`/workflow/${workflow.id}`}>
          <Button variant="outline" size="sm" className="w-full mt-4" data-testid={`button-open-workflow-${workflow.id}`}>
            Open Workflow
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function WorkflowCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="h-4 bg-muted rounded animate-pulse w-24" />
          <div className="h-5 bg-muted rounded-full animate-pulse w-20" />
        </div>
        <div className="h-9 bg-muted rounded animate-pulse w-full" />
      </CardContent>
    </Card>
  );
}
