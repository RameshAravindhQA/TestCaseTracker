
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSoundContext } from '@/hooks/use-sound-provider';
import { SoundEnhancedButton } from '@/components/ui/sound-enhanced-button';
import { useToast } from '@/hooks/use-toast';
import { soundFetch } from '@/lib/sound-api-integration';
import { Play, Volume2, VolumeX, Check, X, Plus, Edit, Trash } from 'lucide-react';

export const SoundIntegrationExample: React.FC = () => {
  const { 
    playSound, 
    playCrudSound, 
    playErrorSound, 
    playSuccessSound, 
    playMessageSound, 
    playNavigationSound 
  } = useSoundContext();
  const { toast } = useToast();

  const handleApiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    try {
      // Example API call with sound integration
      const response = await soundFetch('/api/example', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify({ test: 'data' }) : undefined,
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `${method} operation completed successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `${method} operation failed`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Integration Examples
          </CardTitle>
          <CardDescription>
            Examples of how sounds are integrated throughout the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Basic Sound Tests */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Basic Sound Effects</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => playSound('click')} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Click Sound
              </Button>
              <Button onClick={() => playSound('success')} variant="outline">
                <Check className="h-4 w-4 mr-2" />
                Success Sound
              </Button>
              <Button onClick={() => playSound('error')} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Error Sound
              </Button>
              <Button onClick={() => playSound('message')} variant="outline">
                <Volume2 className="h-4 w-4 mr-2" />
                Message Sound
              </Button>
              <Button onClick={() => playSound('navigation')} variant="outline">
                Navigation Sound
              </Button>
            </div>
          </div>

          {/* CRUD Operation Sounds */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">CRUD Operation Sounds</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => playCrudSound('create')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
              <Button onClick={() => playCrudSound('update')} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Update
              </Button>
              <Button onClick={() => playCrudSound('delete')} variant="outline">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Sound Enhanced Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sound Enhanced Components</h3>
            <div className="flex flex-wrap gap-2">
              <SoundEnhancedButton crudOperation="create">
                Create Item (Auto Sound)
              </SoundEnhancedButton>
              <SoundEnhancedButton crudOperation="update">
                Update Item (Auto Sound)
              </SoundEnhancedButton>
              <SoundEnhancedButton crudOperation="delete" variant="destructive">
                Delete Item (Auto Sound)
              </SoundEnhancedButton>
              <SoundEnhancedButton soundType="navigation">
                Navigate (Auto Sound)
              </SoundEnhancedButton>
            </div>
          </div>

          {/* Toast with Sound Integration */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Toast Notifications with Sounds</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => toast({ 
                  title: "Success", 
                  description: "This is a success message with sound" 
                })}
                variant="outline"
              >
                Success Toast
              </Button>
              <Button 
                onClick={() => toast({ 
                  title: "Error", 
                  description: "This is an error message with sound",
                  variant: "destructive"
                })}
                variant="outline"
              >
                Error Toast
              </Button>
            </div>
          </div>

          {/* API Call Sound Integration */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">API Calls with Sound Integration</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleApiCall('POST')} variant="outline">
                POST Request
              </Button>
              <Button onClick={() => handleApiCall('PUT')} variant="outline">
                PUT Request
              </Button>
              <Button onClick={() => handleApiCall('DELETE')} variant="outline">
                DELETE Request
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
