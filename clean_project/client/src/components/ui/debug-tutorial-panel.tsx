
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, Play, Square } from 'lucide-react';

interface DebugTutorialPanelProps {
  isWelcomeOpen: boolean;
  isOnboardingOpen: boolean;
  isUserGuideOpen: boolean;
  user: any;
  onResetTutorial: () => void;
  onShowOnboarding: () => void;
  onHideAll: () => void;
  onClose: () => void;
}

export function DebugTutorialPanel({
  isWelcomeOpen,
  isOnboardingOpen,
  isUserGuideOpen,
  user,
  onResetTutorial,
  onShowOnboarding,
  onHideAll,
  onClose
}: DebugTutorialPanelProps) {
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
  const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

  return (
    <div className="fixed bottom-4 right-4 z-[10000]">
      <Card className="w-80 bg-black/90 text-white border-gray-600">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono">🔍 Tutorial Debug Panel</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>User:</span>
              <Badge variant="outline">{user?.firstName || 'None'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Welcome Dialog:</span>
              <Badge variant={isWelcomeOpen ? "default" : "secondary"}>
                {isWelcomeOpen ? '✅ Open' : '❌ Closed'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Onboarding:</span>
              <Badge variant={isOnboardingOpen ? "default" : "secondary"}>
                {isOnboardingOpen ? '✅ Open' : '❌ Closed'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>User Guide:</span>
              <Badge variant={isUserGuideOpen ? "default" : "secondary"}>
                {isUserGuideOpen ? '✅ Open' : '❌ Closed'}
              </Badge>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span>Has Seen Welcome:</span>
              <Badge variant={hasSeenWelcome ? "default" : "destructive"}>
                {hasSeenWelcome || 'false'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Completed Onboarding:</span>
              <Badge variant={hasCompletedOnboarding ? "default" : "destructive"}>
                {hasCompletedOnboarding || 'false'}
              </Badge>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShowOnboarding}
                className="text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Show Tutorial
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onHideAll}
                className="text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Hide All
              </Button>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onResetTutorial}
              className="w-full text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Tutorial State
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
