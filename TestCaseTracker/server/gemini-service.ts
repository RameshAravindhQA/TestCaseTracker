import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Google Gemini AI with proper error handling
let genAI: GoogleGenerativeAI | null = null;
let initializationError: string | null = null;

try {
  console.log('🔧 Initializing Gemini AI...');

  const apiKey = process.env.GOOGLE_API_KEY;
  console.log('🔧 API Key status:', apiKey ? `CONFIGURED (${apiKey.substring(0, 10)}...)` : 'MISSING');
  console.log('🔧 Full environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : 'NONE'
  });

  if (apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim() !== '' && apiKey.startsWith('AIza')) {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI initialized successfully with valid API key');
  } else {
    initializationError = 'Google Gemini API key not configured or invalid format';
    console.warn('❌ Google Gemini API key not configured or invalid format');
    console.warn('🔧 Expected format: AIzaSy... but got:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');
    console.warn('🔧 Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
  }
} catch (error) {
  initializationError = `Gemini initialization failed: ${error.message}`;
  console.error('❌ Gemini initialization error:', error);
}

export interface TestCaseGenerationRequest {
  requirement: string;
  projectContext?: string;
  moduleContext?: string;
  testType: string;
  priority: string;
  websiteUrl?: string;
  elementInspection?: string;
  userFlows?: string;
  businessRules?: string;
  inputType: 'text' | 'url' | 'image' | 'inspect';
  images?: Express.Multer.File[];
}

export interface GeneratedTestCase {
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  testType: string;
  coverage: string;
  category: string;
  tags: string[];
}

export interface TestCaseGenerationResponse {
  testCases: GeneratedTestCase[];
  analysis: {
    coverage: string;
    complexity: string;
    focusAreas: string;
    suggestions: string[];
  };
  message: string;
  source: 'gemini-ai' | 'mock-service';
}

export class GeminiAIService {
  private model: any = null;
  private visionModel: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (genAI && !initializationError) {
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        this.visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
        this.isInitialized = true;
        console.log('✅ Gemini models initialized successfully');
      } else {
        console.warn('❌ Gemini models not initialized:', initializationError || 'Unknown error');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('❌ Gemini model initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    console.log('🚀 Starting test case generation...', {
      inputType: request.inputType,
      hasGemini: this.isInitialized,
      requirement: request.requirement?.substring(0, 50) + '...',
      apiKeyConfigured: !!genAI,
      initError: initializationError
    });

