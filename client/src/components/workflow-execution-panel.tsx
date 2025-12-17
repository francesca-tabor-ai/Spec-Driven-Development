import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AgentCardCompact } from "@/components/agent-card";
import { agents, type AgentType, type ExecutionStep } from "@shared/schema";

interface WorkflowExecutionPanelProps {
  workflowId: string;
  steps: ExecutionStep[];
  currentAgentIndex: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepClick: (agentType: AgentType) => void;
}

export function WorkflowExecutionPanel({
  workflowId,
  steps,
  currentAgentIndex,
  isRunning,
  onStart,
  onPause,
  onReset,
  onStepClick
}: WorkflowExecutionPanelProps) {
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const hasErrors = steps.some(s => s.status === "error");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">Workflow Progress</CardTitle>
          <Badge
            variant={hasErrors ? "destructive" : isRunning ? "default" : "secondary"}
          >
            {hasErrors ? "Error" : isRunning ? "Running" : completedSteps === steps.length && steps.length > 0 ? "Complete" : "Ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps}/{steps.length} steps</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-workflow" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              className="flex-1"
              data-testid="button-pause-workflow"
            >
              <Pause className="h-4 w-4 mr-1.5" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onStart}
              className="flex-1"
              disabled={completedSteps === steps.length && steps.length > 0}
              data-testid="button-start-workflow"
            >
              <Play className="h-4 w-4 mr-1.5" />
              {completedSteps > 0 ? "Resume" : "Start"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            data-testid="button-reset-workflow"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mb-4" />

        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-1">
            {steps.map((step, index) => {
              const agent = agents.find(a => a.id === step.agentType);
              if (!agent) return null;

              return (
                <div
                  key={step.id}
                  className="relative"
                >
                  {index < steps.length - 1 && (
                    <div className="absolute left-[19px] top-[44px] w-0.5 h-4 bg-border" />
                  )}
                  <button
                    onClick={() => onStepClick(step.agentType)}
                    className="w-full text-left hover-elevate rounded-md"
                    data-testid={`button-step-${step.agentType}`}
                  >
                    <AgentCardCompact
                      agent={agent}
                      status={step.status}
                      isActive={index === currentAgentIndex}
                      stepNumber={index + 1}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface WorkflowTimelineProps {
  steps: ExecutionStep[];
  onStepClick: (agentType: AgentType) => void;
}

export function WorkflowTimeline({ steps, onStepClick }: WorkflowTimelineProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const agent = agents.find(a => a.id === step.agentType);
        if (!agent) return null;

        const statusConfig = {
          pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
          running: { icon: Loader2, color: "text-primary", bg: "bg-primary/10" },
          completed: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
          error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" }
        };

        const { icon: StatusIcon, color, bg } = statusConfig[step.status];

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick(step.agentType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${bg} hover-elevate`}
              data-testid={`timeline-step-${step.agentType}`}
            >
              <StatusIcon className={`h-4 w-4 ${color} ${step.status === "running" ? "animate-spin" : ""}`} />
              <span className="text-sm font-medium whitespace-nowrap">{agent.name}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
