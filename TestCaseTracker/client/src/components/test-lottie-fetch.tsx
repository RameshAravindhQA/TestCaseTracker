
import React, { useEffect, useState } from 'react';

export const TestLottieFetch = () => {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const testFiles = async () => {
      const files = [
        'businessman-rocket.json',
        'rocket.json', 
        'male-avatar.json',
        'female-avatar.json'
      ];

      const testResults = [];
      
      for (const file of files) {
        try {
          console.log(`Testing: /lottie/${file}`);
          const response = await fetch(`/lottie/${file}`);
          const status = response.status;
          const contentType = response.headers.get('content-type');
          
          if (response.ok) {
            const text = await response.text();
            try {
              const data = JSON.parse(text);
              testResults.push({
                file,
                status: 'SUCCESS',
                httpStatus: status,
                contentType,
                isValidJson: true,
                hasVersion: !!(data.v || data.version),
                hasLayers: !!(data.layers && Array.isArray(data.layers))
              });
            } catch {
              testResults.push({
                file,
                status: 'INVALID_JSON',
                httpStatus: status,
                contentType,
                isValidJson: false
              });
            }
          } else {
            testResults.push({
              file,
              status: 'HTTP_ERROR',
              httpStatus: status,
              contentType
            });
          }
        } catch (error) {
          testResults.push({
            file,
            status: 'FETCH_ERROR',
            error: error.message
          });
        }
      }
      
      setResults(testResults);
    };

    testFiles();
  }, []);

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-bold mb-4">🧪 Lottie File Test Results</h3>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-2 border rounded bg-white">
            <div className="font-mono text-sm">/lottie/{result.file}</div>
            <div className={`text-xs px-2 py-1 rounded mt-1 ${
              result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.status} - HTTP {result.httpStatus}
            </div>
            {result.contentType && (
              <div className="text-xs text-gray-600 mt-1">
                Content-Type: {result.contentType}
              </div>
            )}
            {result.hasVersion !== undefined && (
              <div className="text-xs text-gray-600">
                Valid Lottie: {result.hasVersion && result.hasLayers ? '✅' : '❌'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
