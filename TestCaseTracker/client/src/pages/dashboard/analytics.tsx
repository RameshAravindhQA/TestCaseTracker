
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MainLayout } from '@/components/layout/main-layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity,
  Calendar,
  Target,
  Award,
  Clock
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboard() {
  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.json();
    },
  });

  // Fetch employee projects
  const { data: employeeProjects = [] } = useQuery({
    queryKey: ["/api/employee-projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employee-projects");
      return res.json();
    },
  });

  // Fetch all projects
  const { data: allProjects = [] } = useQuery({
    queryKey: ["/api/projects/mapping-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects/mapping-options");
      return res.json();
    },
  });

  // Calculate statistics
  const totalEmployees = employees.length;
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p: any) => p.status === 'Active').length;
  
  // Department distribution
  const departmentData = employees.reduce((acc: any, emp: any) => {
    const dept = emp.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departmentChartData = Object.entries(departmentData).map(([name, value]) => ({
    name,
    value,
    percentage: ((value as number) / totalEmployees * 100).toFixed(1)
  }));

  // Employee status distribution
  const statusData = employees.reduce((acc: any, emp: any) => {
    const status = emp.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name,
    value
  }));

  // Project allocation data
  const projectAllocationData = allProjects.map((project: any) => {
    const assignedEmployees = employeeProjects.filter(
      (ep: any) => ep.projectId === project.id && ep.status !== 'Completed'
    );
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      employees: assignedEmployees.length,
      totalAllocation: assignedEmployees.reduce((sum: number, ep: any) => sum + (ep.allocation || 0), 0)
    };
  });

  // Employee workload data
  const employeeWorkloadData = employees.map((employee: any) => {
    const projects = employeeProjects.filter(
      (ep: any) => ep.employeeId === employee.id && ep.status !== 'Completed'
    );
    const totalAllocation = projects.reduce((sum: number, ep: any) => sum + (ep.allocation || 0), 0);
    
    return {
      name: `${employee.firstName} ${employee.lastName}`,
      allocation: totalAllocation,
      projects: projects.length,
      status: totalAllocation > 100 ? 'Overallocated' : totalAllocation > 80 ? 'High' : 'Normal'
    };
  }).sort((a, b) => b.allocation - a.allocation);

  // Monthly joining trend (mock data for demo)
  const monthlyJoiningData = [
    { month: 'Jan', employees: 2 },
    { month: 'Feb', employees: 3 },
    { month: 'Mar', employees: 1 },
    { month: 'Apr', employees: 4 },
    { month: 'May', employees: 2 },
    { month: 'Jun', employees: 3 }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into employee allocation and project status
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Active workforce
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {activeProjects} active projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Allocation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employeeWorkloadData.length > 0 
                  ? Math.round(employeeWorkloadData.reduce((sum, emp) => sum + emp.allocation, 0) / employeeWorkloadData.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average employee allocation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overallocated</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {employeeWorkloadData.filter(emp => emp.allocation > 100).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Employees over 100%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Distribution by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employee Status */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Project Resource Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectAllocationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="employees" fill="#82CA9D" name="Employees" />
                  <Bar dataKey="totalAllocation" fill="#8884D8" name="Total Allocation %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Joining Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Joining Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyJoiningData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="employees" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Employee Workload Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Employee Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={employeeWorkloadData.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar 
                  dataKey="allocation" 
                  fill={(entry: any) => entry.allocation > 100 ? '#FF6B6B' : entry.allocation > 80 ? '#FFD93D' : '#6BCF7F'}
                  name="Allocation %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
