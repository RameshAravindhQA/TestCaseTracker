
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThemeCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThemeChange: (theme: ChatTheme) => void;
  currentTheme: ChatTheme;
}

interface ChatTheme {
  backgroundImage?: string;
  backgroundColor: string;
  messageBackgroundColor: string;
  textColor: string;
  accentColor: string;
}

export function ThemeCustomizer({ open, onOpenChange, onThemeChange, currentTheme }: ThemeCustomizerProps) {
  const { toast } = useToast();
  const [theme, setTheme] = useState<ChatTheme>(currentTheme);
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);

  const presetThemes = [
    {
      name: 'Default',
      backgroundColor: '#f9fafb',
      messageBackgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6'
    },
    {
      name: 'Dark',
      backgroundColor: '#1f2937',
      messageBackgroundColor: '#374151',
      textColor: '#f9fafb',
      accentColor: '#60a5fa'
    },
    {
      name: 'Ocean',
      backgroundColor: '#0f172a',
      messageBackgroundColor: '#1e293b',
      textColor: '#e2e8f0',
      accentColor: '#06b6d4'
    },
    {
      name: 'Forest',
      backgroundColor: '#14532d',
      messageBackgroundColor: '#166534',
      textColor: '#dcfce7',
      accentColor: '#22c55e'
    }
  ];

  const handleWallpaperUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setWallpaperFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setTheme(prev => ({
            ...prev,
            backgroundImage: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleSaveTheme = () => {
    onThemeChange(theme);
    localStorage.setItem('messengerTheme', JSON.stringify(theme));
    toast({
      title: "Theme saved",
      description: "Your custom theme has been applied"
    });
    onOpenChange(false);
  };

  const handlePresetSelect = (preset: any) => {
    setTheme({
      ...preset,
      backgroundImage: undefined
    });
  };

  const removeWallpaper = () => {
    setTheme(prev => ({
      ...prev,
      backgroundImage: undefined
    }));
    setWallpaperFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Chat Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preset Themes */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preset Themes</Label>
            <div className="grid grid-cols-2 gap-3">
              {presetThemes.map((preset) => (
                <Card 
                  key={preset.name}
                  className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{preset.name}</span>
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.backgroundColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.messageBackgroundColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Wallpaper */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Custom Wallpaper</Label>
            {theme.backgroundImage ? (
              <div className="relative">
                <img 
                  src={theme.backgroundImage} 
                  alt="Wallpaper preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeWallpaper}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload a wallpaper image</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}
          </div>

          {/* Color Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                type="color"
                id="backgroundColor"
                value={theme.backgroundColor}
                onChange={(e) => setTheme(prev => ({ ...prev, backgroundColor: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="messageBackgroundColor">Message Background</Label>
              <Input
                type="color"
                id="messageBackgroundColor"
                value={theme.messageBackgroundColor}
                onChange={(e) => setTheme(prev => ({ ...prev, messageBackgroundColor: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <Input
                type="color"
                id="textColor"
                value={theme.textColor}
                onChange={(e) => setTheme(prev => ({ ...prev, textColor: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <Input
                type="color"
                id="accentColor"
                value={theme.accentColor}
                onChange={(e) => setTheme(prev => ({ ...prev, accentColor: e.target.value }))}
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preview</Label>
            <div 
              className="border rounded-lg p-4 h-32 relative overflow-hidden"
              style={{
                backgroundColor: theme.backgroundColor,
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: theme.textColor
              }}
            >
              <div 
                className="rounded-lg p-2 mb-2 max-w-xs"
                style={{ backgroundColor: theme.messageBackgroundColor }}
              >
                <p className="text-sm">Sample message preview</p>
              </div>
              <div 
                className="rounded-lg p-2 ml-auto max-w-xs"
                style={{ backgroundColor: theme.accentColor, color: 'white' }}
              >
                <p className="text-sm">Your message</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTheme}>
              Apply Theme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
