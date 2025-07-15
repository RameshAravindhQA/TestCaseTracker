
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectSelect } from '@/components/ui/project-select';
import { ModuleSelect } from '@/components/ui/module-select';

interface DataField {
  id: string;
  name: string;
  type: string;
  format?: string;
}

interface Project {
  id: number;
  name: string;
}

interface Module {
  id: number;
  name: string;
  projectId: number;
}

const DATA_TYPES = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'fullName', label: 'Full Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Street Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State/Province' },
  { value: 'country', label: 'Country' },
  { value: 'pincode', label: 'PIN/ZIP Code' },
  { value: 'company', label: 'Company Name' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'username', label: 'Username' },
  { value: 'password', label: 'Password' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'number', label: 'Random Number' },
  { value: 'decimal', label: 'Decimal Number' },
  { value: 'boolean', label: 'Boolean (True/False)' },
  { value: 'uuid', label: 'UUID' },
  { value: 'ip', label: 'IP Address' },
  { value: 'url', label: 'Website URL' },
  { value: 'text', label: 'Random Text' },
  { value: 'paragraph', label: 'Lorem Ipsum Paragraph' },
  { value: 'currency', label: 'Currency Amount' },
  { value: 'creditCard', label: 'Credit Card Number' },
  { value: 'ssn', label: 'SSN/ID Number' },
  { value: 'iban', label: 'IBAN' },
  { value: 'color', label: 'Color Code' },
  { value: 'image', label: 'Image URL' },
  { value: 'custom', label: 'Custom Format' }
];

export function TestDataGenerator() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [fields, setFields] = useState<DataField[]>([]);
  const [recordCount, setRecordCount] = useState<number>(10);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch modules for selected project
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: [`/api/projects/${selectedProject}/modules`],
    enabled: !!selectedProject,
  });

  const addField = () => {
    const newField: DataField = {
      id: Date.now().toString(),
      name: '',
      type: 'firstName'
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<DataField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const generateMockData = (type: string, format?: string): any => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Ashley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const companies = ['TechCorp', 'DataSoft', 'InnovateLabs', 'GlobalTech', 'FutureSys', 'NextGen', 'SmartSolutions', 'CloudWorks'];
    const domains = ['example.com', 'test.org', 'demo.net', 'sample.co', 'mock.io'];

    switch (type) {
      case 'firstName':
        return firstNames[Math.floor(Math.random() * firstNames.length)];
      case 'lastName':
        return lastNames[Math.floor(Math.random() * lastNames.length)];
      case 'fullName':
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      case 'email':
        return `${firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase()}${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`;
      case 'phone':
        return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
      case 'address':
        return `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Pine', 'Elm', 'Cedar'][Math.floor(Math.random() * 5)]} St`;
      case 'city':
        return ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'][Math.floor(Math.random() * 8)];
      case 'state':
        return ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA'][Math.floor(Math.random() * 8)];
      case 'country':
        return ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'India'][Math.floor(Math.random() * 8)];
      case 'pincode':
        return Math.floor(Math.random() * 90000) + 10000;
      case 'company':
        return companies[Math.floor(Math.random() * companies.length)];
      case 'jobTitle':
        return ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'Marketing Specialist', 'Sales Representative'][Math.floor(Math.random() * 6)];
      case 'username':
        return `user${Math.floor(Math.random() * 9999)}`;
      case 'password':
        return `Pass${Math.floor(Math.random() * 9999)}!`;
      case 'date':
        const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
        return date.toISOString().split('T')[0];
      case 'time':
        return `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
      case 'datetime':
        return new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString();
      case 'number':
        return Math.floor(Math.random() * 1000);
      case 'decimal':
        return (Math.random() * 1000).toFixed(2);
      case 'boolean':
        return Math.random() > 0.5;
      case 'uuid':
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      case 'ip':
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      case 'url':
        return `https://www.${domains[Math.floor(Math.random() * domains.length)]}`;
      case 'text':
        return ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'][Math.floor(Math.random() * 8)];
      case 'paragraph':
        return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      case 'currency':
        return `$${(Math.random() * 10000).toFixed(2)}`;
      case 'creditCard':
        return `4${Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0')}`;
      case 'ssn':
        return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
      case 'iban':
        return `US${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 1000000000000000000000).toString().padStart(22, '0')}`;
      case 'color':
        return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      case 'image':
        return `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`;
      case 'custom':
        return format || 'Custom Value';
      default:
        return 'Unknown';
    }
  };

  const generateData = () => {
    if (fields.length === 0) {
      toast({
        title: "No Fields Defined",
        description: "Please add at least one field to generate data.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const data = [];
      for (let i = 0; i < recordCount; i++) {
        const record: any = {};
        fields.forEach(field => {
          if (field.name) {
            record[field.name] = generateMockData(field.type, field.format);
          }
        });
        data.push(record);
      }
      setGeneratedData(data);
      setIsGenerating(false);
      
      toast({
        title: "Data Generated Successfully",
        description: `Generated ${recordCount} records with ${fields.length} fields.`,
      });
    }, 1000);
  };

  const downloadCSV = () => {
    if (generatedData.length === 0) return;

    const headers = fields.map(field => field.name).join(',');
    const rows = generatedData.map(record => 
      fields.map(field => record[field.name] || '').join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_data_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (generatedData.length === 0) return;

    const text = JSON.stringify(generatedData, null, 2);
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Test data has been copied as JSON format.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Data Generator</CardTitle>
          <CardDescription>
            Generate realistic test data for your testing needs. Select a project and module, then configure the data fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project and Module Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-select">Project</Label>
              <ProjectSelect
                value={selectedProject}
                onValueChange={setSelectedProject}
                projects={projects}
              />
            </div>
            <div>
              <Label htmlFor="module-select">Module (Optional)</Label>
              <ModuleSelect
                value={selectedModule}
                onValueChange={setSelectedModule}
                modules={modules}
                disabled={!selectedProject}
              />
            </div>
          </div>

          {/* Record Count */}
          <div>
            <Label htmlFor="record-count">Number of Records</Label>
            <Input
              id="record-count"
              type="number"
              value={recordCount}
              onChange={(e) => setRecordCount(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="10000"
              className="w-32"
            />
          </div>

          {/* Fields Configuration */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Data Fields</Label>
              <Button onClick={addField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Enter field name"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Data Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField(field.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {field.type === 'custom' && (
                    <div className="flex-1">
                      <Label>Custom Format</Label>
                      <Input
                        value={field.format || ''}
                        onChange={(e) => updateField(field.id, { format: e.target.value })}
                        placeholder="Enter custom format"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateData} 
            disabled={isGenerating || fields.length === 0}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Test Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Data Preview */}
      {generatedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Generated Data</CardTitle>
                <CardDescription>
                  {generatedData.length} records generated
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <Button variant="outline" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-96 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {fields.map((field) => (
                      <th key={field.id} className="text-left p-2 border-b font-medium">
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedData.slice(0, 100).map((record, index) => (
                    <tr key={index} className="border-b">
                      {fields.map((field) => (
                        <td key={field.id} className="p-2">
                          {String(record[field.name] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {generatedData.length > 100 && (
                <div className="p-4 text-center text-gray-500 border-t">
                  Showing first 100 records of {generatedData.length} total records
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
