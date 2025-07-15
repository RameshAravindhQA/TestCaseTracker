import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  ExternalLink, 
  RefreshCw, 
  Home, 
  ArrowLeft, 
  ArrowRight, 
  Globe,
  FileSpreadsheet,
  FileText,
  Presentation,
  Calendar,
  Mail,
  Drive,
  Monitor,
  Maximize,
  Settings
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';

interface GoogleService {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  description: string;
}

const TestSheetsPage: React.FC = () => {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState('https://sheets.google.com');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://sheets.google.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const googleServices: GoogleService[] = [
    {
      id: 'sheets',
      name: 'Google Sheets',
      url: 'https://sheets.google.com',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      description: 'Create and edit spreadsheets'
    },
    {
      id: 'docs',
      name: 'Google Docs',
      url: 'https://docs.google.com',
      icon: <FileText className="w-5 h-5" />,
      description: 'Create and edit documents'
    },
    {
      id: 'slides',
      name: 'Google Slides',
      url: 'https://slides.google.com',
      icon: <Presentation className="w-5 h-5" />,
      description: 'Create and edit presentations'
    },
    {
      id: 'drive',
      name: 'Google Drive',
      url: 'https://drive.google.com',
      icon: <Drive className="w-5 h-5" />,
      description: 'Access your files and folders'
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      url: 'https://calendar.google.com',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Manage your schedule'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      url: 'https://mail.google.com',
      icon: <Mail className="w-5 h-5" />,
      description: 'Access your email'
    }
  ];

  const [selectedService, setSelectedService] = useState<GoogleService>(googleServices[0]);

  // Navigate to URL
  const navigateToUrl = (url: string) => {
    if (iframeRef.current) {
      setIsLoading(true);
      setCurrentUrl(url);

      // Add to history if it's a new URL
      if (url !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(url);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }

      iframeRef.current.src = url;

      // Handle iframe load
      const handleLoad = () => {
        setIsLoading(false);
        toast({
          title: "Page Loaded",
          description: `Successfully loaded ${url}`,
        });
      };

      iframeRef.current.addEventListener('load', handleLoad, { once: true });
    }
  };

  // Navigate to Google service
  const navigateToService = (service: GoogleService) => {
    setSelectedService(service);
    navigateToUrl(service.url);
  };

  // Browser navigation functions
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigateToUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigateToUrl(history[newIndex]);
    }
  };

  const goHome = () => {
    navigateToUrl(selectedService.url);
  };

  const refresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = currentUrl;
    }
  };

  // Handle manual URL input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get('url') as string;

    if (url) {
      // Ensure URL has protocol
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      navigateToUrl(finalUrl);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Quick links for common Google Workspace activities
  const quickLinks = [
    {
      name: 'Create New Sheet',
      url: 'https://sheets.google.com/create',
      description: 'Start with a blank spreadsheet'
    },
    {
      name: 'Create New Doc',
      url: 'https://docs.google.com/document/create',
      description: 'Start with a blank document'
    },
    {
      name: 'My Drive',
      url: 'https://drive.google.com/drive/my-drive',
      description: 'Access your files'
    },
    {
      name: 'Shared with Me',
      url: 'https://drive.google.com/drive/shared-with-me',
      description: 'View shared files'
    },
    {
      name: 'Recent Files',
      url: 'https://drive.google.com/drive/recent',
      description: 'Recently accessed files'
    },
    {
      name: 'Forms',
      url: 'https://forms.google.com',
      description: 'Create and manage forms'
    }
  ];

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Minimal header for fullscreen */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={goBack} disabled={historyIndex === 0}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={goForward} disabled={historyIndex === history.length - 1}>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4" />
              <span className="truncate">{currentUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(currentUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Fullscreen iframe */}
        <div className="relative" style={{ height: 'calc(100vh - 60px)' }}>
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="Google Workspace Browser - Fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              toast({
                title: "Loading Error",
                description: "Failed to load the requested page.",
                variant: "destructive"
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Google Workspace Integration</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Direct access to Google services
          </Badge>
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            <Maximize className="w-4 h-4 mr-1" />
            Fullscreen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Services and Quick Links */}
        <div className="lg:col-span-1 space-y-4">
          {/* Google Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Google Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {googleServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => navigateToService(service)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedService.id === service.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {service.icon}
                    <div>
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-gray-600">{service.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => navigateToUrl(link.url)}
                  className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-all group"
                >
                  <div className="font-medium text-sm group-hover:text-blue-700">{link.name}</div>
                  <div className="text-xs text-gray-600">{link.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Browser Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Browser Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <div className="font-medium">Current Service:</div>
                <div className="text-gray-600">{selectedService.name}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">History:</div>
                <div className="text-gray-600">{history.length} pages</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Status:</div>
                <div className={`text-${isLoading ? 'orange' : 'green'}-600`}>
                  {isLoading ? 'Loading...' : 'Ready'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Browser Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Browser Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Navigation Controls */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goBack}
                    disabled={historyIndex === 0}
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goForward}
                    disabled={historyIndex === history.length - 1}
                    title="Go Forward"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refresh}
                    disabled={isLoading}
                    title="Refresh Page"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goHome}
                    title="Go to Service Home"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                </div>

                {/* URL Input */}
                <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="url"
                      defaultValue={currentUrl}
                      placeholder="Enter URL or search..."
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" size="sm">
                    Go
                  </Button>
                </form>

                {/* External Link and Fullscreen */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(currentUrl, '_blank')}
                    title="Open in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                    title="Enter Fullscreen"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browser Frame */}
          <Card className="relative">
            <CardContent className="p-0">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </div>
              )}

              <div className="relative overflow-hidden rounded-lg border">
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full border-0"
                  style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}
                  title="Google Workspace Browser"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads allow-modals"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    toast({
                      title: "Loading Error",
                      description: "Failed to load the requested page.",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tips and Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Navigation</h4>
                  <ul className="space-y-1">
                    <li>• Use browser controls for navigation</li>
                    <li>• Quick access via service buttons</li>
                    <li>• History tracking available</li>
                    <li>• Fullscreen mode for better focus</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-1">
                    <li>• Direct Google account access</li>
                    <li>• Full workspace functionality</li>
                    <li>• Real-time collaboration</li>
                    <li>• Integrated with TestCaseTracker</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestSheetsPage;