
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Users, 
  TestTube, 
  Bug, 
  FileText, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Folder,
  Clock,
  Download,
  Search,
  ChevronRight,
  Home
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  content: string;
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "text-blue-600",
    content: `
# Welcome to NavaDhiti Test Case Management System

## First Steps:
1. **Login/Register**: Access the system with your credentials
2. **Dashboard Overview**: Familiarize yourself with the main dashboard
3. **Create Your First Project**: Start by creating a new testing project
4. **Invite Team Members**: Add collaborators to your project

## Key Concepts:
- **Projects**: Containers for organizing test cases and bugs
- **Modules**: Sub-sections within projects for better organization
- **Test Cases**: Individual test scenarios with steps and expected results
- **Bug Reports**: Issues found during testing with severity and priority levels

## Navigation:
- Use the sidebar to navigate between different modules
- The top header contains user settings and notifications
- Each module has its own toolbar with relevant actions

## Quick Actions:
- **Ctrl + N**: Create new item in current module
- **Ctrl + S**: Save current form
- **Ctrl + F**: Search within current view
    `
  },
  {
    id: "project-management",
    title: "Project Management", 
    icon: Users,
    color: "text-green-600",
    content: `
# Managing Testing Projects

## Creating Projects:
1. Navigate to **Dashboard → Projects → New Project**
2. Fill in project details (name, description, dates)
3. Set project prefix for test case numbering
4. Add team members and assign roles

## Project Roles:
- **Admin**: Full access to all features
- **Manager**: Can manage projects and users
- **Developer**: Can view and update assigned items
- **Tester**: Can create test cases and bug reports

## Project Settings:
- **General**: Basic project information
- **Members**: Manage team access and roles
- **Modules**: Configure project modules
- **Integrations**: Connect to external tools

## Best Practices:
- Use clear, descriptive project names
- Set realistic timelines
- Regularly review project progress
- Maintain clear communication with team members
    `
  },
  {
    id: "test-cases",
    title: "Test Case Management",
    icon: TestTube,
    color: "text-purple-600", 
    content: `
# Creating and Managing Test Cases

## Test Case Structure:
- **Test Case ID**: Auto-generated (e.g., TC-001)
- **Title**: Clear, descriptive summary
- **Description**: Detailed explanation of what to test
- **Prerequisites**: Conditions that must be met before testing
- **Test Steps**: Step-by-step instructions
- **Expected Results**: What should happen when test passes
- **Priority**: Critical, High, Medium, Low
- **Status**: Draft, Active, Deprecated

## Test Execution:
1. Select test cases to execute
2. Follow test steps carefully
3. Record actual results
4. Mark as Pass/Fail/Blocked
5. Create bug reports for failures

## Smart Features:
- **AI Test Generator**: Automatically generate test cases
- **Smart Suggestions**: Get AI-powered test recommendations
- **Bulk Operations**: Import/export test cases via CSV
- **Tags**: Organize test cases with custom tags

## Test Case Templates:
- **Functional Testing**: Standard functional test template
- **UI Testing**: User interface specific tests
- **API Testing**: Backend API test cases
- **Performance Testing**: Load and stress test cases
    `
  },
  {
    id: "bug-tracking",
    title: "Bug Tracking",
    icon: Bug,
    color: "text-red-600",
    content: `
# Bug Reporting and Management

## Creating Bug Reports:
1. Navigate to **Bugs → New Bug**
2. Fill in bug details and reproduction steps
3. Set severity and priority levels
4. Attach screenshots or files
5. Assign to team members

## Bug Severity Levels:
- **Critical**: System crashes, data loss
- **High**: Major functionality broken
- **Medium**: Minor functionality issues
- **Low**: Cosmetic or enhancement requests

## Bug Status Workflow:
- **Open**: Newly reported bug
- **In Progress**: Being worked on
- **Fixed**: Developer completed fix
- **Verified**: QA confirmed fix
- **Closed**: Bug resolution confirmed
- **Reopened**: Issue still exists

## Bug Comments and Collaboration:
- Add comments with updates
- @ mention team members
- Attach additional files
- Track status changes

## GitHub Integration:
- Sync bugs with GitHub issues
- Two-way synchronization
- Automatic status updates
    `
  },
  {
    id: "documents",
    title: "Document Management",
    icon: FileText,
    color: "text-orange-600",
    content: `
# Managing Project Documents

## Document Organization:
- **Folders**: Organize documents in hierarchical structure
- **Categories**: Group related documents
- **Version Control**: Track document versions
- **Access Control**: Manage who can view/edit

## Supported File Types:
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, PNG, GIF, SVG
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Archives**: ZIP, RAR

## Document Features:
- **Drag & Drop**: Easy file uploads
- **Preview**: View documents inline
- **Search**: Find documents by content
- **Comments**: Collaborate on documents
- **Download**: Export documents locally

## Folder Operations:
- **Create**: New folders and subfolders
- **Move**: Drag documents between folders
- **Rename**: Update folder names
- **Delete**: Remove folders and contents
    `
  },
  {
    id: "messaging",
    title: "Team Communication",
    icon: MessageSquare,
    color: "text-indigo-600",
    content: `
# Team Communication Features

## Project Chat:
- **Real-time messaging**: Instant team communication
- **File sharing**: Share documents and images
- **Message history**: Search and reference past conversations
- **@ Mentions**: Notify specific team members

## Messenger Features:
- **Direct Messages**: One-on-one conversations
- **Group Chats**: Team discussions
- **Online Status**: See who's available
- **Notifications**: Stay updated on messages

## AI Assistant:
- **Smart Help**: Get AI-powered assistance
- **Context Aware**: Understands your current work
- **Quick Answers**: Instant responses to queries
- **Learning**: Improves with usage

## Communication Best Practices:
- Use clear, concise messages
- @ mention for important notifications
- Share relevant files and screenshots
- Keep conversations project-focused
    `
  },
  {
    id: "reporting",
    title: "Reports and Analytics",
    icon: BarChart3,
    color: "text-emerald-600",
    content: `
# Generating Reports and Analytics

## Available Reports:
- **Test Execution Summary**: Overall test progress
- **Bug Summary**: Bug status and trends
- **Project Progress**: Timeline and milestones
- **Team Performance**: Individual contributions
- **Coverage Analysis**: Requirement coverage

## Report Formats:
- **PDF**: Professional formatted reports
- **Excel**: Data for further analysis
- **CSV**: Raw data export
- **Dashboard**: Interactive visualizations

## Scheduled Reports:
- **Daily**: Automated daily summaries
- **Weekly**: Weekly progress reports
- **Monthly**: Comprehensive monthly analysis
- **Custom**: Configure your own schedule

## Report Customization:
- **Date Ranges**: Select specific time periods
- **Filters**: Focus on specific data
- **Charts**: Visual data representation
- **Branding**: Company logo and colors
    `
  },
  {
    id: "settings",
    title: "System Configuration",
    icon: Settings,
    color: "text-gray-600",
    content: `
# System Settings and Configuration

## User Settings:
- **Profile**: Update personal information
- **Password**: Change login credentials
- **Preferences**: UI and notification settings
- **Theme**: Light/dark mode selection

## Project Settings:
- **General**: Project information and dates
- **Members**: Team access and permissions
- **Modules**: Enable/disable features
- **Integrations**: External tool connections

## Admin Settings:
- **User Management**: Create and manage users
- **System Configuration**: Global settings
- **Backup**: Data backup and restore
- **Security**: Authentication and permissions

## Module Configuration:
- **Test Cases**: Configure test case settings
- **Bug Reports**: Bug workflow customization
- **Documents**: File storage settings
- **Notifications**: Email and in-app alerts
    `
  }
];

