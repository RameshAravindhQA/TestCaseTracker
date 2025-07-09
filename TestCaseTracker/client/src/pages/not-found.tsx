import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";

export default function NotFound() {
  const [location, navigate] = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Determine the content based on if we're in MainLayout or not
  const Content = () => (
    <Card className="w-full max-w-md mx-4">
      <CardContent className="pt-6">
        <div className="flex mb-4 gap-2 items-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">404 Page Not Found</h1>
        </div>
        
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // If authenticated, use MainLayout, otherwise use a plain layout
  return isAuthenticated ? (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <Content />
      </div>
    </MainLayout>
  ) : (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Content />
    </div>
  );
}
