import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Target,
  Building2,
  Users,
  Shield,
  Code2,
  Gauge,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

interface Question {
  id: string;
  title: string;
  description: string;
  icon: any;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

interface Recommendation {
  tool: string;
  score: number;
  description: string;
  strengths: string[];
  considerations: string[];
  bestFor: string;
}

interface FrameworkResult {
  recommendations: Recommendation[];
  summary: string;
  projectProfile: string;
}

const questions: Question[] = [
  {
    id: "project_type",
    title: "Project Type",
    description: "What type of project are you building?",
    icon: Target,
    options: [
      { value: "web_app", label: "Web Application", description: "Full-stack web application with frontend and backend" },
      { value: "api", label: "API / Backend Service", description: "REST or GraphQL API service" },
      { value: "mobile", label: "Mobile Application", description: "iOS, Android, or cross-platform mobile app" },
      { value: "platform", label: "Platform / SaaS", description: "Multi-tenant platform or software-as-a-service" },
      { value: "data_pipeline", label: "Data Pipeline", description: "ETL, data processing, or analytics system" }
    ]
  },
  {
    id: "organization_type",
    title: "Organization Type",
    description: "What type of organization are you working in?",
    icon: Building2,
    options: [
      { value: "startup", label: "Startup", description: "Early-stage company focused on speed and iteration" },
      { value: "scaleup", label: "Scale-up", description: "Growing company balancing speed with process" },
      { value: "enterprise", label: "Enterprise", description: "Large organization with established processes" },
      { value: "agency", label: "Agency / Consultancy", description: "Building products for multiple clients" },
      { value: "solo", label: "Solo / Small Team", description: "Individual developer or small team" }
    ]
  },
  {
    id: "team_size",
    title: "Team Size",
    description: "How many developers will work on this project?",
    icon: Users,
    options: [
      { value: "solo", label: "Solo (1)", description: "Single developer" },
      { value: "small", label: "Small (2-5)", description: "Small team with direct communication" },
      { value: "medium", label: "Medium (6-15)", description: "Medium team with some structure" },
      { value: "large", label: "Large (16-50)", description: "Large team requiring coordination" },
      { value: "xlarge", label: "Extra Large (50+)", description: "Multiple teams with complex coordination" }
    ]
  },
  {
    id: "regulatory_level",
    title: "Regulatory Requirements",
    description: "What level of regulatory compliance is needed?",
    icon: Shield,
    options: [
      { value: "none", label: "None", description: "No specific regulatory requirements" },
      { value: "low", label: "Low", description: "Basic data protection (GDPR basics)" },
      { value: "medium", label: "Medium", description: "Industry standards (SOC 2, HIPAA basics)" },
      { value: "high", label: "High", description: "Strict compliance (PCI-DSS, full HIPAA)" },
      { value: "critical", label: "Critical", description: "Government or critical infrastructure" }
    ]
  },
  {
    id: "codebase_state",
    title: "Codebase State",
    description: "What is the current state of your codebase?",
    icon: Code2,
    options: [
      { value: "greenfield", label: "Greenfield", description: "Starting from scratch" },
      { value: "early", label: "Early Stage", description: "Young codebase with flexibility" },
      { value: "established", label: "Established", description: "Mature codebase with patterns" },
      { value: "legacy", label: "Legacy", description: "Older codebase needing modernization" },
      { value: "mixed", label: "Mixed", description: "Combination of old and new systems" }
    ]
  },
  {
    id: "governance_priority",
    title: "Governance Priority",
    description: "How important is formal specification governance?",
    icon: Gauge,
    options: [
      { value: "minimal", label: "Minimal", description: "Speed over documentation" },
      { value: "light", label: "Light", description: "Basic documentation and review" },
      { value: "moderate", label: "Moderate", description: "Structured specs with flexibility" },
      { value: "formal", label: "Formal", description: "Rigorous specification process" },
      { value: "strict", label: "Strict", description: "Full governance and audit trails" }
    ]
  },
  {
    id: "complexity",
    title: "System Complexity",
    description: "How complex is the system you're building?",
    icon: Layers,
    options: [
      { value: "simple", label: "Simple", description: "Single service, straightforward logic" },
      { value: "moderate", label: "Moderate", description: "Multiple components, some integration" },
      { value: "complex", label: "Complex", description: "Many services, complex business logic" },
      { value: "highly_complex", label: "Highly Complex", description: "Distributed systems, real-time requirements" },
      { value: "cutting_edge", label: "Cutting Edge", description: "Novel technology, research-grade complexity" }
    ]
  }
];

export default function DecisionFrameworkPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FrameworkResult | null>(null);

  const recommendMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      const res = await apiRequest("POST", "/api/decision-framework/recommend", { answers });
      return res.json() as Promise<FrameworkResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isComplete = currentStep >= questions.length;

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(questions.length);
      recommendMutation.mutate(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  const canProceed = currentQuestion && answers[currentQuestion.id];

  if (isComplete) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-page-title">Decision Framework</h1>
              <p className="text-xs text-muted-foreground">SDDD Methodology Recommendation</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleReset} data-testid="button-restart">
            Start Over
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto">
            {recommendMutation.isPending ? (
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-lg font-medium mb-2">Analyzing Your Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Generating personalized recommendations...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h2 className="text-xl font-semibold mb-2" data-testid="text-result-title">Your SDDD Recommendations</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">{result.summary}</p>
                </div>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Your Project Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{result.projectProfile}</p>
                  </CardContent>
                </Card>

                <h3 className="font-medium text-lg">Recommended Methodologies</h3>
                <div className="space-y-4">
                  {result.recommendations.map((rec, index) => (
                    <Card key={rec.tool} className={index === 0 ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {index === 0 && (
                                <Badge variant="default">Top Pick</Badge>
                              )}
                              <CardTitle data-testid={`text-recommendation-${index}`}>{rec.tool}</CardTitle>
                            </div>
                            <CardDescription>{rec.description}</CardDescription>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold">{rec.score}%</div>
                            <div className="text-xs text-muted-foreground">match</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-green-600">Strengths</h4>
                            <ul className="space-y-1">
                              {rec.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-yellow-600">Considerations</h4>
                            <ul className="space-y-1">
                              {rec.considerations.map((c, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-yellow-500 shrink-0">-</span>
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm">
                            <span className="font-medium">Best for: </span>
                            <span className="text-muted-foreground">{rec.bestFor}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Something went wrong. Please try again.</p>
                <Button onClick={handleReset} className="mt-4">Start Over</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const Icon = currentQuestion.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="font-semibold" data-testid="text-page-title">Decision Framework</h1>
              <p className="text-xs text-muted-foreground">SDDD Methodology Selector</p>
            </div>
          </div>
          <Badge variant="outline">
            Question {currentStep + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-question-title">{currentQuestion.title}</h2>
            <p className="text-muted-foreground">{currentQuestion.description}</p>
          </div>

          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option.value}
                className={`flex items-start space-x-3 p-4 border rounded-md cursor-pointer hover-elevate ${
                  answers[currentQuestion.id] === option.value ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleAnswer(option.value)}
                data-testid={`option-${option.value}`}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label htmlFor={option.value} className="cursor-pointer flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          data-testid="button-next"
        >
          {currentStep === questions.length - 1 ? "Get Recommendations" : "Next"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
