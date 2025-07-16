import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Shield, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

interface WelcomeDialogProps {
  open?: boolean;
  onClose?: () => void;
}

export function WelcomeDialog({ open: controlledOpen, onClose }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only show welcome dialog after successful login
    if (controlledOpen === undefined) {
      const hasShownWelcome = localStorage.getItem(`hasShownWelcome_${user?.id}`);
      const shouldShowWelcome = sessionStorage.getItem('showWelcomeDialog');

      // Show if user is authenticated, hasn't seen welcome, and session indicates to show
      if (isAuthenticated && user && !hasShownWelcome && shouldShowWelcome === 'true') {
        // Remove the trigger flag
        sessionStorage.removeItem('showWelcomeDialog');
        
        // Add delay to ensure login process is complete
        const timer = setTimeout(() => {
          console.log('🎉 Showing welcome dialog for user:', user.firstName);
          setOpen(true);
        }, 1500);

        return () => clearTimeout(timer);
      }
    } else {
      setOpen(controlledOpen);
    }
  }, [controlledOpen, isAuthenticated, user]);

const handleClose = () => {
    if (user?.id) {
      localStorage.setItem(`hasShownWelcome_${user.id}`, 'true');
    }
    setOpen(false);
    onClose?.();
  };
}