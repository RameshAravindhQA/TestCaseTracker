
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload, 
  Eye, 
  Code, 
  FileText, 
  Monitor,
  Settings,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface TestAction {
  id: string;
  type: 'click' | 'type' | 'navigate' | 'wait' | 'assertion';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  timestamp: number;
  screenshot?: string;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  url: string;
  actions: TestAction[];
  created: Date;
  lastRun?: Date;
  status?: 'passed' | 'failed' | 'running';
  duration?: number;
}

interface TestReport {
  id: string;
  testCaseId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'passed' | 'failed';
  steps: {
    action: TestAction;
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
    screenshot?: string;
    duration: number;
  }[];
  totalDuration: number;
  screenshots: string[];
}

const PlaywrightAutomation: React.FC = () => {
  const { toast } = useToast();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [recordedActions, setRecordedActions] = useState<TestAction[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null);
  
  // Recording configuration
  const [recordingConfig, setRecordingConfig] = useState({
    url: 'https://example.com',
    browserType: 'chromium',
    headless: false,
    deviceType: 'desktop',
    viewport: { width: 1280, height: 720 },
    enableScreenshots: true,
    enableVideoRecording: false
  });

  // New test case form
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    description: '',
    url: ''
  });

  const browserIframeRef = useRef<HTMLIFrameElement>(null);
  const recordingSessionRef = useRef<string | null>(null);

  // Load test cases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('playwrightTestCases');
    if (saved) {
      setTestCases(JSON.parse(saved));
    }
  }, []);

  // Save test cases to localStorage
  const saveTestCases = (cases: TestCase[]) => {
    setTestCases(cases);
    localStorage.setItem('playwrightTestCases', JSON.stringify(cases));
  };

  // Start recording session
  const startRecording = async () => {
    if (!recordingConfig.url) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL to start recording.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRecording(true);
      setRecordedActions([]);
      
      const response = await fetch('/api/playwright/start-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordingConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to start recording session');
      }

      const { sessionId, browserUrl } = await response.json();
      recordingSessionRef.current = sessionId;

      // Load the browser in iframe for inspection
      if (browserIframeRef.current) {
        browserIframeRef.current.src = browserUrl;
      }

      // Start listening for recorded actions
      const eventSource = new EventSource(`/api/playwright/recording-events/${sessionId}`);
      
      eventSource.onmessage = (event) => {
        const action: TestAction = JSON.parse(event.data);
        setRecordedActions(prev => [...prev, action]);
      };

      eventSource.onerror = () => {
        console.error('Recording event stream error');
        eventSource.close();
      };

      toast({
        title: "Recording Started",
        description: "Browser automation recording is now active. Interact with the page to record actions.",
      });

    } catch (error) {
      console.error('Recording start error:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording session.",
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };

  // Stop recording session
  const stopRecording = async () => {
    if (!recordingSessionRef.current) return;

    try {
      await fetch(`/api/playwright/stop-recording/${recordingSessionRef.current}`, {
        method: 'POST'
      });

      setIsRecording(false);
      recordingSessionRef.current = null;

      toast({
        title: "Recording Stopped",
        description: `Recorded ${recordedActions.length} actions. You can now save this as a test case.`,
      });

    } catch (error) {
      console.error('Recording stop error:', error);
    }
  };

  // Save recorded actions as test case
  const saveTestCase = () => {
    if (!newTestCase.name || recordedActions.length === 0) {
      toast({
        title: "Invalid Test Case",
        description: "Please provide a name and record some actions.",
        variant: "destructive"
      });
      return;
    }

    const testCase: TestCase = {
      id: Date.now().toString(),
      name: newTestCase.name,
      description: newTestCase.description,
      url: recordingConfig.url,
      actions: recordedActions,
      created: new Date()
    };

    saveTestCases([...testCases, testCase]);
    setNewTestCase({ name: '', description: '', url: '' });
    setRecordedActions([]);

    toast({
      title: "Test Case Saved",
      description: `Test case "${testCase.name}" has been saved successfully.`,
    });
  };

  // Run test case
  const runTestCase = async (testCase: TestCase) => {
    setIsRunning(true);
    setSelectedTestCase(testCase);

    try {
      const response = await fetch('/api/playwright/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCase,
          config: {
            ...recordingConfig,
            enableScreenshots: true,
            enableVideoRecording: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run test case');
      }

      const { reportId } = await response.json();

      // Monitor test execution
      const eventSource = new EventSource(`/api/playwright/test-progress/${reportId}`);
      
      eventSource.onmessage = (event) => {
        const update = JSON.parse(event.data);
        
        if (update.type === 'progress') {
          setCurrentReport(update.report);
        } else if (update.type === 'completed') {
          setCurrentReport(update.report);
          setReports(prev => [...prev, update.report]);
          setIsRunning(false);
          eventSource.close();

          toast({
            title: "Test Completed",
            description: `Test case completed with status: ${update.report.status}`,
            variant: update.report.status === 'passed' ? 'default' : 'destructive'
          });
        }
      };

      eventSource.onerror = () => {
        console.error('Test execution event stream error');
        eventSource.close();
        setIsRunning(false);
      };

    } catch (error) {
      console.error('Test execution error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to execute test case.",
        variant: "destructive"
      });
      setIsRunning(false);
    }
  };

  // Export test case
  const exportTestCase = (testCase: TestCase) => {
    const playwrightCode = generatePlaywrightCode(testCase);
    const blob = new Blob([playwrightCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testCase.name.replace(/\s+/g, '-')}.spec.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Playwright code
  const generatePlaywrightCode = (testCase: TestCase): string => {
    let code = `const { test, expect } = require('@playwright/test');

test('${testCase.name}', async ({ page }) => {
  // Navigate to the page
  await page.goto('${testCase.url}');
  
`;

    testCase.actions.forEach((action, index) => {
      switch (action.type) {
        case 'click':
          code += `  // Step ${index + 1}: Click on ${action.selector}\n`;
          code += `  await page.click('${action.selector}');\n\n`;
          break;
        case 'type':
          code += `  // Step ${index + 1}: Type "${action.value}" into ${action.selector}\n`;
          code += `  await page.fill('${action.selector}', '${action.value}');\n\n`;
          break;
        case 'navigate':
          code += `  // Step ${index + 1}: Navigate to ${action.url}\n`;
          code += `  await page.goto('${action.url}');\n\n`;
          break;
        case 'wait':
          code += `  // Step ${index + 1}: Wait for ${action.timeout}ms\n`;
          code += `  await page.waitForTimeout(${action.timeout});\n\n`;
          break;
        case 'assertion':
          code += `  // Step ${index + 1}: Assert element is visible\n`;
          code += `  await expect(page.locator('${action.selector}')).toBeVisible();\n\n`;
          break;
      }
    });

    code += `});`;
    return code;
  };

  // Delete test case
  const deleteTestCase = (id: string) => {
    const updated = testCases.filter(tc => tc.id !== id);
    saveTestCases(updated);
    if (selectedTestCase?.id === id) {
      setSelectedTestCase(null);
    }
    toast({
      title: "Test Case Deleted",
      description: "Test case has been removed successfully.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test Automation with Playwright</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/api/playwright/docs', '_blank')}>
            <FileText className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recorder" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recorder">Recorder</TabsTrigger>
          <TabsTrigger value="testcases">Test Cases</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Recording Tab */}
        <TabsContent value="recorder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recording Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Recording Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target URL</Label>
                  <Input
                    value={recordingConfig.url}
                    onChange={(e) => setRecordingConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    disabled={isRecording}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Browser</Label>
                    <Select
                      value={recordingConfig.browserType}
                      onValueChange={(value) => setRecordingConfig(prev => ({ ...prev, browserType: value }))}
                      disabled={isRecording}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chromium">Chromium</SelectItem>
                        <SelectItem value="firefox">Firefox</SelectItem>
                        <SelectItem value="webkit">WebKit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Device Type</Label>
                    <Select
                      value={recordingConfig.deviceType}
                      onValueChange={(value) => setRecordingConfig(prev => ({ ...prev, deviceType: value }))}
                      disabled={isRecording}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Headless Mode</Label>
                  <Switch
                    checked={recordingConfig.headless}
                    onCheckedChange={(checked) => setRecordingConfig(prev => ({ ...prev, headless: checked }))}
                    disabled={isRecording}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable Screenshots</Label>
                  <Switch
                    checked={recordingConfig.enableScreenshots}
                    onCheckedChange={(checked) => setRecordingConfig(prev => ({ ...prev, enableScreenshots: checked }))}
                    disabled={isRecording}
                  />
                </div>

                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button onClick={startRecording} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="destructive" className="flex-1">
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recorded Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recorded Actions ({recordedActions.length})</span>
                  {isRecording && <Badge variant="destructive">Recording</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {recordedActions.map((action, index) => (
                    <div key={action.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">
                        {index + 1}. {action.type.toUpperCase()}
                      </div>
                      <div className="text-gray-600">
                        {action.selector && `Selector: ${action.selector}`}
                        {action.value && ` | Value: ${action.value}`}
                        {action.url && ` | URL: ${action.url}`}
                      </div>
                    </div>
                  ))}
                </div>

                {recordedActions.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Test Case Name</Label>
                      <Input
                        value={newTestCase.name}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter test case name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={newTestCase.description}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter test case description"
                      />
                    </div>
                    <Button onClick={saveTestCase} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Test Case
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Browser Inspector */}
          {isRecording && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Browser Inspector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                  <iframe
                    ref={browserIframeRef}
                    className="w-full h-full"
                    title="Browser Inspector"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Cases Tab */}
        <TabsContent value="testcases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {testCases.map((testCase) => (
                  <div key={testCase.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{testCase.name}</h3>
                        <p className="text-sm text-gray-600">{testCase.description}</p>
                        <p className="text-xs text-gray-500">
                          {testCase.actions.length} actions | Created: {testCase.created.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => runTestCase(testCase)}
                          disabled={isRunning}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportTestCase(testCase)}
                        >
                          <Code className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTestCase(testCase.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {testCases.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No test cases created yet. Start recording to create your first test case.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution" className="space-y-6">
          {currentReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                  Test Execution - {selectedTestCase?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={currentReport.status === 'passed' ? 'default' : currentReport.status === 'failed' ? 'destructive' : 'secondary'}>
                    {currentReport.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Duration: {currentReport.totalDuration}ms
                  </span>
                </div>

                {isRunning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentReport.steps.length} / {selectedTestCase?.actions.length || 0}</span>
                    </div>
                    <Progress value={(currentReport.steps.length / (selectedTestCase?.actions.length || 1)) * 100} />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Execution Steps</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {currentReport.steps.map((step, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Step {index + 1}: {step.action.type.toUpperCase()}
                          </span>
                          <Badge variant={step.status === 'passed' ? 'default' : step.status === 'failed' ? 'destructive' : 'secondary'}>
                            {step.status}
                          </Badge>
                        </div>
                        {step.error && (
                          <div className="text-red-600 mt-1">{step.error}</div>
                        )}
                        <div className="text-gray-600 mt-1">
                          Duration: {step.duration}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Test Report #{report.id}</h3>
                        <p className="text-sm text-gray-600">
                          Started: {report.startTime.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration: {report.totalDuration}ms
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={report.status === 'passed' ? 'default' : 'destructive'}>
                          {report.status.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.steps.filter(s => s.status === 'passed').length} / {report.steps.length} steps passed
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No test reports available. Run some test cases to see reports here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlaywrightAutomation;
