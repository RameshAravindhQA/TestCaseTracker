
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Download, 
  BookOpen, 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  Bug, 
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  Clock,
  GitBranch,
  Table,
  Notebook,
  Calendar,
  CheckSquare,
  ArrowRight
} from 'lucide-react';

interface UserGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  exampleData?: string;
  steps: string[];
}

const guideSections: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-6 w-6" />,
    description: 'Central hub for project overview and metrics',
    features: [
      'Project statistics overview',
      'Real-time test execution charts',
      'Bug discovery and resolution trends',
      'Test status distribution',
      'Recent activity monitoring'
    ],
    exampleData: 'Total Projects: 5, Test Cases: 120, Open Bugs: 8, Pass Rate: 85%',
    steps: [
      'Login to access your dashboard',
      'View project statistics in the top cards',
      'Monitor test execution trends in the charts',
      'Check recent activity in the activity panel',
      'Use the "New Project" button to create projects'
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: <FolderOpen className="h-6 w-6" />,
    description: 'Create and manage testing projects',
    features: [
      'Create new projects',
      'Edit project details',
      'Manage team collaborators',
      'Project import/export',
      'Project statistics'
    ],
    exampleData: 'Project: "E-commerce Website", Team: 5 members, Modules: 8, Test Cases: 45',
    steps: [
      'Navigate to Projects from the sidebar',
      'Click "New Project" to create a project',
      'Fill in project name, description, and details',
      'Add team members as collaborators',
      'Use actions menu to edit or delete projects'
    ]
  },
  {
    id: 'modules',
    title: 'Modules',
    icon: <FileText className="h-6 w-6" />,
    description: 'Organize test cases by feature modules',
    features: [
      'Create feature modules',
      'Edit module details',
      'Link modules to projects',
      'Module-based test organization',
      'Module statistics'
    ],
    exampleData: 'Module: "User Authentication", Project: "E-commerce Website", Test Cases: 12',
    steps: [
      'Go to Modules from the sidebar',
      'Click "New Module" button',
      'Enter module name and description',
      'Select the parent project',
      'Save and start adding test cases'
    ]
  },
  {
    id: 'test-cases',
    title: 'Test Cases',
    icon: <CheckSquare className="h-6 w-6" />,
    description: 'Create and manage detailed test cases',
    features: [
      'Manual test case creation',
      'AI-powered test case generation',
      'Test case execution tracking',
      'Status management (Pass/Fail/Blocked)',
      'Test case import/export',
      'Tag-based filtering'
    ],
    exampleData: 'Test Case: "Login with valid credentials", Status: Pass, Module: "Authentication"',
    steps: [
      'Navigate to Test Cases',
      'Click "New Test Case" or use AI generator',
      'Fill in test case details and steps',
      'Set expected results and priority',
      'Execute tests and update status',
      'Use filters to organize test cases'
    ]
  },
  {
    id: 'bug-reports',
    title: 'Bug Reports',
    icon: <Bug className="h-6 w-6" />,
    description: 'Track and manage software defects',
    features: [
      'Report new bugs',
      'Attach screenshots and files',
      'Set priority and severity levels',
      'Bug status tracking',
      'Assign bugs to team members',
      'Link bugs to test cases'
    ],
    exampleData: 'Bug: "Login button not responsive", Severity: High, Status: Open, Assignee: John Doe',
    steps: [
      'Go to Bug Reports section',
      'Click "Report Bug" button',
      'Fill in bug details and reproduction steps',
      'Upload screenshots or attachments',
      'Set severity and assign to team member',
      'Track bug resolution progress'
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <BarChart3 className="h-6 w-6" />,
    description: 'Generate comprehensive testing reports',
    features: [
      'Consolidated test reports',
      'Bug summary reports',
      'Project progress reports',
      'Export reports to PDF/Excel',
      'Custom report filters',
      'Real-time report updates'
    ],
    exampleData: 'Report: "Weekly Test Summary", Period: Jan 1-7, Pass Rate: 92%, Bugs Found: 15',
    steps: [
      'Access Reports from the sidebar',
      'Select report type (Consolidated/Bug Summary)',
      'Choose date range and filters',
      'Generate report',
      'Export to PDF or Excel format'
    ]
  },
  {
    id: 'traceability-matrix',
    title: 'Traceability Matrix',
    icon: <Table className="h-6 w-6" />,
    description: 'Visualize relationships between modules',
    features: [
      'Custom marker creation',
      'Color-coded relationships',
      'Module relationship mapping',
      'Interactive matrix view',
      'Relationship tracking'
    ],
    exampleData: 'Matrix: Authentication ↔ User Profile (Strong dependency), Payment ↔ Orders (Medium)',
    steps: [
      'Navigate to Traceability Matrix',
      'Create custom markers with colors',
      'Click matrix cells to assign relationships',
      'Use different markers for different relationship types',
      'View complete traceability map'
    ]
  },
  {
    id: 'messenger',
    title: 'Messenger',
    icon: <MessageSquare className="h-6 w-6" />,
    description: 'Team communication and collaboration',
    features: [
      'Real-time messaging',
      'Project-specific chats',
      'File sharing',
      'Message history',
      'Team notifications'
    ],
    exampleData: 'Chat: "Project Alpha Team", Members: 8, Messages: 245, Files shared: 12',
    steps: [
      'Open Messenger from sidebar',
      'Create or join project chats',
      'Send messages to team members',
      'Share files and screenshots',
      'Search message history'
    ]
  },
  {
    id: 'timesheets',
    title: 'Timesheets',
    icon: <Clock className="h-6 w-6" />,
    description: 'Track testing time and effort',
    features: [
      'Time tracking for test activities',
      'Project-based time logs',
      'Effort estimation',
      'Time reports',
      'Activity categorization'
    ],
    exampleData: 'Timesheet: "Testing Sprint 1", Total Hours: 40, Activities: Test Execution, Bug Fixing',
    steps: [
      'Go to Timesheets section',
      'Create new timesheet entry',
      'Log time for testing activities',
      'Categorize activities by type',
      'Generate time reports'
    ]
  },
  {
    id: 'test-sheets',
    title: 'Test Sheets',
    icon: <Table className="h-6 w-6" />,
    description: 'Spreadsheet-like test management',
    features: [
      'Excel-like interface',
      'Formula support',
      'Bulk test case management',
      'Data import/export',
      'Collaborative editing'
    ],
    exampleData: 'Sheet: "Regression Tests", Rows: 50, Columns: Test ID, Description, Status, Results',
    steps: [
      'Navigate to Test Sheets',
      'Create new test sheet',
      'Add test cases in spreadsheet format',
      'Use formulas for calculations',
      'Export to Excel format'
    ]
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: <FileText className="h-6 w-6" />,
    description: 'Manage project documentation',
    features: [
      'Document upload and storage',
      'Folder organization',
      'Document sharing',
      'Version control',
      'Search functionality'
    ],
    exampleData: 'Folder: "Test Plans", Files: 8, Types: PDF, Word, Excel, Images',
    steps: [
      'Access Documents section',
      'Create folders for organization',
      'Upload files and documents',
      'Share documents with team',
      'Use search to find files'
    ]
  },
  {
    id: 'notebooks',
    title: 'Notebooks',
    icon: <Notebook className="h-6 w-6" />,
    description: 'Digital notebooks for testing notes',
    features: [
      'Rich text editing',
      'Attachment support',
      'Note organization',
      'Search and tagging',
      'Collaborative notes'
    ],
    exampleData: 'Notebook: "Testing Notes", Pages: 25, Tags: UI, API, Performance',
    steps: [
      'Go to Notebooks',
      'Create new notebook',
      'Add pages and content',
      'Attach files and images',
      'Use tags for organization'
    ]
  },
  {
    id: 'kanban',
    title: 'Kanban Board',
    icon: <Calendar className="h-6 w-6" />,
    description: 'Visual task management',
    features: [
      'Drag-and-drop interface',
      'Custom columns',
      'Task cards',
      'Progress tracking',
      'Team assignment'
    ],
    exampleData: 'Board: "Sprint Planning", Columns: To Do, In Progress, Testing, Done',
    steps: [
      'Open Kanban Board',
      'Create task cards',
      'Drag tasks between columns',
      'Assign tasks to team members',
      'Track progress visually'
    ]
  },
  {
    id: 'github-integration',
    title: 'GitHub Integration',
    icon: <GitBranch className="h-6 w-6" />,
    description: 'Connect with GitHub repositories',
    features: [
      'Repository connection',
      'Issue creation',
      'Pull request tracking',
      'Branch management',
      'Code integration'
    ],
    exampleData: 'Repository: "myapp-frontend", Issues: 23, PRs: 8, Connected: Yes',
    steps: [
      'Navigate to GitHub Integration',
      'Connect your repository',
      'Configure access permissions',
      'Create issues from bugs',
      'Track development progress'
    ]
  },
  {
    id: 'functional-flow',
    title: 'Functional Flow',
    icon: <GitBranch className="h-6 w-6" />,
    description: 'Design application flow diagrams',
    features: [
      'Flow diagram creation',
      'Node-based interface',
      'Process mapping',
      'Decision points',
      'Flow validation'
    ],
    exampleData: 'Flow: "User Registration Process", Nodes: 8, Decision Points: 3',
    steps: [
      'Access Functional Flow',
      'Create new flow diagram',
      'Add nodes and connections',
      'Define decision points',
      'Validate flow logic'
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    icon: <Users className="h-6 w-6" />,
    description: 'Manage team members and permissions',
    features: [
      'User account management',
      'Role assignment',
      'Permission settings',
      'Team organization',
      'Access control'
    ],
    exampleData: 'Users: 15, Roles: Admin, Tester, Developer, Active: 12',
    steps: [
      'Go to User Management',
      'Add new team members',
      'Assign roles and permissions',
      'Manage user access',
      'Monitor user activity'
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings className="h-6 w-6" />,
    description: 'Configure system preferences',
    features: [
      'System configuration',
      'User preferences',
      'Integration settings',
      'Security settings',
      'Backup configuration'
    ],
    exampleData: 'Settings: Email notifications: On, Auto-backup: Daily, Theme: Dark',
    steps: [
      'Access Settings menu',
      'Configure system preferences',
      'Set up integrations',
      'Manage security settings',
      'Configure backup options'
    ]
  }
];

export function UserGuideDialog({ isOpen, onClose }: UserGuideDialogProps) {
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');

  const handleDownloadPDF = () => {
    // Create comprehensive PDF content
    const pdfContent = `
TestCaseTracker - Complete User Guide

${guideSections.map(section => `
${section.title.toUpperCase()}
${section.description}

Features:
${section.features.map(feature => `• ${feature}`).join('\n')}

Example Data:
${section.exampleData}

Step-by-Step Instructions:
${section.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

---
`).join('\n')}

© 2024 TestCaseTracker - Complete Testing Management System
    `.trim();

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TestCaseTracker-Complete-User-Guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedSectionData = guideSections.find(s => s.id === selectedSection);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              TestCaseTracker User Guide
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Guide
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 h-[calc(90vh-120px)]">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-4">Modules</h3>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {guideSections.map((section) => (
                  <div
                    key={section.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSection === section.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <div>
                        <span className={`text-sm font-medium ${
                          selectedSection === section.id ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {section.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <ScrollArea className="h-full">
              {selectedSectionData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {selectedSectionData.icon}
                      <div>
                        <CardTitle className="text-xl">{selectedSectionData.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{selectedSectionData.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features Section */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Key Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedSectionData.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Example Data */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Example Data
                      </h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm text-gray-700">{selectedSectionData.exampleData}</code>
                      </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Step-by-Step Instructions
                      </h4>
                      <div className="space-y-3">
                        {selectedSectionData.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1 text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use keyboard shortcuts for faster navigation</li>
                        <li>• Set up notifications for important updates</li>
                        <li>• Use filters and search to find items quickly</li>
                        <li>• Export data regularly for backup</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
