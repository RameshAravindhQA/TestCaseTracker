import { useState } from "react";
import { EnhancedFileUpload } from "@/components/ui/enhanced-file-upload";
import { FileAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/shell";
import { DashboardHeader } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layouts/dashboard-layout";

function TestUploadPage() {
  const [files, setFiles] = useState<FileAttachment[]>([]);

  return (
    <>
      <Helmet>
        <title>Test File Upload | TestCaseTracker</title>
      </Helmet>
      <DashboardShell>
        <DashboardHeader heading="Test File Upload" text="Testing the enhanced file upload component" />
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedFileUpload 
                value={files} 
                onChange={setFiles} 
                maxSize={50 * 1024 * 1024}  /* 50MB */
                maxFiles={10}
              />
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </>
  );
}

export default function TestUploadPageWrapper() {
  return (
    <DashboardLayout>
      <TestUploadPage />
    </DashboardLayout>
  );
}
