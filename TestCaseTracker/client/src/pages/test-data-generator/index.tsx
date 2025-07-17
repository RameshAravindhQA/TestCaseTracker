import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Download, RefreshCw, Globe, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import Lottie from 'lottie-react';
import businessmanRocketData from '../../public/lottie/businessman-rocket.json';

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
  Canada: {
    name: () => {
      const firstNames = ['Liam', 'William', 'Lucas', 'Noah', 'Ethan', 'Nathan', 'Alexander', 'James', 'Benjamin', 'Daniel', 'Emma', 'Olivia', 'Sophia', 'Chloe', 'Isabella', 'Abigail', 'Mia', 'Emily', 'Madison', 'Ella'];
      const lastNames = ['Tremblay', 'Gagnon', 'Roy', 'Bouchard', 'Gauthier', 'Lavoie', 'Fortin', 'Ouellet', 'Côté', 'Leclerc', 'Smith', 'Brown', 'Williams', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Moore', 'Martin', 'Jackson'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.ca', 'outlook.com', 'hotmail.ca', 'sympatico.ca'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const areaCode = Math.floor(Math.random() * 800) + 200;
      const exchange = Math.floor(Math.random() * 800) + 200;
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `+1 (${areaCode}) ${exchange}-${number}`;
    },
    postalCode: () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let postalCode = '';
      postalCode += letters[Math.floor(Math.random() * letters.length)];
      postalCode += numbers[Math.floor(Math.random() * numbers.length)];
      postalCode += letters[Math.floor(Math.random() * letters.length)];
      postalCode += ' ';
      postalCode += numbers[Math.floor(Math.random() * numbers.length)];
      postalCode += letters[Math.floor(Math.random() * letters.length)];
      postalCode += numbers[Math.floor(Math.random() * numbers.length)];
      return postalCode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Main Street', 'Queen Street', 'Elm Avenue', 'Maple Avenue', 'Park Avenue', 'Victoria Street', 'Albert Street', 'Church Street', 'King Street', 'First Street'];
      const cities = ['Toronto', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Vancouver', 'Quebec City', 'Hamilton', 'Kitchener'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postalCode = countryData.Canada.postalCode();
      return `${houseNumbers} ${street}, ${city}, ON ${postalCode}`;
    },
  },
  Australia: {
    name: () => {
      const firstNames = ['Oliver', 'Jack', 'William', 'Noah', 'Thomas', 'James', 'Charlie', 'Henry', 'Oscar', 'Leo', 'Olivia', 'Charlotte', 'Mia', 'Amelia', 'Isla', 'Ava', 'Sophie', 'Emily', 'Grace', 'Chloe'];
      const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'White', 'Martin', 'Jackson', 'Thompson', 'Nguyen', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com.au', 'outlook.com', 'hotmail.com', 'bigpond.com'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const areaCode = Math.floor(Math.random() * 90) + 2;
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+61 ${areaCode} ${number.toString().slice(0, 4)} ${number.toString().slice(4)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 4; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Main Street', 'High Street', 'Park Avenue', 'George Street', 'Elizabeth Street', 'Victoria Street', 'Queen Street', 'Church Street', 'King Street', 'Albert Street'];
      const cities = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Geelong'];
      const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'QLD', 'ACT', 'NSW', 'NSW', 'VIC'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const postcode = countryData.Australia.postcode();
      return `${houseNumbers} ${street}, ${city} ${state} ${postcode}`;
    },
  },
  Germany: {
    name: () => {
      const firstNames = ['Emilia', 'Hannah', 'Mia', 'Emma', 'Sophia', 'Lena', 'Lea', 'Marie', 'Anna', 'Luisa', 'Ben', 'Paul', 'Leon', 'Finn', 'Jonas', 'Elias', 'Felix', 'Maximilian', 'Luis', 'Luca'];
      const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.de', 'outlook.de', 'web.de', 'gmx.de'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const areaCode = Math.floor(Math.random() * 9999) + 100;
      const number = Math.floor(Math.random() * 9000000) + 1000000;
      return `+49 ${areaCode} ${number.toString().slice(0, 3)} ${number.toString().slice(3)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Hauptstraße', 'Bahnhofstraße', 'Dorfstraße', 'Schulstraße', 'Gartenstraße', 'Goethestraße', 'Lessingstraße', 'Beethovenstraße', 'Rosenstraße', 'Lindenstraße'];
      const cities = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'];
      const postcode = countryData.Germany.postcode();
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];

      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
  France: {
    name: () => {
      const firstNames = ['Emma', 'Louise', 'Jade', 'Alice', 'Chloé', 'Léa', 'Manon', 'Inès', 'Camille', 'Sarah', 'Gabriel', 'Raphaël', 'Louis', 'Lucas', 'Arthur', 'Hugo', 'Jules', 'Adam', 'Théo', 'Nathan'];
      const lastNames = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.fr', 'outlook.fr', 'orange.fr', 'sfr.fr'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 900000000) + 100000000;
      return `+33 ${number.toString().slice(0, 1)} ${number.toString().slice(1, 3)} ${number.toString().slice(3, 5)} ${number.toString().slice(5, 7)} ${number.toString().slice(7, 9)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Rue de la République', 'Rue du General de Gaulle', 'Rue Victor Hugo', 'Rue de la Mairie', 'Rue des Écoles', 'Rue Pasteur', 'Rue de la Gare', 'Rue Jean Jaurès', 'Rue du 8 Mai 1945', 'Rue des Lilas'];
      const cities = ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.France.postcode();
      return `${houseNumbers} ${street}, ${postcode} ${city}`;
    },
  },
  Japan: {
    name: () => {
      const firstNames = ['Haruto', 'Minato', 'Sora', 'Aoi', 'Itsuki', 'Hinata', 'Riku', 'Asahi', 'Yuto', 'Yuma', 'Yuna', 'Hina', 'Sakura', 'Akari', 'Rin', 'Aoi', 'Himari', 'Mei', 'Mio', 'Kokona'];
      const lastNames = ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki'];
      return `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.co.jp', 'outlook.jp', 'softbank.ne.jp', 'docomo.ne.jp'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 900000000) + 100000000;
      return `+81 0${number.toString().slice(0, 2)}-${number.toString().slice(2, 6)}-${number.toString().slice(6, 10)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 3; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      postcode += '-';
      for (let i = 0; i < 4; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Chuo-dori', 'Omotesando', 'Ginza', 'Shibuya', 'Harajuku', 'Roppongi', 'Akihabara', 'Ueno', 'Asakusa', 'Shinjuku'];
      const cities = ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Japan.postcode();
      return `${city}, ${street}, ${houseNumbers}, ${postcode}`;
    },
  },
  China: {
    name: () => {
      const firstNames = ['Wei', 'Li', 'Jie', 'Ming', 'Yan', 'Fang', 'Shu', 'Juan', 'Hong', 'Ying', 'Tao', 'Jun', 'Hui', 'Ping', 'Lei', 'Na', 'Lin', 'Ke', 'Qing', 'Xiao'];
      const lastNames = ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Hu', 'Zhu', 'Gao', 'Lin', 'He', 'Guo', 'Ma', 'Luo'];
      return `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com.cn', '163.com', 'qq.com', 'sina.com'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 9000000000) + 1000000000;
      return `+86 1${number.toString().slice(0, 2)} ${number.toString().slice(2, 6)} ${number.toString().slice(6, 10)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 6; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Jiefang Road', 'Zhongshan Road', 'Renmin Road', 'Xinhua Road', 'Changjiang Road', 'Beijing Road', 'Shanghai Road', 'Guangzhou Road', 'Shenzhen Road', 'Nanjing Road'];
      const cities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Chongqing', 'Tianjin', 'Nanjing'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.China.postcode();
      return `${city}, ${street}, ${houseNumbers}, ${postcode}`;
    },
  },
  Brazil: {
    name: () => {
      const firstNames = ['Maria', 'Ana', 'Francisca', 'Antônia', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patrícia', 'Aline', 'José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Marcos', 'Luiz', 'Fernando', 'Ricardo'];
      const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Carvalho', 'Andrade', 'Machado', 'Nascimento', 'Martins', 'Campos', 'Rocha', 'Correia', 'Cardoso'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com.br', 'outlook.com.br', 'uol.com.br', 'terra.com.br'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const ddd = ['11', '21', '31', '41', '51', '61', '71', '81', '91', '27'];
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+55 (${ddd[Math.floor(Math.random() * ddd.length)]}) 9${number.toString().slice(0, 4)}-${number.toString().slice(4, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      postcode += '-';
      for (let i = 0; i < 3; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Avenida Paulista', 'Rua Augusta', 'Avenida Brasil', 'Rua da Consolação', 'Avenida Ipiranga', 'Rua 25 de Março', 'Avenida Faria Lima', 'Rua Teodoro Sampaio', 'Avenida Rebouças', 'Rua Oscar Freire'];
      const cities = ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Brazil.postcode();
      return `${street}, ${houseNumbers} - ${city}, ${postcode}`;
    },
  },
  Mexico: {
    name: () => {
      const firstNames = ['Sofia', 'Valentina', 'Isabella', 'Ximena', 'Camila', 'María', 'Daniela', 'Valeria', 'Renata', 'Victoria', 'Santiago', 'Mateo', 'Sebastián', 'Matías', 'Nicolás', 'Alejandro', 'Diego', 'Samuel', 'Daniel', 'Gabriel'];
      const lastNames = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Flores', 'Jiménez', 'Moreno', 'Díaz', 'Reyes', 'Torres', 'Gutiérrez', 'Vargas', 'Mendoza', 'Ruiz', 'Castillo'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.com.mx', 'hotmail.com', 'live.com.mx', 'prodigy.net.mx'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const lada = ['55', '81', '33', '664', '999', '777', '656', '993', '442', '844'];
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+52 ${lada[Math.floor(Math.random() * lada.length)]} ${number.toString().slice(0, 4)}-${number.toString().slice(4, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Avenida Insurgentes', 'Paseo de la Reforma', 'Avenida Juárez', 'Avenida Universidad', 'Avenida Chapultepec', 'Avenida Constituyentes', 'Avenida Revolución', 'Avenida División del Norte', 'Avenida Cuauhtémoc', 'Avenida Miguel Ángel de Quevedo'];
      const cities = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Ciudad Juárez', 'Zapopan', 'Guadalupe', 'Nezahualcóyotl'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Mexico.postcode();
      return `${street}, ${houseNumbers} - ${city}, ${postcode}`;
    },
  },
  Italy: {
    name: () => {
      const firstNames = ['Sofia', 'Aurora', 'Giulia', 'Alice', 'Emma', 'Giorgia', 'Beatrice', 'Greta', 'Martina', 'Anna', 'Leonardo', 'Alessandro', 'Tommaso', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Francesco', 'Edoardo'];
      const lastNames = ['Rossi', 'Ferrari', 'Russo', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: (name: string) => {
      const domains = ['gmail.com', 'yahoo.it', 'libero.it', 'hotmail.it', 'tiscali.it'];
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 900000000) + 100000000;
      return `+39 3${number.toString().slice(0, 2)} ${number.toString().slice(2, 5)} ${number.toString().slice(5, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Via Roma', 'Corso Italia', 'Via Garibaldi', 'Viale Dante', 'Via Mazzini', 'Via Cavour', 'Via Veneto', 'Corso Vittorio Emanuele', 'Via Montenapoleone', 'Via dei Fori Imperiali'];
      const cities = ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Italy.postcode();
      return `${street}, ${houseNumbers} - ${city}, ${postcode}`;
    },
  },
  Spain: {
    name: () => {
      const firstNames = ['Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Daniela', 'Valeria', 'Alba', 'Noa', 'Sara', 'Hugo', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Álvaro', 'David', 'Adrián', 'Mario', 'Enzo'];
      const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Díaz', 'Jiménez', 'Álvarez', 'Moreno', 'Muñoz', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vázquez'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.es', 'hotmail.es', 'outlook.es', 'telefonica.net'];
      const name = countryData.Spain.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 900000000) + 100000000;
      return `+34 6${number.toString().slice(0, 2)} ${number.toString().slice(2, 5)} ${number.toString().slice(5, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Gran Vía', 'Calle Alcalá', 'Paseo de Gracia', 'Calle Preciados', 'Calle Serrano', 'Rambla de Catalunya', 'Calle Mayor', 'Calle Fuencarral', 'Avenida Diagonal', 'Calle Princesa'];
      const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Spain.postcode();
      return `${street}, ${houseNumbers} - ${city}, ${postcode}`;
    },
  },
  Russia: {
    name: () => {
      const firstNames = ['Александр', 'Михаил', 'Иван', 'Дмитрий', 'Максим', 'Андрей', 'Сергей', 'Артём', 'Никита', 'Владимир', 'Анастасия', 'Елена', 'Ольга', 'Наталья', 'Татьяна', 'Ирина', 'Юлия', 'Светлана', 'Мария', 'Екатерина'];
      const lastNames = ['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев'];
      return `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yandex.ru', 'mail.ru', 'rambler.ru', 'outlook.com'];
      const name = countryData.Russia.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 9000000000) + 1000000000;
      return `+7 9${number.toString().slice(0, 2)} ${number.toString().slice(2, 5)}-${number.toString().slice(5, 7)}-${number.toString().slice(7, 9)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 6; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Тверская улица', 'Арбат', 'Невский проспект', 'Садовое кольцо', 'Ленинский проспект', 'Кутузовский проспект', 'Варшавское шоссе', 'Рублевское шоссе', 'Дмитровское шоссе', 'Ярославское шоссе'];
      const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Russia.postcode();
      return `${street}, ${houseNumbers} - ${city}, ${postcode}`;
    },
  },
  'South Korea': {
    name: () => {
      const firstNames = ['민준', '서준', '도윤', '시우', '주원', '하준', '지훈', '현우', '건우', '유준', '서연', '하윤', '서아', '지우', '아윤', '채원', '수아', '지민', '예나', '다은'];
      const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '유', '홍'];
      return `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'nate.com'];
      const name = countryData['South Korea'].name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+82 10-${number.toString().slice(0, 4)}-${number.toString().slice(4, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['테헤란로', '강남대로', '세종대로', '을지로', '종로', '충무로', '서초대로', '압구정로', '청담동', '명동'];
      const cities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '창원', '성남'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData['South Korea'].postcode();
      return `${city}, ${street}, ${houseNumbers}, ${postcode}`;
    },
  },
  Netherlands: {
    name: () => {
      const firstNames = ['Emma', 'Julia', 'Mila', 'Sophie', 'Tess', 'Liv', 'Noa', 'Saar', 'Lotte', 'Evi', 'Sem', 'Noah', 'Lucas', 'Finn', 'Liam', 'Daan', 'Luuk', 'Jesse', 'Milan', 'Thomas'];
      const lastNames = ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bosch', 'Vos', 'Peters', 'Hendriks', 'Dekker', 'van Leeuwen', 'de Graaf'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.nl', 'hotmail.com', 'outlook.com', 'ziggo.nl'];
      const name = countryData.Netherlands.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+31 6${number.toString().slice(0, 2)} ${number.toString().slice(2, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
    },
    postcode: () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let postcode = '';
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += numbers[Math.floor(Math.random() * numbers.length)];
      postcode += ' ';
      postcode += letters[Math.floor(Math.random() * letters.length)];
      postcode += letters[Math.floor(Math.random() * letters.length)];
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 999) + 1;
      const streets = ['Herengracht', 'Keizersgracht', 'Prinsengracht', 'Leidsestraat', 'Kalverstraat', 'Utrechtsestraat', 'Nieuwendijk', 'Damrak', 'Reguliersbreestraat', 'Rembrandtplein'];
      const cities = ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Netherlands.postcode();
      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
  Sweden: {
    name: () => {
      const firstNames = ['Alice', 'Ella', 'Maja', 'Olivia', 'Ebba', 'William', 'Lucas', 'Liam', 'Oscar', 'Hugo'];
      const lastNames = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Svensson', 'Persson', 'Pettersson'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.se', 'hotmail.com', 'outlook.com', 'spray.se'];
      const name = countryData.Sweden.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+46 7${number.toString().slice(0, 1)} ${number.toString().slice(1, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 3; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      postcode += ' ';
      for (let i = 0; i < 2; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Drottninggatan', 'Kungsgatan', 'Vasagatan', 'Sveavägen', 'Storgatan', 'Östermalmsgatan', 'Götgatan', 'Hornsgatan', 'Odengatan', 'Valhallavägen'];
      const cities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro', 'Västerås', 'Helsingborg', 'Jönköping', 'Norrköping'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Sweden.postcode();
      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
  Norway: {
    name: () => {
      const firstNames = ['Emma', 'Nora', 'Olivia', 'Sofia', 'Ingrid', 'Jakob', 'Lucas', 'Oliver', 'Noah', 'William'];
      const lastNames = ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Nilsen', 'Pedersen', 'Kristiansen', 'Jensen', 'Karlsen'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.no', 'hotmail.com', 'outlook.com', 'online.no'];
      const name = countryData.Norway.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+47 ${number.toString().slice(0, 3)} ${number.toString().slice(3, 5)} ${number.toString().slice(5, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 4; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Storgata', 'Karl Johans gate', 'Bogstadveien', 'Frognerveien', 'Pilestredet', 'Grønland', 'Thorvald Meyers gate', 'Markveien', 'Akersgata', 'Bygdøy allé'];
      const cities = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Drammen', 'Fredrikstad', 'Skien', 'Bodø', 'Tromsø'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Norway.postcode();
      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
  Denmark: {
    name: () => {
      const firstNames = ['Ida', 'Emma', 'Sofia', 'Clara', 'Ella', 'William', 'Noah', 'Oliver', 'Oscar', 'Lucas'];
      const lastNames = ['Jensen', 'Nielsen', 'Hansen', 'Andersen', 'Pedersen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Olsen'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.dk', 'hotmail.com', 'outlook.com', 'tdc.dk'];
      const name = countryData.Denmark.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+45 ${number.toString().slice(0, 2)} ${number.toString().slice(2, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 4; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Vesterbrogade', 'Nørrebrogade', 'Østerbrogade', 'Amagerbrogade', 'Frederiksberg Allé', 'Strøget', 'Jægersborggade', 'Istedgade', 'Gothersgade', 'Nyhavn'];
      const cities = ['København', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Vejle', 'Randers', 'Kolding', 'Horsens', 'Roskilde'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Denmark.postcode();
      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
  Finland: {
    name: () => {
      const firstNames = ['Aino', 'Eevi', 'Helmi', 'Sofia', 'Emma', 'Leevi', 'Elias', 'Oliver', 'Leo', 'Eino'];
      const lastNames = ['Korhonen', 'Virtanen', 'Mäkinen', 'Nieminen', 'Mäkelä', 'Hämäläinen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen'];
      return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => {
      const domains = ['gmail.com', 'yahoo.fi', 'hotmail.com', 'outlook.com', 'netti.fi'];
      const name = countryData.Finland.name();
      const cleanName = name.toLowerCase().replace(/\s+/g, '.');
      return `${cleanName}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },
    phone: () => {
      const number = Math.floor(Math.random() * 90000000) + 10000000;
      return `+358 4${number.toString().slice(0, 1)} ${number.toString().slice(1, 4)} ${number.toString().slice(4, 6)} ${number.toString().slice(6, 8)}`;
    },
    postcode: () => {
      const numbers = '0123456789';
      let postcode = '';
      for (let i = 0; i < 5; i++) {
        postcode += numbers[Math.floor(Math.random() * numbers.length)];
      }
      return postcode;
    },
    address: () => {
      const houseNumbers = Math.floor(Math.random() * 99) + 1;
      const streets = ['Aleksanterinkatu', 'Mannerheimintie', 'Esplanadi', 'Hämeenkatu', 'Kauppakatu', 'Lönnrotinkatu', 'Bulevardi', 'Eerikinkatu', 'Uudenmaankatu', 'Annankatu'];
      const cities = ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Turku', 'Oulu', 'Lahti', 'Kuopio', 'Jyväskylä', 'Pori'];

      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const postcode = countryData.Finland.postcode();
      return `${street} ${houseNumbers}, ${postcode} ${city}`;
    },
  },
};

const dataTypes = {
  personal: ['name', 'email', 'phone', 'address'],
  indian: ['pan', 'aadhaar', 'gst', 'ifsc', 'upi', 'drivingLicense', 'passport', 'vehicleNumber'],
  usa: ['ssn'],
  uk: ['postcode'],
  canada: ['postalCode'],
  australia: ['postcode'],
  germany: ['postcode'],
  france: ['postcode'],
  japan: ['postcode'],
  china: ['postcode'],
  brazil: ['postcode'],
  mexico: ['postcode'],
  italy: ['postcode'],
  spain: ['postcode'],
  russia: ['postcode'],
  'south korea': ['postcode'],
  netherlands: ['postcode'],
  sweden: ['postcode'],
  norway: ['postcode'],
  denmark: ['postcode'],
  finland: ['postcode'],
  financial: ['creditCard', 'bankAccount'],
  internet: ['username', 'password', 'ipAddress', 'macAddress'],
  datetime: ['date', 'time', 'timestamp'],
  business: ['company', 'jobTitle', 'department'],
  lorem: ['sentence', 'paragraph', 'word'],
};

const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
];

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
          <div className="mb-6 flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Data Generator</h1>
            <p className="text-muted-foreground mt-1">Generate realistic test data for various countries and use cases</p>
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
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.flag} {country.name}
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
                  {selectedCountry === 'Canada' && (
                    <div>
                      <Label className="text-sm font-medium text-orange-600">Canada Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.canada.map(type => (
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
                  {selectedCountry === 'Australia' && (
                    <div>
                      <Label className="text-sm font-medium text-yellow-600">Australia Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.australia.map(type => (
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
                  {selectedCountry === 'Germany' && (
                    <div>
                      <Label className="text-sm font-medium text-lime-600">Germany Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.germany.map(type => (
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
                  {selectedCountry === 'France' && (
                    <div>
                      <Label className="text-sm font-medium text-fuchsia-600">France Specific</Label>
                      <div className="space-y-2 mt-1">
                        {dataTypes.france.map(type => (
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
                {selectedCountry === 'Japan' && (
                  <div>
                    <Label className="text-sm font-medium text-emerald-600">Japan Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.japan.map(type => (
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
                {selectedCountry === 'China' && (
                  <div>
                    <Label className="text-sm font-medium text-rose-600">China Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.china.map(type => (
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
                {selectedCountry === 'Brazil' && (
                  <div>
                    <Label className="text-sm font-medium text-amber-600">Brazil Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.brazil.map(type => (
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
                {selectedCountry === 'Mexico' && (
                  <div>
                    <Label className="text-sm font-medium text-teal-600">Mexico Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.mexico.map(type => (
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
                {selectedCountry === 'Italy' && (
                  <div>
                    <Label className="text-sm font-medium text-violet-600">Italy Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.italy.map(type => (
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
                {selectedCountry === 'Spain' && (
                  <div>
                    <Label className="text-sm font-medium text-indigo-600">Spain Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.spain.map(type => (
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
                {selectedCountry === 'Russia' && (
                  <div>
                    <Label className="text-sm font-medium text-lime-800">Russia Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.russia.map(type => (
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
                {selectedCountry === 'South Korea' && (
                  <div>
                    <Label className="text-sm font-medium text-pink-800">South Korea Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes['south korea'].map(type => (
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
                {selectedCountry === 'Netherlands' && (
                  <div>
                    <Label className="text-sm font-medium text-stone-800">Netherlands Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.netherlands.map(type => (
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
                {selectedCountry === 'Sweden' && (
                  <div>
                    <Label className="text-sm font-medium text-sky-800">Sweden Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.sweden.map(type => (
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
                {selectedCountry === 'Norway' && (
                  <div>
                    <Label className="text-sm font-medium text-zinc-800">Norway Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.norway.map(type => (
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
                {selectedCountry === 'Denmark' && (
                  <div>
                    <Label className="text-sm font-medium text-slate-800">Denmark Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.denmark.map(type => (
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
                {selectedCountry === 'Finland' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-800">Finland Specific</Label>
                    <div className="space-y-2 mt-1">
                      {dataTypes.finland.map(type => (
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

                  {/* Financial Data Types */}
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