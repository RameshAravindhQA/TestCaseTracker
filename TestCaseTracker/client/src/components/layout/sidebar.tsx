
import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderKanban,
  CheckSquare,
  BugPlay,
  MessageSquare,
  Clock,
  FileText,
  FileBarChart,
  FormInput,
  ListFilter,
  Sparkles,
  BoxSelect,
  Play,
  Terminal,
  Briefcase,
  UserCheck,
  Users,
  Settings,
  User,
  Trello,
  Github,
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
}

function SidebarItem({ icon, label, to, isActive }: SidebarItemProps) {
  return (
    <a
      href={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </a>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const navigationItems = [
    { icon: <Home className="h-5 w-5" />, label: "Dashboard", to: "/dashboard" },
    { icon: <FolderKanban className="h-5 w-5" />, label: "Projects", to: "/projects" },
    { icon: <Trello className="h-5 w-5" />, label: "Kanban Board", to: "/kanban" },
    { icon: <CheckSquare className="h-5 w-5" />, label: "Test Cases", to: "/test-cases" },
    { icon: <Sparkles className="h-5 w-5" />, label: "AI Generator", to: "/ai-generator" },
    { icon: <BugPlay className="h-5 w-5" />, label: "Bug Reports", to: "/bugs" },
    { icon: <Terminal className="h-5 w-5" />, label: "Messenger", to: "/messenger" },
    { icon: <Github className="h-5 w-5" />, label: "GitHub Integration", to: "/github" },
    { icon: <BoxSelect className="h-5 w-5" />, label: "Functional Flow", to: "/functional-flow" },
    { icon: <Clock className="h-5 w-5" />, label: "Timesheets", to: "/timesheets" },
    { icon: <FileText className="h-5 w-5" />, label: "Documents", to: "/documents" },
    { icon: <FileBarChart className="h-5 w-5" />, label: "Reports", to: "/reports" },
    { icon: <FormInput className="h-5 w-5" />, label: "Test Sheets", to: "/test-sheets" },
    { icon: <ListFilter className="h-5 w-5" />, label: "Traceability Matrix", to: "/traceability-matrix" },
    { icon: <FileText className="h-5 w-5" />, label: "Notebooks", to: "/notebooks" },
    { icon: <CheckSquare className="h-5 w-5" />, label: "Todo List", to: "/todos" },
    { icon: <Play className="h-5 w-5" />, label: "Test Automation", to: "/automation" },
    { icon: <UserCheck className="h-5 w-5" />, label: "Catalyst Management", to: "/employees" },
    { icon: <Briefcase className="h-5 w-5" />, label: "Navadhiti Projects", to: "/navadhiti-projects" },
    { icon: <Users className="h-5 w-5" />, label: "User Management", to: "/users" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", to: "/settings" },
    { icon: <User className="h-5 w-5" />, label: "My Profile", to: "/profile" },
  ];

  return (
    <div className="fixed left-0 top-0 z-30 h-full w-60 bg-card border-r border-border">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold">NavaDhiti</span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.startsWith(item.to)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
