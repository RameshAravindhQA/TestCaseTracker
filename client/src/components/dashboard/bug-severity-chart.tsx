import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { memo } from "react";

interface BugSeverityChartProps {
  data: {
    severity: string;
    percentage: number;
    color: string;
  }[];
}

// Using memo to prevent unnecessary re-renders
export const BugSeverityChart = memo(function BugSeverityChart({ data }: BugSeverityChartProps) {
  try {
    // Enhanced validation for empty or invalid data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <Card className="shadow-md border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800">Bug Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 flex items-center justify-center text-gray-500">
              No bug severity data available
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Validate each data point to ensure it has all required properties
    const validData = data.filter(item => 
      item && 
      typeof item === 'object' && 
      typeof item.severity === 'string' && 
      typeof item.percentage === 'number' && 
      typeof item.color === 'string'
    );
    
    // If no valid data items remain after filtering
    if (validData.length === 0) {
      return (
        <Card className="shadow-md border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800">Bug Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 flex items-center justify-center text-gray-500">
              No valid bug severity data available
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Render chart with validated data
    return (
      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">Bug Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 flex flex-col justify-center">
            <div className="space-y-6">
              {validData.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                      <span className="text-base font-medium text-gray-800">{item.severity}</span>
                    </div>
                    <span className="text-base font-bold text-gray-800">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="h-3 rounded-full" 
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    // Catch any rendering errors and show a fallback UI
    console.error("Error rendering BugSeverityChart:", error);
    return (
      <Card className="shadow-md border-0 rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800">Bug Severity Distribution</CardTitle>
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
