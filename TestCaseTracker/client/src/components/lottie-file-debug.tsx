
import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LottieTestResult {
  file: string;
  status: 'LOADING' | 'SUCCESS' | 'HTTP_ERROR' | 'HTML_ERROR' | 'FORMAT_ERROR' | 'PARSE_ERROR' | 'FETCH_ERROR' | 'VALID_LOTTIE';
  data: any;
  error?: string;
  httpStatus?: number;
  details?: {
    version?: string;
    layers?: number;
    frameRate?: number;
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface LottieFileDebugProps {
  onTestResults?: (results: LottieTestResult[]) => void;
}

export const LottieFileDebug: React.FC<LottieFileDebugProps> = ({ onTestResults }) => {
  const [results, setResults] = useState<LottieTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAnimations, setPlayingAnimations] = useState<Set<string>>(new Set());

  const testFiles = [
    '/lottie/rocket.json',
    '/lottie/businessman-rocket.json',
    '/lottie/male-avatar.json',
    '/lottie/female-avatar.json',
    '/lottie/business-team.json',
    '/lottie/office-team.json',
    '/lottie/software-dev.json'
  ];

  const testLottieFiles = async () => {
    setLoading(true);
    const testResults: LottieTestResult[] = [];

    for (const file of testFiles) {
      console.log(`🧪 Testing Lottie file: ${file}`);
      
      const result: LottieTestResult = {
        file,
        status: 'LOADING',
        data: null
      };

      try {
        // Test fetch with detailed logging
        console.log(`📡 Fetching: ${file}`);
        const response = await fetch(file);
        
        result.httpStatus = response.status;
        
        if (!response.ok) {
          console.error(`❌ HTTP ${response.status} for ${file}`);
          result.status = 'HTTP_ERROR';
          result.error = `HTTP ${response.status}: ${response.statusText}`;
          testResults.push(result);
          continue;
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`📄 Content-Type: ${contentType} for ${file}`);

        const text = await response.text();
        console.log(`📝 Response length: ${text.length} characters for ${file}`);
        console.log(`📝 Response preview: ${text.substring(0, 100)}...`);

        // Check if we got HTML instead of JSON
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error(`❌ Received HTML instead of JSON for ${file}`);
          result.status = 'HTML_ERROR';
          result.error = 'Received HTML page instead of JSON file';
          testResults.push(result);
          continue;
        }

        // Try to parse JSON
        let jsonData;
        try {
          jsonData = JSON.parse(text);
          console.log(`✅ JSON parsed successfully for ${file}`);
        } catch (parseError) {
          console.error(`❌ JSON parse error for ${file}:`, parseError);
          result.status = 'PARSE_ERROR';
          result.error = `JSON Parse Error: ${parseError.message}`;
          testResults.push(result);
          continue;
        }

        // Validate Lottie format
        if (!jsonData || typeof jsonData !== 'object') {
          result.status = 'FORMAT_ERROR';
          result.error = 'Invalid JSON object';
          testResults.push(result);
          continue;
        }

        // Check for essential Lottie properties
        const hasVersion = jsonData.v || jsonData.version;
        const hasLayers = Array.isArray(jsonData.layers);
        const hasFrameRate = jsonData.fr || jsonData.frameRate;
        const hasWidth = jsonData.w || jsonData.width;
        const hasHeight = jsonData.h || jsonData.height;

        if (!hasVersion) {
          result.status = 'FORMAT_ERROR';
          result.error = 'Missing version information';
          testResults.push(result);
          continue;
        }

        if (!hasLayers) {
          result.status = 'FORMAT_ERROR';
          result.error = 'Missing or invalid layers array';
          testResults.push(result);
          continue;
        }

        if (jsonData.layers.length === 0) {
          result.status = 'FORMAT_ERROR';
          result.error = 'No animation layers found';
          testResults.push(result);
          continue;
        }

        // Extract details
        result.details = {
          version: jsonData.v || jsonData.version,
          layers: jsonData.layers?.length || 0,
          frameRate: jsonData.fr || jsonData.frameRate,
          width: jsonData.w || jsonData.width,
          height: jsonData.h || jsonData.height,
          duration: jsonData.op ? (jsonData.op / (jsonData.fr || 30)) : undefined
        };

        result.status = 'VALID_LOTTIE';
        result.data = jsonData;
        
        console.log(`✅ Valid Lottie file: ${file}`, result.details);

      } catch (error) {
        console.error(`❌ Fetch error for ${file}:`, error);
        result.status = 'FETCH_ERROR';
        result.error = error instanceof Error ? error.message : 'Unknown fetch error';
      }

      testResults.push(result);
    }

    setResults(testResults);
    setLoading(false);

    // Call the callback with results
    if (onTestResults) {
      onTestResults(testResults);
    }

    // Log summary
    const validCount = testResults.filter(r => r.status === 'VALID_LOTTIE').length;
    const totalCount = testResults.length;
    console.log(`🎬 Lottie Test Summary: ${validCount}/${totalCount} files are valid`);
  };

  useEffect(() => {
    testLottieFiles();
  }, []);

  const toggleAnimation = (file: string) => {
    setPlayingAnimations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(file)) {
        newSet.delete(file);
      } else {
        newSet.add(file);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID_LOTTIE':
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOADING':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'VALID_LOTTIE': 'default',
      'SUCCESS': 'default',
      'LOADING': 'secondary',
      'HTTP_ERROR': 'destructive',
      'HTML_ERROR': 'destructive',
      'FORMAT_ERROR': 'destructive',
      'PARSE_ERROR': 'destructive',
      'FETCH_ERROR': 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'destructive'} className="text-xs">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading && results.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>🧪 Testing Lottie Files...</span>
          </CardTitle>
          <CardDescription>
            Checking all Lottie animation files for validity and accessibility
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const validFiles = results.filter(r => r.status === 'VALID_LOTTIE');
  const errorFiles = results.filter(r => r.status !== 'VALID_LOTTIE' && r.status !== 'LOADING');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Lottie File Debug Panel</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{validFiles.length}/{results.length} Valid</Badge>
            <Button size="sm" onClick={testLottieFiles} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Re-test
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Testing Lottie animation files for validity and rendering capability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Test Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Valid: {validFiles.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Errors: {errorFiles.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span>Total: {results.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">
                {results.length > 0 ? Math.round((validFiles.length / results.length) * 100) : 0}% Success
              </span>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <span className="font-mono text-sm truncate" title={result.file}>
                    {result.file.split('/').pop()}
                  </span>
                </div>
                {getStatusBadge(result.status)}
              </div>

              {/* Details */}
              {result.details && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Version: {result.details.version}</div>
                  <div>Layers: {result.details.layers}</div>
                  <div>Size: {result.details.width}×{result.details.height}</div>
                  {result.details.frameRate && <div>FPS: {result.details.frameRate}</div>}
                  {result.details.duration && <div>Duration: {result.details.duration.toFixed(1)}s</div>}
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {result.error}
                </div>
              )}

              {/* Animation Preview */}
              {result.data && result.status === 'VALID_LOTTIE' && (
                <div className="relative">
                  <div className="w-full h-24 border border-dashed rounded flex items-center justify-center bg-muted/30">
                    <div className="relative w-20 h-20">
                      <Lottie
                        animationData={result.data}
                        loop={true}
                        autoplay={playingAnimations.has(result.file)}
                        style={{ width: '100%', height: '100%' }}
                        onError={(error) => {
                          console.error(`❌ Lottie render error for ${result.file}:`, error);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Play/Pause Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => toggleAnimation(result.file)}
                  >
                    {playingAnimations.has(result.file) ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}

              {/* HTTP Status */}
              {result.httpStatus && (
                <div className="text-xs">
                  <span className="text-muted-foreground">HTTP:</span>
                  <span className={result.httpStatus === 200 ? 'text-green-600' : 'text-red-600'}>
                    {' '}{result.httpStatus}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {results.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No test results available. Click "Re-test" to run diagnostics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
