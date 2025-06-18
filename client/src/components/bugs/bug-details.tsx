import { Bug, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BugDetailsProps {
  bug: Bug;
  users?: User[];
}

export function BugDetails({ bug, users = [] }: BugDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{bug.bugId} - {bug.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Severity</h3>
            <Badge variant="outline" className="mt-1">
              {bug.severity}
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-medium">Priority</h3>
            <Badge variant="outline" className="mt-1">
              {bug.priority}
            </Badge>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Status</h3>
          <Badge variant="outline" className={`mt-1 ${getStatusColor(bug.status)}`}>
            {bug.status}
          </Badge>
        </div>

        {bug.environment && (
          <div>
            <h3 className="text-sm font-medium">Environment</h3>
            <p className="text-sm text-gray-700 mt-1">{bug.environment}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium">Pre-Conditions</h3>
          <p className="text-sm text-gray-700 mt-1">{bug.preConditions || "None specified"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Steps to Reproduce</h3>
          <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans border border-gray-200 rounded-md p-3 bg-gray-50">
            {bug.stepsToReproduce}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-medium">Expected Result</h3>
          <p className="text-sm text-gray-700 mt-1">{bug.expectedResult}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Actual Result</h3>
          <p className="text-sm text-gray-700 mt-1">{bug.actualResult}</p>
        </div>

        {bug.comments && (
          <div>
            <h3 className="text-sm font-medium">Comments</h3>
            <p className="text-sm text-gray-700 mt-1">{bug.comments}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}