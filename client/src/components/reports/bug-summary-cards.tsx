import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug } from "@/types";
import { Copy, AlertTriangle, AlertCircle, Info, CheckCircle, Clock, Shield, Zap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BugSummaryCardsProps {
  bugs: Bug[];
  projectName?: string;
}

export function BugSummaryCards({ bugs, projectName }: BugSummaryCardsProps) {
  const { toast } = useToast();

  // Calculate stats
  const totalBugs = bugs.length;
  const criticalBugs = bugs.filter(bug => bug.severity === 'Critical').length;
  const majorBugs = bugs.filter(bug => bug.severity === 'Major').length;
  const minorBugs = bugs.filter(bug => bug.severity === 'Minor').length;
  const trivialBugs = bugs.filter(bug => bug.severity === 'Trivial').length;

  const openBugs = bugs.filter(bug => bug.status === 'Open').length;
  const inProgressBugs = bugs.filter(bug => bug.status === 'In Progress').length;
  const resolvedBugs = bugs.filter(bug => bug.status === 'Resolved').length;
  const closedBugs = bugs.filter(bug => bug.status === 'Closed').length;

  const copyToClipboard = () => {
    const summary = `Bug Reports Summary - ${projectName}
Total Bugs: ${totalBugs}
Critical: ${criticalBugs}, Major: ${majorBugs}, Minor: ${minorBugs}, Trivial: ${trivialBugs}
Open: ${openBugs}, In Progress: ${inProgressBugs}, Resolved: ${resolvedBugs}, Closed: ${closedBugs}`;

    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied to clipboard",
      description: "Bug summary has been copied to clipboard.",
    });
  };

  if (totalBugs === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Bug Reports Summary</h2>
          <p className="text-gray-600">{projectName}</p>
        </div>

        <Card className="p-8 text-center border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">No bugs found!</h3>
          <p className="text-green-600">Excellent work on maintaining quality!</p>
        </Card>
      </div>
    );
  }

  // Calculate bug statistics
  const totalBugsAll = bugs.length;
  const criticalBugsAll = bugs.filter(bug => bug.severity === 'Critical').length;
  const majorBugsAll = bugs.filter(bug => bug.severity === 'Major').length;
  const minorBugsAll = bugs.filter(bug => bug.severity === 'Minor').length;
  const trivialBugsAll = bugs.filter(bug => bug.severity === 'Trivial').length;
  const openBugsAll = bugs.filter(bug => bug.status === 'Open' || bug.status === 'In Progress').length;
  const closedBugsAll = bugs.filter(bug => bug.status === 'Closed' || bug.status === 'Resolved').length;

  const summaryData = [
    {
      title: "Total Bugs",
      value: totalBugsAll,
      icon: AlertTriangle,
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      bgGradient: "from-indigo-50 via-purple-50 to-pink-50",
      textColor: "text-indigo-700",
      iconBg: "bg-gradient-to-r from-indigo-500 to-purple-600",
      border: "border-indigo-200",
    },
    {
      title: "Critical",
      value: criticalBugsAll,
      icon: Shield,
      gradient: "from-red-500 via-rose-500 to-pink-500",
      bgGradient: "from-red-50 via-rose-50 to-pink-50",
      textColor: "text-red-700",
      iconBg: "bg-gradient-to-r from-red-500 to-rose-600",
      border: "border-red-200",
    },
    {
      title: "Major",
      value: majorBugsAll,
      icon: Zap,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bgGradient: "from-orange-50 via-amber-50 to-yellow-50",
      textColor: "text-orange-700",
      iconBg: "bg-gradient-to-r from-orange-500 to-amber-600",
      border: "border-orange-200",
    },
    {
      title: "Minor",
      value: minorBugsAll,
      icon: Info,
      gradient: "from-yellow-400 via-lime-400 to-green-400",
      bgGradient: "from-yellow-50 via-lime-50 to-green-50",
      textColor: "text-yellow-700",
      iconBg: "bg-gradient-to-r from-yellow-500 to-lime-600",
      border: "border-yellow-200",
    },
    {
      title: "Trivial",
      value: trivialBugsAll,
      icon: Star,
      gradient: "from-gray-400 via-slate-400 to-zinc-400",
      bgGradient: "from-gray-50 via-slate-50 to-zinc-50",
      textColor: "text-gray-700",
      iconBg: "bg-gradient-to-r from-gray-500 to-slate-600",
      border: "border-gray-200",
    },
    {
      title: "Open",
      value: openBugsAll,
      icon: Clock,
      gradient: "from-purple-500 via-violet-500 to-indigo-500",
      bgGradient: "from-purple-50 via-violet-50 to-indigo-50",
      textColor: "text-purple-700",
      iconBg: "bg-gradient-to-r from-purple-500 to-violet-600",
      border: "border-purple-200",
    },
    {
      title: "Closed",
      value: closedBugsAll,
      icon: CheckCircle,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      bgGradient: "from-emerald-50 via-teal-50 to-cyan-50",
      textColor: "text-emerald-700",
      iconBg: "bg-gradient-to-r from-emerald-500 to-teal-600",
      border: "border-emerald-200",
    },
  ];

  const copyToClipboardAll = () => {
    const summaryText = `Bug Report Summary ${projectName ? `for ${projectName}` : ''}
Generated on: ${new Date().toLocaleString()}

Total Bugs: ${totalBugsAll}
Critical: ${criticalBugsAll}
Major: ${majorBugsAll}
Minor: ${minorBugsAll}
Trivial: ${trivialBugsAll}
Open: ${openBugsAll}
Closed: ${closedBugsAll}

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
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Bug Reports Summary
          </h2>
          {projectName && (
            <p className="text-muted-foreground mt-1 text-lg">Project: {projectName}</p>
          )}
        </div>
        <Button onClick={copyToClipboardAll} variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100">
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className={`relative overflow-hidden ${item.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-40`} />
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className={`text-sm font-medium ${item.textColor}`}>
                  {item.title}
                </CardTitle>
                <div className={`${item.iconBg} p-3 rounded-xl shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-3xl font-bold ${item.textColor} mb-2`}>
                  {item.value}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <span>
                      {totalBugsAll > 0 ? `${((item.value / totalBugsAll) * 100).toFixed(1)}%` : '0%'} of total
                    </span>
                  </div>
                  <div className={`w-12 h-2 bg-gradient-to-r ${item.gradient} rounded-full opacity-60`} />
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-500`}
                      style={{ width: totalBugsAll > 0 ? `${(item.value / totalBugsAll) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalBugsAll === 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <p className="text-xl font-semibold text-green-800">No bugs found!</p>
              <p className="text-green-600 mt-1">Excellent work on maintaining quality!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}