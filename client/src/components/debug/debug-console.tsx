import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Wifi, 
  WifiOff, 
  User, 
  Database, 
  Clock,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  MessageCircle,
  FileSpreadsheet,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  data?: any;
}

export function DebugConsole() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [activeTab, setActiveTab] = useState('logs');

  // Monitor connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    };

    updateConnectionStatus();
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  // Capture console logs
  useEffect(() => {
    if (!isVisible) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    const createLogEntry = (level: DebugLog['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Extract module from message if it has emoji patterns
      let module = 'Console';
      if (message.includes('🔄 MESSENGER') || message.includes('MESSENGER')) module = 'Messenger';
      else if (message.includes('🔄 SPREADSHEET') || message.includes('SPREADSHEET')) module = 'Spreadsheet';
      else if (message.includes('🔄 AUTH') || message.includes('AUTH')) module = 'Auth';
      else if (message.includes('🔒 PROTECTED')) module = 'Route Guard';

      const logEntry: DebugLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level,
        module,
        message,
        data: args.length === 1 && typeof args[0] === 'object' ? args[0] : args
      };

      setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      createLogEntry('info', args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      createLogEntry('warn', args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      createLogEntry('error', args);
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      createLogEntry('debug', args);
    };

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, [isVisible]);

  const addLog = (level: DebugLog['level'], module: string, message: string, data?: any) => {
    const logEntry: DebugLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      module,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), logEntry]);
  };

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.module}] ${log.message}${
        log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''
      }`
    ).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySystemInfo = () => {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      connectionStatus,
      auth: {
        user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
        authLoading,
        isAuthenticated
      },
      storage: {
        localStorage: {
          auth: localStorage.getItem('isAuthenticated'),
          user: localStorage.getItem('user') ? 'present' : 'none',
          messenger_chats: localStorage.getItem('messenger_chats') ? 'present' : 'none',
          messenger_selectedChat: localStorage.getItem('messenger_selectedChat') ? 'present' : 'none',
          spreadsheets: localStorage.getItem('spreadsheets') ? 'present' : 'none'
        },
        sessionStorage: Object.keys(sessionStorage)
      },
      browser: {
        cookiesEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      moduleDebugData: {
        messenger: (window as any).messengerDebug,
        spreadsheet: (window as any).spreadsheetDebug
      },
      recentLogs: logs.slice(-10)
    };

    navigator.clipboard.writeText(JSON.stringify(systemInfo, null, 2)).then(() => {
      addLog('info', 'Debug', 'System information copied to clipboard');
    });
  };

  const runAuthDiagnostics = () => {
    addLog('info', 'Diagnostics', 'Running authentication diagnostics...');

    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');

    addLog('info', 'Diagnostics', `Stored auth: ${storedAuth}`);
    addLog('info', 'Diagnostics', `Stored user: ${storedUser ? 'present' : 'none'}`);
    addLog('info', 'Diagnostics', `Current user: ${user ? user.email : 'none'}`);
    addLog('info', 'Diagnostics', `Auth loading: ${authLoading}`);
    addLog('info', 'Diagnostics', `Is authenticated: ${isAuthenticated}`);

    if (storedAuth === 'true' && storedUser && !user) {
      addLog('warn', 'Diagnostics', 'Auth state mismatch detected - stored auth but no user context');
    }
  };

  const runModuleDiagnostics = () => {
    addLog('info', 'Diagnostics', 'Running module diagnostics...');

    const messengerDebug = (window as any).messengerDebug;
    const spreadsheetDebug = (window as any).spreadsheetDebug;

    if (messengerDebug) {
      addLog('info', 'Messenger', `Last debug: ${messengerDebug.timestamp}`);
      addLog('info', 'Messenger', `Chats: ${messengerDebug.data.chatsCount}, Users: ${messengerDebug.data.usersCount}`);
      addLog('info', 'Messenger', `WS State: ${messengerDebug.connectivity.wsStateText}`);
    } else {
      addLog('warn', 'Messenger', 'No debug data available');
    }

    if (spreadsheetDebug) {
      addLog('info', 'Spreadsheet', `Last debug: ${spreadsheetDebug.timestamp}`);
      addLog('info', 'Spreadsheet', `Spreadsheets: ${spreadsheetDebug.data.spreadsheetsCount}`);
      addLog('info', 'Spreadsheet', `Selected project: ${spreadsheetDebug.data.selectedProject}`);
    } else {
      addLog('warn', 'Spreadsheet', 'No debug data available');
    }
  };

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'debug': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Messenger': return <MessageCircle className="h-3 w-3" />;
      case 'Spreadsheet': return <FileSpreadsheet className="h-3 w-3" />;
      case 'Auth': return <Shield className="h-3 w-3" />;
      case 'Route Guard': return <Shield className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Console
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[500px] max-h-[600px] z-50 shadow-2xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Console
              <Badge variant="outline" className="text-xs">
                {logs.length} logs
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={connectionStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
                {connectionStatus === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </Badge>
              <Badge variant={isAuthenticated ? 'default' : 'destructive'} className="text-xs">
                <User className="h-3 w-3" />
              </Badge>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="mt-2">
              <div className="flex gap-1 mb-2">
                <Button onClick={clearLogs} variant="outline" size="sm" className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                <Button onClick={exportLogs} variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No debug logs yet
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className={`p-2 rounded text-xs border ${getLevelColor(log.level)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {getModuleIcon(log.module)}
                            <Badge variant="outline" className="text-xs">
                              {log.module}
                            </Badge>
                          </div>
                          <span className="text-xs opacity-70">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-mono text-xs break-words">
                          {log.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="system" className="mt-2">
              <ScrollArea className="h-80">
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Authentication</strong>
                    <div>User: {user ? user.email : 'None'}</div>
                    <div>Loading: {authLoading ? 'Yes' : 'No'}</div>
                    <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
                  </div>

                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Storage</strong>
                    <div>Auth Token: {localStorage.getItem('isAuthenticated') || 'None'}</div>
                    <div>User Data: {localStorage.getItem('user') ? 'Present' : 'None'}</div>
                    <div>Messenger Data: {localStorage.getItem('messenger_chats') ? 'Present' : 'None'}</div>
                  </div>

                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Browser</strong>
                    <div>URL: {window.location.pathname}</div>
                    <div>Connection: {connectionStatus}</div>
                    <div>Platform: {navigator.platform}</div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tools" className="mt-2">
              <div className="space-y-2">
                <Button onClick={copySystemInfo} variant="outline" size="sm" className="w-full text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy System Info
                </Button>
                <Button onClick={runAuthDiagnostics} variant="outline" size="sm" className="w-full text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Auth Diagnostics
                </Button>
                <Button onClick={runModuleDiagnostics} variant="outline" size="sm" className="w-full text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Module Diagnostics
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Force Refresh
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}