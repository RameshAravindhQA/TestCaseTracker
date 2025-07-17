import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LottieFileDebugProps {
  onTestResults?: (results: any[]) => void;
}

export const LottieFileDebug: React.FC<LottieFileDebugProps> = ({ onTestResults }) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testFiles = [
    '/lottie/rocket.json',
    '/lottie/businessman-rocket.json', 
    '/lottie/male-avatar.json',
    '/lottie/female-avatar.json',
    '/lottie/business-team.json',
    '/lottie/office-team.json',
    '/lottie/software-dev.json'
  ];

  const runTests = async () => {
    setTesting(true);
    const results = [];

    for (const filePath of testFiles) {
      console.log(`🧪 Testing file: ${filePath}`);

      try {
        const response = await fetch(filePath);
        const status = response.status;
        const contentType = response.headers.get('content-type') || 'unknown';

        if (response.ok) {
          const text = await response.text();
          const isHTML = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

          if (isHTML) {
            results.push({
              path: filePath,
              status: 'HTML_RESPONSE',
              contentType,
              size: text.length,
              error: 'Received HTML instead of JSON (likely 404)'
            });
          } else {
            try {
              const jsonData = JSON.parse(text);
              const isValidLottie = jsonData.v && jsonData.layers && Array.isArray(jsonData.layers);

              results.push({
                path: filePath,
                status: isValidLottie ? 'VALID_LOTTIE' : 'INVALID_JSON',
                contentType,
                size: text.length,
                version: jsonData.v,
                layerCount: jsonData.layers?.length || 0,
                frameRate: jsonData.fr
              });
            } catch (parseError) {
              results.push({
                path: filePath,
                status: 'PARSE_ERROR',
                contentType,
                size: text.length,
                error: parseError.message
              });
            }
          }
        } else {
          results.push({
            path: filePath,
            status: 'HTTP_ERROR',
            httpStatus: status,
            contentType,
            error: `HTTP ${status}`
          });
        }
      } catch (fetchError) {
        results.push({
          path: filePath,
          status: 'FETCH_ERROR',
          error: fetchError.message
        });
      }
    }

    setTestResults(results);
    onTestResults?.(results);
    setTesting(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID_LOTTIE': return 'bg-green-100 text-green-800';
      case 'HTTP_ERROR': 
      case 'FETCH_ERROR': 
      case 'HTML_RESPONSE': return 'bg-red-100 text-red-800';
      case 'PARSE_ERROR':
      case 'INVALID_JSON': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🧪 Lottie File Debug
          <Button 
            onClick={runTests} 
            disabled={testing}
            size="sm"
          >
            {testing ? 'Testing...' : 'Re-test Files'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div key={index} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono">{result.path}</code>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                {result.httpStatus && <div>HTTP Status: {result.httpStatus}</div>}
                {result.contentType && <div>Content-Type: {result.contentType}</div>}
                {result.size && <div>Size: {result.size} bytes</div>}
                {result.version && <div>Lottie Version: {result.version}</div>}
                {result.layerCount !== undefined && <div>Layers: {result.layerCount}</div>}
                {result.frameRate && <div>Frame Rate: {result.frameRate}</div>}
                {result.error && <div className="text-red-600">Error: {result.error}</div>}
              </div>
            </div>
          ))}
        </div>

        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="text-sm font-medium text-blue-800">Summary:</div>
            <div className="text-xs text-blue-600 mt-1">
              Valid: {testResults.filter(r => r.status === 'VALID_LOTTIE').length} | 
              Errors: {testResults.filter(r => r.status.includes('ERROR') || r.status === 'HTML_RESPONSE').length} | 
              Total: {testResults.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};