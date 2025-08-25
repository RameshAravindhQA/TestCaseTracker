
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Key, Info, CheckCircle, XCircle, Loader2, Bot, Shield, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIProvider {
  provider: string;
  name: string;
  description: string;
  keyFormat: string;
  available: boolean;
  error?: string;
  isFree: boolean;
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

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
      // Clear the input field
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
    <div className="container mx-auto p-6 space-y-6">
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
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Security settings will be available in future updates.</p>
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
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Appearance settings will be available in future updates.</p>
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
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">General settings will be available in future updates.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
