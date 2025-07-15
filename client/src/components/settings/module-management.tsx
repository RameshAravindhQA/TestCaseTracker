import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Bug, 
  BarChart3, 
  MessageCircle, 
  Github, 
  Workflow, 
  Clock, 
  FolderOpen,
  Settings,
  Target,
  Bot,
  Globe,
  NotebookPen,
  Users,
  CalendarDays
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModuleSettings {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  roles: string[];
}

export function ModuleManagement() {
  const { toast } = useToast();
  const [modules, setModules] = useState<ModuleSettings[]>([
    {
      id: 'test-cases',
      name: 'Test Cases',
      description: 'Manage and execute test cases',
      icon: FileText,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'bugs',
      name: 'Bug Reports',
      description: 'Track and manage bugs',
      icon: Bug,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Generate test and bug reports',
      icon: BarChart3,
      enabled: true,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'messenger',
      name: 'Messenger',
      description: 'Team communication and chat',
      icon: MessageCircle,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer', 'Manager']
    },
    {
      id: 'github',
      name: 'GitHub Integration',
      description: 'Integrate with GitHub repositories',
      icon: Github,
      enabled: true,
      roles: ['Admin', 'Developer']
    },
    {
      id: 'functional-flow',
      name: 'Functional Flow',
      description: 'Design functional flow diagrams',
      icon: Workflow,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'timesheets',
      name: 'Timesheets',
      description: 'Track time and attendance',
      icon: Clock,
      enabled: true,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'Document management system',
      icon: FolderOpen,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer', 'Manager']
    },
    {
      id: 'traceability-matrix',
      name: 'Traceability Matrix',
      description: 'Track requirements and test coverage',
      icon: Target,
      enabled: true,
      roles: ['Admin', 'Tester']
    },
    {
      id: 'automation',
      name: 'Test Automation',
      description: 'Automated testing tools',
      icon: Bot,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'api-testing',
      name: 'API Testing',
      description: 'Test REST APIs and web services',
      icon: Globe,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'notebooks',
      name: 'Notebooks',
      description: 'Digital notebooks and documentation',
      icon: NotebookPen,
      enabled: true,
      roles: ['Admin', 'Tester', 'Developer']
    },
    {
      id: 'kanban',
      name: 'Kanban Board',
      description: 'Project management with Kanban',
      icon: CalendarDays,
      enabled: true,
      roles: ['Admin', 'Manager', 'Tester', 'Developer']
    }
  ]);

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    ));

    const module = modules.find(m => m.id === moduleId);
    toast({
      title: "Module Updated",
      description: `${module?.name} has been ${module?.enabled ? 'disabled' : 'enabled'}`
    });
  };

  const saveSettings = () => {
    // Here you would save the settings to the backend
    toast({
      title: "Settings Saved",
      description: "Module settings have been updated successfully"
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Manager': return 'bg-blue-100 text-blue-800';
      case 'Developer': return 'bg-green-100 text-green-800';
      case 'Tester': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Module Configuration</h3>
          <p className="text-sm text-gray-600">
            Control which modules are available to different user roles
          </p>
        </div>
        <Button onClick={saveSettings}>
          Save Settings
        </Button>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.id} className={`transition-all ${!module.enabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${module.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`h-5 w-5 ${module.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{module.name}</h4>
                        {!module.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {module.roles.map((role) => (
                          <Badge 
                            key={role} 
                            variant="outline" 
                            className={`text-xs ${getRoleColor(role)}`}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}