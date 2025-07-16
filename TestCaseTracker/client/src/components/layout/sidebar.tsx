import React, { useState, useMemo, memo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FrozenAvatar } from "@/components/ui/frozen-avatar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BugPlay,
  FileBarChart,
  FileText,
  Users,
  Settings,
  LogOut,
  Loader2,
  Clock,
  Play,
  Terminal,
  Trello,
  Kanban,
  Monitor,
  Navigation,
  RefreshCw,
  Compass,
  BoxSelect,
  FormInput,
  ListFilter,
  Star,
  ExternalLink,
  ChevronRight,
  Github,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const SidebarComponent = ({ className }: SidebarProps) => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    refetchInterval: 30000, // Reduce frequency to 30 seconds
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent avatar flicker
    staleTime: 60000, // 1 minute stale time
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all query cache
      queryClient.clear();

      // Remove auth status from localStorage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastLoginTime');

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });

      // Redirect to login page
      window.location.href = "/login";
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logoutMutation.mutate();
  };

  // Memoize navigation items to prevent recreation on re-render
  const navItems: NavItem[] = useMemo(() => [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <FolderKanban className="h-5 w-5" />,
    },
    {
      name: "Kanban Board",
      href: "/kanban",
      icon: <Trello className="h-5 w-5" />,
    },
    {
      name: "Test Cases",
      href: "/test-cases",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      name: "Bug Reports",
      href: "/bugs",
      icon: <BugPlay className="h-5 w-5" />,
    },
    {
      name: "Messenger",
      href: "/messenger",
      icon: <Terminal className="h-5 w-5" />,
    },
    {
      name: "GitHub Integration",
      href: "/github",
      icon: <Github className="h-5 w-5" />,
    },
    {
      name: "Functional Flow",
      href: "/functional-flow",
      icon: <BoxSelect className="h-5 w-5" />,
    },
    {
      name: "Timesheets",
      href: "/timesheets",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: "Documents",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <FileBarChart className="h-5 w-5" />,
    },
    {
      name: "Test Sheets",
      href: "/test-sheets",
      icon: <FormInput className="h-5 w-5" />,
    },
    {
      name: "Traceability Matrix",
      href: "/traceability-matrix",
      icon: <ListFilter className="h-5 w-5" />,
    },
    {
      name: "Notebooks",
      href: "/notebooks",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Todo List",
      href: "/todos",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      name: "Test Data Generator",
      href: "/test-data-generator",
      icon: <FileText className="h-5 w-5" />,
    },
  ], []);

  const adminItems: NavItem[] = useMemo(() => [
    {
      name: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ], []);

  const userItems: NavItem[] = useMemo(() => [
    {
      name: "My Profile",
      href: "/profile",
      icon: <Users className="h-5 w-5" />,
    },
  ], []);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 w-60 flex flex-col border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800",
        className
      )}
    >

      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <img src="/images/navadhiti-logo-tree.jpg" alt="NavaDhiti" className="h-8 w-8 rounded" />
            <span className="">NavaDhiti</span>
          </Link>
      </div>

      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Using the FrozenAvatar component that "freezes" on first render */}
        <FrozenAvatar 
          user={user} 
          className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700"
          fallbackClassName="bg-gradient-to-br from-primary/80 to-primary/40"
        />
        {useMemo(() => (
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || (user?.firstName ? `${user?.firstName} ${user?.lastName || ''}`.trim() : "Guest User")}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{user?.role || "User"}</p>
          </div>
        ), [user?.name, user?.firstName, user?.lastName, user?.role])}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-2 py-4 space-y-1">
          {useMemo(() => 
            navItems.map((item) => (
              <div key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md group",
                    location.startsWith(item.href) 
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center">
                    <span className={cn("mr-3", location.startsWith(item.href) ? "text-white" : "text-gray-500 dark:text-gray-400")}>
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Render submenu if item has children */}
                {item.children && item.children.length > 0 && (
                  <div className="pl-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center px-2 py-1.5 text-sm rounded-md",
                          location.startsWith(child.href)
                            ? "text-primary font-medium bg-primary/10"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                        )}
                      >
                        <span className="mr-2 text-gray-600 dark:text-gray-300">
                          {child.icon}
                        </span>
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )), [navItems, location])}
        </div>

        {/* User account section */}
        <>
          <div className="px-3 py-3">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Account
            </h3>
          </div>

          <div className="px-2 space-y-1">
            {useMemo(() => 
              userItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                    location.startsWith(item.href)
                      ? "text-white bg-primary"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  <span className={cn("mr-3", location.startsWith(item.href) ? "text-white" : "text-gray-500 dark:text-gray-400")}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              )), [userItems, location])}
          </div>
        </>

        {/* Admin section */}
        {user?.role === "Admin" && (
          <>
            <div className="px-3 py-3">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Admin
              </h3>
            </div>

            <div className="px-2 space-y-1">
              {useMemo(() => 
                adminItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      location.startsWith(item.href)
                        ? "text-white bg-primary"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className={cn("mr-3", location.startsWith(item.href) ? "text-white" : "text-gray-500 dark:text-gray-400")}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )), [adminItems, location])}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-300" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of NavaDhiti? Your session will be ended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-primary hover:bg-primary/90"
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Log out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

// Memoize the SidebarComponent to prevent unnecessary re-renders
export const Sidebar = memo(SidebarComponent);