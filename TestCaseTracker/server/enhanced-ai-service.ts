
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { logger } from './logger';

export type AIProvider = 'gemini' | 'openai';

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
  aiProvider?: AIProvider;
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
  source: 'gemini-ai' | 'openai' | 'mock-service';
  provider: AIProvider;
}

// Initialize AI services
let genAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;
let geminiInitError: string | null = null;
let openaiInitError: string | null = null;

// Initialize Google Gemini
try {
  const geminiApiKey = process.env.GOOGLE_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key' && geminiApiKey.startsWith('AIza')) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('✅ Gemini AI initialized successfully');
  } else {
    geminiInitError = 'Google Gemini API key not configured or invalid format';
    console.warn('❌ Google Gemini API key not configured or invalid format');
  }
} catch (error) {
  geminiInitError = `Gemini initialization failed: ${error.message}`;
  console.error('❌ Gemini initialization error:', error);
}

// Initialize OpenAI
try {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && openaiApiKey !== 'your-openai-api-key' && openaiApiKey.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    console.log('✅ OpenAI initialized successfully');
  } else {
    openaiInitError = 'OpenAI API key not configured or invalid format';
    console.warn('❌ OpenAI API key not configured or invalid format');
  }
} catch (error) {
  openaiInitError = `OpenAI initialization failed: ${error.message}`;
  console.error('❌ OpenAI initialization error:', error);
}

export class EnhancedAIService {
  
  static getAvailableProviders(): { provider: AIProvider; name: string; available: boolean; error?: string }[] {
    return [
      {
        provider: 'gemini',
        name: 'Google Gemini',
        available: !!genAI && !geminiInitError,
        error: geminiInitError || undefined
      },
      {
        provider: 'openai',
        name: 'OpenAI GPT-4',
        available: !!openai && !openaiInitError,
        error: openaiInitError || undefined
      }
    ];
  }

  static async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    const provider = request.aiProvider || 'gemini';
    
    console.log(`🚀 Starting test case generation with ${provider}...`, {
      provider,
      inputType: request.inputType,
      requirement: request.requirement?.substring(0, 50) + '...'
    });

    try {
      switch (provider) {
        case 'gemini':
          return await this.generateWithGemini(request);
        case 'openai':
          return await this.generateWithOpenAI(request);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} AI failed, falling back to mock service:`, error);
      return this.getMockResponse(request);
    }
  }

  private static async generateWithGemini(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!genAI || geminiInitError) {
      throw new Error(geminiInitError || 'Gemini not initialized');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = this.buildPrompt(request);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini response received:', text.substring(0, 200) + '...');
    
    const testCases = JSON.parse(text);
    
    return {
      testCases: testCases,
      analysis: {
        coverage: 'Comprehensive',
        complexity: this.getComplexityLevel(request),
        focusAreas: this.getFocusAreas(request),
        suggestions: this.getSuggestions(request)
      },
      message: `Generated ${testCases.length} test cases using Google Gemini AI`,
      source: 'gemini-ai',
      provider: 'gemini'
    };
  }

  private static async generateWithOpenAI(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!openai || openaiInitError) {
      throw new Error(openaiInitError || 'OpenAI not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    // Try different OpenAI models in order of preference
    const models = ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        console.log(`🔮 Trying OpenAI model: ${model}`);
        
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only, no additional text or explanations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        });

    const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`No response from OpenAI using model ${model}`);
        }

        console.log(`🤖 OpenAI response received using ${model}:`, content.substring(0, 200) + '...');
        
        const testCases = JSON.parse(content);
        
        return {
          testCases: testCases,
          analysis: {
            coverage: 'Comprehensive',
            complexity: this.getComplexityLevel(request),
            focusAreas: this.getFocusAreas(request),
            suggestions: this.getSuggestions(request)
          },
          message: `Generated ${testCases.length} test cases using OpenAI ${model}`,
          source: 'openai',
          provider: 'openai'
        };
        
      } catch (error: any) {
        console.error(`❌ OpenAI model ${model} failed:`, error.message);
        lastError = error;
        
        // If it's a model not found error, try the next model
        if (error.status === 404 || error.code === 'model_not_found') {
          continue;
        }
        
        // For other errors, break and throw
        break;
      }
    }
    
    // If we get here, all models failed
    throw new Error(`All OpenAI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private static buildPrompt(request: TestCaseGenerationRequest): string {
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

  private static getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
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
      source: 'mock-service',
      provider: request.aiProvider || 'gemini'
    };
  }

  private static generateMockTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const isRegistrationTest = request.requirement?.toLowerCase().includes('registration') || 
                              request.moduleContext?.toLowerCase().includes('registration');

    if (isRegistrationTest) {
      return this.getRegistrationTestCases(request);
    }

    return this.getDefaultTestCases(request);
  }

  private static getRegistrationTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
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
      }
    ];
  }

  private static getDefaultTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const feature = request.requirement || 'Application functionality';
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

  private static getComplexityLevel(request: TestCaseGenerationRequest): string {
    if (request.businessRules || request.elementInspection) return 'High';
    if (request.websiteUrl || request.images?.length) return 'Medium';
    return 'Low';
  }

  private static getFocusAreas(request: TestCaseGenerationRequest): string {
    switch (request.inputType) {
      case 'url': return 'Navigation, UI Components, Cross-browser Testing';
      case 'image': return 'Visual Elements, Layout, Responsive Design';
      case 'inspect': return 'Element Interactions, JavaScript Functionality';
      default: return 'User Interface, Data Validation, Error Handling';
    }
  }

  private static getSuggestions(request: TestCaseGenerationRequest): string[] {
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
