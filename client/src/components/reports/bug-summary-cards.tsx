import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug } from "@/types";
import { Copy, AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BugSummaryCardsProps {
  bugs: Bug[];
  projectName?: string;
}

export function BugSummaryCards({ bugs, projectName }: BugSummaryCardsProps) {
  const { toast } = useToast();

  // Calculate bug statistics
  const totalBugs = bugs.length;
  const criticalBugs = bugs.filter(bug => bug.severity === 'Critical').length;
  const majorBugs = bugs.filter(bug => bug.severity === 'Major').length;
  const minorBugs = bugs.filter(bug => bug.severity === 'Minor').length;
  const trivialBugs = bugs.filter(bug => bug.severity === 'Trivial').length;
  const openBugs = bugs.filter(bug => bug.status === 'Open' || bug.status === 'In Progress').length;
  const closedBugs = bugs.filter(bug => bug.status === 'Closed' || bug.status === 'Resolved').length;

  const summaryData = [
    {
      title: "Total Bugs",
      value: totalBugs,
      icon: AlertTriangle,
      gradient: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Critical",
      value: criticalBugs,
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Major",
      value: majorBugs,
      icon: AlertTriangle,
      gradient: "from-orange-500 to-orange-600",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Minor",
      value: minorBugs,
      icon: Info,
      gradient: "from-yellow-500 to-yellow-600",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Trivial",
      value: trivialBugs,
      icon: Info,
      gradient: "from-gray-500 to-gray-600",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Open",
      value: openBugs,
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Closed",
      value: closedBugs,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const copyToClipboard = () => {
    const summaryText = `Bug Report Summary ${projectName ? `for ${projectName}` : ''}
Generated on: ${new Date().toLocaleString()}

Total Bugs: ${totalBugs}
Critical: ${criticalBugs}
Major: ${majorBugs}
Minor: ${minorBugs}
Trivial: ${trivialBugs}
Open: ${openBugs}
Closed: ${closedBugs}

Bug Details:
${bugs.map(bug => `- ${bug.bugId || bug.id}: ${bug.title} (${bug.severity} - ${bug.status})`).join('\n')}`;

    navigator.clipboard.writeText(summaryText).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Bug summary has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy summary to clipboard.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bug Reports Summary</h2>
          {projectName && (
            <p className="text-muted-foreground">Project: {projectName}</p>
          )}
        </div>
        <Button onClick={copyToClipboard} variant="outline">
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className={`${item.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${item.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${item.textColor}`}>
                  {item.value}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                  <span>
                    {totalBugs > 0 ? `${((item.value / totalBugs) * 100).toFixed(1)}%` : '0%'} of total
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalBugs === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">No bugs found!</p>
              <p className="text-muted-foreground">Great job on maintaining quality!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}