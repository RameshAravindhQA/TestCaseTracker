
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
