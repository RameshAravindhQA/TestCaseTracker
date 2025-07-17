import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleSheet {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export default function TestSheetsPage() {
  const { toast } = useToast();
  const [sheets, setSheets] = useState<GoogleSheet[]>([
    {
      id: "1",
      name: "Sample Test Cases",
      url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
      createdAt: new Date().toISOString()
    }
  ]);
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetUrl, setNewSheetUrl] = useState("");
  const [currentSheet, setCurrentSheet] = useState<GoogleSheet | null>(null);

  const addSheet = () => {
    if (!newSheetName.trim() || !newSheetUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and URL",
        variant: "destructive"
      });
      return;
    }

    // Validate Google Sheets URL
    if (!newSheetUrl.includes("docs.google.com/spreadsheets")) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid Google Sheets URL",
        variant: "destructive"
      });
      return;
    }

    const newSheet: GoogleSheet = {
      id: Date.now().toString(),
      name: newSheetName,
      url: newSheetUrl,
      createdAt: new Date().toISOString()
    };

    setSheets([...sheets, newSheet]);
    setNewSheetName("");
    setNewSheetUrl("");

    toast({
      title: "Sheet Added",
      description: "Google Sheet has been added successfully"
    });
  };

  const removeSheet = (id: string) => {
    setSheets(sheets.filter(sheet => sheet.id !== id));
    if (currentSheet?.id === id) {
      setCurrentSheet(null);
    }
    toast({
      title: "Sheet Removed",
      description: "Google Sheet has been removed"
    });
  };

  const openSheet = (sheet: GoogleSheet) => {
    setCurrentSheet(sheet);
  };

  const getEmbedUrl = (url: string) => {
    // Convert Google Sheets URL to embed format
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/edit?usp=sharing&rm=minimal`;
    }
    return url;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Sheets</h1>
            <p className="text-muted-foreground">
              Access and manage your Google Sheets directly in the browser
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sheets List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Google Sheets</CardTitle>
                <CardDescription>
                  Your linked spreadsheets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Sheet */}
                <div className="space-y-3 p-3 border rounded-lg">
                  <h4 className="font-medium">Add New Sheet</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Sheet name"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                    />
                    <Input
                      placeholder="Google Sheets URL"
                      value={newSheetUrl}
                      onChange={(e) => setNewSheetUrl(e.target.value)}
                    />
                    <Button onClick={addSheet} className="w-full" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sheet
                    </Button>
                  </div>
                </div>

                {/* Sheets List */}
                <div className="space-y-2">
                  {sheets.map(sheet => (
                    <div
                      key={sheet.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentSheet?.id === sheet.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => openSheet(sheet)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{sheet.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(sheet.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(sheet.url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSheet(sheet.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {sheets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No sheets added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sheet Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-[800px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {currentSheet ? currentSheet.name : "Select a Sheet"}
                  {currentSheet && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(currentSheet.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Google Sheets
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {currentSheet
                    ? "View and edit your Google Sheet directly in the browser"
                    : "Select a Google Sheet from the sidebar to view it here"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                {currentSheet ? (
                  <iframe
                    src={getEmbedUrl(currentSheet.url)}
                    className="w-full h-full border-0 rounded-b-lg"
                    title={currentSheet.name}
                    allow="encrypted-media"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Select a Google Sheet to get started</p>
                      <p className="text-sm mt-2">
                        You can add Google Sheets URLs and access them directly here
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">1. Get Google Sheets URL</h4>
                <p className="text-sm text-muted-foreground">
                  Open your Google Sheet, click "Share" and copy the sharing link.
                  Make sure it's set to "Anyone with the link can view/edit".
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Add to Test Sheets</h4>
                <p className="text-sm text-muted-foreground">
                  Paste the URL in the "Add New Sheet" form with a descriptive name
                  and click "Add Sheet".
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Access Directly</h4>
                <p className="text-sm text-muted-foreground">
                  Click on any sheet from the sidebar to open it in the embedded viewer.
                  You can also open it in a new tab.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}