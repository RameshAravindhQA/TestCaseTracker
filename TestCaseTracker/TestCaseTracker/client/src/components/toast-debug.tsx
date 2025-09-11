
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ToastDebug() {
  const { toast } = useToast();

  useEffect(() => {
    console.log("ToastDebug component mounted");
    
    // Test toast on mount
    const testToast = () => {
      console.log("Triggering test toast");
      toast({
        title: "Toast Debug",
        description: "Toast system is working!",
        duration: 3000,
      });
    };

    // Delay test toast to ensure system is ready
    const timer = setTimeout(testToast, 1000);
    
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="fixed bottom-4 left-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs z-[10000]">
      <p>Toast Debug Active</p>
      <button 
        onClick={() => {
          console.log("Manual toast test triggered");
          toast({
            title: "Manual Test",
            description: "Manual toast test",
            duration: 3000,
          });
        }}
        className="mt-1 px-2 py-1 bg-yellow-200 rounded text-xs"
      >
        Test Toast
      </button>
    </div>
  );
}
