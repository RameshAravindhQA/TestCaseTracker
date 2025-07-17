
import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

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

        console.log(`✅ HTTP OK for ${file}`);

        // Get response text
        const text = await response.text();
        console.log(`📄 Response length for ${file}: ${text.length} characters`);

        // Check if response is HTML (404 page)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error(`❌ HTML response for ${file}`);
          result.status = 'HTML_ERROR';
          result.error = 'Received HTML instead of JSON (likely 404)';
          testResults.push(result);
          continue;
        }

        // Try to parse JSON
        let jsonData;
        try {
          jsonData = JSON.parse(text);
          console.log(`✅ JSON parsed for ${file}`);
        } catch (parseError) {
          console.error(`❌ JSON parse error for ${file}:`, parseError);
          result.status = 'PARSE_ERROR';
          result.error = `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`;
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
        
        console.log(`✅ Valid Lottie file: ${file} - v${result.details.version}, ${result.details.layers} layers`);
        
      } catch (error) {
        console.error(`❌ Fetch error for ${file}:`, error);
        result.status = 'FETCH_ERROR';
        result.error = error instanceof Error ? error.message : 'Unknown fetch error';
      }

      testResults.push(result);
    }

    setResults(testResults);
    setLoading(false);

    // Auto-play all valid animations
    const validFiles = testResults
      .filter(r => r.status === 'VALID_LOTTIE')
      .map(r => r.file);
    setPlayingAnimations(new Set(validFiles));

    // Call callback if provided
    if (onTestResults) {
      onTestResults(testResults);
    }

    console.log(`🧪 Test complete: ${testResults.filter(r => r.status === 'VALID_LOTTIE').length}/${testResults.length} valid`);
  };

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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOADING':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID_LOTTIE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOADING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  // Auto-run test on component mount
  useEffect(() => {
    testLottieFiles();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🧪 Lottie Animation Debug Panel
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Testing {testFiles.length} Lottie animation files from /lottie/ directory
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testLottieFiles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Retest'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && results.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Testing Lottie files...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div
                key={result.file}
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* File Header */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono text-muted-foreground truncate">
                    {result.file}
                  </div>
                  {getStatusIcon(result.status)}
                </div>

                {/* Status Badge */}
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(result.status)}`}>
                  {result.status.replace('_', ' ')}
                  {result.httpStatus && ` (${result.httpStatus})`}
                </Badge>

                {/* Error Message */}
                {result.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {result.error}
                  </div>
                )}

                {/* Animation Details */}
                {result.details && (
                  <div className="text-xs space-y-1 bg-muted/50 p-2 rounded">
                    <div>Version: {result.details.version}</div>
                    <div>Layers: {result.details.layers}</div>
                    <div>Size: {result.details.width}×{result.details.height}</div>
                    <div>FPS: {result.details.frameRate}</div>
                    {result.details.duration && (
                      <div>Duration: {result.details.duration.toFixed(1)}s</div>
                    )}
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
                          onComplete={() => {
                            console.log(`🔄 Animation completed: ${result.file}`);
                          }}
                          onLoopComplete={() => {
                            console.log(`🔁 Animation loop completed: ${result.file}`);
                          }}
                          renderer="svg"
                          rendererSettings={{
                            preserveAspectRatio: 'xMidYMid meet',
                            clearCanvas: true,
                            progressiveLoad: false,
                            hideOnTransparent: true
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Play/Pause Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
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

                {/* Failed Animation Placeholder */}
                {result.status !== 'VALID_LOTTIE' && result.status !== 'LOADING' && (
                  <div className="w-full h-24 border border-dashed rounded flex items-center justify-center bg-red-50">
                    <div className="text-center">
                      <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <div className="text-xs text-red-600">Failed to Load</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {results.length > 0 && !loading && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Test Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'VALID_LOTTIE').length}
                </div>
                <div className="text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status.includes('ERROR')).length}
                </div>
                <div className="text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.filter(r => r.status === 'VALID_LOTTIE').length > 0 ? 
                    playingAnimations.size : 0}
                </div>
                <div className="text-muted-foreground">Playing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {results.length}
                </div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
