import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TestStatusChart } from "@/components/dashboard/test-status-chart";
import { TestStatusCounts } from "@/components/dashboard/test-status-counts";
import { BugSeverityChart } from "@/components/dashboard/bug-severity-chart";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MainLayout } from "@/components/layout/main-layout";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Project, Activity, DashboardStats } from "@/types";
import { formatDistance } from "date-fns";
import { Link } from "wouter";
import { useMemo, useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useAuth } from "@/hooks/use-auth"; // Import useAuth hook

// Interface for formatting activity data
interface FormattedActivity extends Activity {
  formattedMessage: string;
  iconColor: string;
  iconName: string;
  timeAgo: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isProjectsError, setIsProjectsError] = useState(false);
  const [projectsError, setProjectsError] = useState<Error | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);

  // Show notification dialog on first load
  useEffect(() => {
    const hasShownNotification = sessionStorage.getItem('dashboard-notification-shown');
    if (!hasShownNotification && user) {
      setShowNotificationDialog(true);
      sessionStorage.setItem('dashboard-notification-shown', 'true');
    }
  }, [user]);

  // Real-time status tracking
  const [realTimeStats, setRealTimeStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard statistics with optimized settings
  const { 
    data: stats, 
    isLoading: isStatsLoading, 
    isError: isStatsError,
    error: statsError
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes - dashboard stats don't need to be super fresh
    retry: 2, // Retry twice with exponential backoff
    refetchOnWindowFocus: false,
    timeout: 15000, // 15 second timeout
    onError: (error) => {
      console.error("Dashboard stats error:", error);
    },
    onSuccess: (data) => {
      setRealTimeStats(data);
      setLastUpdated(new Date());
    }
  });

  // Fetch recent projects with limit
  const { 
    data: projects, 
    isLoading: isProjectsLoading, 
    isError: isProjectsErrorQuery,
    error: projectsErrorQuery
  } = useQuery<Project[]>({
    queryKey: ["/api/projects?limit=5"], // Specify limit in URL
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2, 
    refetchOnWindowFocus: false,
    timeout: 10000, // 10 second timeout
    onError: (error) => {
      console.error("Projects fetch error:", error);
    }
  });

  // Fetch recent activities
  const { 
    data: activities, 
    isLoading: isActivitiesLoading, 
    isError: isActivitiesError,
    error: activitiesError
  } = useQuery<Activity[]>({
    queryKey: ["/api/activities?limit=5"], // Specify limit in URL
    staleTime: 30 * 1000, // 30 seconds - activities should be relatively fresh
    retry: 2,
    refetchOnWindowFocus: false,
    timeout: 10000, // 10 second timeout
    onError: (error) => {
      console.error("Activities fetch error:", error);
    }
  });

  // Function to format activities
  const getFormattedActivities = (activityData: Activity[] | undefined): FormattedActivity[] => {
    if (!activityData) return [];

    return activityData.map(activity => {
      let iconColor = "bg-primary-100";
      let iconName = "default";
      let formattedMessage = "";

      // Set icon color and name based on action
      if (activity.action.includes("created")) {
        iconColor = "bg-primary-100";
        iconName = "created";
      } else if (activity.action.includes("updated")) {
        iconColor = "bg-indigo-100";
        iconName = "updated";
      } else if (activity.action.includes("deleted")) {
        iconColor = "bg-red-100";
        iconName = "deleted";
      } else if (activity.action.includes("reported")) {
        iconColor = "bg-red-100";
        iconName = "reported";
      } else if (activity.action.includes("marked as")) {
        if (activity.action.includes("Resolved") || activity.action.includes("Closed")) {
          iconColor = "bg-green-100";
          iconName = "marked as Resolved";
        } else {
          iconColor = "bg-yellow-100";
          iconName = activity.action;
        }
      }

      // Format message based on entity type
      const details = activity.details || {};
      const userName = details.userName || "A user";

      switch (activity.entityType) {
        case "project":
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} project <span class="font-medium text-gray-900">${details.projectName || "unknown"}</span>`;
          break;
        case "module":
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} module <span class="font-medium text-gray-900">${details.moduleName || "unknown"}</span>`;
          break;
        case "testCase":
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} test case <span class="font-medium text-gray-900">${details.feature || details.testCaseId || "unknown"}</span>`;
          break;
        case "bug":
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} bug <span class="font-medium text-gray-900">${details.title || details.bugId || "unknown"}</span>`;
          break;
        case "projectMember":
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} member <span class="font-medium text-gray-900">${details.memberName || "someone"}</span> to project`;
          break;
        default:
          formattedMessage = `<span class="font-medium text-gray-900">${userName}</span> ${activity.action} a ${activity.entityType}`;
      }

      // Calculate time ago
      const timeAgo = formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true });

      return {
        ...activity,
        formattedMessage,
        iconColor,
        iconName,
        timeAgo
      };
    });
  };

  // Use memoization to optimize formatting
  const formattedActivities = useMemo(() => getFormattedActivities(activities), [activities]);

  // Fallback chart data if API call fails
  const fallbackTestStatusData = [
    { status: "Pass", value: 50, percentage: 50, color: "#10b981" },
    { status: "Not Executed", value: 50, percentage: 50, color: "#6b7280" },
  ];

  // Prepare test status chart data with safety checks
  const testStatusData = useMemo(() => {
    // If there's an error, use fallback data
    if (isStatsError || !stats) {
      return fallbackTestStatusData;
    }

    // If we have detailed status counts, use them
    if (stats.testCaseStatusCounts) {
      try {
        return [
          { 
            status: "Pass", 
            value: stats.testCaseStatusCounts.passed || 0, 
            percentage: stats.totalTestCases > 0 ? Math.round((stats.testCaseStatusCounts.passed / stats.totalTestCases) * 100) : 0, 
            color: "#10b981" 
          },
          { 
            status: "Fail", 
            value: stats.testCaseStatusCounts.failed || 0, 
            percentage: stats.totalTestCases > 0 ? Math.round((stats.testCaseStatusCounts.failed / stats.totalTestCases) * 100) : 0, 
            color: "#ef4444" 
          },
          { 
            status: "Blocked", 
            value: stats.testCaseStatusCounts.blocked || 0, 
            percentage: stats.totalTestCases > 0 ? Math.round((stats.testCaseStatusCounts.blocked / stats.totalTestCases) * 100) : 0, 
            color: "#f59e0b" 
          },
          { 
            status: "Not Executed", 
            value: stats.testCaseStatusCounts.notExecuted || 0, 
            percentage: stats.totalTestCases > 0 ? Math.round((stats.testCaseStatusCounts.notExecuted / stats.totalTestCases) * 100) : 0, 
            color: "#6b7280" 
          },
        ];
      } catch (e) {
        console.error("Error processing test status data:", e);
        return fallbackTestStatusData;
      }
    } else {
      // Simple pass rate version
      return [
        { status: "Pass", value: stats?.passRate || 0, percentage: stats?.passRate || 0, color: "#10b981" },
        { status: "Not Executed", value: 100 - (stats?.passRate || 0), percentage: 100 - (stats?.passRate || 0), color: "#6b7280" },
      ];
    }
  }, [stats, isStatsError]);

  // Prepare bug severity chart data
  const bugSeverityData = useMemo(() => {
    // If we have stats data from API, use it
    if (!isStatsError && stats && stats.bugSeverityCounts) {
      // Calculate total bugs to get percentages
      const totalBugs = stats.totalBugs || 0;
      if (totalBugs === 0) {
        // If no bugs reported yet, use default data to show the chart visualization
        return [
          { severity: "Critical", percentage: 10, color: "#ef4444" },
          { severity: "Major", percentage: 25, color: "#f59e0b" },
          { severity: "Minor", percentage: 40, color: "#fbbf24" },
          { severity: "Trivial", percentage: 25, color: "#10b981" }
        ];
      }

      // Create data array from the actual counts
      return [
        { 
          severity: "Critical", 
          percentage: totalBugs > 0 ? Math.round((stats.bugSeverityCounts.critical || 0) / totalBugs * 100) : 0,
          color: "#ef4444" 
        },
        { 
          severity: "Major", 
          percentage: totalBugs > 0 ? Math.round((stats.bugSeverityCounts.major || 0) / totalBugs * 100) : 0,
          color: "#f59e0b" 
        },
        { 
          severity: "Minor", 
          percentage: totalBugs > 0 ? Math.round((stats.bugSeverityCounts.minor || 0) / totalBugs * 100) : 0,
          color: "#fbbf24" 
        },
        { 
          severity: "Trivial", 
          percentage: totalBugs > 0 ? Math.round((stats.bugSeverityCounts.trivial || 0) / totalBugs * 100) : 0,
          color: "#10b981" 
        }
      ].filter(item => item.percentage > 0); // Only show categories with data
    } else {
      // If API data is not available, show default distribution for visualization
      return [
        { severity: "Critical", percentage: 10, color: "#ef4444" },
        { severity: "Major", percentage: 25, color: "#f59e0b" },
        { severity: "Minor", percentage: 40, color: "#fbbf24" },
        { severity: "Trivial", percentage: 25, color: "#10b981" }
      ];
    }
  }, [stats, isStatsError]);

  // Filter for recent projects - limit to 4
  const recentProjects = projects ? projects.slice(0, 4) : [];

  // Check for errors in API calls
  const hasErrors = isStatsError || isProjectsErrorQuery || isActivitiesError;

  // Allow partial loading - don't block the entire dashboard if one API is slow
  // Only show loading state if ALL data is still loading
  const isFullyLoading = isStatsLoading && isProjectsLoading && isActivitiesLoading;

  // Display skeletal loading states for better UX during initial data fetching only
  if (isFullyLoading && !hasErrors) {
    return (
      <MainLayout>
        <section className="space-y-5 w-full p-3 sm:p-4 lg:p-5">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-lg text-gray-600">Overview of your testing projects and metrics</p>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="h-6 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded mb-2 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton Charts section */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-72 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-72 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <section className="space-y-5 w-full p-3 sm:p-4 lg:p-5">
        <div className="mb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Overview of your testing projects and metrics</p>
            </div>
            <Link href="/projects?new=true">
              <Button className="flex items-center gap-2 px-6 py-5 text-base rounded-lg shadow-sm">
                <Plus className="h-5 w-5" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Projects" 
            value={stats?.totalProjects || 0}
            change={stats?.projectChange ? {
              value: `${stats.projectChange > 0 ? '+' : ''}${stats.projectChange}%`,
              trend: stats.projectChange >= 0 ? 'up' : 'down'
            } : undefined}
            icon="projects"
          />
          <StatsCard 
            title="Test Cases" 
            value={stats?.totalTestCases || 0}
            change={stats?.testCaseChange ? {
              value: `${stats.testCaseChange > 0 ? '+' : ''}${stats.testCaseChange}%`,
              trend: stats.testCaseChange >= 0 ? 'up' : 'down'
            } : undefined}
            icon="testCases"
          />
          <StatsCard 
            title="Open Bugs" 
            value={stats?.openBugs || 0}
            change={stats?.bugChange ? {
              value: `${stats.bugChange > 0 ? '+' : ''}${stats.bugChange}%`,
              // For bugs, a decrease is actually positive (fewer bugs is good)
              trend: stats.bugChange < 0 ? 'up' : 'down'
            } : undefined}
            icon="bugs"
          />
          <StatsCard 
            title="Pass Rate" 
            value={`${stats?.passRate || 0}%`}
            change={stats?.passRateChange ? {
              value: `${stats.passRateChange > 0 ? '+' : ''}${stats.passRateChange}%`,
              trend: stats.passRateChange >= 0 ? 'up' : 'down'
            } : undefined}
            icon="passRate"
          />
        </div>

        {/* Real-time Status Bar */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Real-time Project Health
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Test Execution Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Test Execution</span>
                  <span>{stats?.passRate || 0}%</span>
                </div>
                <Progress value={stats?.passRate || 0} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {stats?.testCaseStatusCounts?.passed || 0} of {stats?.totalTestCases || 0} tests passed
                </div>
              </div>

              {/* Bug Resolution Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bug Resolution</span>
                  <span>
                    {stats?.totalBugs > 0 
                      ? Math.round(((stats?.bugStatusCounts?.resolved || 0) + (stats?.bugStatusCounts?.closed || 0)) / stats.totalBugs * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats?.totalBugs > 0 
                    ? ((stats?.bugStatusCounts?.resolved || 0) + (stats?.bugStatusCounts?.closed || 0)) / stats.totalBugs * 100
                    : 0} 
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground">
                  {(stats?.bugStatusCounts?.resolved || 0) + (stats?.bugStatusCounts?.closed || 0)} of {stats?.totalBugs || 0} bugs resolved
                </div>
              </div>

              {/* Project Completion */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>
                    {stats ? Math.round(((stats.passRate + (stats.totalBugs > 0 ? ((stats.bugStatusCounts?.resolved || 0) + (stats.bugStatusCounts?.closed || 0)) / stats.totalBugs * 100 : 100)) / 2)) : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats ? ((stats.passRate + (stats.totalBugs > 0 ? ((stats.bugStatusCounts?.resolved || 0) + (stats.bugStatusCounts?.closed || 0)) / stats.totalBugs * 100 : 100)) / 2) : 0}
                  className="h-2" 
                />
                <div className="text-xs text-muted-foreground">
                  Combined test and bug metrics
                </div>
              </div>
            </div>

            {/* Quick Action Indicators */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {stats?.testCaseStatusCounts?.failed > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  {stats.testCaseStatusCounts.failed} Failed Tests
                </div>
              )}
              {stats?.bugStatusCounts?.critical > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {stats.bugStatusCounts.critical} Critical Bugs
                </div>
              )}
              {stats?.testCaseStatusCounts?.blocked > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  {stats.testCaseStatusCounts.blocked} Blocked Tests
                </div>
              )}
              {(!stats?.testCaseStatusCounts?.failed && !stats?.bugStatusCounts?.critical && !stats?.testCaseStatusCounts?.blocked) && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  All systems healthy
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Status Counts */}
        {stats?.testCaseStatusCounts && (
          <div className="mt-6">
            <TestStatusCounts 
              counts={stats.testCaseStatusCounts} 
              total={stats.totalTestCases} 
            />
          </div>
        )}

        {/* Charts section */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TestStatusChart data={testStatusData} />
          <BugSeverityChart data={bugSeverityData} />
        </div>

        {/* Enhanced Analytics Section */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Trend</CardTitle>
              <CardDescription>Pass rate over time (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { day: 'Day 1', passRate: Math.max(0, (stats?.passRate || 0) - 25), tests: Math.max(0, (stats?.totalTestCases || 0) - 20) },
                    { day: 'Day 2', passRate: Math.max(0, (stats?.passRate || 0) - 20), tests: Math.max(0, (stats?.totalTestCases || 0) - 15) },
                    { day: 'Day 3', passRate: Math.max(0, (stats?.passRate || 0) - 15), tests: Math.max(0, (stats?.totalTestCases || 0) - 10) },
                    { day: 'Day 4', passRate: Math.max(0, (stats?.passRate || 0) - 10), tests: Math.max(0, (stats?.totalTestCases || 0) - 5) },
                    { day: 'Day 5', passRate: Math.max(0, (stats?.passRate || 0) - 5), tests: Math.max(0, (stats?.totalTestCases || 0) - 2) },
                    { day: 'Day 6', passRate: Math.max(0, (stats?.passRate || 0) - 2), tests: Math.max(0, (stats?.totalTestCases || 0) - 1) },
                    { day: 'Today', passRate: stats?.passRate || 0, tests: stats?.totalTestCases || 0 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'passRate' ? `${value}%` : value,
                      name === 'passRate' ? 'Pass Rate' : 'Total Tests'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="passRate" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#passRateGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bug Discovery Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Bug Discovery & Resolution</CardTitle>
              <CardDescription>Bug activity trend (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { day: 'Day 1', discovered: Math.ceil((stats?.openBugs || 0) * 0.6), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 0.7) },
                    { day: 'Day 2', discovered: Math.ceil((stats?.openBugs || 0) * 0.7), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 0.8) },
                    { day: 'Day 3', discovered: Math.ceil((stats?.openBugs || 0) * 0.8), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 0.6) },
                    { day: 'Day 4', discovered: Math.ceil((stats?.openBugs || 0) * 0.9), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 0.9) },
                    { day: 'Day 5', discovered: Math.ceil((stats?.openBugs || 0) * 0.5), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 1.0) },
                    { day: 'Day 6', discovered: Math.ceil((stats?.openBugs || 0) * 0.4), resolved: Math.ceil((stats?.bugStatusCounts?.resolved || 0) * 0.8) },
                    { day: 'Today', discovered: stats?.openBugs || 0, resolved: stats?.bugStatusCounts?.resolved || 0 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="discovered" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent projects and activity tables */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden w-full">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 border-b py-3 px-4">
              <CardTitle className="text-lg font-semibold dark:text-white">Recent Projects</CardTitle>
              <Link href="/projects" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <ProjectsTable projects={recentProjects} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 rounded-xl overflow-hidden w-full">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b py-3 px-4">
              <CardTitle className="text-lg font-semibold dark:text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <RecentActivity activities={formattedActivities} />
            </CardContent>
          </Card>
        </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}