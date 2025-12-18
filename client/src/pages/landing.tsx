import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, Building2, ListTodo, Code2, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Specifications</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </header>

        <main>
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Spec-Driven Development Workflow
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform your ideas into well-structured specifications using AI-powered agents. 
              From concept to implementation, follow a proven workflow that treats specifications 
              as the authoritative source of truth.
            </p>
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">Five Specialized AI Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Decision Author</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Produces formal, decision-oriented specifications for SDDD tool and methodology selection
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Analyst / PM</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Creates Project Briefs, PRDs, and Initial Specifications from your requirements
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Architect</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Translates requirements into coherent system architecture with ADRs
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Scrum Master</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Decomposes plans into hyper-detailed, testable user stories and tasks
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Developer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Produces implementation code following specifications and architectural decisions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Constitutional Governance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Define project-wide rules and guidelines that all agents must follow
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to start?</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to create your first specification workflow
            </p>
            <Button size="lg" asChild data-testid="button-signin-bottom">
              <a href="/api/login">Sign In to Continue</a>
            </Button>
          </section>
        </main>
      </div>
    </div>
  );
}
