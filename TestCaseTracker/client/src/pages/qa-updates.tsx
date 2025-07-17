import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QAUpdatesPage() {
  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400">
              This page has been removed. Please return to the dashboard.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}