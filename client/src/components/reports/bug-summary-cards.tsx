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
      bgGradient: "bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950 shadow-2xl border border-slate-800/80",
      textColor: "text-white",
      iconColor: "text-slate-200",
    },
    {
      title: "Critical",
      value: criticalBugsAll,
      icon: Shield,
      bgGradient: "bg-gradient-to-br from-red-950 via-red-900 to-red-950 shadow-2xl border border-red-700/60",
      textColor: "text-white", 
      iconColor: "text-red-200",
    },
    {
      title: "Major",
      value: majorBugsAll,
      icon: Zap,
      bgGradient: "bg-gradient-to-br from-orange-950 via-orange-900 to-amber-950 shadow-2xl border border-orange-700/60",
      textColor: "text-white",
      iconColor: "text-orange-200",
    },
    {
      title: "Minor",
      value: minorBugsAll,
      icon: Info,
      bgGradient: "bg-gradient-to-br from-yellow-950 via-amber-900 to-yellow-950 shadow-2xl border border-yellow-700/60",
      textColor: "text-white",
      iconColor: "text-yellow-200",
    },
    {
      title: "Trivial",
      value: trivialBugsAll,
      icon: Star,
      bgGradient: "bg-gradient-to-br from-stone-950 via-neutral-900 to-stone-950 shadow-2xl border border-stone-700/60",
      textColor: "text-white",
      iconColor: "text-stone-200",
    },
    {
      title: "Open",
      value: openBugsAll,
      icon: Clock,
      bgGradient: "bg-gradient-to-br from-rose-950 via-red-900 to-rose-950 shadow-2xl border border-rose-700/60",
      textColor: "text-white",
      iconColor: "text-rose-200",
    },
    {
      title: "In Progress",
      value: inProgressBugs,
      icon: Clock,
      bgGradient: "bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 shadow-2xl border border-blue-700/60",
      textColor: "text-white",
      iconColor: "text-blue-200",
    },
    {
      title: "Resolved",
      value: resolvedBugs,
      icon: CheckCircle,
      bgGradient: "bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 shadow-2xl border border-green-700/60",
      textColor: "text-white",
      iconColor: "text-green-200",
    },
    {
      title: "Closed",
      value: closedBugs,
      icon: CheckCircle,
      bgGradient: "bg-gradient-to-br from-violet-950 via-purple-900 to-violet-950 shadow-2xl border border-violet-700/60",
      textColor: "text-white",
      iconColor: "text-violet-200",
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
        <Button onClick={copyToClipboardAll} variant="outline" className="bg-gradient-to-r from-slate-900 to-gray-900 border-slate-700 hover:from-slate-800 hover:to-gray-800 text-white hover:text-white">
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className={`group relative overflow-hidden ${item.bgGradient} p-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-0`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className={`text-sm ${item.textColor}/90 font-medium flex items-center gap-2 mb-3`}>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  {item.title}
                </div>
                <div className={`text-3xl font-bold ${item.textColor} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  {item.value}
                </div>
                <div className={`text-xs ${item.textColor}/80`}>
                  {totalBugsAll > 0 ? `${((item.value / totalBugsAll) * 100).toFixed(1)}%` : '0%'} of total
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full group-hover:from-white/20"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white/30 via-white/20 to-white/30 opacity-50"></div>
              </div>
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

const getSeverityGradient = (severity: string): string => {
  switch (severity) {
    case 'Critical':
      return 'bg-gradient-to-br from-red-900 via-red-950 to-black text-white shadow-2xl border-red-600/50';
    case 'Major':
      return 'bg-gradient-to-br from-orange-800 via-orange-900 to-red-900 text-white shadow-2xl border-orange-600/50';
    case 'Minor':
      return 'bg-gradient-to-br from-yellow-700 via-yellow-800 to-orange-800 text-white shadow-2xl border-yellow-600/50';
    case 'Trivial':
      return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white shadow-2xl border-gray-600/50';
    default:
      return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white shadow-2xl border-gray-600/50';
  }
};

const getStatusGradient = (status: string): string => {
  switch (status) {
    case 'Open':
      return 'bg-gradient-to-br from-red-800 via-red-900 to-black text-white shadow-2xl border-red-600/50';
    case 'In Progress':
      return 'bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white shadow-2xl border-blue-600/50';
    case 'Resolved':
      return 'bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 text-white shadow-2xl border-green-600/50';
    case 'Closed':
      return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white shadow-2xl border-gray-600/50';
    default:
      return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white shadow-2xl border-gray-600/50';
  }
};