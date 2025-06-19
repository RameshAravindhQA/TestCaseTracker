
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
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      description: "Unresolved issues"
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      description: "Being worked on"
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      gradient: "from-green-500 via-green-600 to-green-700",
      textColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      description: "Fixed issues"
    }
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
Critical: ${stats.critical} (${stats.total > 0 ? ((stats.critical / stats.total) * 100).toFixed(1) : '0'}%)
Major: ${stats.major} (${stats.total > 0 ? ((stats.major / stats.total) * 100).toFixed(1) : '0'}%)
Minor: ${stats.minor} (${stats.total > 0 ? ((stats.minor / stats.total) * 100).toFixed(1) : '0'}%)
Trivial: ${stats.trivial} (${stats.total > 0 ? ((stats.trivial / stats.total) * 100).toFixed(1) : '0'}%)

📋 BY STATUS:
Open: ${stats.open} (${stats.total > 0 ? ((stats.open / stats.total) * 100).toFixed(1) : '0'}%)
In Progress: ${stats.inProgress} (${stats.total > 0 ? ((stats.inProgress / stats.total) * 100).toFixed(1) : '0'}%)
Resolved: ${stats.resolved} (${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0'}%)
Closed: ${stats.closed} (${stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : '0'}%)

🔍 BUG DETAILS:
${filteredBugs.map(bug => `- ${bug.bugId || bug.id}: ${bug.title} (${bug.severity} - ${bug.status})`).join('\n')}`;

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
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group",
                  card.borderColor
                )}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={cn("p-2 rounded-lg transition-colors duration-300", card.bgColor)}>
                      <Icon className={cn("h-4 w-4", card.textColor)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-2xl font-bold transition-colors duration-300", card.textColor)}>
                      {card.value}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {card.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {stats.total > 0 ? `${((card.value / stats.total) * 100).toFixed(1)}%` : '0%'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(card.title, card.value)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {copied === card.title && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-lg"
                      >
                        <span className="text-sm font-medium text-green-600">Copied!</span>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
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
