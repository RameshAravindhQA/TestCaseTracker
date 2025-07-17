import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  FolderOpen,
  TestTube,
  Bug,
  Users,
  FileText,
  BarChart3,
  Settings,
  GitBranch,
  MessageCircle,
  ClipboardList,
  BookOpen,
  CheckSquare,
  Clock,
  Globe,
  Workflow,
  Bot,
  Kanban,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  FileTextIcon,
  GitMerge,
  
  Users2,
  Settings2,
  Network,
  Brain,
  Zap,
  Target,
  Shield,
  UserCog,
  LifeBuoy,
  Mail,
  Phone
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

interface DashboardStats {
  totalProjects: number;
  totalTestCases: number;
  openBugs: number;
  passRate: number;
}

const navigationItems = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", badge: null },
      { icon: BarChart3, label: "Reports", href: "/reports", badge: null },
      { icon: GitBranch, label: "Functional Flow", href: "/functional-flow", badge: "Beta" },
    ]
  },
  {
    title: "Project Management",
    items: [
      { icon: FolderOpen, label: "Projects", href: "/projects", badge: null },
      { icon: Users, label: "Team", href: "/users", badge: null },
      { icon: MessageSquare, label: "Messenger", href: "/messenger", badge: "New" },
    ]
  },
  {
    title: "Testing",
    items: [
      { icon: TestTube, label: "Test Cases", href: "/test-cases", badge: null },
      { icon: Bug, label: "Bugs", href: "/bugs", badge: null },
      { icon: ClipboardList, label: "Test Sheets", href: "/test-sheets", badge: null },
      { icon: Network, label: "Traceability Matrix", href: "/traceability-matrix", badge: null },
    ]
  },
  {
    title: "Documentation",
    items: [
      { icon: FileText, label: "Documents", href: "/documents", badge: null },
      { icon: BookOpen, label: "Notebooks", href: "/notebooks", badge: null },
    ]
  },
  {
    title: "Tools & Automation",
    items: [
      { icon: Bot, label: "Automation", href: "/automation", badge: "Pro" },
      { icon: GitBranch, label: "GitHub Integration", href: "/github", badge: null },
      { icon: Kanban, label: "Kanban Board", href: "/kanban", badge: null },
      { icon: Brain, label: "Test Data Generator", href: "/test-data-generator", badge: "AI" },
    ]
  },
  {
    title: "Time & Tasks",
    items: [
      { icon: Clock, label: "Timesheets", href: "/timesheets", badge: null },
      { icon: CheckSquare, label: "Todo Lists", href: "/todos", badge: null },
    ]
  },
  {
    title: "Administration",
    items: [
      { icon: Settings, label: "Settings", href: "/settings", badge: null },
      { icon: Shield, label: "Permissions", href: "/permissions", badge: null },
      { icon: UserCog, label: "Admin Panel", href: "/admin/notifications", badge: null },
    ]
  }
];

export function SidebarComponent({ isCollapsed, onToggle, isMobile, isOpen, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Always call hooks at the top level - never conditionally
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    enabled: !!user, // Only run when user is available
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!user, // Only run when user is available
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Early return after all hooks are called
  if (!user) {
    return null;
  }

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard" || location === "/";
    }
    return location.startsWith(href);
  };

  const getBadgeCount = (href: string) => {
    if (!stats) return null;

    switch (href) {
      case "/bugs":
        return stats.openBugs > 0 ? stats.openBugs : null;
      case "/projects":
        return stats.totalProjects > 0 ? stats.totalProjects : null;
      case "/test-cases":
        return stats.totalTestCases > 0 ? stats.totalTestCases : null;
      default:
        return null;
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <TestTube className="h-6 w-6 text-primary" />
          {!isCollapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TestTracker
            </span>
          )}
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          {navigationItems.map((section) => (
            <div key={section.title} className="space-y-2">
              {!isCollapsed && (
                <h4 className="text-sm font-medium text-muted-foreground px-2 mb-2">
                  {section.title}
                </h4>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const badgeCount = getBadgeCount(item.href);

                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 h-10",
                        isCollapsed && "px-2",
                        active && "bg-accent text-accent-foreground font-medium"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <div className="flex items-center gap-1">
                            {badgeCount && (
                              <Badge variant="secondary" className="h-5 text-xs px-1.5">
                                {badgeCount}
                              </Badge>
                            )}
                            {item.badge && (
                              <Badge 
                                variant={item.badge === "New" ? "default" : "outline"} 
                                className="h-5 text-xs px-1.5"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Quick Stats
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold">{stats?.totalProjects || 0}</div>
                <div className="text-muted-foreground">Projects</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-semibold">{stats?.passRate || 0}%</div>
                <div className="text-muted-foreground">Pass Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-background transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </div>
  );
}