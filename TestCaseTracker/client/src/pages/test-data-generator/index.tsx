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

  const dataTypes = {
    'United States': [
      'SSN', 'Driver License', 'Passport', 'Tax ID', 'Phone', 'ZIP Code', 'Credit Card', 'Bank Account'
    ],
    'United Kingdom': [
      'National Insurance Number', 'Passport', 'Phone', 'Postcode', 'VAT Number', 'Sort Code', 'IBAN'
    ],
    'Canada': [
      'SIN', 'Health Card', 'Passport', 'Phone', 'Postal Code', 'Bank Transit Number'
    ],
    'Australia': [
      'TFN', 'Medicare', 'Passport', 'Phone', 'Postcode', 'ABN', 'BSB Number'
    ],
    'Germany': [
      'Tax ID', 'Passport', 'Phone', 'Postcode', 'VAT Number', 'IBAN', 'BIC'
    ],
    'India': [
      'PAN Number', 'Aadhaar Number', 'GST Number', 'Passport', 'Driving License', 
      'Voter ID', 'Phone', 'PIN Code', 'IFSC Code', 'Bank Account', 'UPI ID',
      'EPF Number', 'ESI Number', 'TAN Number', 'CIN Number', 'FSSAI License'
    ],
    'France': [
      'INSEE Number', 'Passport', 'Phone', 'Postal Code', 'VAT Number', 'IBAN', 'SIRET'
    ],
    'Japan': [
      'My Number', 'Passport', 'Phone', 'Postal Code', 'Bank Account', 'Residence Card'
    ],
    'China': [
      'National ID', 'Passport', 'Phone', 'Postal Code', 'Bank Account', 'UnionPay Card'
    ],
    'Brazil': [
      'CPF', 'CNPJ', 'RG', 'Passport', 'Phone', 'CEP', 'Bank Account'
    ],
    'Mexico': [
      'CURP', 'RFC', 'Passport', 'Phone', 'Postal Code', 'CLABE'
    ]
  };

  const generateCountrySpecificData = (type: string, index: number) => {
    switch (type) {
      // India specific
      case 'PAN Number':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      case 'Aadhaar Number':
        return `${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;
      case 'GST Number':
        return `${Math.floor(Math.random() * 90) + 10}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}`;
      case 'IFSC Code':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}0${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      case 'UPI ID':
        return `user${index + 1}@paytm`;
      case 'PIN Code':
        return `${Math.floor(Math.random() * 900000) + 100000}`;
      case 'EPF Number':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}/${Math.floor(Math.random() * 90000) + 10000}/${Math.floor(Math.random() * 9000000) + 1000000}`;

      // US specific
      case 'SSN':
        return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
      case 'Driver License':
        return `DL${Math.floor(Math.random() * 90000000) + 10000000}`;
      case 'Tax ID':
        return `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`;
      case 'ZIP Code':
        return `${Math.floor(Math.random() * 90000) + 10000}`;

      // UK specific
      case 'National Insurance Number':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 90) + 10}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      case 'Postcode':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      case 'VAT Number':
        return `GB${Math.floor(Math.random() * 900000000) + 100000000}`;

      // Generic
      case 'Passport':
        return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90000000) + 10000000}`;
      case 'Phone':
        return `+${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      case 'Bank Account':
        return `${Math.floor(Math.random() * 900000000000) + 100000000000}`;
      case 'Credit Card':
        return `4${Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0')}`;

      default:
        return `${type}_${index + 1}`;
    }
  };

  const [selectedFields, setSelectedFields] = useState({
    firstName: true,
    lastName: true,
    email: true,
    phone: false,
    address: false,
    city: false,
    zipCode: false,
    country: false,
    company: false,
    jobTitle: false,
    avatarUrl: false,
    username: false,
    dateOfBirth: false,
    website: false,
    uuid: false,
    iban: false,
    product: false,
    price: false,
    creditCard: false,
    loremText: false,
    // Country-specific fields
    socialSecurityNumber: false,
    nationalId: false,
    passport: false,
    bankAccount: false,
    taxId: false,
    drivingLicense: false,
    healthInsurance: false,
    postalCode: false,
    region: false,
    currency: false
  });

  const generateData = () => {
    const data = [];
    for (let i = 0; i < recordCount; i++) {
      const record = {};

      // Set locale based on selected country
      //faker.setLocale(getLocaleForCountry(selectedCountry));

      // if (selectedFields.firstName) record.firstName = faker.person.firstName();
      // if (selectedFields.lastName) record.lastName = faker.person.lastName();
      // if (selectedFields.email) record.email = faker.internet.email();
      // if (selectedFields.phone) record.phone = getCountrySpecificPhone(selectedCountry);
      // if (selectedFields.address) record.address = faker.location.streetAddress();
      // if (selectedFields.city) record.city = faker.location.city();
      // if (selectedFields.zipCode) record.zipCode = getCountrySpecificZipCode(selectedCountry);
      // if (selectedFields.country) record.country = selectedCountry;
      // if (selectedFields.company) record.company = faker.company.name();
      // if (selectedFields.jobTitle) record.jobTitle = faker.person.jobTitle();
      // if (selectedFields.avatarUrl) record.avatarUrl = faker.image.avatar();
      // if (selectedFields.username) record.username = faker.internet.userName();
      // if (selectedFields.dateOfBirth) record.dateOfBirth = faker.date.past({ years: 50 }).toISOString().split('T')[0];
      // if (selectedFields.website) record.website = faker.internet.url();
      // if (selectedFields.uuid) record.uuid = faker.string.uuid();
      // if (selectedFields.iban) record.iban = getCountrySpecificIBAN(selectedCountry);
      // if (selectedFields.product) record.product = faker.commerce.productName();
      // if (selectedFields.price) record.price = faker.commerce.price({ symbol: getCurrencySymbol(selectedCountry) });
      // if (selectedFields.creditCard) record.creditCard = faker.finance.creditCardNumber();
      // if (selectedFields.loremText) record.loremText = faker.lorem.paragraph();

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
              record[field.id] = `https://i.pravatar.cc/150?img=${(i % 70) + 1}`;
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

      // Country-specific fields
      if (selectedFields.socialSecurityNumber) record.socialSecurityNumber = generateCountrySpecificData("SSN", i);
      if (selectedFields.nationalId) record.nationalId = generateCountrySpecificData("National ID", i);
      if (selectedFields.passport) record.passport = generateCountrySpecificData("Passport", i);
      if (selectedFields.bankAccount) record.bankAccount = generateCountrySpecificData("Bank Account", i);
      if (selectedFields.taxId) record.taxId = generateCountrySpecificData("Tax ID", i);
      if (selectedFields.drivingLicense) record.drivingLicense = generateCountrySpecificData("Driving License", i);
      //if (selectedFields.healthInsurance) record.healthInsurance = getCountrySpecificHealthInsurance(selectedCountry);
      if (selectedFields.postalCode) record.postalCode = generateCountrySpecificData("Postal Code", i);
      //if (selectedFields.region) record.region = getCountrySpecificRegion(selectedCountry);
      //if (selectedFields.currency) record.currency = getCurrencyCode(selectedCountry);
      data.push(record);
    }

    setGeneratedData(data);
  };

  // Helper functions for country-specific data
  const getLocaleForCountry = (country: string) => {
    const localeMap: { [key: string]: string } = {
      'United States': 'en_US',
      'United Kingdom': 'en_GB',
      'India': 'en_IN',
      'Germany': 'de',
      'France': 'fr',
      'Japan': 'ja',
      'China': 'zh_CN',
      'Brazil': 'pt_BR',
      'Spain': 'es',
      'Italy': 'it'
    };
    return localeMap[country] || 'en_US';
  };

  const generateFakeDataByCountry = (type: string, country: string): string => {
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

  const getCountrySpecificPhone = (country: string) => {
    const phoneFormats: { [key: string]: string } = {
      'US': '+1-###-###-####',
      'GB': '+44-####-######',
      'IN': '+91-#####-#####',
      'DE': '+49-###-########',
      'FR': '+33-#-##-##-##-##',
      'JP': '+81-##-####-####',
      'CN': '+86-###-####-####',
      'BR': '+55-##-#####-####',
      'ES': '+34-###-###-###',
      'IT': '+39-###-###-####'
    };
    return phoneFormats[country] || '+1-###-###-####';
  };

  const getCountrySpecificZipCode = (country: string) => {
    const zipFormats: { [key: string]: string } = {
      'US': '#####',
      'GB': '??# #??',
      'IN': '######',
      'DE': '#####',
      'FR': '#####',
      'JP': '###-####',
      'CN': '######',
      'BR': '#####-###',
      'ES': '#####',
      'IT': '#####'
    };
    return zipFormats[country] || '#####';
  };

  const getCurrencySymbol = (country: string) => {
    const currencyMap: { [key: string]: string } = {
      'US': '$',
      'GB': '£',
      'IN': '₹',
      'DE': '€',
      'FR': '€',
      'JP': '¥',
      'CN': '¥',
      'BR': 'R$',
      'ES': '€',
      'IT': '€'
    };
    return currencyMap[country] || '$';
  };

  const getCountrySpecificIBAN = (country: string): string => {
    const ibanFormats: { [key: string]: string } = {
        'US': '############',
        'GB': '########',
        'IN': '###############',
        'DE': '####################',
        'FR': '#####################',
        'JP': '#######',
        'CN': '###############',
        'BR': '########-#',
        'ES': '####################',
        'IT': '###########'
    };
    return ibanFormats[country] || '############';
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

             <Card>
              <CardHeader>
                <CardTitle>Data Fields</CardTitle>
                <CardDescription>
                  Select which fields to include in your test data
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.price}
                    onChange={(e) => setSelectedFields({...selectedFields, price: e.target.checked})}
                  />
                  <span>Price</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.loremText}
                    onChange={(e) => setSelectedFields({...selectedFields, loremText: e.target.checked})}
                  />
                  <span>Lorem Text</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.socialSecurityNumber}
                    onChange={(e) => setSelectedFields({...selectedFields, socialSecurityNumber: e.target.checked})}
                  />
                  <span>Social Security</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.nationalId}
                    onChange={(e) => setSelectedFields({...selectedFields, nationalId: e.target.checked})}
                  />
                  <span>National ID</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.passport}
                    onChange={(e) => setSelectedFields({...selectedFields, passport: e.target.checked})}
                  />
                  <span>Passport</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.bankAccount}
                    onChange={(e) => setSelectedFields({...selectedFields, bankAccount: e.target.checked})}
                  />
                  <span>Bank Account</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.taxId}
                    onChange={(e) => setSelectedFields({...selectedFields, taxId: e.target.checked})}
                  />
                  <span>Tax ID</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.drivingLicense}
                    onChange={(e) => setSelectedFields({...selectedFields, drivingLicense: e.target.checked})}
                  />
                  <span>Driving License</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.healthInsurance}
                    onChange={(e) => setSelectedFields({...selectedFields, healthInsurance: e.target.checked})}
                  />
                  <span>Health Insurance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.region}
                    onChange={(e) => setSelectedFields({...selectedFields, region: e.target.checked})}
                  />
                  <span>Region/State</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.currency}
                    onChange={(e) => setSelectedFields({...selectedFields, currency: e.target.checked})}
                  />
                  <span>Currency</span>
                </label>
              </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex gap-4">
              <Button
                onClick={generateData}
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