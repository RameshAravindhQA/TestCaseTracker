import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function TestSheetsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-96">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Sheets Module Removed</h3>
          <p className="text-gray-600">This module has been removed as requested.</p>
        </CardContent>
      </Card>
    </div>
  );
}