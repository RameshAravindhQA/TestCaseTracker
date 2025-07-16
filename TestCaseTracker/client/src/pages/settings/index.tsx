import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  Globe, 
  Loader2, 
  Lock, 
  Mail, 
  Palette, 
  Save, 
  Shield, 
  Users2, 
  Zap,
  FileArchive,
  Database,
  Tag,
  NotebookPen
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { RolePermissions } from "@/components/settings/role-permissions";
import { MarkerManagement } from "@/components/settings/marker-management";

// Types
interface SystemSettings {
  id: number;
  companyName: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  emailSettings: {
    smtpServer: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    senderEmail: string;
    enableEmailNotifications: boolean;
  };
  backupSettings: {
    enableAutomaticBackups: boolean;
    backupFrequency: string;
    backupLocation: string;
    retentionPeriod: number;
  };
  securitySettings: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number;
    enableTwoFactor: boolean;
    allowedIpAddresses: string[];
  };
  testCaseSettings: {
    defaultStatusOptions: string[];
    defaultPriorityOptions: string[];
    defaultView: string;
    enableVersioning: boolean;
  };
}

// Default settings
const defaultSettings: SystemSettings = {
  id: 1,
  companyName: "Test Case Tracker",
  companyLogo: "/assets/logo.png",
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  emailSettings: {
    smtpServer: "smtp.example.com",
    smtpPort: 587,
    smtpUsername: "notifications@example.com",
    smtpPassword: "",
    senderEmail: "no-reply@example.com",
    enableEmailNotifications: false,
  },
  backupSettings: {
    enableAutomaticBackups: true,
    backupFrequency: "daily",
    backupLocation: "local",
    retentionPeriod: 30,
  },
  securitySettings: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    sessionTimeout: 60,
    enableTwoFactor: false,
    allowedIpAddresses: [],
  },
  testCaseSettings: {
    defaultStatusOptions: ["Not Run", "Pass", "Fail", "Blocked"],
    defaultPriorityOptions: ["Low", "Medium", "High"],
    defaultView: "list",
    enableVersioning: true,
  },
};

// Form schemas
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyLogo: z.string().optional(),
  primaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, "Must be a valid hex color"),
});

const emailSettingsSchema = z.object({
  smtpServer: z.string().min(1, "SMTP server is required"),
  smtpPort: z.coerce.number().int().positive("Port must be a positive number"),
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().optional(),
  senderEmail: z.string().email("Must be a valid email address"),
  enableEmailNotifications: z.boolean(),
});

const backupSettingsSchema = z.object({
  enableAutomaticBackups: z.boolean(),
  backupFrequency: z.string().min(1, "Backup frequency is required"),
  backupLocation: z.string().min(1, "Backup location is required"),
  retentionPeriod: z.coerce.number().int().positive("Retention period must be a positive number"),
});

const securitySettingsSchema = z.object({
  passwordPolicy: z.object({
    minLength: z.coerce.number().int().min(6, "Minimum length must be at least 6"),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
  }),
  sessionTimeout: z.coerce.number().int().positive("Session timeout must be a positive number"),
  enableTwoFactor: z.boolean(),
  allowedIpAddresses: z.array(z.string()),
});

