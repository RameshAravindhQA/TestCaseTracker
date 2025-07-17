import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
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
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavaDhitiLogo } from "@/components/ui/navadhiti-logo";
import { useColorTheme } from "@/components/theme/theme-provider";
import { useStableAvatar } from "@/hooks/use-stable-avatar";
import { LottieAvatar } from "@/components/ui/lottie-avatar";

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
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const activeItemRef = React.useRef<HTMLAnchorElement>(null);

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
    {
      name: "Test Automation",
      href: "/automation",
      icon: <Play className="h-5 w-5" />,
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

  // Animation variants for sidebar items
  const sidebarItemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    hover: {
      x: 5,
      scale: 1.02,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  };

  const userItems: NavItem[] = useMemo(() => [
    {
      name: "My Profile",
      href: "/profile",
      icon: <Users className="h-5 w-5" />,
    },
  ], []);

  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current) {
      const activeElement = activeItemRef.current;
      const sidebar = sidebarRef.current;

      // Calculate the position to scroll to
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.offsetHeight;
      const sidebarHeight = sidebar.clientHeight;
      const sidebarScrollTop = sidebar.scrollTop;

      // Check if element is fully visible
      const isVisible = (
        elementTop >= sidebarScrollTop &&
        elementTop + elementHeight <= sidebarScrollTop + sidebarHeight
      );

      if (!isVisible) {
        // Scroll to center the active item with better calculation
        const scrollTo = Math.max(0, elementTop - (sidebarHeight / 2) + (elementHeight / 2));
        sidebar.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [location]);

  // Add click handler for menu items to ensure proper scrolling
  const handleMenuItemClick = useCallback((href: string) => {
    // Small delay to allow navigation to complete before scrolling
    setTimeout(() => {
      if (sidebarRef.current) {
        const targetElement = sidebarRef.current.querySelector(`[href="${href}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }, 100);
  }, []);

  // Use stable avatar to prevent flickering
  const stableAvatar = useStableAvatar(user);

  // Get Lottie data for avatar display
  const avatarLottieData = useMemo(() => {
    if (!user || user.avatarType !== 'lottie' || !user.avatarData) {
      return null;
    }

    try {
      const avatarData = typeof user.avatarData === 'string' 
        ? JSON.parse(user.avatarData) 
        : user.avatarData;

      return avatarData?.preview || null;
    } catch (error) {
      console.error('❌ Error parsing avatar Lottie data:', error);
      return null;
    }
  }, [user]);

  // Compute avatar source with proper Lottie handling
  const avatarSrc = useMemo(() => {
    if (!user) return undefined;

    // Handle Lottie animations - don't use profilePicture URL for Lottie
    if (user.avatarType === 'lottie' && user.avatarData) {
      // Return null for Lottie animations as they should be rendered by LottieAvatar component
      return null;
    }

    // Handle regular profile pictures
    if (user.profilePicture && !user.profilePicture.startsWith('lottie:')) {
      // Add cache busting timestamp
      const separator = user.profilePicture.includes('?') ? '&' : '?';
      return `${user.profilePicture}${separator}t=${Date.now()}`;
    }

    return undefined;
  }, [user]);

  const userPermissions = useQuery<string[]>({
    queryKey: ['/api/user/permissions'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/permissions");
        if (!res.ok) {
          throw new Error('Failed to fetch permissions');
        }
        return res.json();
      } catch (error) {
        console.warn('Failed to fetch permissions:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 w-60 flex flex-col border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 z-30",
        className
      )}
    >

      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <img src="/images/navadhiti-logo-tree.jpg" alt="NavaDhiti" className="h-12 w-12 rounded" />
            <span className="">NavaDhiti</span>
          </Link>
      </div>

      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* Using the FrozenAvatar component that "freezes" on first render */}
        
        {/* Sidebar Profile Section */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-white border-2 border-primary/20 flex items-center justify-center">
            {avatarLottieData ? (
              <LottieAvatar
                animationData={avatarLottieData}
                width={36}
                height={36}
                autoplay={true}
                loop={true}
                name={user?.firstName || 'User'}
              />
            ) : avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Sidebar avatar image failed to load:", e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                <span className="text-xs text-white font-semibold">
                  {stableAvatar.userInitials}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role || "Member"}
            </p>
          </div>
        </div>
        
        {/*  <FrozenAvatar 
          user={user} 
          className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700"
          fallbackClassName="bg-gradient-to-br from-primary/80 to-primary/40"
        /> */}
        {useMemo(() => (
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || (user?.firstName ? `${user?.firstName} ${user?.lastName || ''}`.trim() : "Guest User")}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{user?.role || "User"}</p>
          </div>
        ), [user?.name, user?.firstName, user?.lastName, user?.role])}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400" ref={sidebarRef}>
        <motion.div 
          className="px-2 py-4 space-y-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {useMemo(() => 
            navItems.map((item, index) => {
              const isActive = location.startsWith(item.href);
              return (
              <div key={item.href}>
                <motion.div
                  variants={sidebarItemVariants}
                  custom={index}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link 
                    href={item.href}
                    onClick={() => handleMenuItemClick(item.href)}
                    className={cn(
                      "flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md group transition-all duration-200",
                      isActive
                        ? "text-white bg-primary shadow-md"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center">
                      <motion.span 
                        className={cn("mr-3", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {item.icon}
                      </motion.span>
                      {item.name}
                    </div>
                    {item.badge && (
                      <motion.span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

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
            )}), [navItems, location])}
        </motion.div>

        {/* User account section */}
        <>
          <motion.div 
            className="px-3 py-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: navItems.length * 0.05 + 0.1 }}
          >
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Account
            </h3>
          </motion.div>

          <motion.div 
            className="px-2 space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {useMemo(() => 
              userItems.map((item, index) => {
                const isActive = location.startsWith(item.href);
                return (
                <motion.div
                  key={item.href}
                  variants={sidebarItemVariants}
                  custom={navItems.length + index}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link 
                    href={item.href}
                    ref={isActive ? activeItemRef : null}
                    onClick={() => handleMenuItemClick(item.href)}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group transition-all duration-200",
                      isActive
                        ? "text-white bg-primary shadow-md"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    <motion.span 
                      className={cn("mr-3", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.icon}
                    </motion.span>
                    {item.name}
                  </Link>
                </motion.div>
              )}), [userItems, location, navItems.length])}
          </motion.div>
        </>

        {/* Admin section */}
        <AnimatePresence>
          {user?.role === "Admin" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="px-3 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navItems.length + userItems.length) * 0.05 + 0.2 }}
              >
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Admin
                </h3>
              </motion.div>

              <motion.div 
                className="px-2 space-y-1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {useMemo(() => 
                  adminItems.map((item, index) => {
                    const isActive = location.startsWith(item.href);
                    return (
                    <motion.div
                      key={item.href}
                      variants={sidebarItemVariants}
                      custom={navItems.length + userItems.length + index}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Link 
                        href={item.href}
                        onClick={() => handleMenuItemClick(item.href)}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm font-medium rounded-md group transition-all duration-200",
                          isActive
                            ? "text-white bg-primary shadow-md"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        )}
                      >
                        <motion.span 
                          className={cn("mr-3", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.15 }}
                        >
                          {item.icon}
                        </motion.span>
                        {item.name}
                      </Link>
                    </motion.div>
                  )}), [adminItems, location, navItems.length, userItems.length])}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <motion.div 
        className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (navItems.length + userItems.length + (user?.role === "Admin" ? adminItems.length : 0)) * 0.05 + 0.3 }}
      >
        <motion.div 
          className="flex items-center justify-between mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
          <ThemeToggle />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <motion.div
              animate={logoutMutation.isPending ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: logoutMutation.isPending ? Infinity : 0 }}
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-300" />
            </motion.div>
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </motion.div>
      </motion.div>

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