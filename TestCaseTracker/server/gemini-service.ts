import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

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
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private visionModel: any = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    try {
      console.log('🔧 Initializing Gemini AI Service...');

      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
        console.warn('❌ Google Gemini API key not configured properly');
        this.isConfigured = false;
        return;
      }

      console.log('✅ Google Gemini API key found:', apiKey.substring(0, 10) + '...');

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      this.visionModel = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      this.isConfigured = true;
      console.log('✅ Gemini AI Service initialized successfully');

    } catch (error: any) {
      console.error('❌ Failed to initialize Gemini AI Service:', error.message);
      this.isConfigured = false;
    }
  }

  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    console.log('🚀 Starting test case generation with Gemini AI...');

    try {
      // Always try Gemini first if configured
      if (this.isConfigured && this.model) {
        try {
          console.log('🔮 Using Google Gemini AI for generation...');
          return await this.generateWithGemini(request);
        } catch (geminiError: any) {
          console.error('❌ Gemini AI failed:', geminiError.message);
          console.log('🔄 Falling back to intelligent mock service...');
        }
      } else {
        console.log('⚠️ Gemini AI not configured, using mock service');
      }

      // Fallback to mock service
      return this.getMockResponse(request);

    } catch (error: any) {
      console.error('❌ Critical error in generateTestCases:', error.message);
      return this.getMockResponse(request);
    }
  }

  private async generateWithGemini(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    const prompt = this.buildPrompt(request);

    console.log('📝 Generated prompt length:', prompt.length);

    let response: string;

    try {
      switch (request.inputType) {
        case 'image':
          if (request.images && request.images.length > 0) {
            response = await this.generateFromImages(prompt, request.images);
          } else {
            response = await this.generateFromText(prompt);
          }
          break;
        default:
          response = await this.generateFromText(prompt);
      }

      console.log('✅ Gemini response received, length:', response.length);

      return this.parseGeminiResponse(response);

    } catch (error: any) {
      console.error('❌ Gemini generation failed:', error.message);
      throw new Error(`Gemini AI generation failed: ${error.message}`);
    }
  }

  private async generateFromText(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateFromImages(prompt: string, images: Express.Multer.File[]): Promise<string> {
    const imageParts = await Promise.all(
      images.map(async (image) => {
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
    const response = await result.response;
    return response.text();
  }

  private buildPrompt(request: TestCaseGenerationRequest): string {
    return `
You are an expert QA Engineer and Test Case Designer. Generate comprehensive test cases based on the provided requirements.

**CONTEXT:**
- Project: ${request.projectContext || 'General Application'}
- Module: ${request.moduleContext || 'Not specified'}
- Test Type: ${request.testType}
- Priority: ${request.priority}
- Input Type: ${request.inputType}

**REQUIREMENT:**
${request.requirement || 'Generate test cases for the specified functionality'}

${request.businessRules ? `**BUSINESS RULES:**\n${request.businessRules}` : ''}
${request.websiteUrl ? `**WEBSITE URL:**\n${request.websiteUrl}` : ''}
${request.userFlows ? `**USER FLOWS:**\n${request.userFlows}` : ''}
${request.elementInspection ? `**ELEMENTS TO TEST:**\n${request.elementInspection}` : ''}

**INSTRUCTIONS:**
1. Generate 6-10 comprehensive test cases
2. Cover positive scenarios, negative scenarios, and edge cases
3. Include clear step-by-step instructions
4. Specify expected results with acceptance criteria
5. Use appropriate priority levels (High, Medium, Low)
6. Add relevant tags for categorization

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:

{
  "testCases": [
    {
      "feature": "Clear descriptive feature name",
      "testObjective": "What this test validates",
      "preConditions": "Setup requirements and initial state",
      "testSteps": "1. Step one\\n2. Step two\\n3. Step three\\n4. Verify result",
      "expectedResult": "Expected outcome with specific criteria",
      "priority": "High",
      "testType": "${request.testType}",
      "coverage": "Positive Testing",
      "category": "Core Functionality",
      "tags": ["functional", "positive", "core"]
    }
  ],
  "analysis": {
    "coverage": "Comprehensive coverage assessment",
    "complexity": "Medium",
    "focusAreas": "Key testing focus areas",
    "suggestions": ["Suggestion 1", "Suggestion 2"]
  },
  "message": "Generated X comprehensive test cases successfully"
}

Generate the JSON response now:`;
  }

  private parseGeminiResponse(response: string): TestCaseGenerationResponse {
    try {
      // Clean the response
      let cleanResponse = response.trim();

      // Remove markdown formatting
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');

      // Find JSON content
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON content found in response');
      }

      const jsonStr = cleanResponse.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);

      // Validate structure
      if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
        throw new Error('Invalid response structure: missing testCases array');
      }

      // Ensure all test cases have required fields
      const validatedTestCases = parsed.testCases.map((tc: any, index: number) => ({
        feature: tc.feature || `Generated Feature ${index + 1}`,
        testObjective: tc.testObjective || 'Validate functionality',
        preConditions: tc.preConditions || 'System should be accessible',
        testSteps: tc.testSteps || '1. Perform test action\n2. Verify result',
        expectedResult: tc.expectedResult || 'Expected behavior achieved',
        priority: tc.priority || 'Medium',
        testType: tc.testType || 'functional',
        coverage: tc.coverage || 'Basic functionality',
        category: tc.category || 'General',
        tags: Array.isArray(tc.tags) ? tc.tags : ['ai-generated']
      }));

      return {
        testCases: validatedTestCases,
        analysis: parsed.analysis || {
          coverage: 'Comprehensive',
          complexity: 'Medium',
          focusAreas: 'Core functionality validation',
          suggestions: ['Review generated test cases', 'Consider additional edge cases']
        },
        message: parsed.message || `Generated ${validatedTestCases.length} test cases successfully with Gemini AI`
      };

    } catch (error: any) {
      console.error('❌ Failed to parse Gemini response:', error.message);
      throw new Error(`Response parsing failed: ${error.message}`);
    }
  }

  private getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
    console.log('🎭 Generating intelligent mock response...');

    const isRegistrationTest = request.requirement?.toLowerCase().includes('registration') || 
                              request.moduleContext?.toLowerCase().includes('registration');

    let mockTestCases: GeneratedTestCase[];

    if (isRegistrationTest) {
      mockTestCases = [
        {
          feature: "User Registration - Valid Data Entry",
          testObjective: "Verify successful user registration with valid data",
          preConditions: "Registration page is accessible and all required fields are displayed",
          testSteps: "1. Navigate to registration page\n2. Enter valid first name\n3. Enter valid last name\n4. Enter valid email address\n5. Enter strong password\n6. Confirm password\n7. Accept terms and conditions\n8. Click 'Register' button\n9. Verify success message",
          expectedResult: "User should be successfully registered with confirmation message displayed",
          priority: "High",
          testType: request.testType || "functional",
          coverage: "Positive Testing",
          category: "Registration - Happy Path",
          tags: ["registration", "positive-testing", "user-creation"]
        },
        {
          feature: "User Registration - Email Validation",
          testObjective: "Verify email field validation with invalid email formats",
          preConditions: "Registration page is loaded",
          testSteps: "1. Navigate to registration page\n2. Enter valid first and last name\n3. Enter invalid email formats (missing @, missing domain, etc.)\n4. Attempt to register\n5. Verify validation error messages",
          expectedResult: "Appropriate error messages should be displayed for invalid email formats",
          priority: "High",
          testType: request.testType || "functional",
          coverage: "Input Validation",
          category: "Registration - Validation",
          tags: ["registration", "negative-testing", "email-validation"]
        },
        {
          feature: "User Registration - Password Security",
          testObjective: "Verify password field validation and security requirements",
          preConditions: "Registration page is accessible",
          testSteps: "1. Navigate to registration page\n2. Test weak passwords (too short, no special characters, etc.)\n3. Test password confirmation mismatch\n4. Verify validation messages\n5. Test strong password acceptance",
          expectedResult: "Weak passwords should be rejected with clear error messages, strong passwords accepted",
          priority: "High",
          testType: "security",
          coverage: "Password Security",
          category: "Registration - Security",
          tags: ["registration", "password-security", "validation"]
        }
      ];
    } else {
      const requirement = request.requirement || 'User functionality';
      mockTestCases = [
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
          tags: ["positive-testing", "core-flow"]
        },
        {
          feature: `${requirement} - Input Validation`,
          testObjective: `Verify input validation for ${requirement.toLowerCase()}`,
          preConditions: "Feature is accessible",
          testSteps: "1. Navigate to the feature\n2. Enter invalid data formats\n3. Submit form\n4. Verify validation messages",
          expectedResult: "Appropriate validation messages should be displayed",
          priority: "High",
          testType: request.testType || "functional",
          coverage: "Input Validation",
          category: "Data Validation",
          tags: ["validation", "negative-testing"]
        }
      ];
    }

    return {
      testCases: mockTestCases,
      analysis: {
        coverage: 'Comprehensive',
        complexity: 'Medium',
        focusAreas: 'Core functionality, Input validation, Error handling',
        suggestions: [
          'Consider adding performance tests',
          'Include accessibility testing',
          'Add cross-browser compatibility tests'
        ]
      },
      message: `Generated ${mockTestCases.length} test cases using intelligent mock service (Gemini AI unavailable)`
    };
  }

  async analyzeWebsite(url: string): Promise<any> {
    if (!this.isConfigured || !this.model) {
      return {
        elements: 'Website analysis unavailable - Gemini AI not configured',
        userFlows: 'Standard web application flows',
        testAreas: ['Navigation', 'Forms', 'Content'],
        complexity: 'Medium'
      };
    }

    try {
      const prompt = `Analyze the website at ${url} and provide a JSON response with:
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
    } catch (error: any) {
      console.error('❌ Website analysis failed:', error.message);
      return {
        elements: 'Analysis failed - using default recommendations',
        userFlows: 'Standard web application flows',
        testAreas: ['Navigation', 'Forms', 'Content'],
        complexity: 'Medium'
      };
    }
  }
}

// Create and export the service instance
export const geminiService = new GeminiAIService();
export default geminiService;