    // Try Gemini AI first if properly configured
    if (this.isInitialized && genAI && !initializationError) {
      try {
        console.log('🤖 Attempting to use Google Gemini AI...');
        return await this.generateWithGemini(request);
      } catch (error) {
        console.error('❌ Gemini AI failed, falling back to mock service:', error);
        return this.getMockResponse(request);
      }
    } else {
      console.log('🎭 Using intelligent mock service (Gemini not available)');
      console.log('🔧 Reason:', initializationError || 'Gemini not initialized');
      return this.getMockResponse(request);
    }
  }

  private async generateWithGemini(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    const prompt = this.buildGeminiPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Gemini response received:', text.substring(0, 200) + '...');
      
      // Clean up the response text - remove any markdown or extra formatting
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Parse the JSON response
      let testCases;
      try {
        testCases = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response as JSON:', parseError);
        console.log('🔍 Raw response:', text);
        // Fall back to mock service if JSON parsing fails
        throw new Error('Failed to parse Gemini response as valid JSON');
      }
      
      // Ensure testCases is an array
      if (!Array.isArray(testCases)) {
        console.error('❌ Gemini response is not an array:', typeof testCases);
        throw new Error('Gemini response must be an array of test cases');
      }
      
      return {
        testCases: testCases,
        analysis: {
          coverage: 'Comprehensive',
          complexity: this.getComplexityLevel(request),
          focusAreas: this.getFocusAreas(request),
          suggestions: this.getSuggestions(request)
        },
        message: `Generated ${testCases.length} test cases using Google Gemini AI`,
        source: 'gemini-ai'
      };
    } catch (error) {
      console.error('❌ Gemini AI generation error:', error);
      throw error;
    }
  }

  private buildGeminiPrompt(request: TestCaseGenerationRequest): string {
    return `You are an expert QA engineer. Generate comprehensive test cases based on the following requirement:

Requirement: ${request.requirement}
${request.projectContext ? `Project Context: ${request.projectContext}` : ''}
${request.moduleContext ? `Module Context: ${request.moduleContext}` : ''}
Test Type: ${request.testType || 'functional'}
Priority: ${request.priority || 'Medium'}
Input Type: ${request.inputType || 'text'}

Generate 4-6 detailed test cases that cover:
1. Happy path scenarios
2. Edge cases  
3. Error scenarios
4. Boundary conditions
5. Integration points

Return ONLY a valid JSON array with the following structure:
[
  {
    "feature": "Feature name",
    "testObjective": "Clear test objective",
    "preConditions": "Prerequisites",
    "testSteps": "1. Step one\\n2. Step two\\n3. Step three",
    "expectedResult": "Expected outcome",
    "priority": "High|Medium|Low",
    "testType": "${request.testType || 'functional'}",
    "coverage": "What this test covers",
    "category": "Test category",
    "tags": ["tag1", "tag2"]
  }
]

Ensure the response is valid JSON only, no additional text.`;
  }

  private getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
    console.log('🎭 Generating comprehensive mock response...');

    const mockTestCases = this.generateMockTestCases(request);

    return {
      testCases: mockTestCases,
      analysis: {
        coverage: 'Comprehensive',
        complexity: this.getComplexityLevel(request),
        focusAreas: this.getFocusAreas(request),
        suggestions: this.getSuggestions(request)
      },
      message: `Generated ${mockTestCases.length} comprehensive test cases using intelligent mock service`,
      source: 'mock-service'
    };
  }

  private generateMockTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const isRegistrationTest = request.requirement?.toLowerCase().includes('registration') || 
                              request.moduleContext?.toLowerCase().includes('registration');

    if (isRegistrationTest) {
      return this.getRegistrationTestCases(request);
    }

    switch (request.inputType) {
      case 'text':
        return this.getTextBasedTestCases(request);
      case 'url':
        return this.getUrlBasedTestCases(request);
      case 'image':
        return this.getImageBasedTestCases(request);
      case 'inspect':
        return this.getInspectionBasedTestCases(request);
      default:
        return this.getDefaultTestCases(request);
    }
  }

  private getRegistrationTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    return [
      {
        feature: "User Registration - Valid Data Entry",
        testObjective: "Verify successful user registration with valid data",
        preConditions: "Registration page is accessible and all required fields are displayed",
        testSteps: "1. Navigate to registration page\n2. Enter valid first name (e.g., 'John')\n3. Enter valid last name (e.g., 'Doe')\n4. Enter valid email address\n5. Enter strong password\n6. Confirm password\n7. Accept terms and conditions\n8. Click 'Register' button\n9. Verify success message\n10. Check user receives confirmation email",
        expectedResult: "User should be successfully registered, receive confirmation message, and get verification email",
        priority: "High",
        testType: request.testType || "functional",
        coverage: "Positive Testing",
        category: "Registration - Happy Path",
        tags: ["registration", "positive-testing", "user-creation", "email-verification"]
      },
      {
        feature: "User Registration - Email Validation",
        testObjective: "Verify email field validation with invalid email formats",
        preConditions: "Registration page is loaded",
        testSteps: "1. Navigate to registration page\n2. Enter valid first and last name\n3. Enter invalid email formats:\n   - Missing @ symbol\n   - Missing domain\n   - Invalid characters\n   - Empty email field\n4. Attempt to register\n5. Verify validation error messages",
        expectedResult: "Appropriate error messages should be displayed for each invalid email format",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Input Validation",
        category: "Registration - Validation",
        tags: ["registration", "negative-testing", "email-validation", "error-handling"]
      },
      {
        feature: "User Registration - Password Security",
        testObjective: "Verify password field validation and security requirements",
        preConditions: "Registration page is accessible",
        testSteps: "1. Navigate to registration page\n2. Fill valid details except password\n3. Test weak passwords:\n   - Too short (< 8 characters)\n   - No uppercase letters\n   - No special characters\n   - Common passwords\n4. Test password confirmation mismatch\n5. Verify validation messages\n6. Test strong password acceptance",
        expectedResult: "Weak passwords should be rejected with specific error messages. Strong passwords should be accepted",
        priority: "High",
        testType: "security",
        coverage: "Password Security",
        category: "Registration - Security",
        tags: ["registration", "password-security", "validation", "security-testing"]
      },
      {
        feature: "User Registration - Duplicate Prevention",
        testObjective: "Verify system prevents registration with existing email addresses",
        preConditions: "At least one user already registered in the system",
        testSteps: "1. Navigate to registration page\n2. Enter valid first name, last name\n3. Enter email address that already exists\n4. Enter valid password and confirmation\n5. Accept terms and conditions\n6. Click 'Register' button\n7. Verify error message appears",
        expectedResult: "System should display error message indicating email already exists",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Duplicate Prevention",
        category: "Registration - Business Logic",
        tags: ["registration", "duplicate-prevention", "negative-testing", "business-rules"]
      }
    ];
  }

  private getTextBasedTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const feature = request.requirement || 'Text-based functionality';
    return [
      {
        feature: `${feature} - Happy Path`,
        testObjective: `Verify successful ${feature.toLowerCase()} with valid data`,
        preConditions: "Application is accessible and feature is available",
        testSteps: "1. Navigate to the feature\n2. Enter valid input data\n3. Submit the form\n4. Verify successful completion",
        expectedResult: "Feature should work correctly with valid input",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Happy Path",
        category: "Core Functionality",
        tags: ["positive-testing", "core-flow", "happy-path"]
      },
      {
        feature: `${feature} - Input Validation`,
        testObjective: `Verify input validation for ${feature.toLowerCase()}`,
        preConditions: "Feature is accessible",
        testSteps: "1. Navigate to the feature\n2. Enter invalid data formats\n3. Submit form\n4. Verify validation messages\n5. Test boundary conditions",
        expectedResult: "Appropriate validation messages should be displayed",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Input Validation",
        category: "Data Validation",
        tags: ["validation", "negative-testing", "error-handling"]
      }
    ];
  }

  private getUrlBasedTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    return [
      {
        feature: "Website Navigation - Menu Links",
        testObjective: "Verify all navigation menu links work correctly",
        preConditions: `Website ${request.websiteUrl} is accessible`,
        testSteps: "1. Load the website\n2. Click on each menu item\n3. Verify pages load correctly\n4. Check for broken links",
        expectedResult: "All menu links should navigate to correct pages without errors",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Navigation Testing",
        category: "User Interface",
        tags: ["navigation", "ui-testing", "links"]
      },
      {
        feature: "Website Responsiveness - Mobile View",
        testObjective: "Verify website displays correctly on mobile devices",
        preConditions: `Website ${request.websiteUrl} is accessible`,
        testSteps: "1. Open website on mobile device\n2. Test different screen sizes\n3. Verify content readability\n4. Test touch interactions",
        expectedResult: "Website should be fully responsive and usable on mobile",
        priority: "Medium",
        testType: "ui",
        coverage: "Responsive Design",
        category: "Mobile Testing",
        tags: ["responsive", "mobile", "ui-testing"]
      }
    ];
  }

  private getImageBasedTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const imageCount = request.images ? request.images.length : 0;
    return [
      {
        feature: "UI Layout - Visual Elements",
        testObjective: "Verify UI elements are positioned correctly according to design",
        preConditions: `${imageCount} design mockup(s) are available for reference`,
        testSteps: "1. Compare actual UI with design mockups\n2. Verify element positioning\n3. Check color schemes\n4. Validate typography",
        expectedResult: "UI should match the provided design specifications",
        priority: request.priority || "High",
        testType: request.testType || "ui",
        coverage: "Visual Design",
        category: "UI Validation",
        tags: ["ui-testing", "visual-validation", "design-compliance"]
      }
    ];
  }

  private getInspectionBasedTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    return [
      {
        feature: "DOM Element Validation",
        testObjective: "Verify DOM elements are properly structured and accessible",
        preConditions: "Web page is loaded with the specified elements",
        testSteps: "1. Inspect DOM structure\n2. Validate element attributes\n3. Check for proper semantic markup\n4. Test element accessibility",
        expectedResult: "All DOM elements should be properly structured and accessible",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "DOM Validation",
        category: "Technical Validation",
        tags: ["dom", "structure", "accessibility"]
      }
    ];
  }

  private getDefaultTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    return [
      {
        feature: "Default Test Case",
        testObjective: "Verify basic functionality",
        preConditions: "System is ready for testing",
        testSteps: "1. Perform basic test\n2. Verify results",
        expectedResult: "System behaves as expected",
        priority: request.priority || "Medium",
        testType: request.testType || "functional",
        coverage: "Basic",
        category: "General",
        tags: ["basic-testing", "default"]
      }
    ];
  }

  private getComplexityLevel(request: TestCaseGenerationRequest): string {
    if (request.businessRules || request.elementInspection) return 'High';
    if (request.websiteUrl || request.images?.length) return 'Medium';
    return 'Low';
  }

  private getFocusAreas(request: TestCaseGenerationRequest): string {
    switch (request.inputType) {
      case 'url': return 'Navigation, UI Components, Cross-browser Testing';
      case 'image': return 'Visual Elements, Layout, Responsive Design';
      case 'inspect': return 'Element Interactions, JavaScript Functionality';
      default: return 'User Interface, Data Validation, Error Handling';
    }
  }

  private getSuggestions(request: TestCaseGenerationRequest): string[] {
    const suggestions = ['Consider adding performance tests', 'Include accessibility testing'];

    if (request.testType !== 'security') {
      suggestions.push('Add security testing scenarios');
    }
    if (request.inputType === 'url') {
      suggestions.push('Test cross-browser compatibility');
    }

    return suggestions;
  }
}

// Create and export the service instance
export const geminiService = new GeminiAIService();

// Export the service instance for use in routes
export default geminiService;