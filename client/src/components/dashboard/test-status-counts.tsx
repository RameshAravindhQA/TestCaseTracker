import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestStatusCountsProps {
  counts: {
    passed: number;
    failed: number;
    blocked: number;
    notExecuted: number;
  };
  total: number;
}

export function TestStatusCounts({ counts, total }: TestStatusCountsProps) {
  // Calculate percentages
  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Card className="shadow-sm border-0 rounded-xl overflow-hidden w-full">
      <CardHeader className="bg-gray-50 border-b py-3 px-4">
        <CardTitle className="text-lg font-semibold">Test Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Passed Tests */}
          <div className="bg-white rounded-lg border p-3 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{counts.passed}</h3>
            <p className="text-sm font-medium text-gray-500">Passed</p>
            <div className="text-xs text-green-600 mt-1">{getPercentage(counts.passed)}%</div>
          </div>

          {/* Failed Tests */}
          <div className="bg-white rounded-lg border p-3 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{counts.failed}</h3>
            <p className="text-sm font-medium text-gray-500">Failed</p>
            <div className="text-xs text-red-600 mt-1">{getPercentage(counts.failed)}%</div>
          </div>

          {/* Blocked Tests */}
          <div className="bg-white rounded-lg border p-3 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-.707 1.707l2 2a1 1 0 001.414 0l2-2A1 1 0 0012 9H8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{counts.blocked}</h3>
            <p className="text-sm font-medium text-gray-500">Blocked</p>
            <div className="text-xs text-yellow-600 mt-1">{getPercentage(counts.blocked)}%</div>
          </div>

          {/* Not Executed Tests */}
          <div className="bg-white rounded-lg border p-3 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{counts.notExecuted}</h3>
            <p className="text-sm font-medium text-gray-500">Not Executed</p>
            <div className="text-xs text-gray-600 mt-1">{getPercentage(counts.notExecuted)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}