export default function UserGuidePage() {
  const [selectedSection, setSelectedSection] = useState<string>("getting-started");
  const [searchTerm, setSearchTerm] = useState("");

  const currentSection = guideSections.find(section => section.id === selectedSection);
  const filteredSections = guideSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadGuide = (format: 'pdf' | 'html') => {
    const content = guideSections.map(section => `
      <div class="section">
        <h1>${section.title}</h1>
        <div class="content">${section.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    
    const fullContent = `
      <html>
        <head>
          <title>NavaDhiti Test Case Management - User Guide</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .section { margin-bottom: 40px; page-break-after: always; }
            h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
            .content { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>NavaDhiti Test Case Management System - User Guide</h1>
          ${content}
        </body>
      </html>
    `;
    
    const blob = new Blob([fullContent], { type: format === 'pdf' ? 'application/pdf' : 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-guide.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar Navigation */}
      <div className="w-80 border-r bg-gray-50 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Guide
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive documentation for the Test Case Management System
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Download Options */}
        <div className="mb-6 space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => downloadGuide('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => downloadGuide('html')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download HTML
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    isActive 
                      ? "bg-blue-100 border-l-4 border-blue-500 text-blue-700" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${section.color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{section.title}</div>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8">
            {currentSection && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50`}>
                    <currentSection.icon className={`h-8 w-8 ${currentSection.color}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{currentSection.title}</h1>
                    <Badge variant="outline" className="mt-1">
                      Documentation
                    </Badge>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-8">
                    <div className="prose prose-lg max-w-none">
                      {currentSection.content.split('\n').map((line, index) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-2xl font-bold mt-8 mb-4 first:mt-0">{line.substring(2)}</h1>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
                        }
                        if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-lg font-medium mt-4 mb-2">{line.substring(4)}</h3>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={index} className="ml-4">{line.substring(2)}</li>;
                        }
                        if (line.match(/^\d+\./)) {
                          return <li key={index} className="ml-4 list-decimal">{line}</li>;
                        }
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={index} className="mb-3">
                              {parts.map((part, i) => 
                                i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                              )}
                            </p>
                          );
                        }
                        if (line.trim() === '') {
                          return <br key={index} />;
                        }
                        return <p key={index} className="mb-3">{line}</p>;
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
