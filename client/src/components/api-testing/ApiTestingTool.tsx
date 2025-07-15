
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Play, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Copy, 
  Settings,
  Plus,
  Minus,
  FileText,
  Folder,
  Globe
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  params: { key: string; value: string; enabled: boolean }[];
  body: {
    type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
    data: any;
  };
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiValue?: string;
  };
  tests: string;
  preRequestScript: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
  timestamp: Date;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  requests: ApiRequest[];
  variables: { key: string; value: string }[];
  created: Date;
}

interface Environment {
  id: string;
  name: string;
  variables: { key: string; value: string; enabled: boolean }[];
}

const ApiTestingTool: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [currentRequest, setCurrentRequest] = useState<ApiRequest>({
    id: '',
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: { type: 'none', data: '' },
    auth: { type: 'none' },
    tests: '',
    preRequestScript: ''
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [history, setHistory] = useState<ApiRequest[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedCollections = localStorage.getItem('apiTestingCollections');
    const savedEnvironments = localStorage.getItem('apiTestingEnvironments');
    const savedHistory = localStorage.getItem('apiTestingHistory');

    if (savedCollections) setCollections(JSON.parse(savedCollections));
    if (savedEnvironments) setEnvironments(JSON.parse(savedEnvironments));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  const saveCollections = (cols: Collection[]) => {
    setCollections(cols);
    localStorage.setItem('apiTestingCollections', JSON.stringify(cols));
  };

  const saveEnvironments = (envs: Environment[]) => {
    setEnvironments(envs);
    localStorage.setItem('apiTestingEnvironments', JSON.stringify(envs));
  };

  const saveHistory = (hist: ApiRequest[]) => {
    setHistory(hist);
    localStorage.setItem('apiTestingHistory', JSON.stringify(hist));
  };

  // Send API request
  const sendRequest = async () => {
    if (!currentRequest.url) {
      toast({
        title: "Invalid Request",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Process environment variables
      let processedUrl = currentRequest.url;
      let processedHeaders = { ...currentRequest.headers };

      // Replace environment variables
      const currentEnv = environments.find(env => env.id === selectedEnvironment);
      if (currentEnv) {
        currentEnv.variables.forEach(variable => {
          if (variable.enabled) {
            const placeholder = `{{${variable.key}}}`;
            processedUrl = processedUrl.replace(new RegExp(placeholder, 'g'), variable.value);
          }
        });
      }

      // Build request options
      const requestOptions: RequestInit = {
        method: currentRequest.method,
        headers: {}
      };

      // Add headers
      currentRequest.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          (requestOptions.headers as any)[header.key] = header.value;
        }
      });

      // Add authentication
      if (currentRequest.auth.type === 'bearer' && currentRequest.auth.token) {
        (requestOptions.headers as any)['Authorization'] = `Bearer ${currentRequest.auth.token}`;
      } else if (currentRequest.auth.type === 'basic' && currentRequest.auth.username && currentRequest.auth.password) {
        const credentials = btoa(`${currentRequest.auth.username}:${currentRequest.auth.password}`);
        (requestOptions.headers as any)['Authorization'] = `Basic ${credentials}`;
      } else if (currentRequest.auth.type === 'api-key' && currentRequest.auth.apiKey && currentRequest.auth.apiValue) {
        (requestOptions.headers as any)[currentRequest.auth.apiKey] = currentRequest.auth.apiValue;
      }

      // Add body for non-GET requests
      if (currentRequest.method !== 'GET' && currentRequest.body.type !== 'none') {
        if (currentRequest.body.type === 'raw') {
          requestOptions.body = currentRequest.body.data;
          (requestOptions.headers as any)['Content-Type'] = 'application/json';
        } else if (currentRequest.body.type === 'form-data') {
          const formData = new FormData();
          Object.entries(currentRequest.body.data || {}).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          requestOptions.body = formData;
        } else if (currentRequest.body.type === 'x-www-form-urlencoded') {
          const params = new URLSearchParams();
          Object.entries(currentRequest.body.data || {}).forEach(([key, value]) => {
            params.append(key, value as string);
          });
          requestOptions.body = params.toString();
          (requestOptions.headers as any)['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      // Add query parameters
      const url = new URL(processedUrl);
      currentRequest.params.forEach(param => {
        if (param.enabled && param.key) {
          url.searchParams.append(param.key, param.value);
        }
      });

      // Make the request
      const response = await fetch(url.toString(), requestOptions);
      const endTime = Date.now();
      
      // Get response data
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Create response object
      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
        timestamp: new Date()
      };

      setResponse(apiResponse);

      // Add to history
      const requestWithId = { ...currentRequest, id: Date.now().toString() };
      saveHistory([requestWithId, ...history.slice(0, 49)]); // Keep last 50 requests

      toast({
        title: "Request Completed",
        description: `${response.status} ${response.statusText} - ${apiResponse.time}ms`,
      });

    } catch (error) {
      console.error('API request error:', error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add header/param row
  const addHeaderRow = () => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', enabled: true }]
    }));
  };

  const addParamRow = () => {
    setCurrentRequest(prev => ({
      ...prev,
      params: [...prev.params, { key: '', value: '', enabled: true }]
    }));
  };

  // Remove header/param row
  const removeHeaderRow = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const removeParamRow = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      params: prev.params.filter((_, i) => i !== index)
    }));
  };

  // Save request to collection
  const saveToCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    const requestWithId = { ...currentRequest, id: Date.now().toString() };
    const updatedCollection = {
      ...collection,
      requests: [...collection.requests, requestWithId]
    };

    const updatedCollections = collections.map(c => 
      c.id === collectionId ? updatedCollection : c
    );

    saveCollections(updatedCollections);
    toast({
      title: "Request Saved",
      description: `Request saved to collection "${collection.name}".`,
    });
  };

  // Create new collection
  const createCollection = (name: string, description: string) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      description,
      requests: [],
      variables: [],
      created: new Date()
    };

    saveCollections([...collections, newCollection]);
    toast({
      title: "Collection Created",
      description: `Collection "${name}" created successfully.`,
    });
  };

  // Export collection as Swagger/OpenAPI
  const exportSwagger = (collection: Collection) => {
    const swagger = {
      openapi: "3.0.0",
      info: {
        title: collection.name,
        description: collection.description,
        version: "1.0.0"
      },
      paths: {} as any
    };

    collection.requests.forEach(request => {
      try {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method.toLowerCase();

        if (!swagger.paths[path]) {
          swagger.paths[path] = {};
        }

        swagger.paths[path][method] = {
          summary: request.name,
          parameters: request.params.map(param => ({
            name: param.key,
            in: "query",
            required: param.enabled,
            schema: { type: "string" }
          })),
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: { type: "object" }
                }
              }
            }
          }
        };

        if (request.body.type !== 'none') {
          swagger.paths[path][method].requestBody = {
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          };
        }
      } catch (error) {
        console.error('Error processing request for Swagger:', error);
      }
    });

    const blob = new Blob([JSON.stringify(swagger, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/\s+/g, '-')}-swagger.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Swagger Exported",
      description: `Swagger documentation for "${collection.name}" has been downloaded.`,
    });
  };

  // Copy response
  const copyResponse = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    toast({
      title: "Response Copied",
      description: "Response data copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Testing Tool</h1>
        <div className="flex gap-2">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Environment</SelectItem>
              {environments.map(env => (
                <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Collections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {collections.map(collection => (
              <div key={collection.id} className="p-2 border rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{collection.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportSwagger(collection)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {collection.requests.map(req => (
                    <button
                      key={req.id}
                      onClick={() => setCurrentRequest(req)}
                      className="w-full text-left text-sm p-1 hover:bg-gray-100 rounded"
                    >
                      <Badge variant="outline" className="mr-2">
                        {req.method}
                      </Badge>
                      {req.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Request Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Builder</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* Open save modal */}}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={sendRequest}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="request" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="auth">Authorization</TabsTrigger>
                  <TabsTrigger value="scripts">Scripts</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="space-y-4">
                  {/* URL and Method */}
                  <div className="flex gap-2">
                    <Select
                      value={currentRequest.method}
                      onValueChange={(value: any) => setCurrentRequest(prev => ({ ...prev, method: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                        <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={currentRequest.url}
                      onChange={(e) => setCurrentRequest(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="Enter request URL"
                      className="flex-1"
                    />
                  </div>

                  <Tabs defaultValue="params" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="params">Params</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                      <TabsTrigger value="body">Body</TabsTrigger>
                    </TabsList>

                    {/* Parameters */}
                    <TabsContent value="params">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Query Parameters</Label>
                          <Button size="sm" variant="outline" onClick={addParamRow}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {currentRequest.params.map((param, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Switch
                              checked={param.enabled}
                              onCheckedChange={(checked) => {
                                const updated = [...currentRequest.params];
                                updated[index].enabled = checked;
                                setCurrentRequest(prev => ({ ...prev, params: updated }));
                              }}
                            />
                            <Input
                              placeholder="Key"
                              value={param.key}
                              onChange={(e) => {
                                const updated = [...currentRequest.params];
                                updated[index].key = e.target.value;
                                setCurrentRequest(prev => ({ ...prev, params: updated }));
                              }}
                            />
                            <Input
                              placeholder="Value"
                              value={param.value}
                              onChange={(e) => {
                                const updated = [...currentRequest.params];
                                updated[index].value = e.target.value;
                                setCurrentRequest(prev => ({ ...prev, params: updated }));
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeParamRow(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Headers */}
                    <TabsContent value="headers">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Headers</Label>
                          <Button size="sm" variant="outline" onClick={addHeaderRow}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {currentRequest.headers.map((header, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Switch
                              checked={header.enabled}
                              onCheckedChange={(checked) => {
                                const updated = [...currentRequest.headers];
                                updated[index].enabled = checked;
                                setCurrentRequest(prev => ({ ...prev, headers: updated }));
                              }}
                            />
                            <Input
                              placeholder="Key"
                              value={header.key}
                              onChange={(e) => {
                                const updated = [...currentRequest.headers];
                                updated[index].key = e.target.value;
                                setCurrentRequest(prev => ({ ...prev, headers: updated }));
                              }}
                            />
                            <Input
                              placeholder="Value"
                              value={header.value}
                              onChange={(e) => {
                                const updated = [...currentRequest.headers];
                                updated[index].value = e.target.value;
                                setCurrentRequest(prev => ({ ...prev, headers: updated }));
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeHeaderRow(index)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Body */}
                    <TabsContent value="body">
                      <div className="space-y-4">
                        <Select
                          value={currentRequest.body.type}
                          onValueChange={(value: any) => setCurrentRequest(prev => ({ 
                            ...prev, 
                            body: { ...prev.body, type: value } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="raw">Raw (JSON)</SelectItem>
                            <SelectItem value="form-data">Form Data</SelectItem>
                            <SelectItem value="x-www-form-urlencoded">URL Encoded</SelectItem>
                          </SelectContent>
                        </Select>

                        {currentRequest.body.type === 'raw' && (
                          <Textarea
                            value={currentRequest.body.data || ''}
                            onChange={(e) => setCurrentRequest(prev => ({ 
                              ...prev, 
                              body: { ...prev.body, data: e.target.value } 
                            }))}
                            placeholder="Enter JSON data"
                            rows={10}
                          />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Authorization */}
                <TabsContent value="auth" className="space-y-4">
                  <Select
                    value={currentRequest.auth.type}
                    onValueChange={(value: any) => setCurrentRequest(prev => ({ 
                      ...prev, 
                      auth: { ...prev.auth, type: value } 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api-key">API Key</SelectItem>
                    </SelectContent>
                  </Select>

                  {currentRequest.auth.type === 'bearer' && (
                    <Input
                      placeholder="Token"
                      value={currentRequest.auth.token || ''}
                      onChange={(e) => setCurrentRequest(prev => ({ 
                        ...prev, 
                        auth: { ...prev.auth, token: e.target.value } 
                      }))}
                    />
                  )}

                  {currentRequest.auth.type === 'basic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Username"
                        value={currentRequest.auth.username || ''}
                        onChange={(e) => setCurrentRequest(prev => ({ 
                          ...prev, 
                          auth: { ...prev.auth, username: e.target.value } 
                        }))}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={currentRequest.auth.password || ''}
                        onChange={(e) => setCurrentRequest(prev => ({ 
                          ...prev, 
                          auth: { ...prev.auth, password: e.target.value } 
                        }))}
                      />
                    </div>
                  )}

                  {currentRequest.auth.type === 'api-key' && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Key"
                        value={currentRequest.auth.apiKey || ''}
                        onChange={(e) => setCurrentRequest(prev => ({ 
                          ...prev, 
                          auth: { ...prev.auth, apiKey: e.target.value } 
                        }))}
                      />
                      <Input
                        placeholder="Value"
                        value={currentRequest.auth.apiValue || ''}
                        onChange={(e) => setCurrentRequest(prev => ({ 
                          ...prev, 
                          auth: { ...prev.auth, apiValue: e.target.value } 
                        }))}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Scripts */}
                <TabsContent value="scripts" className="space-y-4">
                  <div>
                    <Label>Pre-request Script</Label>
                    <Textarea
                      value={currentRequest.preRequestScript}
                      onChange={(e) => setCurrentRequest(prev => ({ ...prev, preRequestScript: e.target.value }))}
                      placeholder="JavaScript code to run before request"
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>Tests</Label>
                    <Textarea
                      value={currentRequest.tests}
                      onChange={(e) => setCurrentRequest(prev => ({ ...prev, tests: e.target.value }))}
                      placeholder="JavaScript code to test response"
                      rows={6}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Response */}
          {response && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Response
                    <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                      {response.status} {response.statusText}
                    </Badge>
                    <span className="text-sm font-normal text-gray-600">
                      {response.time}ms | {(response.size / 1024).toFixed(2)}KB
                    </span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={copyResponse}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="body">
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="headers">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-4 text-sm">
                          <span className="font-medium min-w-32">{key}:</span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTestingTool;
