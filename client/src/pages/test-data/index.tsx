
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/ui/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Plus, Trash2, Database } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface DataField {
  id: string;
  name: string;
  type: string;
  category: string;
}

const DATA_CATEGORIES = {
  'Personal Information': {
    'firstName': () => {
      const names = ['Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavya', 'Arjun', 'Meera', 'Sanjay', 'Deepika', 'Rahul', 'Pooja'];
      return names[Math.floor(Math.random() * names.length)];
    },
    'lastName': () => {
      const surnames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Verma', 'Yadav', 'Reddy', 'Nair'];
      return surnames[Math.floor(Math.random() * surnames.length)];
    },
    'fullName': () => {
      const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavya'];
      const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Agarwal'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    'email': () => {
      const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const name = 'user' + Math.floor(Math.random() * 10000);
      return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    'phoneNumber': () => {
      // Indian phone number format
      const prefixes = ['98', '99', '90', '91', '92', '93', '94', '95', '96', '97'];
      return `+91 ${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 90000000 + 10000000)}`;
    },
    'dateOfBirth': () => {
      const year = Math.floor(Math.random() * 50) + 1950;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    },
    'age': () => Math.floor(Math.random() * 60) + 18,
    'gender': () => {
      const genders = ['Male', 'Female', 'Other'];
      return genders[Math.floor(Math.random() * genders.length)];
    }
  },
  'Address Information': {
    'streetAddress': () => {
      const streets = ['MG Road', 'Brigade Road', 'Commercial Street', 'Residency Road', 'Richmond Road'];
      const numbers = Math.floor(Math.random() * 999) + 1;
      return `${numbers} ${streets[Math.floor(Math.random() * streets.length)]}`;
    },
    'city': () => {
      const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
      return cities[Math.floor(Math.random() * cities.length)];
    },
    'state': () => {
      const states = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
      return states[Math.floor(Math.random() * states.length)];
    },
    'pincode': () => {
      // Indian pincode format (6 digits)
      return Math.floor(Math.random() * 900000) + 100000;
    },
    'country': () => 'India',
    'landmark': () => {
      const landmarks = ['Near Metro Station', 'Opposite Hospital', 'Behind Mall', 'Near School', 'Close to Park'];
      return landmarks[Math.floor(Math.random() * landmarks.length)];
    }
  },
  'Financial Information': {
    'bankAccountNumber': () => {
      return Math.floor(Math.random() * 9000000000000000) + 1000000000000000;
    },
    'ifscCode': () => {
      const bankCodes = ['HDFC', 'ICIC', 'SBIN', 'AXIS', 'KTKM'];
      const code = bankCodes[Math.floor(Math.random() * bankCodes.length)];
      return `${code}0${Math.floor(Math.random() * 900000) + 100000}`;
    },
    'panNumber': () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const pan = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('') +
                  'P' +
                  letters[Math.floor(Math.random() * letters.length)] +
                  Math.floor(Math.random() * 9000) + 1000 +
                  letters[Math.floor(Math.random() * letters.length)];
      return pan;
    },
    'aadharNumber': () => {
      return Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
    },
    'creditCardNumber': () => {
      const prefixes = ['4', '5', '3'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      return prefix + Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
    },
    'cvv': () => Math.floor(Math.random() * 900) + 100,
    'salary': () => Math.floor(Math.random() * 1000000) + 300000
  },
  'Business Information': {
    'companyName': () => {
      const companies = ['TechCorp Solutions', 'InnovaSoft', 'DataFlow Systems', 'CloudTech India', 'NextGen Technologies'];
      return companies[Math.floor(Math.random() * companies.length)];
    },
    'jobTitle': () => {
      const titles = ['Software Engineer', 'Product Manager', 'Data Analyst', 'QA Engineer', 'DevOps Engineer'];
      return titles[Math.floor(Math.random() * titles.length)];
    },
    'department': () => {
      const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
      return departments[Math.floor(Math.random() * departments.length)];
    },
    'employeeId': () => 'EMP' + Math.floor(Math.random() * 90000) + 10000,
    'gstNumber': () => {
      const stateCode = Math.floor(Math.random() * 36) + 1;
      return `${stateCode.toString().padStart(2, '0')}${Array.from({length: 13}, () => Math.floor(Math.random() * 10)).join('')}Z${Math.floor(Math.random() * 10)}`;
    }
  },
  'Internet & Technology': {
    'username': () => 'user' + Math.floor(Math.random() * 100000),
    'password': () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
      return Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
    'ipAddress': () => {
      return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
    },
    'macAddress': () => {
      return Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
    },
    'url': () => {
      const domains = ['example.com', 'testsite.org', 'demo.net', 'sample.in'];
      return `https://www.${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    'uuid': () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },
  'Dates & Numbers': {
    'date': () => {
      const year = Math.floor(Math.random() * 5) + 2020;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    },
    'time': () => {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    },
    'number': () => Math.floor(Math.random() * 1000000),
    'decimal': () => (Math.random() * 1000).toFixed(2),
    'percentage': () => (Math.random() * 100).toFixed(1) + '%',
    'currency': () => '₹' + (Math.random() * 100000).toFixed(2)
  },
  'Miscellaneous': {
    'boolean': () => Math.random() > 0.5,
    'status': () => {
      const statuses = ['Active', 'Inactive', 'Pending', 'Approved', 'Rejected'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    },
    'priority': () => {
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      return priorities[Math.floor(Math.random() * priorities.length)];
    },
    'tags': () => {
      const tags = ['urgent', 'review', 'testing', 'development', 'production'];
      return tags.slice(0, Math.floor(Math.random() * 3) + 1).join(', ');
    },
    'description': () => {
      const descriptions = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco.'
      ];
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
  }
};

export default function TestDataGeneratorPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [numberOfRecords, setNumberOfRecords] = useState(10);
  const [dataFields, setDataFields] = useState<DataField[]>([]);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFieldType, setSelectedFieldType] = useState<string>('');

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const addField = () => {
    if (!selectedFieldType) return;
    
    const newField: DataField = {
      id: Date.now().toString(),
      name: selectedFieldType.charAt(0).toUpperCase() + selectedFieldType.slice(1),
      type: selectedFieldType,
      category: selectedCategory
    };
    
    setDataFields([...dataFields, newField]);
    setSelectedFieldType('');
  };

  const removeField = (id: string) => {
    setDataFields(dataFields.filter(field => field.id !== id));
  };

  const generateTestData = () => {
    if (dataFields.length === 0) return;
    
    const data = [];
    for (let i = 0; i < numberOfRecords; i++) {
      const record: any = { id: i + 1 };
      dataFields.forEach(field => {
        const category = Object.keys(DATA_CATEGORIES).find(cat => 
          Object.keys(DATA_CATEGORIES[cat]).includes(field.type)
        );
        if (category && DATA_CATEGORIES[category][field.type]) {
          record[field.name] = DATA_CATEGORIES[category][field.type]();
        } else {
          record[field.name] = 'Sample ' + field.name;
        }
      });
      data.push(record);
    }
    setGeneratedData(data);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-data.json';
    a.click();
  };

  const exportToCSV = () => {
    if (generatedData.length === 0) return;
    
    const headers = Object.keys(generatedData[0]).join(',');
    const rows = generatedData.map(row => Object.values(row).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-data.csv';
    a.click();
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Database className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Test Data Generator</h1>
            <p className="text-gray-600">Generate realistic test data for your testing projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Records</label>
                <Input
                  type="number"
                  value={numberOfRecords}
                  onChange={(e) => setNumberOfRecords(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Fields</label>
                <div className="space-y-2">
                  <Select value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedFieldType('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DATA_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedCategory && (
                    <Select value={selectedFieldType} onValueChange={setSelectedFieldType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(DATA_CATEGORIES[selectedCategory]).map((fieldType) => (
                          <SelectItem key={fieldType} value={fieldType}>
                            {fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button onClick={addField} disabled={!selectedFieldType} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>

              {dataFields.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Selected Fields</label>
                  <div className="space-y-2">
                    {dataFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{field.name}</span>
                          <Badge variant="secondary" className="ml-2">{field.category}</Badge>
                        </div>
                        <Button
                          onClick={() => removeField(field.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={generateTestData} 
                disabled={dataFields.length === 0}
                className="w-full"
              >
                Generate Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Generated Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Data Preview
                {generatedData.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={exportToJSON} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedData.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{numberOfRecords} records generated</p>
                  <div className="max-h-96 overflow-auto border rounded">
                    <pre className="p-4 text-sm">
                      {JSON.stringify(generatedData.slice(0, 5), null, 2)}
                      {generatedData.length > 5 && '\n... and more'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Configure fields and generate data to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
