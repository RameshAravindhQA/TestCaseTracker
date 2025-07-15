
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Download, 
  Copy, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Save,
  Upload,
  Globe,
  User,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface CustomField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'email' | 'phone' | 'date' | 'boolean' | 'select';
  options?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

interface DataTemplate {
  id: string;
  name: string;
  description: string;
  fields: CustomField[];
  created: Date;
}

interface CountryData {
  name: string;
  code: string;
  phonePrefix: string;
  postalCodeFormat: string;
  currency: string;
  locale: string;
  cities: string[];
  states?: string[];
}

const GlobalTestDataGenerator: React.FC = () => {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [dataType, setDataType] = useState<string>('personal');
  const [recordCount, setRecordCount] = useState<number>(10);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [templates, setTemplates] = useState<DataTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  
  const countries: CountryData[] = [
    {
      name: 'United States',
      code: 'US',
      phonePrefix: '+1',
      postalCodeFormat: '####',
      currency: 'USD',
      locale: 'en-US',
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
      states: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan']
    },
    {
      name: 'India',
      code: 'IN',
      phonePrefix: '+91',
      postalCodeFormat: '######',
      currency: 'INR',
      locale: 'en-IN',
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Surat', 'Jaipur'],
      states: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Uttar Pradesh']
    },
    {
      name: 'United Kingdom',
      code: 'GB',
      phonePrefix: '+44',
      postalCodeFormat: 'A## #AA',
      currency: 'GBP',
      locale: 'en-GB',
      cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Newcastle']
    },
    {
      name: 'Canada',
      code: 'CA',
      phonePrefix: '+1',
      postalCodeFormat: 'A#A #A#',
      currency: 'CAD',
      locale: 'en-CA',
      cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener']
    },
    {
      name: 'Australia',
      code: 'AU',
      phonePrefix: '+61',
      postalCodeFormat: '####',
      currency: 'AUD',
      locale: 'en-AU',
      cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Geelong']
    }
  ];

  const dataTypes = [
    {
      id: 'personal',
      name: 'Personal Information',
      icon: <User className="w-4 h-4" />,
      fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address', 'city', 'state', 'postalCode']
    },
    {
      id: 'business',
      name: 'Business Data',
      icon: <Building className="w-4 h-4" />,
      fields: ['companyName', 'businessEmail', 'businessPhone', 'website', 'industry', 'employees', 'revenue', 'address']
    },
    {
      id: 'financial',
      name: 'Financial Data',
      icon: <CreditCard className="w-4 h-4" />,
      fields: ['accountNumber', 'routingNumber', 'creditCardNumber', 'expiryDate', 'cvv', 'bankName', 'accountType']
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      icon: <Globe className="w-4 h-4" />,
      fields: ['productName', 'sku', 'price', 'category', 'description', 'stock', 'rating', 'reviews']
    },
    {
      id: 'custom',
      name: 'Custom Fields',
      icon: <Plus className="w-4 h-4" />,
      fields: []
    }
  ];

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('testDataTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Generate random data based on field type and country
  const generateFieldData = (fieldName: string, country: CountryData): any => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const companies = ['Tech Corp', 'Global Industries', 'Innovation Labs', 'Digital Solutions', 'Future Systems'];
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Consulting'];
    
    switch (fieldName) {
      case 'firstName':
        return firstNames[Math.floor(Math.random() * firstNames.length)];
      case 'lastName':
        return lastNames[Math.floor(Math.random() * lastNames.length)];
      case 'email':
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase();
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
        return `${firstName}.${lastName}@example.com`;
      case 'phone':
        return `${country.phonePrefix} ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      case 'dateOfBirth':
        const year = 1950 + Math.floor(Math.random() * 50);
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'address':
        return `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} St`;
      case 'city':
        return country.cities[Math.floor(Math.random() * country.cities.length)];
      case 'state':
        return country.states ? country.states[Math.floor(Math.random() * country.states.length)] : '';
      case 'postalCode':
        return country.postalCodeFormat.replace(/#/g, () => Math.floor(Math.random() * 10).toString())
                                       .replace(/A/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
      case 'companyName':
        return companies[Math.floor(Math.random() * companies.length)];
      case 'businessEmail':
        return `contact@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s/g, '')}.com`;
      case 'businessPhone':
        return `${country.phonePrefix} ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      case 'website':
        return `https://www.${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s/g, '')}.com`;
      case 'industry':
        return industries[Math.floor(Math.random() * industries.length)];
      case 'employees':
        return Math.floor(Math.random() * 10000) + 1;
      case 'revenue':
        return Math.floor(Math.random() * 10000000) + 100000;
      case 'accountNumber':
        return Math.floor(Math.random() * 9000000000) + 1000000000;
      case 'routingNumber':
        return Math.floor(Math.random() * 900000000) + 100000000;
      case 'creditCardNumber':
        return `4${Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0')}`;
      case 'expiryDate':
        const expMonth = Math.floor(Math.random() * 12) + 1;
        const expYear = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
        return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`;
      case 'cvv':
        return Math.floor(Math.random() * 900) + 100;
      case 'bankName':
        return `${country.name} National Bank`;
      case 'accountType':
        return ['Checking', 'Savings', 'Business'][Math.floor(Math.random() * 3)];
      case 'productName':
        return `Product ${Math.floor(Math.random() * 1000)}`;
      case 'sku':
        return `SKU${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      case 'price':
        return (Math.random() * 1000 + 10).toFixed(2);
      case 'category':
        return ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'][Math.floor(Math.random() * 5)];
      case 'description':
        return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      case 'stock':
        return Math.floor(Math.random() * 1000);
      case 'rating':
        return (Math.random() * 5).toFixed(1);
      case 'reviews':
        return Math.floor(Math.random() * 1000);
      default:
        return 'Sample Data';
    }
  };

  // Generate data based on selected type
  const generateData = () => {
    const country = countries.find(c => c.code === selectedCountry) || countries[0];
    const selectedDataType = dataTypes.find(dt => dt.id === dataType);
    
    if (!selectedDataType) return;

    const fields = dataType === 'custom' ? customFields.map(f => f.name) : selectedDataType.fields;
    const data = [];

    for (let i = 0; i < recordCount; i++) {
      const record: any = {};
      
      if (dataType === 'custom') {
        customFields.forEach(field => {
          record[field.name] = generateCustomFieldData(field, country);
        });
      } else {
        fields.forEach(field => {
          record[field] = generateFieldData(field, country);
        });
      }
      
      data.push(record);
    }

    setGeneratedData(data);
    toast({
      title: "Data Generated",
      description: `Generated ${recordCount} records of ${selectedDataType.name} data for ${country.name}.`,
    });
  };

  // Generate custom field data
  const generateCustomFieldData = (field: CustomField, country: CountryData): any => {
    switch (field.type) {
      case 'string':
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const length = Math.floor(Math.random() * ((field.maxLength || 20) - (field.minLength || 5))) + (field.minLength || 5);
        return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      case 'number':
        return Math.floor(Math.random() * ((field.max || 100) - (field.min || 1))) + (field.min || 1);
      case 'email':
        return `user${Math.floor(Math.random() * 1000)}@example.com`;
      case 'phone':
        return `${country.phonePrefix} ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        return date.toISOString().split('T')[0];
      case 'boolean':
        return Math.random() > 0.5;
      case 'select':
        return field.options?.[Math.floor(Math.random() * field.options.length)] || 'Option 1';
      default:
        return 'Sample Value';
    }
  };

  // Add custom field
  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: `field_${customFields.length + 1}`,
      type: 'string',
      minLength: 1,
      maxLength: 50
    };
    setCustomFields([...customFields, newField]);
  };

  // Update custom field
  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Remove custom field
  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  // Save template
  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for the template.",
        variant: "destructive"
      });
      return;
    }

    const newTemplate: DataTemplate = {
      id: Date.now().toString(),
      name: templateName,
      description: `Custom template with ${customFields.length} fields`,
      fields: customFields,
      created: new Date()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('testDataTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template saved",
      description: `Template "${templateName}" has been saved successfully.`,
    });
    
    setTemplateName('');
  };

  // Load template
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomFields([...template.fields]);
      setDataType('custom');
      toast({
        title: "Template loaded",
        description: `Loaded template "${template.name}" with ${template.fields.length} fields.`,
      });
    }
  };

  // Export data
  const exportData = (format: 'json' | 'csv') => {
    if (generatedData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please generate some data first.",
        variant: "destructive"
      });
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(generatedData, null, 2);
      filename = `test-data-${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      const headers = Object.keys(generatedData[0]);
      const csvContent = [
        headers.join(','),
        ...generatedData.map(row => 
          headers.map(header => `"${row[header]?.toString().replace(/"/g, '""') || ''}"`).join(',')
        )
      ].join('\n');
      
      content = csvContent;
      filename = `test-data-${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: `Data exported as ${format.toUpperCase()} successfully.`,
    });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (generatedData.length === 0) return;
    
    navigator.clipboard.writeText(JSON.stringify(generatedData, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "Generated data has been copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Global Test Data Generator</h1>
        <Badge variant="outline" className="text-sm">
          AI-Powered • Country-Specific • Custom Fields
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Country/Region</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Number of Records</Label>
                <Input
                  type="number"
                  value={recordCount}
                  onChange={(e) => setRecordCount(parseInt(e.target.value) || 10)}
                  min="1"
                  max="1000"
                />
              </div>

              <Button onClick={generateData} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Data
              </Button>
            </CardContent>
          </Card>

          {/* Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.fields.length} fields</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadTemplate(template.id)}
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={dataType === 'custom' ? 'custom' : 'generated'}>
            <TabsList>
              <TabsTrigger value="generated">Generated Data</TabsTrigger>
              <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="generated" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Generated Data ({generatedData.length} records)
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportData('csv')}>
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportData('json')}>
                        <Download className="w-4 h-4 mr-1" />
                        JSON
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedData.length > 0 ? (
                    <div className="max-h-96 overflow-auto">
                      <pre className="text-xs bg-gray-50 p-4 rounded">
                        {JSON.stringify(generatedData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data generated yet. Configure your settings and click "Generate Data".
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Custom Fields
                    <Button size="sm" onClick={addCustomField}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customFields.map(field => (
                    <div key={field.id} className="p-4 border rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={field.name}
                          onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                          placeholder="Field name"
                          className="flex-1 mr-2"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateCustomField(field.id, { type: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCustomField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Type-specific options */}
                      {field.type === 'string' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Min Length</Label>
                            <Input
                              type="number"
                              value={field.minLength || 1}
                              onChange={(e) => updateCustomField(field.id, { minLength: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label>Max Length</Label>
                            <Input
                              type="number"
                              value={field.maxLength || 50}
                              onChange={(e) => updateCustomField(field.id, { maxLength: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Min Value</Label>
                            <Input
                              type="number"
                              value={field.min || 1}
                              onChange={(e) => updateCustomField(field.id, { min: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label>Max Value</Label>
                            <Input
                              type="number"
                              value={field.max || 100}
                              onChange={(e) => updateCustomField(field.id, { max: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}

                      {field.type === 'select' && (
                        <div>
                          <Label>Options (one per line)</Label>
                          <Textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateCustomField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {customFields.length > 0 && (
                    <div className="flex gap-2">
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name"
                        className="flex-1"
                      />
                      <Button onClick={saveTemplate}>
                        <Save className="w-4 h-4 mr-1" />
                        Save Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GlobalTestDataGenerator;
