import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clipboard, Check, AlertCircle, X, Bug, CircleX, CircleCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface BugSummary {
  total: number;
  ui: number;
  minor: number;
  major: number;
  closed: number;
  open: number;
}

interface BugReportSummaryProps {
  bugData: BugSummary;
  loading?: boolean;
}

export function BugReportSummary({ bugData, loading }: BugReportSummaryProps) {
  // Don't render if no bug data and not loading
  if (!loading && (!bugData || bugData.total === 0)) {
    return null;
  }

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [_, navigate] = useLocation(); // For navigation to other pages

  // Function to copy report to clipboard
  const copyToClipboard = () => {
    const text = `Bug Report Summary
Generated on: ${new Date().toLocaleString()}

Total Bugs: ${bugData.total}
UI Bugs: ${bugData.ui}
Minor Bugs: ${bugData.minor}
Major Bugs: ${bugData.major}
Closed Bugs: ${bugData.closed}
Open Bugs: ${bugData.open}`;

    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Bug report summary has been copied to clipboard",
        });

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bug Report Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-bold">Bug Report Summary</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-1 transition-all ${copied ? "bg-green-50 text-green-600 border-green-300" : ""}`}
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" />
              <span>Copy Report</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="min-h-[180px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center space-y-2">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-6 gap-4 w-full">
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
                <div className="h-10 bg-gray-200 rounded col-span-1"></div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view all bugs"
                onClick={() => navigate('/bugs')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</h3>
                    <Bug className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bugData.total}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                    All Bugs
                  </Badge>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view UI bugs"
                onClick={() => navigate('/bugs?type=ui')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">UI</h3>
                    <AlertCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{bugData.ui}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800">
                    Interface Issues
                  </Badge>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view minor bugs"
                onClick={() => navigate('/bugs?severity=minor')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Minor</h3>
                    <X className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{bugData.minor}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800">
                    Low Severity
                  </Badge>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view major bugs"
                onClick={() => navigate('/bugs?severity=major')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Major</h3>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bugData.major}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800">
                    High Severity
                  </Badge>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view closed bugs"
                onClick={() => navigate('/bugs?status=closed')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Closed</h3>
                    <CircleCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bugData.closed}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                    Resolved Issues
                  </Badge>
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 relative group"
                title="Click to view open bugs"
                onClick={() => navigate('/bugs?status=open')}
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Open</h3>
                    <CircleX className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bugData.open}</p>
                  <Badge variant="outline" className="mt-2 w-fit bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800">
                    Pending Issues
                  </Badge>
                </div>
              </motion.div>
            </div>

            <div className="overflow-x-auto mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <table className="min-w-full text-center">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-4 text-sm font-semibold">Total Bugs</th>
                    <th className="py-2 px-4 text-sm font-semibold">UI</th>
                    <th className="py-2 px-4 text-sm font-semibold">Minor</th>
                    <th className="py-2 px-4 text-sm font-semibold">Major</th>
                    <th className="py-2 px-4 text-sm font-semibold">Closed</th>
                    <th className="py-2 px-4 text-sm font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4 font-semibold">{bugData.total}</td>
                    <td className="py-2 px-4">{bugData.ui}</td>
                    <td className="py-2 px-4">{bugData.minor}</td>
                    <td className="py-2 px-4">{bugData.major}</td>
                    <td className="py-2 px-4">{bugData.closed}</td>
                    <td className="py-2 px-4">{bugData.open}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}