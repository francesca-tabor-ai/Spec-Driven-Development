import {
  FileText,
  ClipboardList,
  Building2,
  ListTodo,
  Code2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgentInfo, AgentType } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  ClipboardList,
  Building2,
  ListTodo,
  Code2
};

interface AgentCardProps {
  agent: AgentInfo;
  status?: "idle" | "running" | "completed" | "error";
  isSelected?: boolean;
  onClick?: () => void;
  onExecute?: () => void;
}

export function AgentCard({ agent, status = "idle", isSelected, onClick, onExecute }: AgentCardProps) {
  const IconComponent = iconMap[agent.icon] || FileText;

  const statusConfig = {
    idle: { icon: Clock, label: "Ready", variant: "secondary" as const },
    running: { icon: Clock, label: "Running", variant: "default" as const },
    completed: { icon: CheckCircle2, label: "Completed", variant: "default" as const },
    error: { icon: AlertCircle, label: "Error", variant: "destructive" as const }
  };

  const { icon: StatusIcon, label: statusLabel, variant: statusVariant } = statusConfig[status];

  return (
    <Card
      className={`transition-all duration-200 cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
      data-testid={`card-agent-${agent.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <IconComponent className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5 line-clamp-1">
                {agent.description}
              </CardDescription>
            </div>
          </div>
          {status !== "idle" && (
            <Badge variant={statusVariant} className="shrink-0">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.outputTypes.map((outputType) => (
            <Badge key={outputType} variant="outline" className="text-xs">
              {outputType}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onExecute?.();
          }}
          disabled={status === "running"}
          data-testid={`button-execute-${agent.id}`}
        >
          {status === "running" ? (
            <>
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              Execute Agent
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface AgentCardCompactProps {
  agent: AgentInfo;
  status?: "pending" | "running" | "completed" | "error";
  isActive?: boolean;
  stepNumber: number;
}

export function AgentCardCompact({ agent, status = "pending", isActive, stepNumber }: AgentCardCompactProps) {
  const IconComponent = iconMap[agent.icon] || FileText;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
        isActive ? "bg-muted" : ""
      }`}
      data-testid={`step-agent-${agent.id}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-sm font-medium text-muted-foreground">
        {status === "completed" ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : status === "running" ? (
          <Clock className="h-4 w-4 animate-spin text-primary" />
        ) : status === "error" ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : (
          stepNumber
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
          {agent.name}
        </p>
      </div>
      <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`} />
    </div>
  );
}
