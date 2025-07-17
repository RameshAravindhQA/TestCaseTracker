
import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Star, Users, Zap, Bug, BarChart3, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QAUpdatesPage() {
  const updates = [
    {
      version: "v2.3.0",
      date: "July 17, 2025",
      type: "major",
      title: "Lottie Avatar System",
      description: "Introduced animated Lottie avatars for user profiles with upload and selection capabilities.",
      features: [
        "Upload custom Lottie animations",
        "Pre-built avatar collection",
        "Real-time preview and selection",
        "Avatar persistence across sessions"
      ],
      icon: <Star className="h-5 w-5" />
    },
    {
      version: "v2.2.0", 
      date: "July 15, 2025",
      type: "major",
      title: "Enhanced Reporting System",
      description: "Advanced analytics and consolidated reporting with interactive charts and export capabilities.",
      features: [
        "Interactive bug summary charts",
        "Consolidated project reports",
        "CSV/PDF export functionality",
        "Real-time analytics dashboard"
      ],
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      version: "v2.1.0",
      date: "July 10, 2025", 
      type: "feature",
      title: "Real-time Chat System",
      description: "WebSocket-powered chat system for team collaboration with project-specific channels.",
      features: [
        "Real-time messaging",
        "Project-specific chat rooms",
        "File sharing in chat",
        "Message persistence"
      ],
      icon: <MessageCircle className="h-5 w-5" />
    },
    {
      version: "v2.0.5",
      date: "July 5, 2025",
      type: "patch",
      title: "Bug Fixes & Performance",
      description: "Critical bug fixes and performance improvements across the platform.",
      features: [
        "Fixed test case persistence issues",
        "Improved file upload stability", 
        "Enhanced error handling",
        "Database optimization"
      ],
      icon: <Bug className="h-5 w-5" />
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'feature': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">QA Updates</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Latest features, improvements, and bug fixes for TestCase Tracker
          </p>
        </div>

        {/* Updates Timeline */}
        <div className="space-y-6">
          {updates.map((update, index) => (
            <motion.div
              key={update.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {update.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{update.title}</CardTitle>
                          <Badge className={getTypeColor(update.type)}>
                            {update.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {update.date}
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {update.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {update.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
              <p className="text-muted-foreground mb-4">
                Have feedback or suggestions? We'd love to hear from you!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline">
                  Share Feedback
                </Button>
                <Button>
                  Join Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
