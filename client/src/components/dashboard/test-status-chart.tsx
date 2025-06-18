import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { memo } from "react";

interface TestStatusChartProps {
  data: {
    status: string;
    value: number;
    percentage: number;
    color: string;
  }[];
}

// Using memo to prevent unnecessary re-renders
export const TestStatusChart = memo(function TestStatusChart({ data }: TestStatusChartProps) {
  // Error handling wrapper
  try {
    // Handle empty or invalid data gracefully
    if (!data || !Array.isArray(data) || data.length === 0 || data.every(item => !item || item.value === 0)) {
      return (
        <Card className="shadow-md border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800">Test Case Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 flex items-center justify-center text-gray-500">
              No test case data available
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Enhanced data validation - ensure all required fields exist and are of correct type
    const validData = data.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.status === 'string' && 
      typeof item.value === 'number' && 
      typeof item.percentage === 'number' &&
      typeof item.color === 'string' &&
      item.value > 0
    );
    
    // If we still have no valid data after filtering, show the empty state
    if (validData.length === 0) {
      return (
        <Card className="shadow-md border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800">Test Case Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 flex items-center justify-center text-gray-500">
              No valid test case data available
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Render the chart with validated data
    return (
      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">Test Case Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="status"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  strokeWidth={2}
                >
                  {validData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="white"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (!props || !props.payload) return [value, name];
                    return [`${value} (${props.payload.percentage}%)`, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  iconType="circle" 
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Catch any rendering errors and display a fallback UI
    console.error("Error rendering TestStatusChart:", error);
    return (
      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800">Test Case Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 flex items-center justify-center text-gray-500">
            Unable to display chart data
          </div>
        </CardContent>
      </Card>
    );
  }
});
