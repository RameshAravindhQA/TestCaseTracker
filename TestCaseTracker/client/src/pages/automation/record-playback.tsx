
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Eye, Download, Trash2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';

interface RecordedScript {
  id: string;
  name: string;
  projectId: string;
  moduleId: string;
  testCaseIds: string[];
  recordedActions: any[];
  createdAt: string;
  duration: number;
  status: 'recorded' | 'playing' | 'completed' | 'failed';
}

function RecordPlaybackPage() {
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Fetch recorded scripts
  const { data: scripts = [], refetch: refetchScripts } = useQuery({
    queryKey: ['automation-scripts'],
    queryFn: async () => {
      const response = await fetch('/api/automation/scripts');
      if (!response.ok) throw new Error('Failed to fetch scripts');
      return response.json();
    }
  });

  // Play script mutation
  const playScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await fetch(`/api/automation/scripts/${scriptId}/play`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to play script');
      return response.json();
    },
    onSuccess: () => {
      setIsPlaying(true);
      toast({
        title: 'Script Playing',
        description: 'The automation script is now playing.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to play script: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const response = await fetch(`/api/automation/scripts/${scriptId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete script');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Script Deleted',
        description: 'The automation script has been deleted.',
      });
      refetchScripts();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete script: ${error}`,
        variant: 'destructive',
      });
    }
  });

  const handlePlayScript = (scriptId: string) => {
    playScriptMutation.mutate(scriptId);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      deleteScriptMutation.mutate(scriptId);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record & Playback</h1>
        <p className="text-muted-foreground">
          Manage and playback your recorded automation scripts
        </p>
      </div>

      <Tabs defaultValue="playback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playback">Playback Scripts</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="playback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recorded Scripts</CardTitle>
              <CardDescription>
                Select and playback your recorded automation scripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scripts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No recorded scripts found. Go to the Record tab to create your first automation script.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scripts.map((script: RecordedScript) => (
                    <div
                      key={script.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{script.name}</h3>
                          <Badge variant={script.status === 'completed' ? 'default' : 'secondary'}>
                            {script.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(script.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(script.duration)}
                          </span>
                          <span>{script.testCaseIds.length} test cases</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePlayScript(script.id)}
                          disabled={isPlaying}
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* View script details */}}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteScript(script.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isPlaying && (
            <Card>
              <CardHeader>
                <CardTitle>Script Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    Script is currently executing... Please wait for completion.
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setIsPlaying(false)}
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Stop Execution
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                View the history of script executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Execution history will be displayed here once scripts are run.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RecordPlaybackPage;
