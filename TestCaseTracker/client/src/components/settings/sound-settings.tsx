import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSound, SoundType } from "@/hooks/use-sound";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Volume2 } from "lucide-react";

export function SoundSettings() {
  const { getSoundSettings, setSoundSettings, playSound, uploadSound } = useSound();
  const { toast } = useToast();
  const [settings, setSettings] = useState(getSoundSettings());
  const fileInputRefs = useRef<{ [key in SoundType]?: HTMLInputElement }>({});

  const handleToggle = (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    setSoundSettings(newSettings);
  };

  const handleVolumeChange = (volume: number[]) => {
    const newSettings = { ...settings, volume: volume[0] };
    setSettings(newSettings);
    setSoundSettings(newSettings);
  };

  const handleSoundUpload = async (type: SoundType, file: File) => {
    try {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive"
        });
        return;
      }

      await uploadSound(type, file);
      setSettings(getSoundSettings());
      toast({
        title: "Sound uploaded",
        description: `${type} sound has been updated successfully`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload sound file",
        variant: "destructive"
      });
    }
  };

  const soundTypes: { key: SoundType; label: string; description: string }[] = [
    { key: 'click', label: 'Click Sound', description: 'Played when clicking buttons and links' },
    { key: 'crud', label: 'CRUD Operations', description: 'Played during create, read, update, delete operations' },
    { key: 'create', label: 'Create Sound', description: 'Played when creating new items' },
    { key: 'update', label: 'Update Sound', description: 'Played when updating existing items' },
    { key: 'delete', label: 'Delete Sound', description: 'Played when deleting items' },
    { key: 'error', label: 'Error Sound', description: 'Played when errors occur' },
    { key: 'success', label: 'Success Sound', description: 'Played on successful operations' },
    { key: 'message', label: 'Message Sound', description: 'Played for notifications and messages' },
    { key: 'navigation', label: 'Navigation Sound', description: 'Played when navigating between pages' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>
            Configure system sounds and upload custom audio files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Sounds</Label>
              <p className="text-sm text-muted-foreground">
                Turn system sounds on or off
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Volume</Label>
            <div className="px-3">
              <Slider
                value={[settings.volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                disabled={!settings.enabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>{Math.round(settings.volume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Sound Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Sound Configuration</Label>
            <div className="grid gap-4">
              {soundTypes.map(({ key, label, description }) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{label}</h4>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <Button
                          onClick={() => playSound(key)}
                          size="sm"
                          variant="outline"
                          disabled={!settings.enabled}
                          title={`Test ${label} sound`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => fileInputRefs.current[key]?.click()}
                          size="sm"
                          variant="outline"
                          title={`Upload custom ${label} sound`}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        ref={(el) => el && (fileInputRefs.current[key] = el)}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSoundUpload(key, file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Test All Sounds */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                soundTypes.forEach(({ key }, index) => {
                  setTimeout(() => playSound(key), index * 500);
                });
              }}
              disabled={!settings.enabled}
              className="w-full"
            >
              Test All Sounds
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}