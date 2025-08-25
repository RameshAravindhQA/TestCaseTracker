
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Key, Info, CheckCircle, XCircle, Loader2, Bot, Shield, Palette, User, Mail, Bell, Lock, Eye, EyeOff, Save, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";

interface AIProvider {
  provider: string;
  name: string;
  description: string;
  keyFormat: string;
  available: boolean;
  error?: string;
  isFree: boolean;
}

interface UserSettings {
  notifications: {
    email: boolean;
    browser: boolean;
    desktop: boolean;
    sound: boolean;
  };
  appearance: {
    theme: string;
    language: string;
    fontSize: number;
    animations: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
  general: {
    timezone: string;
    dateFormat: string;
    autoSave: boolean;
    defaultProject: string;
  };
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      browser: true,
      desktop: false,
      sound: true,
    },
    appearance: {
      theme: "light",
      language: "en",
      fontSize: 14,
      animations: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginNotifications: true,
    },
    general: {
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      autoSave: true,
      defaultProject: "none",
    },
  });

  // Fetch available AI providers
  const { data: providers = [], refetch: refetchProviders } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: async (): Promise<AIProvider[]> => {
      const response = await fetch("/api/ai/providers", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch AI providers");
      const data = await response.json();
      return data.providers || [];
    },
  });

  // API Key management mutation
  const updateAPIKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const response = await fetch("/api/ai/update-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!response.ok) throw new Error("Failed to update API key");
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "API Key Updated",
        description: `${variables.provider} API key has been updated successfully.`,
      });
      refetchProviders();
      setApiKeys(prev => ({
        ...prev,
        [variables.provider]: ""
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  const handleUpdateAPIKey = (provider: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey?.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }

    updateAPIKeyMutation.mutate({ provider, apiKey });
  };

  const handleSettingsUpdate = (section: keyof UserSettings, key: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully.",
    });
  };

  const getProviderIcon = (provider: AIProvider) => {
    if (provider.available) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getProviderBadge = (provider: AIProvider) => {
    if (provider.available) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Configured</Badge>;
    }
    return <Badge variant="destructive">Not Configured</Badge>;
  };

  const getProviderInstructions = (provider: AIProvider) => {
    const instructions: Record<string, string> = {
      gemini: "Get your free API key from Google AI Studio: https://makersuite.google.com/app/apikey",
      openai: "Get your API key from OpenAI Platform: https://platform.openai.com/api-keys",
      claude: "Get your API key from Anthropic Console: https://console.anthropic.com/",
      grok: "Get your API key from xAI Console: https://console.x.ai/",
      deepseek: "Get your free API key from DeepSeek Platform: https://platform.deepseek.com/api_keys",
      perplexity: "Get your API key from Perplexity AI: https://www.perplexity.ai/settings/api",
      together: "Get your free API key from Together AI: https://api.together.xyz/settings/api-keys",
      groq: "Get your free API key from Groq Console: https://console.groq.com/keys"
    };
    return instructions[provider.provider] || "Check the provider's documentation for API key instructions.";
  };

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Configure your preferences</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configuration</h3>
              <a href="#ai-providers" className="flex items-center space-x-3 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg">
                <Bot className="h-4 w-4" />
                <span>AI Providers</span>
              </a>
              <a href="#security" className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </a>
              <a href="#appearance" className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </a>
              <a href="#general" className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Settings className="h-4 w-4" />
                <span>General</span>
              </a>
            </div>

            <div className="space-y-1 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</h3>
              <a href="#profile" className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </a>
              <a href="#notifications" className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600">Configure your TestCaseTracker preferences and integrations</p>
              </div>
            </div>

            <Tabs defaultValue="ai-providers" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai-providers" className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>AI Providers</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>General</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai-providers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-6 w-6" />
                      <span>AI Provider Configuration</span>
                    </CardTitle>
                    <p className="text-gray-600">
                      Configure API keys for various AI providers to enable intelligent test case generation.
                      Free providers are marked with a green badge.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {providers.map((provider) => (
                        <Card key={provider.provider} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getProviderIcon(provider)}
                                <div>
                                  <CardTitle className="text-lg flex items-center space-x-2">
                                    <span>{provider.name}</span>
                                    {provider.isFree && (
                                      <Badge variant="outline" className="text-green-600 border-green-600">
                                        Free
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                </div>
                              </div>
                              {getProviderBadge(provider)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor={`${provider.provider}-key`} className="text-sm font-medium">
                                API Key
                                <span className="text-gray-500 ml-1">({provider.keyFormat})</span>
                              </Label>
                              <div className="flex space-x-2 mt-2">
                                <Input
                                  id={`${provider.provider}-key`}
                                  type="password"
                                  placeholder={`Enter ${provider.name} API key`}
                                  value={apiKeys[provider.provider] || ""}
                                  onChange={(e) => setApiKeys(prev => ({
                                    ...prev,
                                    [provider.provider]: e.target.value
                                  }))}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() => handleUpdateAPIKey(provider.provider)}
                                  disabled={updateAPIKeyMutation.isPending}
                                  size="sm"
                                  className="shrink-0"
                                >
                                  {updateAPIKeyMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Key className="h-4 w-4 mr-1" />
                                      Update
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                              <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">How to get your API key:</p>
                                <p>{getProviderInstructions(provider)}</p>
                              </div>
                            </div>

                            {provider.error && (
                              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <div className="text-sm text-red-700">
                                  <p className="font-medium mb-1">Configuration Error:</p>
                                  <p>{provider.error}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-6 w-6" />
                      <span>Security Settings</span>
                    </CardTitle>
                    <p className="text-gray-600">Manage your account security and privacy settings</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                          checked={userSettings.security.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingsUpdate('security', 'twoFactorAuth', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">Session Timeout (minutes)</Label>
                        <p className="text-sm text-gray-600">Automatically log out after period of inactivity</p>
                        <Select
                          value={userSettings.security.sessionTimeout.toString()}
                          onValueChange={(value) => handleSettingsUpdate('security', 'sessionTimeout', parseInt(value))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Login Notifications</Label>
                          <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                        </div>
                        <Switch
                          checked={userSettings.security.loginNotifications}
                          onCheckedChange={(checked) => handleSettingsUpdate('security', 'loginNotifications', checked)}
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <Button variant="outline" className="mr-2">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                        <Button variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset All Sessions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-6 w-6" />
                      <span>Appearance Settings</span>
                    </CardTitle>
                    <p className="text-gray-600">Customize how TestCaseTracker looks and feels</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Theme</Label>
                        <p className="text-sm text-gray-600">Choose your preferred theme</p>
                        <Select
                          value={userSettings.appearance.theme}
                          onValueChange={(value) => handleSettingsUpdate('appearance', 'theme', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">Language</Label>
                        <p className="text-sm text-gray-600">Select your preferred language</p>
                        <Select
                          value={userSettings.appearance.language}
                          onValueChange={(value) => handleSettingsUpdate('appearance', 'language', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">Font Size</Label>
                        <p className="text-sm text-gray-600">Adjust the interface font size</p>
                        <div className="w-48">
                          <Slider
                            value={[userSettings.appearance.fontSize]}
                            onValueChange={(value) => handleSettingsUpdate('appearance', 'fontSize', value[0])}
                            max={20}
                            min={10}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Small</span>
                            <span>{userSettings.appearance.fontSize}px</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Animations</Label>
                          <p className="text-sm text-gray-600">Enable smooth animations and transitions</p>
                        </div>
                        <Switch
                          checked={userSettings.appearance.animations}
                          onCheckedChange={(checked) => handleSettingsUpdate('appearance', 'animations', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-6 w-6" />
                      <span>General Settings</span>
                    </CardTitle>
                    <p className="text-gray-600">Configure general application preferences</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Timezone</Label>
                        <p className="text-sm text-gray-600">Set your preferred timezone</p>
                        <Select
                          value={userSettings.general.timezone}
                          onValueChange={(value) => handleSettingsUpdate('general', 'timezone', value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Asia/Kolkata">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">Date Format</Label>
                        <p className="text-sm text-gray-600">Choose how dates are displayed</p>
                        <Select
                          value={userSettings.general.dateFormat}
                          onValueChange={(value) => handleSettingsUpdate('general', 'dateFormat', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Auto-Save</Label>
                          <p className="text-sm text-gray-600">Automatically save changes as you work</p>
                        </div>
                        <Switch
                          checked={userSettings.general.autoSave}
                          onCheckedChange={(checked) => handleSettingsUpdate('general', 'autoSave', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">Default Project</Label>
                        <p className="text-sm text-gray-600">Set a default project for new test cases</p>
                        <Select
                          value={userSettings.general.defaultProject}
                          onValueChange={(value) => handleSettingsUpdate('general', 'defaultProject', value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select default project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No default project</SelectItem>
                            <SelectItem value="1">Current Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <p className="text-gray-600">Choose how you want to be notified</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.email}
                        onCheckedChange={(checked) => handleSettingsUpdate('notifications', 'email', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Browser Notifications</Label>
                        <p className="text-sm text-gray-600">Show notifications in your browser</p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.browser}
                        onCheckedChange={(checked) => handleSettingsUpdate('notifications', 'browser', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Sound Notifications</Label>
                        <p className="text-sm text-gray-600">Play sounds for important events</p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.sound}
                        onCheckedChange={(checked) => handleSettingsUpdate('notifications', 'sound', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
