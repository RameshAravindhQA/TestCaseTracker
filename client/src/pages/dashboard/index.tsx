import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bug,
  TestTube,
  FolderOpen,
  Plus,
  LayoutDashboard,
  Folder,
  FileText,
  BarChart3
} from "lucide-react";
// Generate real-time data based only on actual test cases and bugs
  const generateRealTimeData = () => {
    // Return empty data if no actual test cases exist, bugs can be optional
    if (!testCases || testCases.length === 0) {
      return { testExecutionData: [], bugTrendData: [] };
    }

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const testExecutionData = last7Days.map((date, index) => {
      // Filter test cases based on date (using created/updated date as proxy)
      const dayTestCases = testCases.filter(tc => {
        const tcDate = new Date(tc.updatedAt || tc.createdAt);
        return tcDate.toDateString() === date.toDateString();
      });

      const pass = dayTestCases.filter(tc => tc.status === 'Pass').length;
      const fail = dayTestCases.filter(tc => tc.status === 'Fail').length;
      const blocked = dayTestCases.filter(tc => tc.status === 'Blocked').length;
      const notExecuted = dayTestCases.filter(tc => tc.status === 'Not Executed').length;

      return {
        name: index === 6 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pass: pass,
        fail: fail,
        blocked: blocked,
        notExecuted: notExecuted,
        tests: pass + fail + blocked + notExecuted
      };
    });

    const bugTrendData = last7Days.map((date, index) => {
      const dayBugs = bugs ? bugs.filter(bug => {
        const bugDate = new Date(bug.dateReported);
        return bugDate.toDateString() === date.toDateString();
      }) : [];

      const critical = dayBugs.filter(bug => bug.severity === 'Critical').length;
      const major = dayBugs.filter(bug => bug.severity === 'Major').length;
      const minor = dayBugs.filter(bug => bug.severity === 'Minor').length;
      const trivial = dayBugs.filter(bug => bug.severity === 'Trivial').length;

      return {
        name: index === 6 ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        critical: critical,
        major: major,
        minor: minor,
        trivial: trivial,
        discovered: critical + major + minor + trivial,
        resolved: dayBugs.filter(bug => bug.status === 'Resolved' || bug.status === 'Closed').length
      };
    });

    return { testExecutionData, bugTrendData };
  };

  const { testExecutionData, bugTrendData } = generateRealTimeData();
// Fetch projects for the current user with real-time updates
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  });
// Fetch test cases with real-time updates
  const { data: testCases } = useQuery<TestCase[]>({
    queryKey: ["/api/test-cases"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/test-cases");
      if (!response.ok) throw new Error("Failed to fetch test cases");
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch bugs with real-time updates
  const { data: bugs } = useQuery<Bug[]>({
    queryKey: ["/api/bugs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bugs");
      if (!response.ok) throw new Error("Failed to fetch bugs");
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
  });
<div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl opacity-20"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-xl shadow-lg">
                  <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your testing projects and metrics</p>
              </div>
            </div>
          </div>
        </div>
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          icon={Folder}
          trend={stats?.totalProjects > 0 ? "Active projects" : "Create your first project"}
        />
        <StatsCard
          title="Test Cases"
          value={stats?.totalTestCases || 0}
          icon={FileText}
          trend={stats?.totalTestCases > 0 ? "Test cases created" : "No test cases yet"}
        />
        <StatsCard
          title="Open Bugs"
          value={stats?.openBugs || 0}
          icon={Bug}
          trend={stats?.openBugs > 0 ? "Requires attention" : "No open bugs"}
        />
        <StatsCard
          title="Pass Rate"
          value={`${stats?.passRate || 0}%`}
          icon={CheckCircle}
          trend={stats?.passRate > 0 ? "Current success rate" : "No test results yet"}
        />
      </div>
{/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Test Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.totalTestCases > 0 ? (
              <TestStatusChart
                data={[
                  { name: 'Passed', value: stats.testCaseStatusCounts?.Pass || 0, color: '#22c55e' },
                  { name: 'Failed', value: stats.testCaseStatusCounts?.Fail || 0, color: '#ef4444' },
                  { name: 'Blocked', value: stats.testCaseStatusCounts?.Blocked || 0, color: '#f59e0b' },
                  { name: 'Not Executed', value: stats.testCaseStatusCounts?.['Not Executed'] || 0, color: '#6b7280' },
                ]}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test cases available</p>
                  <p className="text-sm">Create a project and add test cases to see statistics</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Execution Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Real-time test execution status</p>
          </CardHeader>
          <CardContent>
            {testExecutionData.length > 0 ? (
              <LineChart width={400} height={300} data={testExecutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tests" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No test case data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bug Discovery & Resolution</CardTitle>
            <p className="text-sm text-muted-foreground">Real-time bug activity overview</p>
          </CardHeader>
          <CardContent>
            {bugTrendData.length > 0 ? (
              <LineChart width={400} height={300} data={bugTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="discovered" stroke="#ef4444" strokeWidth={2} name="Discovered" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} name="Resolved" />
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No bug data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
</div>

      {/* Welcome Dialog - only show if user is properly authenticated */}
    </DashboardLayout>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  // Also fetch user data directly to ensure it's available for the welcome dialog
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });
}
export function DashboardPage() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { user } = useAuth();
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    staleTime: 0, // Always fresh data
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  });

// Show welcome dialog and onboarding for new users
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

    if (!hasSeenWelcome && user) {
      setIsWelcomeOpen(true);
    }

    // Show onboarding for new users who haven't completed it
    if (user && !hasCompletedOnboarding && (!projects || projects.length === 0)) {
      setTimeout(() => setIsOnboardingOpen(true), 1000);
    }
  }, [user, projects]);

const handleWelcomeClose = () => {
    setIsWelcomeOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setIsOnboardingOpen(false);
  };