const testCaseSettingsSchema = z.object({
  defaultStatusOptions: z.array(z.string()).min(1, "At least one status option is required"),
  defaultPriorityOptions: z.array(z.string()).min(1, "At least one priority option is required"),
  defaultView: z.string().min(1, "Default view is required"),
  enableVersioning: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;
type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;
type BackupSettingsFormValues = z.infer<typeof backupSettingsSchema>;
type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;
type TestCaseSettingsFormValues = z.infer<typeof testCaseSettingsSchema>;

interface FeaturePermission {
  module: string;
  feature: string;
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface RolePermissions {
  [key: string]: FeaturePermission[];
}

const defaultPermissions: RolePermissions = {
  Admin: [
    { module: "Projects", feature: "Project Management", view: true, create: true, update: true, delete: true },
    { module: "Projects", feature: "Project Members", view: true, create: true, update: true, delete: true },
    { module: "Test Cases", feature: "Test Case Management", view: true, create: true, update: true, delete: true },
    { module: "Test Cases", feature: "Test Execution", view: true, create: true, update: true, delete: true },
    { module: "Bug Reports", feature: "Bug Management", view: true, create: true, update: true, delete: true },
    { module: "Bug Reports", feature: "Bug Assignment", view: true, create: true, update: true, delete: true },
    { module: "Reports", feature: "Generate Reports", view: true, create: true, update: true, delete: true },
    { module: "Reports", feature: "Export Data", view: true, create: true, update: true, delete: true },
    { module: "Users", feature: "User Management", view: true, create: true, update: true, delete: true },
    { module: "Settings", feature: "System Configuration", view: true, create: true, update: true, delete: true },
    { module: "GitHub", feature: "GitHub Integration", view: true, create: true, update: true, delete: true },
    { module: "Automation", feature: "Test Automation", view: true, create: true, update: true, delete: true },
    { module: "Documents", feature: "Document Management", view: true, create: true, update: true, delete: true },
    { module: "Timesheets", feature: "Time Tracking", view: true, create: true, update: true, delete: true },
    { module: "Notebooks", feature: "Note Management", view: true, create: true, update: true, delete: true },
  ],
  Tester: [
    { module: "Projects", feature: "Project Management", view: true, create: false, update: false, delete: false },
    { module: "Projects", feature: "Project Members", view: true, create: false, update: false, delete: false },
    { module: "Test Cases", feature: "Test Case Management", view: true, create: true, update: true, delete: false },
    { module: "Test Cases", feature: "Test Execution", view: true, create: true, update: true, delete: false },
    { module: "Bug Reports", feature: "Bug Management", view: true, create: true, update: true, delete: false },
    { module: "Bug Reports", feature: "Bug Assignment", view: true, create: false, update: false, delete: false },
    { module: "Reports", feature: "Generate Reports", view: true, create: true, update: false, delete: false },
    { module: "Reports", feature: "Export Data", view: true, create: false, update: false, delete: false },
    { module: "Users", feature: "User Management", view: false, create: false, update: false, delete: false },
    { module: "Settings", feature: "System Configuration", view: false, create: false, update: false, delete: false },
    { module: "GitHub", feature: "GitHub Integration", view: true, create: false, update: false, delete: false },
    { module: "Automation", feature: "Test Automation", view: true, create: true, update: true, delete: false },
    { module: "Documents", feature: "Document Management", view: true, create: true, update: true, delete: false },
    { module: "Timesheets", feature: "Time Tracking", view: true, create: true, update: true, delete: false },
    { module: "Notebooks", feature: "Note Management", view: true, create: true, update: true, delete: true },
  ],
  Developer: [
    { module: "Projects", feature: "Project Management", view: true, create: false, update: true, delete: false },
    { module: "Projects", feature: "Project Members", view: true, create: false, update: false, delete: false },
    { module: "Test Cases", feature: "Test Case Management", view: true, create: false, update: true, delete: false },
    { module: "Test Cases", feature: "Test Execution", view: true, create: false, update: true, delete: false },
    { module: "Bug Reports", feature: "Bug Management", view: true, create: false, update: true, delete: false },
    { module: "Bug Reports", feature: "Bug Assignment", view: true, create: false, update: true, delete: false },
    { module: "Reports", feature: "Generate Reports", view: true, create: false, update: false, delete: false },
    { module: "Reports", feature: "Export Data", view: true, create: false, update: false, delete: false },
    { module: "Users", feature: "User Management", view: false, create: false, update: false, delete: false },
    { module: "Settings", feature: "System Configuration", view: false, create: false, update: false, delete: false },
    { module: "GitHub", feature: "GitHub Integration", view: true, create: true, update: true, delete: false },
    { module: "Automation", feature: "Test Automation", view: true, create: true, update: true, delete: false },
    { module: "Documents", feature: "Document Management", view: true, create: true, update: true, delete: false },
    { module: "Timesheets", feature: "Time Tracking", view: true, create: true, update: true, delete: false },
    { module: "Notebooks", feature: "Note Management", view: true, create: true, update: true, delete: true },
  ],
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(defaultPermissions);
    const [selectedRole, setSelectedRole] = useState(Object.keys(defaultPermissions)[0]); // Initialize with the first role

  // Fetch settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
    initialData: defaultSettings, // Use default settings if API call fails
  });

  // General settings form
  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: settings?.companyName || "",
      companyLogo: settings?.companyLogo || "",
      primaryColor: settings?.primaryColor || "#3b82f6",
      secondaryColor: settings?.secondaryColor || "#10b981",
    },
  });

  // Email settings form
  const emailForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpServer: settings?.emailSettings.smtpServer || "",
      smtpPort: settings?.emailSettings.smtpPort || 587,
      smtpUsername: settings?.emailSettings.smtpUsername || "",
      smtpPassword: settings?.emailSettings.smtpPassword || "",
      senderEmail: settings?.emailSettings.senderEmail || "",
      enableEmailNotifications: settings?.emailSettings.enableEmailNotifications || false,
    },
  });

  // Backup settings form
  const backupForm = useForm<BackupSettingsFormValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: {
      enableAutomaticBackups: settings?.backupSettings.enableAutomaticBackups || true,
      backupFrequency: settings?.backupSettings.backupFrequency || "daily",
      backupLocation: settings?.backupSettings.backupLocation || "local",
      retentionPeriod: settings?.backupSettings.retentionPeriod || 30,
    },
  });

  // Security settings form
  const securityForm = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordPolicy: {
        minLength: settings?.securitySettings.passwordPolicy.minLength || 8,
        requireUppercase: settings?.securitySettings.passwordPolicy.requireUppercase || true,
        requireLowercase: settings?.securitySettings.passwordPolicy.requireLowercase || true,
        requireNumbers: settings?.securitySettings.passwordPolicy.requireNumbers || true,
        requireSpecialChars: settings?.securitySettings.passwordPolicy.requireSpecialChars || true,
      },
      sessionTimeout: settings?.securitySettings.sessionTimeout || 60,
      enableTwoFactor: settings?.securitySettings.enableTwoFactor || false,
      allowedIpAddresses: settings?.securitySettings.allowedIpAddresses || [],
    },
  });

  // Test case settings form
  const testCaseForm = useForm<TestCaseSettingsFormValues>({
    resolver: zodResolver(testCaseSettingsSchema),
    defaultValues: {
      defaultStatusOptions: settings?.testCaseSettings.defaultStatusOptions || ["Not Run", "Pass", "Fail", "Blocked"],
      defaultPriorityOptions: settings?.testCaseSettings.defaultPriorityOptions || ["Low", "Medium", "High"],
      defaultView: settings?.testCaseSettings.defaultView || "list",
      enableVersioning: settings?.testCaseSettings.enableVersioning || true,
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your changes have been applied successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save settings: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Save general settings
  const handleSaveGeneralSettings = (data: GeneralSettingsFormValues) => {
    saveSettingsMutation.mutate({
      companyName: data.companyName,
      companyLogo: data.companyLogo,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
    });
  };

  // Save email settings
  const handleSaveEmailSettings = (data: EmailSettingsFormValues) => {
    saveSettingsMutation.mutate({
      emailSettings: data,
    });
  };

  // Save backup settings
  const handleSaveBackupSettings = (data: BackupSettingsFormValues) => {
    saveSettingsMutation.mutate({
      backupSettings: data,
    });
  };

  // Save security settings
  const handleSaveSecuritySettings = (data: SecuritySettingsFormValues) => {
    saveSettingsMutation.mutate({
      securitySettings: data,
    });
  };

  // Save test case settings
  const handleSaveTestCaseSettings = (data: TestCaseSettingsFormValues) => {
    saveSettingsMutation.mutate({
      testCaseSettings: data,
    });
  };

  // Test email configuration
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/test-email", emailForm.getValues());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "A test email has been sent to the administrator",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send test email: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Create manual backup
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/create-backup", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup created",
        description: "A manual backup has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create backup: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings && !isLoading) {
      generalForm.reset({
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });

      emailForm.reset({
        smtpServer: settings.emailSettings.smtpServer,
        smtpPort: settings.emailSettings.smtpPort,
        smtpUsername: settings.emailSettings.smtpUsername,
        smtpPassword: settings.emailSettings.smtpPassword,
        senderEmail: settings.emailSettings.senderEmail,
        enableEmailNotifications: settings.emailSettings.enableEmailNotifications,
      });

      backupForm.reset({
        enableAutomaticBackups: settings.backupSettings.enableAutomaticBackups,
        backupFrequency: settings.backupSettings.backupFrequency,
        backupLocation: settings.backupSettings.backupLocation,
        retentionPeriod: settings.backupSettings.retentionPeriod,
      });

      securityForm.reset({
        passwordPolicy: {
          minLength: settings.securitySettings.passwordPolicy.minLength,
          requireUppercase: settings.securitySettings.passwordPolicy.requireUppercase,
          requireLowercase: settings.securitySettings.passwordPolicy.requireLowercase,
          requireNumbers: settings.securitySettings.passwordPolicy.requireNumbers,
          requireSpecialChars: settings.securitySettings.passwordPolicy.requireSpecialChars,
        },
        sessionTimeout: settings.securitySettings.sessionTimeout,
        enableTwoFactor: settings.securitySettings.enableTwoFactor,
        allowedIpAddresses: settings.securitySettings.allowedIpAddresses,
      });

      testCaseForm.reset({
        defaultStatusOptions: settings.testCaseSettings.defaultStatusOptions,
        defaultPriorityOptions: settings.testCaseSettings.defaultPriorityOptions,
        defaultView: settings.testCaseSettings.defaultView,
        enableVersioning: settings.testCaseSettings.enableVersioning,
      });
    }
  }, [settings, isLoading]);

  const tabs = [
    { id: "general", label: "General", icon: <Globe className="h-4 w-4 mr-2" /> },
    { id: "email", label: "Email", icon: <Mail className="h-4 w-4 mr-2" /> },
    { id: "backup", label: "Backup", icon: <FileArchive className="h-4 w-4 mr-2" /> },
    { id: "security", label: "Security", icon: <Shield className="h-4 w-4 mr-2" /> },
    { id: "test-case", label: "Test Cases", icon: <NotebookPen className="h-4 w-4 mr-2" /> },
    { id: "permissions", label: "Permissions", icon: <Users2 className="h-4 w-4 mr-2" /> },
  ];

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure application settings and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Card className="md:w-64 flex-shrink-0">
            <CardContent className="p-4">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex-1">
            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic application information and appearance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(handleSaveGeneralSettings)} className="space-y-6">
                      <FormField
                        control={generalForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This will be displayed in the application header and emails
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="companyLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Logo URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter logo URL" {...field} />
                            </FormControl>
                            <FormDescription>
                              URL to your company logo image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Color</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input placeholder="#3b82f6" {...field} />
                                </FormControl>
                                <div 
                                  className="w-8 h-8 rounded-full border"
                                  style={{ backgroundColor: field.value }}
                                ></div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="secondaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Color</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input placeholder="#10b981" {...field} />
                                </FormControl>
                                <div 
                                  className="w-8 h-8 rounded-full border"
                                  style={{ backgroundColor: field.value }}
                                ></div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="flex items-center gap-2"
                          disabled={saveSettingsMutation.isPending}
                        >
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Settings
                  </CardTitle>
                  <CardDescription>
                    Configure email server settings for notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(handleSaveEmailSettings)} className="space-y-6">
                      <FormField
                        control={emailForm.control}
                        name="enableEmailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Enable or disable email notifications
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="smtpServer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Server</FormLabel>
                              <FormControl>
                                <Input placeholder="smtp.example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Port</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="587" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="smtpUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="smtpPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={emailForm.control}
                        name="senderEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Email</FormLabel>
                            <FormControl>
                              <Input placeholder="no-reply@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              Email address that will appear as the sender
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => testEmailMutation.mutate()}
                          disabled={testEmailMutation.isPending}
                        >
                          {testEmailMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          Test Configuration
                        </Button>

                        <Button 
                          type="submit" 
                          className="flex items-center gap-2"
                          disabled={saveSettingsMutation.isPending}
                        >
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Backup Settings */}
            {activeTab === "backup" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileArchive className="h-5 w-5 mr-2" />
                    Backup & Recovery
                  </CardTitle>
                  <CardDescription>
                    Configure automatic backup settings and manage data recovery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...backupForm}>
                    <form onSubmit={backupForm.handleSubmit(handleSaveBackupSettings)} className="space-y-6">
                      <FormField
                        control={backupForm.control}
                        name="enableAutomaticBackups"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Automatic Backups</FormLabel>
                              <FormDescription>
                                Enable or disable scheduled automatic backups
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={backupForm.control}
                          name="backupFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Backup Frequency</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hourly">Hourly</SelectItem>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={backupForm.control}
                          name="backupLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Backup Location</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="local">Local Storage</SelectItem>
                                  <SelectItem value="s3">Amazon S3</SelectItem>
                                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                                </```tool_code
SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={backupForm.control}
                        name="retentionPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retention Period (Days)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of days to keep backup files before automatic deletion
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => createBackupMutation.mutate()}
                          disabled={createBackupMutation.isPending}
                        >
                          {createBackupMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Database className="h-4 w-4" />
                          )}
                          Create Manual Backup
                        </Button>

                        <Button 
                          type="submit" 
                          className="flex items-center gap-2"
                          disabled={saveSettingsMutation.isPending}
                        >
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure security policies and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(handleSaveSecuritySettings)} className="space-y-6">
                      <div>
                        <h3 className="text-md font-medium mb-2">Password Policy</h3>
                        <div className="space-y-4 border rounded-md p-4">
                          <FormField
                            control={securityForm.control}
                            name="passwordPolicy.minLength"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Password Length</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={securityForm.control}
                              name="passwordPolicy.requireUppercase"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Require uppercase letters</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={securityForm.control}
                              name="passwordPolicy.requireLowercase"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Require lowercase letters</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={securityForm.control}
                              name="passwordPolicy.requireNumbers"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Require numbers</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={securityForm.control}
                              name="passwordPolicy.requireSpecialChars"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel>Require special characters</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (minutes)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>
                                Time before users are automatically logged out
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="enableTwoFactor"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Two-Factor Authentication</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <span>
                                  {field.value ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <FormDescription>
                                Require two-factor authentication for all users
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="flex items-center gap-2"
                          disabled={saveSettingsMutation.isPending}
                        >
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Test Case Settings */}
            {activeTab === "test-case" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <NotebookPen className="h-5 w-5 mr-2" />
                    Test Case Settings
                  </CardTitle>
                  <CardDescription>
                    Configure test case management settings and defaults
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...testCaseForm}>
                    <form onSubmit={testCaseForm.handleSubmit(handleSaveTestCaseSettings)} className="space-y-6">
                      <FormField
                        control={testCaseForm.control}
                        name="defaultStatusOptions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Status Options</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Not Run, Pass, Fail, Blocked" 
                                value={field.value.join(", ")}
                                onChange={(e) => {
                                  const values = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
                                  field.onChange(values);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of test case status options
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testCaseForm.control}
                        name="defaultPriorityOptions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Priority Options</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Low, Medium, High" 
                                value={field.value.join(", ")}
                                onChange={(e) => {
                                  const values = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
                                  field.onChange(values);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated list of test case priority options
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={testCaseForm.control}
                          name="defaultView"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default View</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select default view" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="list">List View</SelectItem>
                                  <SelectItem value="grid">Grid View</SelectItem>
                                  <SelectItem value="table">Table View</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={testCaseForm.control}
                          name="enableVersioning"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Version Control</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <span>
                                  {field.value ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <FormDescription>
                                Track test case version history
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="flex items-center gap-2"
                          disabled={saveSettingsMutation.isPending}
                        >
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Permissions Settings */}
            {activeTab === "permissions" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users2 className="h-5 w-5 mr-2" />
                    Role-Based Permissions
                  </CardTitle>
                  <CardDescription>
                    Configure what actions each role can perform in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RolePermissions 
                    rolePermissions={rolePermissions}
                    setRolePermissions={setRolePermissions}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                  />
                </CardContent>
              </Card>
            )}
{/* Marker Management */}
          <Card>
            <CardHeader>
              <CardTitle>Marker Management</CardTitle>
              <CardDescription>
                Create and manage custom markers for traceability matrices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkerManagement />
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}