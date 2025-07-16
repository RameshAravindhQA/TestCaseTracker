import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, RefreshCw, Database } from "lucide-react";

interface DataField {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  customFormat?: string;
}

interface Country {
  code: string;
  name: string;
  locale: string;
}

export default function TestDataGeneratorPage() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [recordCount, setRecordCount] = useState<number>(100);
  const [outputFormat, setOutputFormat] = useState<string>("json");
  const [customFields, setCustomFields] = useState<string>("");
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const countries: Country[] = [
    { code: "US", name: "United States", locale: "en_US" },
    { code: "GB", name: "United Kingdom", locale: "en_GB" },
    { code: "CA", name: "Canada", locale: "en_CA" },
    { code: "AU", name: "Australia", locale: "en_AU" },
    { code: "DE", name: "Germany", locale: "de_DE" },
    { code: "FR", name: "France", locale: "fr_FR" },
    { code: "ES", name: "Spain", locale: "es_ES" },
    { code: "IT", name: "Italy", locale: "it_IT" },
    { code: "JP", name: "Japan", locale: "ja_JP" },
    { code: "CN", name: "China", locale: "zh_CN" },
    { code: "IN", name: "India", locale: "hi_IN" },
    { code: "BR", name: "Brazil", locale: "pt_BR" }
  ];

  const [dataFields, setDataFields] = useState<DataField[]>([
    { id: "firstName", name: "First Name", type: "name.firstName", enabled: true },
    { id: "lastName", name: "Last Name", type: "name.lastName", enabled: true },
    { id: "email", name: "Email", type: "internet.email", enabled: true },
    { id: "phone", name: "Phone", type: "phone.number", enabled: true },
    { id: "address", name: "Address", type: "location.streetAddress", enabled: false },
    { id: "city", name: "City", type: "location.city", enabled: false },
    { id: "country", name: "Country", type: "location.country", enabled: false },
    { id: "zipCode", name: "Zip Code", type: "location.zipCode", enabled: false },
    { id: "company", name: "Company", type: "company.name", enabled: false },
    { id: "jobTitle", name: "Job Title", type: "person.jobTitle", enabled: false },
    { id: "dateOfBirth", name: "Date of Birth", type: "date.birthdate", enabled: false },
    { id: "avatar", name: "Avatar URL", type: "image.avatar", enabled: false },
    { id: "website", name: "Website", type: "internet.url", enabled: false },
    { id: "username", name: "Username", type: "internet.userName", enabled: false },
    { id: "uuid", name: "UUID", type: "string.uuid", enabled: false },
    { id: "creditCard", name: "Credit Card", type: "finance.creditCardNumber", enabled: false },
    { id: "iban", name: "IBAN", type: "finance.iban", enabled: false },
    { id: "price", name: "Price", type: "commerce.price", enabled: false },
    { id: "product", name: "Product", type: "commerce.product", enabled: false },
    { id: "lorem", name: "Lorem Text", type: "lorem.paragraph", enabled: false }
  ]);

  const generateTestData = async () => {
    setIsGenerating(true);
    try {
      // Simulate data generation using faker.js patterns
      const data = Array.from({ length: recordCount }, (_, index) => {
        const record: any = { id: index + 1 };

        dataFields.forEach(field => {
          if (field.enabled) {
            switch (field.type) {
              case "name.firstName":
                record[field.id] = generateFakeDataByCountry("firstName", selectedCountry);
                break;
              case "name.lastName":
                record[field.id] = generateFakeDataByCountry("lastName", selectedCountry);
                break;
              case "internet.email":
                record[field.id] = generateFakeDataByCountry("email", selectedCountry);
                break;
              case "phone.number":
                record[field.id] = generateFakeDataByCountry("phone", selectedCountry);
                break;
              case "location.streetAddress":
                record[field.id] = generateFakeDataByCountry("address", selectedCountry);
                break;
              case "location.city":
                record[field.id] = generateFakeDataByCountry("city", selectedCountry);
                break;
              case "location.country":
                record[field.id] = countries.find(c => c.code === selectedCountry)?.name || "United States";
                break;
              case "location.zipCode":
                record[field.id] = generateFakeDataByCountry("zipCode", selectedCountry);
                break;
              case "company.name":
                record[field.id] = generateFakeDataByCountry("company", selectedCountry);
                break;
              case "person.jobTitle":
                record[field.id] = generateFakeDataByCountry("jobTitle", selectedCountry);
                break;
              case "date.birthdate":
                record[field.id] = generateFakeDataByCountry("dateOfBirth", selectedCountry);
                break;
              case "image.avatar":
                record[field.id] = `https://i.pravatar.cc/150?img=${(index % 70) + 1}`;
                break;
              case "internet.url":
                record[field.id] = generateFakeDataByCountry("website", selectedCountry);
                break;
              case "internet.userName":
                record[field.id] = generateFakeDataByCountry("username", selectedCountry);
                break;
              case "string.uuid":
                record[field.id] = generateUUID();
                break;
              case "finance.creditCardNumber":
                record[field.id] = generateFakeDataByCountry("creditCard", selectedCountry);
                break;
              case "finance.iban":
                record[field.id] = generateFakeDataByCountry("iban", selectedCountry);
                break;
              case "commerce.price":
                record[field.id] = (Math.random() * 1000).toFixed(2);
                break;
              case "commerce.product":
                record[field.id] = generateFakeDataByCountry("product", selectedCountry);
                break;
              case "lorem.paragraph":
                record[field.id] = generateFakeDataByCountry("lorem", selectedCountry);
                break;
              default:
                record[field.id] = generateFakeDataByCountry("text", selectedCountry);
            }
          }
        });

        // Add custom fields
        if (customFields.trim()) {
          try {
            const customFieldsData = JSON.parse(customFields);
            Object.assign(record, customFieldsData);
          } catch (error) {
            console.error("Invalid custom fields JSON:", error);
          }
        }

        return record;
      });

      setGeneratedData(data);
      toast({
        title: "Data Generated",
        description: `Successfully generated ${recordCount} records`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate test data",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFakeData = (type: string, country: string): string => {
    // Simple fake data generation based on country
    const countryData: { [key: string]: { [key: string]: string[] } } = {
      US: {
        firstName: ["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Mary"],
        lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"],
        city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"],
        company: ["Apple Inc", "Microsoft", "Google", "Amazon", "Facebook", "Tesla", "Netflix", "Twitter"]
      },
      GB: {
        firstName: ["James", "Oliver", "William", "Henry", "Emma", "Olivia", "Sophia", "Charlotte"],
        lastName: ["Smith", "Jones", "Taylor", "Williams", "Brown", "Davies", "Evans", "Wilson"],
        city: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh"],
        company: ["BP", "Vodafone", "HSBC", "Shell", "British Airways", "Tesco", "Barclays", "BT Group"]
      },
      // Add more countries as needed
    };

    const currentCountryData = countryData[country] || countryData.US;

    switch (type) {
      case "firstName":
        return getRandomFromArray(currentCountryData.firstName || countryData.US.firstName);
      case "lastName":
        return getRandomFromArray(currentCountryData.lastName || countryData.US.lastName);
      case "email":
        const firstName = getRandomFromArray(currentCountryData.firstName || countryData.US.firstName);
        const lastName = getRandomFromArray(currentCountryData.lastName || countryData.US.lastName);
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      case "phone":
        return country === "US" ? `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}` :
               `+44-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 900000 + 100000)}`;
      case "address":
        return `${Math.floor(Math.random() * 9999 + 1)} ${getRandomFromArray(["Main St", "Oak Ave", "Pine Rd", "Maple Dr", "Cedar Ln"])}`;
      case "city":
        return getRandomFromArray(currentCountryData.city || countryData.US.city);
      case "zipCode":
        return country === "US" ? Math.floor(Math.random() * 90000 + 10000).toString() :
               `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      case "company":
        return getRandomFromArray(currentCountryData.company || countryData.US.company);
      case "jobTitle":
        return getRandomFromArray(["Software Engineer", "Product Manager", "Designer", "Data Analyst", "Marketing Manager", "Sales Representative"]);
      case "dateOfBirth":
        const year = Math.floor(Math.random() * 50 + 1950);
        const month = Math.floor(Math.random() * 12 + 1);
        const day = Math.floor(Math.random() * 28 + 1);
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case "website":
        return `https://www.${getRandomFromArray(["example", "demo", "test", "sample"])}.com`;
      case "username":
        return `user${Math.floor(Math.random() * 10000)}`;
      case "creditCard":
        return `4${Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0')}`;
      case "iban":
        return `${country}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}${Math.floor(Math.random() * 10000000000000000000).toString().padStart(18, '0')}`;
      case "product":
        return getRandomFromArray(["Laptop", "Smartphone", "Tablet", "Headphones", "Camera", "Watch", "Keyboard", "Mouse"]);
      case "lorem":
        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      default:
        return "Sample Text";
    }
  };

  const getRandomFromArray = (array: string[]): string => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const exportData = () => {
    if (generatedData.length === 0) {
      toast({
        title: "No Data",
        description: "Generate some data first",
        variant: "destructive"
      });
      return;
    }

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (outputFormat) {
      case "json":
        content = JSON.stringify(generatedData, null, 2);
        filename = "test-data.json";
        mimeType = "application/json";
        break;
      case "csv":
        const headers = Object.keys(generatedData[0]).join(",");
        const rows = generatedData.map(row => Object.values(row).map(val => `"${val}"`).join(","));
        content = [headers, ...rows].join("\n");
        filename = "test-data.csv";
        mimeType = "text/csv";
        break;
      case "xml":
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${generatedData.map(item => 
          `  <record>\n${Object.entries(item).map(([key, value]) => 
            `    <${key}>${value}</${key}>`
          ).join('\n')}\n  </record>`
        ).join('\n')}\n</data>`;
        filename = "test-data.xml";
        mimeType = "application/xml";
        break;
      case "sql":
        const tableName = "test_data";
        const columns = Object.keys(generatedData[0]);
        const values = generatedData.map(row => 
          `(${Object.values(row).map(val => `'${val}'`).join(", ")})`
        ).join(",\n");
        content = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES\n${values};`;
        filename = "test-data.sql";
        mimeType = "text/sql";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Data exported as ${filename}`
    });
  };

  const toggleField = (fieldId: string) => {
    setDataFields(fields => 
      fields.map(field => 
        field.id === fieldId ? { ...field, enabled: !field.enabled } : field
      )
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Test Data Generator</h1>
        </div>
          <p className="text-muted-foreground">
            Generate realistic test data with country-specific formats and custom fields
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Set up your data generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="country">Country/Locale</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
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
                  <Label htmlFor="recordCount">Number of Records</Label>
                  <Input
                    id="recordCount"
                    type="number"
                    min="1"
                    max="10000"
                    value={recordCount}
                    onChange={(e) => setRecordCount(parseInt(e.target.value) || 100)}
                  />
                </div>

                <div>
                  <Label htmlFor="outputFormat">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="sql">SQL Insert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>
                  Add custom fields as JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder='{"customField": "value", "status": "active"}'
                  value={customFields}
                  onChange={(e) => setCustomFields(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Fields Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Fields</CardTitle>
                <CardDescription>
                  Select which fields to include in your test data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataFields.map(field => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={field.enabled}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label htmlFor={field.id} className="text-sm font-medium">
                        {field.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex gap-4">
              <Button
                onClick={generateTestData}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Data
                  </>
                )}
              </Button>

              {generatedData.length > 0 && (
                <Button onClick={exportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>

            {/* Preview */}
            {generatedData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview ({generatedData.length} records)</CardTitle>
                  <CardDescription>
                    Showing first 5 records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(generatedData.slice(0, 5), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}