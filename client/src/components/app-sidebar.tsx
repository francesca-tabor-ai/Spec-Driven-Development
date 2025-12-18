import { Link, useLocation } from "wouter";
import {
  FileText,
  ClipboardList,
  Building2,
  ListTodo,
  Code2,
  Home,
  ScrollText,
  FolderOpen,
  Settings,
  Plus,
  HelpCircle,
  Upload,
  LogOut,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { AgentType } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Specifications", url: "/workflows", icon: FolderOpen },
  { title: "Constitution", url: "/constitution", icon: ScrollText },
  { title: "Decision Framework", url: "/decision-framework", icon: HelpCircle }
];

interface AgentNavItem extends NavItem {
  agentType: AgentType;
}

const agentNavItems: AgentNavItem[] = [
  { title: "Decision Author", url: "/agent/decision_author", icon: FileText, agentType: "decision_author" },
  { title: "Analyst / PM", url: "/agent/analyst", icon: ClipboardList, agentType: "analyst" },
  { title: "Architect", url: "/agent/architect", icon: Building2, agentType: "architect" },
  { title: "Scrum Master", url: "/agent/scrum_master", icon: ListTodo, agentType: "scrum_master" },
  { title: "Developer", url: "/agent/developer", icon: Code2, agentType: "developer" }
];

interface AppSidebarProps {
  onNewWorkflow?: () => void;
}

export function AppSidebar({ onNewWorkflow }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm" data-testid="text-app-title">SDDD Workflow</span>
            <span className="text-xs text-muted-foreground">Spec-Driven Development</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2 pr-2">
            <span>AI Agents</span>
            <Badge variant="secondary" className="text-xs">5</Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agentNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(`${item.url}/`)}
                  >
                    <Link href={item.url} data-testid={`link-agent-${item.agentType}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-3">
        <Button
          className="w-full"
          onClick={onNewWorkflow}
          data-testid="button-new-workflow"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Specification
        </Button>

        <SidebarSeparator />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2" data-testid="button-user-menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className="text-sm truncate w-full">
                  {user?.firstName || user?.email || 'User'}
                </span>
                {user?.email && user?.firstName && (
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {user.email}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <a href="/api/logout" className="flex items-center gap-2 cursor-pointer" data-testid="button-logout">
                <LogOut className="h-4 w-4" />
                Sign Out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
