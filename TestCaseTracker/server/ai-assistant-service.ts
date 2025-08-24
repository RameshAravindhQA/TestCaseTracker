
interface AIQuery {
  query: string;
  context: any;
  userRole: string;
  userId: number;
}

interface AIResponse {
  response: string;
  suggestions: string[];
  data?: any;
  charts?: any[];
}

export class AIAssistantService {
  
  static async processQuery(query: AIQuery): Promise<AIResponse> {
    const { query: userQuery, context, userRole, userId } = query;
    
    // Analyze the query to determine intent
    const intent = this.analyzeIntent(userQuery);
    
    switch (intent) {
      case 'analytics':
        return this.generateAnalyticsResponse(context, userQuery);
      case 'bug_report':
        return this.generateBugReport(context, userQuery);
      case 'test_status':
        return this.generateTestStatus(context, userQuery);
      case 'team_info':
        return this.generateTeamInfo(context, userQuery);
      case 'project_status':
        return this.generateProjectStatus(context, userQuery);
      case 'trends':
        return this.generateTrends(context, userQuery);
      default:
        return this.generateGenericResponse(context, userQuery);
    }
  }
  
  private static analyzeIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('analytic') || lowerQuery.includes('dashboard') || lowerQuery.includes('overview')) {
      return 'analytics';
    }
    if (lowerQuery.includes('bug') || lowerQuery.includes('defect') || lowerQuery.includes('issue')) {
      return 'bug_report';
    }
    if (lowerQuery.includes('test') || lowerQuery.includes('case') || lowerQuery.includes('coverage')) {
      return 'test_status';
    }
    if (lowerQuery.includes('team') || lowerQuery.includes('employee') || lowerQuery.includes('allocation')) {
      return 'team_info';
    }
    if (lowerQuery.includes('project') || lowerQuery.includes('status') || lowerQuery.includes('progress')) {
      return 'project_status';
    }
    if (lowerQuery.includes('trend') || lowerQuery.includes('performance') || lowerQuery.includes('metric')) {
      return 'trends';
    }
    
    return 'generic';
  }
  
  private static generateAnalyticsResponse(context: any, query: string): AIResponse {
    const { users = [], projects = [], testCases = [], bugs = [], employees = [], projectAssignments = [] } = context;
    
    const totalUsers = users.length;
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: any) => p.status === 'Active').length;
    const totalTestCases = testCases.length;
    const totalBugs = bugs.length;
    const openBugs = bugs.filter((bug: any) => bug.status === 'Open').length;
    const criticalBugs = bugs.filter((bug: any) => bug.severity === 'Critical').length;
    
    const response = `# 📊 **Analytics Dashboard Overview**

## **Key Metrics**
• **Total Projects**: ${totalProjects} (${activeProjects} active)
• **Test Cases**: ${totalTestCases} total
• **Bugs**: ${totalBugs} total (${openBugs} open, ${criticalBugs} critical)
• **Team**: ${totalUsers} users, ${employees.length} employees
• **Active Allocations**: ${projectAssignments.filter((pa: any) => pa.isActive).length}

## **Health Indicators**
${openBugs > 10 ? '🔴 **High Bug Count** - Consider bug triage session' : '🟢 **Bug Count Normal**'}
${criticalBugs > 0 ? `🔴 **${criticalBugs} Critical Bugs** - Immediate attention needed` : '🟢 **No Critical Bugs**'}
${activeProjects === 0 ? '🔴 **No Active Projects**' : `🟢 **${activeProjects} Active Projects**`}

## **Recommendations**
${criticalBugs > 0 ? '• Address critical bugs immediately\n' : ''}
${openBugs > totalBugs * 0.3 ? '• Consider increasing testing resources\n' : ''}
${testCases.length < totalProjects * 10 ? '• Increase test coverage\n' : ''}
• Regular team performance reviews`;

    const suggestions = [
      "Show me critical bugs details",
      "What's the test case coverage by project?",
      "Employee workload analysis",
      "Project timeline overview",
      "Bug severity breakdown"
    ];

    return { response, suggestions };
  }
  
  private static generateBugReport(context: any, query: string): AIResponse {
    const { bugs = [], projects = [] } = context;
    
    const bugsByStatus = bugs.reduce((acc: any, bug: any) => {
      acc[bug.status] = (acc[bug.status] || 0) + 1;
      return acc;
    }, {});
    
    const bugsBySeverity = bugs.reduce((acc: any, bug: any) => {
      acc[bug.severity] = (acc[bug.severity] || 0) + 1;
      return acc;
    }, {});
    
    const criticalBugs = bugs.filter((bug: any) => bug.severity === 'Critical');
    const openBugs = bugs.filter((bug: any) => bug.status === 'Open');
    
    let response = `# 🐛 **Bug Analysis Report**

## **Status Distribution**
${Object.entries(bugsByStatus).map(([status, count]) => `• **${status}**: ${count}`).join('\n')}

## **Severity Breakdown**
${Object.entries(bugsBySeverity).map(([severity, count]) => `• **${severity}**: ${count}`).join('\n')}`;

    if (criticalBugs.length > 0) {
      response += `\n\n## 🚨 **Critical Bugs (Immediate Action Required)**\n`;
      criticalBugs.slice(0, 5).forEach((bug: any, index: number) => {
        const project = projects.find((p: any) => p.id === bug.projectId);
        response += `${index + 1}. **${bug.title}** (${project?.name || 'Unknown Project'})\n`;
      });
    }
    
    if (openBugs.length > 0) {
      response += `\n\n## 📋 **Open Bugs Summary**\n`;
      response += `Total open bugs: **${openBugs.length}**\n`;
      if (openBugs.length > 10) {
        response += `⚠️ **High volume of open bugs** - Consider prioritization session\n`;
      }
    }

    const suggestions = [
      "Show me bugs by project",
      "What are the oldest open bugs?",
      "Bug trend analysis over time",
      "Assign bugs to developers",
      "Export bug report"
    ];

    return { response, suggestions };
  }
  
  private static generateTestStatus(context: any, query: string): AIResponse {
    const { testCases = [], projects = [] } = context;
    
    const testsByStatus = testCases.reduce((acc: any, test: any) => {
      acc[test.status] = (acc[test.status] || 0) + 1;
      return acc;
    }, {});
    
    const testsByProject = projects.map((project: any) => {
      const projectTests = testCases.filter((tc: any) => tc.projectId === project.id);
      return {
        project: project.name,
        total: projectTests.length,
        passed: projectTests.filter((tc: any) => tc.status === 'Passed').length,
        failed: projectTests.filter((tc: any) => tc.status === 'Failed').length,
        pending: projectTests.filter((tc: any) => tc.status === 'Pending').length
      };
    });
    
    let response = `# ✅ **Test Case Status Report**

## **Overall Status**
${Object.entries(testsByStatus).map(([status, count]) => `• **${status}**: ${count}`).join('\n')}

## **Coverage by Project**
${testsByProject.map((p: any) => 
  `**${p.project}**: ${p.total} tests (${p.passed} passed, ${p.failed} failed, ${p.pending} pending)`
).join('\n')}`;

    const totalTests = testCases.length;
    const passedTests = testCases.filter((tc: any) => tc.status === 'Passed').length;
    const failedTests = testCases.filter((tc: any) => tc.status === 'Failed').length;
    
    if (totalTests > 0) {
      const passRate = ((passedTests / totalTests) * 100).toFixed(1);
      response += `\n\n## **Quality Metrics**\n`;
      response += `• **Pass Rate**: ${passRate}%\n`;
      response += `• **Total Coverage**: ${totalTests} test cases\n`;
      
      if (parseFloat(passRate) < 80) {
        response += `\n⚠️ **Pass rate below 80%** - Review failed test cases`;
      }
    }

    const suggestions = [
      "Show failed test cases details",
      "Test execution timeline",
      "Coverage gaps analysis",
      "Generate test execution report",
      "Automated test recommendations"
    ];

    return { response, suggestions };
  }
  
  private static generateTeamInfo(context: any, query: string): AIResponse {
    const { employees = [], projectAssignments = [], projects = [] } = context;
    
    const employeeWorkload = employees.map((emp: any) => {
      const assignments = projectAssignments.filter((pa: any) => pa.employeeId === emp.id && pa.isActive);
      const totalAllocation = assignments.reduce((sum: number, a: any) => sum + (a.allocation || 0), 0);
      
      return {
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.role,
        allocation: totalAllocation,
        projects: assignments.length,
        available: 100 - totalAllocation
      };
    });
    
    const overAllocated = employeeWorkload.filter(emp => emp.allocation > 100);
    const underAllocated = employeeWorkload.filter(emp => emp.allocation < 80);
    const available = employeeWorkload.filter(emp => emp.available > 20);
    
    let response = `# 👥 **Team Allocation Overview**

## **Workforce Summary**
• **Total Employees**: ${employees.length}
• **Active Assignments**: ${projectAssignments.filter((pa: any) => pa.isActive).length}
• **Available Capacity**: ${available.length} employees with 20%+ availability

## **Allocation Status**
${employeeWorkload.slice(0, 10).map((emp: any) => 
  `• **${emp.name}** (${emp.role}): ${emp.allocation}% allocated (${emp.projects} projects)`
).join('\n')}`;

    if (overAllocated.length > 0) {
      response += `\n\n## 🚨 **Over-Allocated Employees**\n`;
      overAllocated.forEach((emp: any) => {
        response += `• **${emp.name}**: ${emp.allocation}% (${emp.allocation - 100}% over capacity)\n`;
      });
    }
    
    if (available.length > 0) {
      response += `\n\n## 🟢 **Available for New Projects**\n`;
      available.slice(0, 5).forEach((emp: any) => {
        response += `• **${emp.name}** (${emp.role}): ${emp.available}% available\n`;
      });
    }

    const suggestions = [
      "Show detailed employee allocations",
      "Find available developers",
      "Project assignment history",
      "Workload balancing recommendations",
      "Team performance metrics"
    ];

    return { response, suggestions };
  }
  
  private static generateProjectStatus(context: any, query: string): AIResponse {
    const { projects = [], testCases = [], bugs = [], projectAssignments = [] } = context;
    
    const projectSummary = projects.map((project: any) => {
      const projectTests = testCases.filter((tc: any) => tc.projectId === project.id);
      const projectBugs = bugs.filter((bug: any) => bug.projectId === project.id);
      const projectTeam = projectAssignments.filter((pa: any) => pa.projectId === project.id && pa.isActive);
      
      return {
        name: project.name || project.projectName,
        status: project.status,
        testCases: projectTests.length,
        openBugs: projectBugs.filter((bug: any) => bug.status === 'Open').length,
        teamSize: projectTeam.length,
        progress: this.calculateProjectProgress(projectTests, projectBugs)
      };
    });
    
    const activeProjects = projectSummary.filter(p => p.status === 'Active');
    const completedProjects = projectSummary.filter(p => p.status === 'Completed');
    
    let response = `# 📋 **Project Status Dashboard**

## **Portfolio Overview**
• **Total Projects**: ${projects.length}
• **Active Projects**: ${activeProjects.length}
• **Completed Projects**: ${completedProjects.length}

## **Active Project Details**
${activeProjects.slice(0, 8).map((p: any) => 
  `**${p.name}**\n  • Progress: ${p.progress}%\n  • Team: ${p.teamSize} members\n  • Tests: ${p.testCases}\n  • Open Bugs: ${p.openBugs}\n`
).join('\n')}`;

    const highRiskProjects = activeProjects.filter(p => p.openBugs > 5 || p.progress < 30);
    if (highRiskProjects.length > 0) {
      response += `\n## ⚠️ **High Risk Projects**\n`;
      highRiskProjects.forEach((p: any) => {
        response += `• **${p.name}**: ${p.openBugs > 5 ? `${p.openBugs} open bugs` : `${p.progress}% progress`}\n`;
      });
    }

    const suggestions = [
      "Show project timeline view",
      "Resource allocation by project",
      "Project risk analysis",
      "Delivery forecasts",
      "Client communication status"
    ];

    return { response, suggestions };
  }
  
  private static generateTrends(context: any, query: string): AIResponse {
    const { bugs = [], testCases = [], projects = [] } = context;
    
    // Simple trend analysis (in a real implementation, you'd use time-series data)
    const bugTrend = this.calculateTrend(bugs, 'createdAt');
    const testTrend = this.calculateTrend(testCases, 'createdAt');
    
    let response = `# 📈 **Performance Trends Analysis**

## **Bug Trends**
• **Recent Activity**: ${bugTrend.recent} bugs created recently
• **Trend Direction**: ${bugTrend.direction}
• **Average per Week**: ${bugTrend.averageWeekly}

## **Test Case Trends**
• **New Tests**: ${testTrend.recent} test cases added recently
• **Coverage Growth**: ${testTrend.direction}
• **Weekly Average**: ${testTrend.averageWeekly}

## **Quality Insights**
${this.generateQualityInsights(bugs, testCases)}`;

    const suggestions = [
      "Detailed bug trend analysis",
      "Test execution success rates",
      "Team productivity metrics",
      "Quality improvement recommendations",
      "Historical comparison"
    ];

    return { response, suggestions };
  }
  
  private static generateGenericResponse(context: any, query: string): AIResponse {
    const { users = [], projects = [], testCases = [], bugs = [], employees = [] } = context;
    
    let response = `I understand you're asking: "${query}"

Based on your current system data:
• **${projects.length}** projects
• **${testCases.length}** test cases  
• **${bugs.length}** bugs
• **${employees.length}** team members

I can help you with:
🔍 **Data Analysis** - Ask about specific metrics or reports
📊 **Insights** - Get trends and patterns in your data
👥 **Team Management** - Allocation and workload information
📋 **Project Status** - Progress and health monitoring
🐛 **Quality Tracking** - Bug analysis and test coverage

Could you be more specific about what you'd like to know?`;

    const suggestions = [
      "Show me project overview",
      "What are my critical issues?",
      "Team workload status",
      "Quality metrics summary",
      "Recent activity report"
    ];

    return { response, suggestions };
  }
  
  private static calculateProjectProgress(testCases: any[], bugs: any[]): number {
    if (testCases.length === 0) return 0;
    
    const passedTests = testCases.filter((tc: any) => tc.status === 'Passed').length;
    const openBugs = bugs.filter((bug: any) => bug.status === 'Open').length;
    
    const testProgress = (passedTests / testCases.length) * 100;
    const bugPenalty = Math.min(openBugs * 5, 30); // Max 30% penalty for bugs
    
    return Math.max(0, Math.round(testProgress - bugPenalty));
  }
  
  private static calculateTrend(items: any[], dateField: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recent = items.filter((item: any) => {
      const itemDate = new Date(item[dateField]);
      return itemDate > weekAgo;
    }).length;
    
    return {
      recent,
      direction: recent > items.length * 0.1 ? 'Increasing' : 'Stable',
      averageWeekly: Math.round(recent)
    };
  }
  
  private static generateQualityInsights(bugs: any[], testCases: any[]): string {
    const criticalBugs = bugs.filter((bug: any) => bug.severity === 'Critical').length;
    const passedTests = testCases.filter((tc: any) => tc.status === 'Passed').length;
    const totalTests = testCases.length;
    
    let insights = '';
    
    if (criticalBugs > 0) {
      insights += `⚠️ **${criticalBugs} Critical Issues** need immediate attention\n`;
    }
    
    if (totalTests > 0) {
      const passRate = (passedTests / totalTests * 100).toFixed(1);
      insights += `✅ **${passRate}% Test Pass Rate** `;
      insights += parseFloat(passRate) > 90 ? '(Excellent)' : parseFloat(passRate) > 80 ? '(Good)' : '(Needs Improvement)';
    }
    
    return insights;
  }
}
