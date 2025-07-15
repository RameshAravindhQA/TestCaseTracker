import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Plus, 
  Trash, 
  Copy, 
  Save, 
  FileJson, 
  Code, 
  Globe,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface ApiRequest {
  id?: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  params: { key: string; value: string; enabled: boolean }[];
  body: {
    type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
    content: string;
    formData: { key: string; value: string; type: 'text' | 'file'; enabled: boolean }[];
  };
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export default function ApiTestingPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ApiRequest>({
    name: "New Request",
    method: "GET",
    url: "",
    headers: [{ key: "", value: "", enabled: true }],
    params: [{ key: "", value: "", enabled: true }],
    body: {
      type: 'none',
      content: "",
      formData: [{ key: "", value: "", type: 'text', enabled: true }]
    }
  });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Sound effect
  const playSound = (type: 'success' | 'error') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.log("Sound not available");
    }
  };

  const addHeader = () => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "", enabled: true }]
    }));
  };

  const updateHeader = (index: number, field: string, value: string | boolean) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.map((header, i) => 
        i === index ? { ...header, [field]: value } : header
      )
    }));
  };

  const removeHeader = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const addParam = () => {
    setCurrentRequest(prev => ({
      ...prev,
      params: [...prev.params, { key: "", value: "", enabled: true }]
    }));
  };

  const updateParam = (index: number, field: string, value: string | boolean) => {
    setCurrentRequest(prev => ({
      ...prev,
      params: prev.params.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const removeParam = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      params: prev.params.filter((_, i) => i !== index)
    }));
  };

  const addFormDataField = () => {
    setCurrentRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: [...prev.body.formData, { key: "", value: "", type: 'text', enabled: true }]
      }
    }));
  };

  const updateFormDataField = (index: number, field: string, value: string | boolean) => {
    setCurrentRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.map((field, i) => 
          i === index ? { ...field, [field]: value } : field
        )
      }
    }));
  };

  const removeFormDataField = (index: number) => {
    setCurrentRequest(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.filter((_, i) => i !== index)
      }
    }));
  };

  const executeRequest = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Project Required",
        description: "Please select a project before making API requests",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Build URL with parameters
      const url = new URL(currentRequest.url);
      currentRequest.params.forEach(param => {
        if (param.enabled && param.key && param.value) {
          url.searchParams.append(param.key, param.value);
        }
      });

      // Build headers
      const headers: Record<string, string> = {};
      currentRequest.headers.forEach(header => {
        if (header.enabled && header.key && header.value) {
          headers[header.key] = header.value;
        }
      });

      // Build body
      let body: any = undefined;
      if (currentRequest.method !== 'GET' && currentRequest.body.type !== 'none') {
        switch (currentRequest.body.type) {
          case 'json':
            headers['Content-Type'] = 'application/json';
            body = currentRequest.body.content;
            break;
          case 'form-data':
            const formData = new FormData();
            currentRequest.body.formData.forEach(field => {
              if (field.enabled && field.key && field.value) {
                formData.append(field.key, field.value);
              }
            });
            body = formData;
            break;
          case 'x-www-form-urlencoded':
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            const params = new URLSearchParams();
            currentRequest.body.formData.forEach(field => {
              if (field.enabled && field.key && field.value) {
                params.append(field.key, field.value);
              }
            });
            body = params.toString();
            break;
          case 'raw':
            body = currentRequest.body.content;
            break;
        }
      }

      const fetchResponse = await fetch(url.toString(), {
        method: currentRequest.method,
        headers,
        body
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseData: any;
      const contentType = fetchResponse.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseData = await fetchResponse.json();
      } else {
        responseData = await fetchResponse.text();
      }

      const apiResponse: ApiResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        data: responseData,
        time: responseTime,
        size: JSON.stringify(responseData).length
      };

      setResponse(apiResponse);

      if (fetchResponse.ok) {
        playSound('success');
        toast({
          title: "Request Successful",
          description: `${fetchResponse.status} ${fetchResponse.statusText} - ${responseTime}ms`
        });
      } else {
        playSound('error');
        toast({
          title: "Request Failed",
          description: `${fetchResponse.status} ${fetchResponse.statusText}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      playSound('error');
      const errorResponse: ApiResponse = {
        status: 0,
        statusText: "Network Error",
        headers: {},
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        time: Date.now() - startTime,
        size: 0
      };
      setResponse(errorResponse);

      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600 bg-green-50";
    if (status >= 300 && status < 400) return "text-blue-600 bg-blue-50";
    if (status >= 400 && status < 500) return "text-orange-600 bg-orange-50";
    if (status >= 500) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />;
    if (status >= 400) return <XCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  API Testing
                </span>
              </h1>
              <p className="text-muted-foreground">Test and document your APIs with a Postman-like interface</p>
            </div>
          </div>

          {/* Project Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Project Selection</CardTitle>
              <CardDescription>Select a project to organize your API tests</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedProjectId?.toString()}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProjectId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request URL */}
                  <div className="flex gap-2">
                    <Select
                      value={currentRequest.method}
                      onValueChange={(value) => setCurrentRequest(prev => ({ ...prev, method: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                        <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter request URL"
                      value={currentRequest.url}
                      onChange={(e) => setCurrentRequest(prev => ({ ...prev, url: e.target.value }))}
                      className="flex-1"
                    />
                    <Button onClick={executeRequest} disabled={isLoading || !currentRequest.url}>
                      {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Send
                    </Button>
                  </div>

                  <Tabs defaultValue="params" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="params">Params</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="auth">Auth</TabsTrigger>
                    </TabsList>

                    <TabsContent value="params" className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Query Parameters</Label>
                        <Button size="sm" variant="outline" onClick={addParam}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {currentRequest.params.map((param, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updateParam(index, 'key', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateParam(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" variant="outline" onClick={() => removeParam(index)}>
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="headers" className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Request Headers</Label>
                        <Button size="sm" variant="outline" onClick={addHeader}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {currentRequest.headers.map((header, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Header"
                            value={header.key}
                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" variant="outline" onClick={() => removeHeader(index)}>
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="body" className="space-y-4">
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
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="form-data">Form Data</SelectItem>
                          <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                          <SelectItem value="raw">Raw</SelectItem>
                          <SelectItem value="binary">Binary</SelectItem>
                        </SelectContent>
                      </Select>

                      {currentRequest.body.type === 'json' && (
                        <Textarea
                          placeholder='{"key": "value"}'
                          value={currentRequest.body.content}
                          onChange={(e) => setCurrentRequest(prev => ({
                            ...prev,
                            body: { ...prev.body, content: e.target.value }
                          }))}
                          rows={8}
                        />
                      )}

                      {currentRequest.body.type === 'form-data' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Form Data</Label>
                            <Button size="sm" variant="outline" onClick={addFormDataField}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {currentRequest.body.formData.map((field, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder="Key"
                                value={field.key}
                                onChange={(e) => updateFormDataField(index, 'key', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Value"
                                value={field.value}
                                onChange={(e) => updateFormDataField(index, 'value', e.target.value)}
                                className="flex-1"
                              />
                              <Select
                                value={field.type}
                                onValueChange={(value: any) => updateFormDataField(index, 'type', value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="file">File</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="outline" onClick={() => removeFormDataField(index)}>
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentRequest.body.type === 'raw' && (
                        <Textarea
                          placeholder="Enter raw body content"
                          value={currentRequest.body.content}
                          onChange={(e) => setCurrentRequest(prev => ({
                            ...prev,
                            body: { ...prev.body, content: e.target.value }
                          }))}
                          rows={8}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="auth">
                      <div className="text-center py-8 text-muted-foreground">
                        Authentication options will be available in the next update
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Response Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    Response
                    {response && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge className={getStatusColor(response.status)}>
                          {getStatusIcon(response.status)}
                          {response.status} {response.statusText}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {response.time}ms
                        </Badge>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {response ? (
                    <Tabs defaultValue="body" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="body">Body</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                        <TabsTrigger value="cookies">Cookies</TabsTrigger>
                      </TabsList>

                      <TabsContent value="body">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="text-sm overflow-auto max-h-96">
                            {typeof response.data === 'string' 
                              ? response.data 
                              : JSON.stringify(response.data, null, 2)
                            }
                          </pre>
                        </div>
                      </TabsContent>

                      <TabsContent value="headers">
                        <div className="space-y-2">
                          {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{key}:</span>
                              <span className="text-sm text-gray-600">{value}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="cookies">
                        <div className="text-center py-8 text-muted-foreground">
                          Cookie information will be available in the next update
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Make a request to see the response</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedProjectId && (
            <Card className="text-center py-12">
              <CardContent>
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground mb-4">Choose a project to start testing your APIs</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}