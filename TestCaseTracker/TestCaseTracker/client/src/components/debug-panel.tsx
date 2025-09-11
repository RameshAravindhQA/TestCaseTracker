
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LottieAnimation } from '@/components/ui/lottie-animation';

export function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testSound = async (type: string) => {
    addLog(`Testing sound: ${type}`);
    try {
      if (window.soundManager) {
        await window.soundManager.playSound(type);
        addLog(`✅ Sound ${type} played successfully`);
      } else {
        addLog(`❌ Sound manager not available`);
      }
    } catch (error) {
      addLog(`❌ Error playing ${type}: ${error}`);
    }
  };

  const testLottie = (path: string) => {
    addLog(`Testing Lottie: ${path}`);
  };

  const clearLogs = () => setLogs([]);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Debug Panel - Sound & Lottie Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound Testing */}
        <div>
          <h3 className="font-semibold mb-2">Sound Testing</h3>
          <div className="flex flex-wrap gap-2">
            {['click', 'crud', 'success', 'error', 'message'].map(sound => (
              <Button
                key={sound}
                size="sm"
                onClick={() => testSound(sound)}
                variant="outline"
              >
                Test {sound}
              </Button>
            ))}
          </div>
        </div>

        {/* Lottie Testing */}
        <div>
          <h3 className="font-semibold mb-2">Lottie Testing</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Rocket', path: '/lottie/rocket.json' },
              { name: 'Business', path: '/lottie/businessman-rocket.json' },
              { name: 'Team', path: '/lottie/business-team.json' },
              { name: 'Software', path: '/lottie/software-dev.json' }
            ].map(lottie => (
              <div key={lottie.name} className="text-center">
                <LottieAnimation
                  animationPath={lottie.path}
                  width={80}
                  height={80}
                />
                <p className="text-xs mt-1">{lottie.name}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testLottie(lottie.path)}
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Logs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Debug Logs</h3>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Test sounds or Lottie animations above.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
