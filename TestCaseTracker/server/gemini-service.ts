import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Google Gemini AI
console.log('🔧 Initializing Gemini AI with API key:', !!process.env.GOOGLE_API_KEY ? 'CONFIGURED' : 'MISSING');
console.log('🔧 API Key preview:', process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 10) + '...' : 'NOT SET');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
}

export class GeminiAIService {
  private model: any = null;
  private visionModel: any = null;

  constructor() {
    try {
      if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-gemini-api-key') {
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        this.visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        console.log('✅ Gemini models initialized successfully');
      } else {
        console.warn('❌ Gemini API key not configured');
      }
    } catch (error) {
      console.error('❌ Gemini models initialization failed:', error);
    }
  }

  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    try {
      console.log('🚀 Starting Gemini test case generation...', {
        inputType: request.inputType,
        hasApiKey: !!process.env.GOOGLE_API_KEY,
        hasModel: !!this.model,
        requirement: request.requirement?.substring(0, 100) + '...'
      });

      // Check if API key is configured
      if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your-gemini-api-key' || process.env.GOOGLE_API_KEY.trim() === '') {
        console.error('❌ Google API key not configured properly');
        return this.getMockResponse(request);
      }

      if (!this.model) {
        console.error('❌ Gemini model not initialized');
        return this.getMockResponse(request);
      }

      let prompt = this.buildBasePrompt(request);
      let response;

      try {
        console.log('🔮 Calling Gemini API with prompt length:', prompt.length);
        
        switch (request.inputType) {
          case 'text':
            response = await this.generateFromText(prompt, request);
            break;
          case 'url':
            response = await this.generateFromUrl(prompt, request);
            break;
          case 'image':
            response = await this.generateFromImages(prompt, request);
            break;
          case 'inspect':
            response = await this.generateFromInspection(prompt, request);
            break;
          default:
            response = await this.generateFromText(prompt, request);
        }

        console.log('✅ Gemini API response received:', {
          responseType: typeof response,
          responseLength: response?.length || 0,
          responsePreview: response?.substring(0, 200) + '...'
        });

      } catch (apiError: any) {
        console.error('❌ Gemini API call failed:', {
          error: apiError.message,
          status: apiError.status,
          code: apiError.code
        });

        // Return mock response instead of throwing error
        console.log('🔄 Falling back to mock response due to API error');
        return this.getMockResponse(request);
      }

      return this.parseResponse(response);
    } catch (error: any) {
      console.error('❌ Error in generateTestCases:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Always return a valid response, never throw
      return this.getMockResponse(request);
    }
  }

  private buildBasePrompt(request: TestCaseGenerationRequest): string {
    return `
You are an expert QA Engineer and Test Case Designer. Generate comprehensive, detailed test cases based on the provided input.

CONTEXT:
- Project: ${request.projectContext || 'General Application'}
- Module: ${request.moduleContext || 'Not specified'}
- Test Type: ${request.testType}
- Priority: ${request.priority}
- Input Type: ${request.inputType}

REQUIREMENTS:
Generate test cases that include:
1. Clear, descriptive feature names
2. Specific test objectives
3. Detailed pre-conditions
4. Step-by-step test procedures
5. Expected results with acceptance criteria
6. Appropriate priority levels
7. Test coverage categories
8. Relevant tags for organization

RESPONSE FORMAT:
Provide a JSON response with the following structure:
{
  "testCases": [
    {
      "feature": "Clear feature name",
      "testObjective": "What this test validates",
      "preConditions": "Setup requirements",
      "testSteps": "1. Step one\\n2. Step two\\n3. Step three",
      "expectedResult": "Expected outcome",
      "priority": "High|Medium|Low",
      "testType": "${request.testType}",
      "coverage": "Coverage area (e.g., Happy Path, Edge Case, Error Handling)",
      "category": "Category (e.g., Authentication, Navigation, Data Entry)",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "analysis": {
    "coverage": "Overall coverage assessment",
    "complexity": "Complexity level",
    "focusAreas": "Key areas of focus",
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "message": "Summary of generated test cases"
}

Generate 8-15 comprehensive test cases covering:
- Happy path scenarios
- Edge cases and boundary conditions
- Error handling and validation
- User experience flows
- Security considerations (if applicable)
- Performance aspects (if applicable)
- Accessibility considerations (if applicable)

INPUT TO ANALYZE:
`;
  }

  private async generateFromText(basePrompt: string, request: TestCaseGenerationRequest): Promise<string> {
    const prompt = `${basePrompt}

REQUIREMENT DESCRIPTION:
${request.requirement}

${request.businessRules ? `BUSINESS RULES & CONSTRAINTS:
${request.businessRules}` : ''}

Generate test cases that thoroughly validate this requirement, including positive and negative scenarios.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  private async generateFromUrl(basePrompt: string, request: TestCaseGenerationRequest): Promise<string> {
    const prompt = `${basePrompt}

WEBSITE URL: ${request.websiteUrl}

${request.userFlows ? `USER FLOWS TO TEST:
${request.userFlows}` : ''}

${request.elementInspection ? `ANALYZED ELEMENTS:
${request.elementInspection}` : ''}

Generate test cases for web application testing, focusing on:
- User interface interactions
- Navigation flows
- Form validations
- Responsive behavior
- Cross-browser compatibility
- Accessibility standards`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  private async generateFromImages(basePrompt: string, request: TestCaseGenerationRequest): Promise<string> {
    if (!request.images || request.images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    const prompt = `${basePrompt}

IMAGES PROVIDED: ${request.images.length} screenshot(s)/mockup(s)

${request.requirement ? `ADDITIONAL CONTEXT:
${request.requirement}` : ''}

Analyze the provided images and generate test cases for:
- UI elements and layout
- User interactions visible in the images
- Visual design consistency
- Responsive behavior
- Accessibility features
- User experience flows`;

    // Convert images to appropriate format for Gemini Vision
    const imageParts = await Promise.all(
      request.images.map(async (image) => {
        const imageData = fs.readFileSync(image.path);
        return {
          inlineData: {
            data: imageData.toString('base64'),
            mimeType: image.mimetype
          }
        };
      })
    );

    const result = await this.visionModel.generateContent([prompt, ...imageParts]);
    return result.response.text();
  }

  private async generateFromInspection(basePrompt: string, request: TestCaseGenerationRequest): Promise<string> {
    const prompt = `${basePrompt}

DOM ELEMENTS/SELECTORS:
${request.elementInspection}

${request.requirement ? `TEST FOCUS:
${request.requirement}` : ''}

Analyze the provided DOM elements and generate test cases for:
- Element interactions (clicks, inputs, hovers)
- Form validations and submissions
- Dynamic content loading
- Element visibility and state changes
- Data binding and updates
- JavaScript functionality
- CSS styling and responsive behavior`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  private getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
    console.log('🎭 Generating mock response for request:', request.inputType);
    
    const mockTestCases = this.generateMockTestCases(request);
    
    return {
      testCases: mockTestCases,
      analysis: {
        coverage: 'Comprehensive',
        complexity: 'Medium',
        focusAreas: 'Core functionality, Input validation, Error handling',
        suggestions: [
          'Consider adding performance tests',
          'Include accessibility testing',
          'Add cross-browser compatibility tests',
          'Consider security testing scenarios'
        ]
      },
      message: `Generated ${mockTestCases.length} test cases using intelligent mock service (Gemini API unavailable)`
    };
  }

  private generateMockTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const isRegistrationTest = request.requirement?.toLowerCase().includes('registration') || 
                              request.moduleContext?.toLowerCase().includes('registration');
    
    if (isRegistrationTest) {
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

    // Generic test cases for other requirements
    const requirement = request.requirement || 'User functionality';
    return [
      {
        feature: `${requirement} - Happy Path`,
        testObjective: `Verify successful ${requirement.toLowerCase()} with valid data`,
        preConditions: "Application is accessible and user has required permissions",
        testSteps: "1. Navigate to the feature\n2. Enter valid data\n3. Submit the form\n4. Verify successful completion",
        expectedResult: "Feature should work correctly with valid input",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Happy Path",
        category: "Core Functionality",
        tags: ["positive-testing", "core-flow", "happy-path"]
      },
      {
        feature: `${requirement} - Input Validation`,
        testObjective: `Verify input validation for ${requirement.toLowerCase()}`,
        preConditions: "Feature is accessible",
        testSteps: "1. Navigate to the feature\n2. Enter invalid data formats\n3. Submit form\n4. Verify validation messages\n5. Test boundary conditions",
        expectedResult: "Appropriate validation messages should be displayed",
        priority: request.priority || "High",
        testType: request.testType || "functional",
        coverage: "Input Validation",
        category: "Data Validation",
        tags: ["validation", "negative-testing", "error-handling"]
      },
      {
        feature: `${requirement} - Error Handling`,
        testObjective: `Verify error handling for ${requirement.toLowerCase()}`,
        preConditions: "Feature is accessible",
        testSteps: "1. Navigate to the feature\n2. Simulate error conditions\n3. Verify graceful error handling\n4. Check error messages are user-friendly",
        expectedResult: "System should handle errors gracefully with clear messages",
        priority: "Medium",
        testType: request.testType || "functional",
        coverage: "Error Handling",
        category: "Error Scenarios",
        tags: ["error-handling", "negative-testing", "user-experience"]
      }
    ];
  }

  private parseResponse(response: string): TestCaseGenerationResponse {
    try {
      logger.info('Parsing Gemini response', { 
        responseType: typeof response,
        responseLength: response?.length || 0,
        isString: typeof response === 'string'
      });

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response format: expected string but got ' + typeof response);
      }

      // Clean the response to extract JSON
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Log the cleaned JSON string for debugging
      logger.debug('Cleaned JSON string:', jsonStr.substring(0, 500) + (jsonStr.length > 500 ? '...' : ''));

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        logger.error('JSON parsing failed:', parseError);
        logger.debug('Failed to parse JSON:', jsonStr);
        throw new Error('Failed to parse response as JSON. Response may not be in correct format.');
      }

      // Validate the structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response structure: expected object but got ' + typeof parsed);
      }

      if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
        logger.warn('Response missing testCases array, creating default structure');
        parsed.testCases = [];
      }

      // Ensure all test cases have required fields
      parsed.testCases = parsed.testCases.map((tc: any, index: number) => {
        if (!tc || typeof tc !== 'object') {
          logger.warn(`Invalid test case at index ${index}, creating default`);
          return {
            feature: `Generated Feature ${index + 1}`,
            testObjective: 'Validate functionality',
            preConditions: 'System should be accessible',
            testSteps: '1. Perform action\n2. Verify result',
            expectedResult: 'Expected outcome achieved',
            priority: 'Medium',
            testType: 'functional',
            coverage: 'Basic functionality',
            category: 'General',
            tags: ['ai-generated']
          };
        }

        return {
          feature: tc.feature || `Generated Feature ${index + 1}`,
          testObjective: tc.testObjective || 'Validate functionality',
          preConditions: tc.preConditions || 'System should be accessible',
          testSteps: tc.testSteps || '1. Perform action\n2. Verify result',
          expectedResult: tc.expectedResult || 'Expected outcome achieved',
          priority: tc.priority || 'Medium',
          testType: tc.testType || 'functional',
          coverage: tc.coverage || 'Basic functionality',
          category: tc.category || 'General',
          tags: Array.isArray(tc.tags) ? tc.tags : ['ai-generated']
        };
      });

      // Ensure analysis object exists
      if (!parsed.analysis || typeof parsed.analysis !== 'object') {
        parsed.analysis = {
          coverage: 'Comprehensive',
          complexity: 'Medium',
          focusAreas: 'Core functionality',
          suggestions: ['Review generated test cases', 'Consider additional edge cases']
        };
      }

      const result = {
        testCases: parsed.testCases,
        analysis: parsed.analysis,
        message: parsed.message || `Generated ${parsed.testCases.length} test cases successfully`
      };

      logger.info('Successfully parsed Gemini response', {
        testCasesCount: result.testCases.length,
        hasAnalysis: !!result.analysis
      });

      return result;

    } catch (error: any) {
      logger.error('Error parsing Gemini response:', {
        message: error.message,
        responseType: typeof response,
        responsePreview: response?.substring(0, 200) || 'null/undefined'
      });

      // Fallback: create a basic test case from the response
      return {
        testCases: [{
          feature: 'AI Generated Test Case (Fallback)',
          testObjective: 'Validate the specified functionality',
          preConditions: 'System should be in a testable state',
          testSteps: '1. Execute the test scenario\n2. Verify the expected behavior\n3. Document the results',
          expectedResult: 'The functionality works as expected',
          priority: 'Medium' as const,
          testType: 'functional',
          coverage: 'Basic functionality',
          category: 'Generated',
          tags: ['ai-generated', 'needs-review', 'fallback']
        }],
        analysis: {
          coverage: 'Basic',
          complexity: 'Unknown',
          focusAreas: 'Manual review required - API response parsing failed',
          suggestions: ['Review and refine the generated test case', 'Check Gemini API configuration', 'Verify API response format']
        },
        message: 'Generated fallback test case due to parsing error - manual review recommended'
      };
    }
  }

  async analyzeWebsite(url: string): Promise<any> {
    try {
      logger.info('Analyzing website with Gemini AI', { url });

      const prompt = `
Analyze the website at ${url} and provide:
1. Key UI elements and their purposes
2. User flows and navigation paths
3. Interactive components
4. Forms and input fields
5. Test-worthy functionality

Return a JSON response with:
{
  "elements": "Description of key UI elements",
  "userFlows": "Main user journeys",
  "testAreas": ["area1", "area2"],
  "complexity": "High|Medium|Low"
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      try {
        return JSON.parse(response);
      } catch {
        return {
          elements: 'Website analysis completed',
          userFlows: 'Standard web application flows',
          testAreas: ['Navigation', 'Forms', 'Content'],
          complexity: 'Medium'
        };
      }
    } catch (error) {
      logger.error('Error analyzing website:', error);
      throw new Error(`Website analysis failed: ${error.message}`);
    }
  }
}

// Create and export the service instance
export const geminiService = new GeminiAIService();

// Debug logging
console.log('🔧 Gemini API Key configured:', !!process.env.GOOGLE_API_KEY);
console.log('🔧 Gemini service initialized');

// Export the service instance for use in routes
export default geminiService;