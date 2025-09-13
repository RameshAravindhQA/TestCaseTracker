import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Module } from "@/types";
import { Copy, AlertTriangle, AlertCircle, Info, CheckCircle, Clock, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedBugSummaryProps {
  bugs: Bug[];
  modules?: Module[];
  projectName?: string;
  className?: string;
}

export function EnhancedBugSummary({ bugs, modules = [], projectName, className }: EnhancedBugSummaryProps) {
  const { toast } = useToast();
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [copied, setCopied] = useState<string | null>(null);

  // Filter bugs by selected module
  const filteredBugs = useMemo(() => {
    if (selectedModuleId === "all") return bugs;
    return bugs.filter(bug => bug.moduleId === parseInt(selectedModuleId));
  }, [bugs, selectedModuleId]);

  // Calculate bug statistics
  const stats = useMemo(() => {
    const total = filteredBugs.length;
    const critical = filteredBugs.filter(bug => bug.severity === 'Critical').length;
    const major = filteredBugs.filter(bug => bug.severity === 'Major').length;
    const minor = filteredBugs.filter(bug => bug.severity === 'Minor').length;
    const trivial = filteredBugs.filter(bug => bug.severity === 'Trivial').length;
    const open = filteredBugs.filter(bug => bug.status === 'Open').length;
    const inProgress = filteredBugs.filter(bug => bug.status === 'In Progress').length;
    const resolved = filteredBugs.filter(bug => bug.status === 'Resolved').length;
    const closed = filteredBugs.filter(bug => bug.status === 'Closed').length;

    return {
      total,
      critical,
      major,
      minor,
      trivial,
      open,
      inProgress,
      resolved,
      closed
    };
  }, [filteredBugs]);

  const summaryCards = [
    {
      title: "Total Bugs",
      value: stats.total,
      icon: AlertTriangle,
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "Total reported bugs"
    },
    {
      title: "Critical",
      value: stats.critical,
      icon: AlertCircle,
      gradient: "from-red-500 via-red-600 to-red-700",
      textColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      description: "Highest priority issues"
    },
    {
      title: "Major",
      value: stats.major,
      icon: AlertTriangle,
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      description: "Important issues"
    },
    {
      title: "Minor",
      value: stats.minor,
      icon: Info,
      gradient: "from-yellow-500 via-yellow-600 to-yellow-700",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      description: "Low impact issues"
    },
    {
      title: "Trivial",
      value: stats.trivial,
      icon: Info,
      gradient: "from-gray-500 via-gray-600 to-gray-700",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      borderColor: "border-gray-200 dark:border-gray-800",
      description: "Minimal impact issues"
    },
    {
      title: "Open",
      value: stats.open,
      icon: Clock,
      gradient: "from-purple-500 via-violet-600 to-indigo-700",
      textColor: "text-purple-700",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/30 dark:to-violet-950/30",
      borderColor: "border-purple-300 dark:border-purple-700",
      shadowColor: "shadow-purple-200/50 dark:shadow-purple-900/50",
      description: "Unresolved issues"
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      gradient: "from-blue-500 via-sky-600 to-cyan-700",
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950/30 dark:to-sky-950/30",
      borderColor: "border-blue-300 dark:border-blue-700",
      shadowColor: "shadow-blue-200/50 dark:shadow-blue-900/50",
      description: "Being worked on"
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      gradient: "from-green-500 via-emerald-600 to-teal-700",
      textColor: "text-green-700",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30",
      borderColor: "border-green-300 dark:border-green-700",
      shadowColor: "shadow-green-200/50 dark:shadow-green-900/50",
      description: "Fixed issues"
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: CheckCircle,
      gradient: "from-emerald-500 via-teal-600 to-cyan-700",
      textColor: "text-emerald-700",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30",
      borderColor: "border-emerald-300 dark:border-emerald-700",
      shadowColor: "shadow-emerald-200/50 dark:shadow-emerald-900/50",
      description: "Completed issues"
    },
  ];

  const copyToClipboard = (cardTitle: string, cardValue: number) => {
    const selectedModule = modules.find(m => m.id === parseInt(selectedModuleId));
    const moduleText = selectedModule ? ` in ${selectedModule.name}` : '';

    const summaryText = `Bug Report Summary${projectName ? ` for ${projectName}` : ''}${moduleText}
Generated on: ${new Date().toLocaleString()}

${cardTitle}: ${cardValue}
Total Bugs: ${stats.total}
Critical: ${stats.critical}
Major: ${stats.major}
Minor: ${stats.minor}
Trivial: ${stats.trivial}
Open: ${stats.open}
In Progress: ${stats.inProgress}
Resolved: ${stats.resolved}
Closed: ${stats.closed}

Percentage: ${stats.total > 0 ? ((cardValue / stats.total) * 100).toFixed(1) : '0'}% of total bugs`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(cardTitle);
      toast({
        title: "Copied to Clipboard",
        description: `${cardTitle} summary has been copied to clipboard.`,
      });
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy summary to clipboard.",
        variant: "destructive",
      });
    });
  };

  const copyAllToClipboard = () => {
    const selectedModule = modules.find(m => m.id === parseInt(selectedModuleId));
    const moduleText = selectedModule ? ` in ${selectedModule.name}` : '';

    const summaryText = `Complete Bug Report Summary${projectName ? ` for ${projectName}` : ''}${moduleText}
Generated on: ${new Date().toLocaleString()}

📊 OVERALL STATISTICS:
Total Bugs: ${stats.total}

🚨 BY SEVERITY:
Critical: ${stats.critical}
Major: ${stats.major}
Minor: ${stats.minor}
Trivial: ${stats.trivial}

📋 BY STATUS:
Open: ${stats.open}
In Progress: ${stats.inProgress}
Resolved: ${stats.resolved}
Closed: ${stats.closed}
`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied('all');
      toast({
        title: "Complete Summary Copied",
        description: "Complete bug summary has been copied to clipboard.",
      });
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy complete summary to clipboard.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bug Reports Summary
          </h2>
          {projectName && (
            <p className="text-muted-foreground">Project: {projectName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {modules.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModuleId !== "all" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedModuleId("all")}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <Button onClick={copyAllToClipboard} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            {copied === 'all' ? 'Copied!' : 'Copy All'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedModuleId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
              key={index} 
              className={`relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl hover:-translate-y-1 border-2 ${card.borderColor} ${card.bgColor} group cursor-pointer shadow-lg ${card.shadowColor}`}
              onClick={() => copyToClipboard(card.title, card.value)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-all duration-500`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2.5 rounded-xl border-2 ${card.borderColor} shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${card.textColor} group-hover:scale-110 transition-transform duration-300`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-4xl font-bold ${card.textColor} mb-2 group-hover:scale-105 transition-transform duration-300`}>
                  {card.value}
                </div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {card.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    Click to copy summary
                  </span>
                  {copied === card.title && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-green-600 bg-green-100 p-1 rounded-full"
                    >
                      <Copy className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {stats.total === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium">No bugs found!</p>
                <p className="text-muted-foreground">
                  {selectedModuleId !== "all" 
                    ? `No bugs in selected module` 
                    : "Great job on maintaining quality!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}