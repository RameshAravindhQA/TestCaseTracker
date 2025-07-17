import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Download, RefreshCw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';

interface GeneratedData {
  [key: string]: string | number;
}

const countryData = {
  India: {
    name: () => {
      const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Fatima', 'Aadhya', 'Vaani', 'Aanya', 'Kiara', 'Diya', 'Pihu', 'Prisha', 'Kavya'];
      const lastNames = ['Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Agarwal', 'Jain', 'Bansal', 'Agrawal', 'Yadav', 'Mishra', 'Tiwari', 'Srivastava', 'Dubey', 'Pandey', 'Saxena', 'Joshi', 'Chopra', 'Malhotra'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const prefixes = ['9', '8', '7', '6'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const remaining = Math.floor(Math.random() * 900000000) + 100000000;
      return `+91 ${prefix}${remaining.toString().slice(0, 9)}`;
    },
    pan: () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let pan = '';
      // Format: AAAAA9999A
      for (let i = 0; i < 5; i++) pan += letters[Math.floor(Math.random() * letters.length)];
      for (let i = 0; i < 4; i++) pan += numbers[Math.floor(Math.random() * numbers.length)];
      pan += letters[Math.floor(Math.random() * letters.length)];
      return pan;
    },
    aadhaar: () => {
      // Generate 12-digit Aadhaar number
      let aadhaar = '';
      for (let i = 0; i < 12; i++) {
        aadhaar += Math.floor(Math.random() * 10);
      }
      return aadhaar.replace(/(.{4})(.{4})(.{4})/, '$1 $2 $3');
    },
    gst: () => {
      // Format: 99AAAAA9999A9A9
      const states = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37'];
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';

      let gst = states[Math.floor(Math.random() * states.length)];
      for (let i = 0; i < 5; i++) gst += letters[Math.floor(Math.random() * letters.length)];
      for (let i = 0; i < 4; i++) gst += numbers[Math.floor(Math.random() * numbers.length)];
      gst += letters[Math.floor(Math.random() * letters.length)];
      gst += numbers[Math.floor(Math.random() * numbers.length)];
      gst += letters[Math.floor(Math.random() * letters.length)];
      return gst;
    },
    ifsc: () => {
      const bankCodes = ['SBIN', 'HDFC', 'ICIC', 'AXIS', 'PUNB', 'CNRB', 'UBIN', 'BARB', 'MAHB', 'IOBA'];
      const bankCode = bankCodes[Math.floor(Math.random() * bankCodes.length)];
      const branchCode = Math.floor(Math.random() * 900000) + 100000;
      return `${bankCode}0${branchCode.toString().slice(0, 6)}`;
    },
    address: () => {
      const streets = ['MG Road', 'Park Street', 'Main Road', 'Gandhi Road', 'Nehru Street', 'Residency Road', 'Commercial Street', 'Brigade Road', 'Richmond Road', 'Cunningham Road'];
      const areas = ['Koramangala', 'Whitefield', 'Electronic City', 'Marathahalli', 'Indiranagar', 'JP Nagar', 'BTM Layout', 'HSR Layout', 'Sarjapur Road', 'Bannerghatta Road'];
      const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
      const states = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];

      const houseNo = Math.floor(Math.random() * 999) + 1;
      const street = streets[Math.floor(Math.random() * streets.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const pincode = Math.floor(Math.random() * 900000) + 100000;

      return `${houseNo}, ${street}, ${area}, ${city}, ${state} - ${pincode}`;
    },
    upi: (name: string) => {
      const providers = ['@paytm', '@googlepay', '@phonepe', '@ybl', '@okaxis', '@okhdfcbank', '@oksbi'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '');
      const provider = providers[Math.floor(Math.random() * providers.length)];
      return `${cleanName}${Math.floor(Math.random() * 1000)}${provider}`;
    },
    drivingLicense: () => {
      const stateCodes = ['KA', 'MH', 'DL', 'TN', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'];
      const stateCode = stateCodes[Math.floor(Math.random() * stateCodes.length)];
      const regionCode = Math.floor(Math.random() * 99) + 1;
      const year = Math.floor(Math.random() * 30) + 1990;
      const serialNo = Math.floor(Math.random() * 9000000) + 1000000;
      return `${stateCode}${regionCode.toString().padStart(2, '0')}${year}${serialNo}`;
    },
    passport: () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let passport = '';
      passport += letters[Math.floor(Math.random() * letters.length)];
      for (let i = 0; i < 7; i++) {
        passport += Math.floor(Math.random() * 10);
      }
      return passport;
    },
    vehicleNumber: () => {
      const stateCodes = ['KA', 'MH', 'DL', 'TN', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'];
      const stateCode = stateCodes[Math.floor(Math.random() * stateCodes.length)];
      const districtCode = Math.floor(Math.random() * 99) + 1;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const letter1 = letters[Math.floor(Math.random() * letters.length)];
      const letter2 = letters[Math.floor(Math.random() * letters.length)];
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `${stateCode} ${districtCode.toString().padStart(2, '0')} ${letter1}${letter2} ${number}`;
    },
  },
  USA: {
    name: () => {
      const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const areaCode = Math.floor(Math.random() * 800) + 200;
      const exchange = Math.floor(Math.random() * 800) + 200;
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `+1 (${areaCode}) ${exchange}-${number}`;
    },
    ssn: () => {
      const area = Math.floor(Math.random() * 900) + 100;
      const group = Math.floor(Math.random() * 90) + 10;
      const serial = Math.floor(Math.random() * 9000) + 1000;
      return `${area}-${group}-${serial}`;
    },
    address: () => {
      const streetNumbers = Math.floor(Math.random() * 9999) + 1;
      const streets = ['Main St', 'First St', 'Second St', 'Park Ave', 'Oak St', 'Maple Ave', 'Cedar St', 'Elm St', 'Washington St', 'Lincoln Ave'];
      const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
      const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const zipCode = Math.floor(Math.random() * 90000) + 10000;
      return `${streetNumbers} ${street}, ${city}, ${state} ${zipCode}`;
    },
  },
  UK: {
    name: () => {
      const firstNames = ['Oliver', 'George', 'Harry', 'Jack', 'Jacob', 'Noah', 'Charlie', 'Muhammad', 'Thomas', 'Oscar', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Isabella', 'Mia', 'Poppy', 'Ella', 'Lily'];
      const lastNames = ['Smith', 'Jones', 'Taylor', 'Williams', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood', 'Thompson', 'White', 'Watson', 'Jackson', 'Wright'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.co.uk', 'bt.com'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const areaCode = Math.floor(Math.random() * 900) + 100;
      const number = Math.floor(Math.random() * 9000000) + 1000000;
      return `+44 ${areaCode} ${number.toString().slice(0, 3)} ${number.toString().slice(3)}`;
    },
    postcode: () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let postcode = '';
      postcode += letters[Math.floor(Math.random() * letters.length)];
      postcode += letters[Math.floor(Math.random() * letters.length)];
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += ' ';
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += letters[Math.floor(Math.random() * letters.length)];
      postcode += letters[Math.floor(Math.random() * letters.length)];
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['High Street', 'Church Lane', 'The Green', 'Mill Lane', 'Station Road', 'Victoria Road', 'Queen Street', 'King Street', 'New Road', 'School Lane'];
      const cities = ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.UK.postcode();
      return `${houseNumbers} ${street}, ${city} ${postcode}`;
    },
  },
};

const dataTypes = {
  personal: ['name', 'email', 'phone', 'address'],
  indian: ['pan', 'aadhaar', 'gst', 'ifsc', 'upi', 'drivingLicense', 'passport', 'vehicleNumber'],
  usa: ['ssn'],
  uk: ['postcode'],
  financial: ['creditCard', 'bankAccount'],
  internet: ['username', 'password', 'ipAddress', 'macAddress'],
  datetime: ['date', 'time', 'timestamp'],
  business: ['company', 'jobTitle', 'department'],
  lorem: ['sentence', 'paragraph', 'word'],
};

export default function TestDataGeneratorPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['name', 'email', 'phone']);
  const [recordCount, setRecordCount] = useState<number>(10);
  const [generatedData, setGeneratedData] = useState<GeneratedData[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>('json');
  const { toast } = useToast();

  const generateData = useCallback(() => {
    const data: GeneratedData[] = [];
    const countryGenerators = countryData[selectedCountry as keyof typeof countryData];

    for (let i = 0; i < recordCount; i++) {
      const record: GeneratedData = {};

      selectedDataTypes.forEach(dataType => {
        if (countryGenerators && countryGenerators[dataType as keyof typeof countryGenerators]) {
          const generator = countryGenerators[dataType as keyof typeof countryGenerators];
          if (dataType === 'email' || dataType === 'upi') {
            // These need the name as input
            const name = record.name || countryGenerators.name();
            record[dataType] = generator(name as string);
          } else {
            record[dataType] = generator();
          }
        } else {
          // Generate generic data for types not specific to country
          switch (dataType) {
            case 'creditCard':
              record[dataType] = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('').replace(/(.{4})/g, '$1 ').trim();
              break;
            case 'bankAccount':
              record[dataType] = Math.floor(Math.random() * 9000000000) + 1000000000;
              break;
            case 'username':
              record[dataType] = `user${Math.floor(Math.random() * 10000)}`;
              break;
            case 'password':
              record[dataType] = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
              break;
            case 'ipAddress':
              record[dataType] = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
              break;
            case 'macAddress':
              record[dataType] = Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
              break;
            case 'date':
              const randomDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
              record[dataType] = randomDate.toISOString().split('T')[0];
              break;
            case 'time':
              record[dataType] = `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
              break;
            case 'timestamp':
              record[dataType] = Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000);
              break;
            case 'company':
              const companies = ['TechCorp', 'DataSoft', 'InnovateLabs', 'GlobalTech', 'FutureSoft', 'DigitalEdge', 'SmartSolutions', 'NextGen', 'CloudWorks', 'InfoSystems'];
              record[dataType] = companies[Math.floor(Math.random() * companies.length)];
              break;
            case 'jobTitle':
              const titles = ['Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer', 'DevOps Engineer', 'QA Engineer', 'Business Analyst', 'Project Manager', 'Tech Lead', 'Sales Manager'];
              record[dataType] = titles[Math.floor(Math.random() * titles.length)];
              break;
            case 'department':
              const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Customer Support', 'Legal', 'Business Development'];
              record[dataType] = departments[Math.floor(Math.random() * departments.length)];
              break;
            case 'word':
              const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do'];
              record[dataType] = words[Math.floor(Math.random() * words.length)];
              break;
            case 'sentence':
              record[dataType] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
              break;
            case 'paragraph':
              record[dataType] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
              break;
          }
        }
      });

      data.push(record);
    }

    setGeneratedData(data);
    toast({
      title: 'Success',
      description: `Generated ${recordCount} records successfully`,
    });
  }, [selectedCountry, selectedDataTypes, recordCount, toast]);

  const copyToClipboard = (format: string) => {
    let output = '';

    switch (format) {
      case 'json':
        output = JSON.stringify(generatedData, null, 2);
        break;
      case 'csv':
        if (generatedData.length > 0) {
          const headers = Object.keys(generatedData[0]).join(',');
          const rows = generatedData.map(row => Object.values(row).join(',')).join('\n');
          output = `${headers}\n${rows}`;
        }
        break;
      case 'sql':
        if (generatedData.length > 0) {
          const tableName = 'test_data';
          const columns = Object.keys(generatedData[0]);
          const values = generatedData.map(row => 
            `(${Object.values(row).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`
          ).join(',\n  ');
          output = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n  ${values};`;
        }
        break;
    }

    navigator.clipboard.writeText(output);
    toast({
      title: 'Copied',
      description: `Data copied to clipboard in ${format.toUpperCase()} format`,
    });
  };

  const downloadData = (format: string) => {
    let output = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        output = JSON.stringify(generatedData, null, 2);
        filename = 'test-data.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        if (generatedData.length > 0) {
          const headers = Object.keys(generatedData[0]).join(',');
          const rows = generatedData.map(row => Object.values(row).join(',')).join('\n');
          output = `${headers}\n${rows}`;
        }
        filename = 'test-data.csv';
        mimeType = 'text/csv';
        break;
      case 'sql':
        if (generatedData.length > 0) {
          const tableName = 'test_data';
          const columns = Object.keys(generatedData[0]);
          const values = generatedData.map(row => 
            `(${Object.values(row).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`
          ).join(',\n  ');
          output = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n  ${values};`;
        }
        filename = 'test-data.sql';
        mimeType = 'text/sql';
        break;
    }

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes(prev => [...prev, dataType]);
    } else {
      setSelectedDataTypes(prev => prev.filter(type => type !== dataType));
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Data Generator</h1>
            <p className="text-muted-foreground">Generate realistic test data for various countries and use cases</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">🇮🇳 India</SelectItem>
                    <SelectItem value="USA">🇺🇸 USA</SelectItem>
                    <SelectItem value="UK">🇬🇧 UK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recordCount">Number of Records</Label>
                <Input
                  id="recordCount"
                  type="number"
                  min="1"
                  max="1000"
                  value={recordCount}
                  onChange={(e) => setRecordCount(Number(e.target.value))}
                />
              </div>

              <div>
                <Label>Data Types</Label>
                <div className="space-y-3 mt-2">
                  {/* Personal Data */}
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Personal</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.personal.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Country-specific Data */}
                  {selectedCountry === 'India' && (
                    <div>
                      <Label className="text-sm font-medium text-green-600">Indian Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.indian.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={selectedDataTypes.includes(type)}
                              onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                            />
                            <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCountry === 'USA' && (
                    <div>
                      <Label className="text-sm font-medium text-red-600">USA Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.usa.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={selectedDataTypes.includes(type)}
                              onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                            />
                            <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCountry === 'UK' && (
                    <div>
                      <Label className="text-sm font-medium text-purple-600">UK Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.uk.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={selectedDataTypes.includes(type)}
                              onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                            />
                            <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Data Types */}
                  <div>
                    <Label className="text-sm font-medium text-orange-600">Financial</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.financial.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-cyan-600">Internet</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.internet.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-indigo-600">DateTime</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.datetime.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-pink-600">Business</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.business.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Lorem</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.lorem.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedDataTypes.includes(type)}
                            onCheckedChange={(checked) => handleDataTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={generateData} className="w-full" disabled={selectedDataTypes.length === 0}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Data
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Data ({generatedData.length} records)</CardTitle>
                {generatedData.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => copyToClipboard(outputFormat)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => downloadData(outputFormat)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedData.length > 0 ? (
                <Textarea
                  value={outputFormat === 'json' ? JSON.stringify(generatedData, null, 2) : 
                         outputFormat === 'csv' ? (() => {
                           const headers = Object.keys(generatedData[0]).join(',');
                           const rows = generatedData.map(row => Object.values(row).join(',')).join('\n');
                           return `${headers}\n${rows}`;
                         })() :
                         (() => {
                           const tableName = 'test_data';
                           const columns = Object.keys(generatedData[0]);
                           const values = generatedData.map(row => 
                             `(${Object.values(row).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`
                           ).join(',\n  ');
                           return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n  ${values};`;
                         })()
                  }
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Select data types and click "Generate Data" to create test data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}