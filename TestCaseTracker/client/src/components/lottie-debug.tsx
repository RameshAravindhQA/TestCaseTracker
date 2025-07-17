
import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

export const LottieDebug = () => {
  const [animations, setAnimations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAnimations = async () => {
      const testFiles = [
        '/lottie/rocket.json',
        '/lottie/businessman-rocket.json',
        '/lottie/male-avatar.json',
        '/lottie/female-avatar.json'
      ];

      const results = [];
      
      for (const file of testFiles) {
        try {
          console.log(`🧪 Testing: ${file}`);
          const response = await fetch(file);
          
          if (!response.ok) {
            console.error(`❌ HTTP ${response.status} for ${file}`);
            results.push({ file, status: 'HTTP_ERROR', data: null });
            continue;
          }

          const text = await response.text();
          
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error(`❌ HTML response for ${file}`);
            results.push({ file, status: 'HTML_ERROR', data: null });
            continue;
          }

          try {
            const data = JSON.parse(text);
            
            if (!data.v && !data.layers && !data.fr) {
              console.error(`❌ Invalid Lottie format for ${file}`);
              results.push({ file, status: 'FORMAT_ERROR', data: null });
              continue;
            }

            console.log(`✅ Valid Lottie: ${file}`);
            results.push({ file, status: 'SUCCESS', data });
            
          } catch (parseError) {
            console.error(`❌ JSON parse error for ${file}:`, parseError);
            results.push({ file, status: 'PARSE_ERROR', data: null });
          }
          
        } catch (error) {
          console.error(`❌ Fetch error for ${file}:`, error);
          results.push({ file, status: 'FETCH_ERROR', data: null });
        }
      }

      setAnimations(results);
      setLoading(false);
    };

    testAnimations();
  }, []);

  if (loading) {
    return <div className="p-4">🧪 Testing Lottie files...</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-4">🧪 Lottie Debug Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {animations.map((anim, index) => (
          <div key={index} className="border p-3 rounded">
            <div className="text-sm font-mono mb-2">{anim.file}</div>
            <div className={`text-xs px-2 py-1 rounded mb-2 ${
              anim.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {anim.status}
            </div>
            
            {anim.data && (
              <div className="mt-2">
                <div className="w-24 h-24 border rounded flex items-center justify-center">
                  <Lottie
                    animationData={anim.data}
                    loop={true}
                    style={{ width: 80, height: 80 }}
                  />
                </div>
                <div className="text-xs mt-1 text-gray-600">
                  v{anim.data.v} • {anim.data.layers?.length || 0} layers
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
