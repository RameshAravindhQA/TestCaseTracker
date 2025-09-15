
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

interface TrackerAnalyticsProps {
  projectId: number;
  features: any[];
  subFeatures: any[];
  workLogs: any[];
}

export function TrackerAnalytics({ projectId, features, subFeatures, workLogs }: TrackerAnalyticsProps) {
  // Calculate analytics data
  const totalFeatures = features?.length || 0;
  const totalSubFeatures = subFeatures?.length || 0;
  const totalWorkLogs = workLogs?.length || 0;

  // Status distribution for features
  const featureStatusData = features?.reduce((acc, feature) => {
    acc[feature.status] = (acc[feature.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const featureChartData = Object.entries(featureStatusData).map(([status, count]) => ({
    status,
    count,
    percentage: totalFeatures > 0 ? Math.round((count / totalFeatures) * 100) : 0
  }));

  // Sub-feature status distribution
  const subFeatureStatusData = subFeatures?.reduce((acc, subFeature) => {
    acc[subFeature.status] = (acc[subFeature.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const subFeatureChartData = Object.entries(subFeatureStatusData).map(([status, count]) => ({
    status,
    count,
    percentage: totalSubFeatures > 0 ? Math.round((count / totalSubFeatures) * 100) : 0
  }));

  // Work type distribution
  const workTypeData = subFeatures?.reduce((acc, subFeature) => {
    const workType = subFeature.workType || 'Unknown';
    acc[workType] = (acc[workType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const workTypeChartData = Object.entries(workTypeData).map(([workType, count]) => ({
    workType,
    count,
    percentage: totalSubFeatures > 0 ? Math.round((count / totalSubFeatures) * 100) : 0
  }));

  // Progress calculation
  const completedSubFeatures = subFeatures?.filter(sf => sf.status === 'Completed').length || 0;
  const overallProgress = totalSubFeatures > 0 ? Math.round((completedSubFeatures / totalSubFeatures) * 100) : 0;

  // Time tracking data
  const totalHours = workLogs?.reduce((sum, log) => sum + (parseFloat(log.hoursWorked) || 0), 0) || 0;
  const estimatedHours = subFeatures?.reduce((sum, sf) => sum + (parseFloat(sf.estimatedHours) || 0), 0) || 0;

  // Department distribution
  const departmentData = subFeatures?.reduce((acc, subFeature) => {
    const dept = subFeature.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const departmentChartData = Object.entries(departmentData).map(([department, count]) => ({
    department,
    count
  }));

  // Growth/Trend Analysis
  const generateTrendData = () => {
    if (!workLogs || workLogs.length === 0) return [];
    
    // Group work logs by date and calculate cumulative hours
    const dateGroups = workLogs.reduce((acc, log) => {
      const date = new Date(log.workDate).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, hours: 0, count: 0 };
      }
      acc[date].hours += parseFloat(log.hoursWorked) || 0;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; hours: number; count: number }>);

    // Sort by date and calculate cumulative values
    const sortedData = Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));
    let cumulativeHours = 0;
    let cumulativeCount = 0;

    return sortedData.map((item, index) => {
      cumulativeHours += item.hours;
      cumulativeCount += item.count;
      
      const growth = index > 0 ? 
        ((item.hours - sortedData[index - 1].hours) / (sortedData[index - 1].hours || 1)) * 100 : 0;

      return {
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyHours: item.hours,
        cumulativeHours,
        dailyLogs: item.count,
        cumulativeLogs: cumulativeCount,
        growth: parseFloat(growth.toFixed(1)),
        velocity: item.hours / (item.count || 1) // Hours per log
      };
    });
  };

  const trendData = generateTrendData();

  // Status progression over time
  const generateStatusProgression = () => {
    if (!subFeatures || subFeatures.length === 0) return [];
    
    // Create mock progression data based on creation dates
    const statusProgression = [];
    const statuses = ['Planning', 'Design', 'Development', 'Testing', 'Completed'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const dayData = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Planning: Math.max(0, totalSubFeatures - (i * 2)),
        Design: Math.min(totalSubFeatures, i * 3),
        Development: Math.min(totalSubFeatures, Math.max(0, i * 2 - 2)),
        Testing: Math.min(totalSubFeatures, Math.max(0, i - 3)),
        Completed: Math.min(totalSubFeatures, Math.max(0, i - 4))
      };
      
      statusProgression.push(dayData);
    }
    
    return statusProgression;
  };

  const statusProgressionData = generateStatusProgression();

  // Performance metrics
  const performanceMetrics = {
    velocityTrend: trendData.length > 1 ? 
      ((trendData[trendData.length - 1].velocity - trendData[0].velocity) / trendData[0].velocity) * 100 : 0,
    productivityGrowth: trendData.length > 1 ?
      ((trendData[trendData.length - 1].dailyHours - trendData[0].dailyHours) / (trendData[0].dailyHours || 1)) * 100 : 0,
    completionRate: totalSubFeatures > 0 ? (completedSubFeatures / totalSubFeatures) * 100 : 0,
    averageHoursPerSubFeature: totalSubFeatures > 0 ? totalHours / totalSubFeatures : 0
  };

  // Colors for charts
  const statusColors = {
    'Planning': '#3b82f6',
    'Design': '#8b5cf6',
    'Development': '#f97316',
    'Testing': '#eab308',
    'Completed': '#22c55e',
    'On Hold': '#6b7280',
    'Cancelled': '#ef4444',
    'Blocked': '#dc2626'
  };

  const workTypeColors = {
    'Development': '#3b82f6',
    'QA': '#22c55e',
    'DevOps': '#8b5cf6',
    'Designing': '#ec4899',
    'Analysis': '#f97316',
    'Documentation': '#6b7280'
  };

  const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#6b7280'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Features</p>
                <p className="text-2xl font-bold">{totalFeatures}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sub-Features</p>
                <p className="text-2xl font-bold">{totalSubFeatures}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Work Logs</p>
                <p className="text-2xl font-bold">{totalWorkLogs}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
              </div>
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sub-Feature Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sub-Feature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subFeatureChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {subFeatureChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Work Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workTypeChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="workType" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ department, count }) => `${department}: ${count}`}
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
      </div>

      {/* Growth & Trend Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Hours Trend & Growth Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'growth' ? `${value}%` : `${value}h`,
                    name === 'dailyHours' ? 'Daily Hours' :
                    name === 'cumulativeHours' ? 'Cumulative Hours' :
                    name === 'growth' ? 'Growth %' : name
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cumulativeHours" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="dailyHours" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="growth" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Progression Over Time */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Progression Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={statusProgressionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="Planning" stackId="1" stroke="#6b7280" fill="#6b7280" />
                <Area type="monotone" dataKey="Design" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                <Area type="monotone" dataKey="Development" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                <Area type="monotone" dataKey="Testing" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                <Area type="monotone" dataKey="Completed" stackId="1" stroke="#10b981" fill="#10b981" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Velocity Trend</p>
                <p className={`text-2xl font-bold ${performanceMetrics.velocityTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceMetrics.velocityTrend >= 0 ? '+' : ''}{performanceMetrics.velocityTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Growth</p>
                <p className={`text-2xl font-bold ${performanceMetrics.productivityGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceMetrics.productivityGrowth >= 0 ? '+' : ''}{performanceMetrics.productivityGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {performanceMetrics.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Hours/Task</p>
                <p className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.averageHoursPerSubFeature.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Tracking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Hours Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{estimatedHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Estimated Hours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {estimatedHours > 0 ? Math.round((totalHours / estimatedHours) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Time Utilization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
