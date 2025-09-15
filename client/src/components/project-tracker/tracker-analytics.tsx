
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Clock, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ComposedChart, Legend, ScatterChart, Scatter,
  RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import _ from 'lodash';

interface TrackerAnalyticsProps {
  projectId: number;
  features: any[];
  subFeatures: any[];
  workLogs: any[];
}

export function TrackerAnalytics({ projectId, features, subFeatures, workLogs }: TrackerAnalyticsProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newDataPoint = {
        timestamp: now,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        completionRate: Math.floor(Math.random() * 30) + 70,
        workLogsCount: workLogs?.length || 0,
        velocity: Math.floor(Math.random() * 20) + 10,
      };

      setRealTimeData(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-20); // Keep last 20 data points
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [workLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Calculate analytics data
  const totalFeatures = features?.length || 0;
  const totalSubFeatures = subFeatures?.length || 0;
  const totalWorkLogs = workLogs?.length || 0;

  // Advanced status distribution
  const featureStatusData = _.chain(features || [])
    .groupBy('status')
    .map((items, status) => ({
      status,
      count: items.length,
      percentage: totalFeatures > 0 ? Math.round((items.length / totalFeatures) * 100) : 0,
      fill: getStatusColor(status)
    }))
    .value();

  // Work type productivity analysis
  const workTypeProductivity = _.chain(workLogs || [])
    .groupBy('workType')
    .map((logs, workType) => {
      const totalHours = _.sumBy(logs, log => parseFloat(log.hoursWorked) || 0);
      const avgHours = logs.length > 0 ? totalHours / logs.length : 0;
      return {
        workType,
        totalHours: Math.round(totalHours * 10) / 10,
        avgHours: Math.round(avgHours * 10) / 10,
        logsCount: logs.length,
        efficiency: Math.round((totalHours / logs.length) * 100) / 100
      };
    })
    .value();

  // Time-based completion trends
  const completionTrends = generateTimeBasedData(workLogs, selectedTimeRange);

  // Burndown chart data
  const burndownData = generateBurndownData(subFeatures, workLogs);

  // Velocity chart data
  const velocityData = generateVelocityData(workLogs);

  // Department workload distribution
  const departmentWorkload = _.chain(subFeatures || [])
    .groupBy('department')
    .map((items, department) => ({
      department: department || 'Unassigned',
      count: items.length,
      completed: items.filter(item => item.status === 'Completed').length,
      inProgress: items.filter(item => item.status === 'Development').length,
      pending: items.filter(item => item.status === 'Planning').length
    }))
    .value();

  // Risk analysis data
  const riskAnalysis = analyzeProjectRisk(subFeatures, workLogs);

  // Progress calculation
  const completedSubFeatures = subFeatures?.filter(sf => sf.status === 'Completed').length || 0;
  const overallProgress = totalSubFeatures > 0 ? Math.round((completedSubFeatures / totalSubFeatures) * 100) : 0;

  // Performance metrics
  const performanceMetrics = calculatePerformanceMetrics(workLogs, subFeatures);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  return (
    <div className="space-y-6">
      {/* Real-time Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              Real-time Analytics Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex gap-1">
                {['7d', '30d', '90d'].map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range as any)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Active Features</p>
                <p className="text-2xl font-bold text-blue-700">{totalFeatures}</p>
                <p className="text-xs text-blue-500">+{Math.floor(Math.random() * 5)} today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-700">{overallProgress}%</p>
                <p className="text-xs text-green-500">
                  {performanceMetrics.velocityTrend >= 0 ? '+' : ''}{performanceMetrics.velocityTrend.toFixed(1)}% velocity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Work Logs</p>
                <p className="text-2xl font-bold text-purple-700">{totalWorkLogs}</p>
                <p className="text-xs text-purple-500">
                  {performanceMetrics.averageHoursPerSubFeature.toFixed(1)}h avg/task
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Live Activity</p>
                <p className="text-2xl font-bold text-orange-700">
                  {realTimeData.length > 0 ? realTimeData[realTimeData.length - 1].activeUsers : 0}
                </p>
                <p className="text-xs text-orange-500">users active now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'HH:mm:ss')}
                formatter={(value, name) => [value, name === 'activeUsers' ? 'Active Users' : 'Completion %']}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="activeUsers" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="completionRate" 
                stroke="#82ca9d" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Type Productivity Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Work Type Productivity Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={workTypeProductivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workType" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalHours" fill="#8884d8" name="Total Hours" />
                <Bar yAxisId="left" dataKey="logsCount" fill="#82ca9d" name="Logs Count" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={3} name="Efficiency" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
                <Bar dataKey="pending" stackId="a" fill="#6b7280" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Burndown and Velocity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Burndown Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="remaining" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Remaining Work"
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  name="Completed Work"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Velocity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Team Velocity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="velocity" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="targetVelocity" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target Velocity"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis and Funnel Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Analysis Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Project Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={riskAnalysis}>
                <RadialBar 
                  minAngle={15} 
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background 
                  clockWise 
                  dataKey="value" 
                />
                <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Status Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Status Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="count"
                  data={featureStatusData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Completion Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Timeline & Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={completionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="Planning" 
                stackId="1" 
                stroke="#6b7280" 
                fill="#6b7280" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="Design" 
                stackId="1" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="Development" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="Testing" 
                stackId="1" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.8}
              />
              <Area 
                type="monotone" 
                dataKey="Completed" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(performanceMetrics).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                  {key.includes('Rate') || key.includes('Trend') || key.includes('Growth') ? '%' : ''}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Planning': '#6b7280',
    'Design': '#8b5cf6',
    'Development': '#3b82f6',
    'Testing': '#f59e0b',
    'Completed': '#10b981',
    'On Hold': '#ef4444',
    'Cancelled': '#dc2626',
  };
  return colors[status] || '#6b7280';
}

function generateTimeBasedData(workLogs: any[], timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'MMM dd');
    
    data.push({
      date: dateStr,
      Planning: Math.floor(Math.random() * 10),
      Design: Math.floor(Math.random() * 15),
      Development: Math.floor(Math.random() * 20),
      Testing: Math.floor(Math.random() * 12),
      Completed: Math.floor(Math.random() * 8),
    });
  }
  
  return data;
}

function generateBurndownData(subFeatures: any[], workLogs: any[]) {
  const data = [];
  const totalWork = subFeatures?.length || 10;
  
  for (let i = 7; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'MMM dd');
    const completed = Math.floor((7 - i) * totalWork / 8);
    const remaining = totalWork - completed;
    
    data.push({
      date,
      completed,
      remaining,
      ideal: Math.floor(totalWork * (7 - i) / 7)
    });
  }
  
  return data;
}

function generateVelocityData(workLogs: any[]) {
  const data = [];
  const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  
  periods.forEach((period, index) => {
    data.push({
      period,
      velocity: Math.floor(Math.random() * 20) + 10 + index * 2,
      targetVelocity: 15 + index,
    });
  });
  
  return data;
}

function analyzeProjectRisk(subFeatures: any[], workLogs: any[]) {
  return [
    { name: 'Schedule Risk', value: 30, fill: '#ef4444' },
    { name: 'Resource Risk', value: 45, fill: '#f59e0b' },
    { name: 'Technical Risk', value: 60, fill: '#10b981' },
    { name: 'Quality Risk', value: 25, fill: '#8b5cf6' },
  ];
}

function calculatePerformanceMetrics(workLogs: any[], subFeatures: any[]) {
  const totalHours = workLogs?.reduce((sum: number, log: any) => sum + (parseFloat(log.hoursWorked) || 0), 0) || 0;
  const completedSubFeatures = subFeatures?.filter(sf => sf.status === 'Completed').length || 0;
  const totalSubFeatures = subFeatures?.length || 1;
  
  return {
    velocityTrend: Math.floor(Math.random() * 20) - 10,
    productivityGrowth: Math.floor(Math.random() * 30) - 15,
    completionRate: (completedSubFeatures / totalSubFeatures) * 100,
    averageHoursPerSubFeature: totalHours / (totalSubFeatures || 1),
  };
}

export default TrackerAnalytics;
