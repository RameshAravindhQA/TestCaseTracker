
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { logger } from './logger';

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'grok' | 'deepseek' | 'huggingface' | 'cohere' | 'mistral';

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
  source: 'gemini-ai' | 'openai' | 'claude-ai' | 'mock-service';
  provider: AIProvider;
  success: boolean;
}

// Initialize AI services with better error handling
let genAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

let geminiInitError: string | null = null;
let openaiInitError: string | null = null;

// Initialize Google Gemini
function initializeGemini() {
  try {
    const geminiApiKey = process.env.GOOGLE_API_KEY;
    console.log('🔧 Gemini initialization check:', {
      hasKey: !!geminiApiKey,
      keyLength: geminiApiKey?.length || 0,
      startsWithAIza: geminiApiKey?.startsWith('AIza') || false,
      preview: geminiApiKey ? `${geminiApiKey.substring(0, 15)}...` : 'NONE'
    });

    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key' || geminiApiKey.trim() === '') {
      geminiInitError = 'Google Gemini API key is not properly configured';
      console.warn('❌ Gemini API key not configured');
      return false;
    } 
    
    if (!geminiApiKey.startsWith('AIza')) {
      geminiInitError = `Google Gemini API key has invalid format. Expected to start with 'AIza'`;
      console.warn('❌ Gemini API key has invalid format');
      return false;
    }

    genAI = new GoogleGenerativeAI(geminiApiKey);
    geminiInitError = null;
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (error: any) {
    geminiInitError = `Gemini initialization failed: ${error.message}`;
    console.error('❌ Gemini initialization error:', error);
    return false;
  }
}

// Initialize OpenAI
function initializeOpenAI() {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log('🔧 OpenAI initialization check:', {
      hasKey: !!openaiApiKey,
      keyLength: openaiApiKey?.length || 0,
      startsWithSk: openaiApiKey?.startsWith('sk-') || false,
      preview: openaiApiKey ? `${openaiApiKey.substring(0, 15)}...` : 'NONE'
    });

    if (!openaiApiKey || openaiApiKey === 'your-openai-api-key' || openaiApiKey.trim() === '') {
      openaiInitError = 'OpenAI API key is not properly configured';
      console.warn('❌ OpenAI API key not configured');
      return false;
    } 
    
    if (!openaiApiKey.startsWith('sk-')) {
      openaiInitError = 'OpenAI API key has invalid format. Expected to start with "sk-"';
      console.warn('❌ OpenAI API key has invalid format');
      return false;
    }

    openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    openaiInitError = null;
    console.log('✅ OpenAI initialized successfully');
    return true;
  } catch (error: any) {
    openaiInitError = `OpenAI initialization failed: ${error.message}`;
    console.error('❌ OpenAI initialization error:', error);
    return false;
  }
}

// Initialize both providers
const geminiReady = initializeGemini();
const openaiReady = initializeOpenAI();

console.log('🔍 AI Providers Status:', {
  gemini: { ready: geminiReady, error: geminiInitError },
  openai: { ready: openaiReady, error: openaiInitError }
});

export class EnhancedAIService {

  static getProviderStatus() {
    return {
      gemini: {
        ready: !!genAI && !geminiInitError,
        error: geminiInitError
      },
      openai: {
        ready: !!openai && !openaiInitError,
        error: openaiInitError
      },
      claude: {
        ready: false,
        error: 'Claude API integration not implemented'
      }
    };
  }

  static getAvailableProviders(): { provider: AIProvider; name: string; available: boolean; error?: string; isFree?: boolean }[] {
    return [
      {
        provider: 'gemini',
        name: 'Google Gemini',
        available: !!genAI && !geminiInitError,
        error: geminiInitError || undefined,
        isFree: false
      },
      {
        provider: 'openai',
        name: 'OpenAI GPT-4',
        available: !!openai && !openaiInitError,
        error: openaiInitError || undefined,
        isFree: false
      },
      {
        provider: 'claude',
        name: 'Anthropic Claude',
        available: false,
        error: 'Not implemented',
        isFree: false
      }
    ];
  }

  static async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      const testRequest: TestCaseGenerationRequest = {
        requirement: 'Test API connectivity',
        testType: 'functional',
        priority: 'Medium',
        inputType: 'text'
      };

      switch (provider) {
        case 'gemini':
          if (!genAI || geminiInitError) return false;
          await EnhancedAIService.generateWithGemini(testRequest);
          return true;
        case 'openai':
          if (!openai || openaiInitError) return false;
          await EnhancedAIService.generateWithOpenAI(testRequest);
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error(`❌ Provider ${provider} test failed:`, error);
      return false;
    }
  }

  static async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    const provider = request.aiProvider || 'gemini';

    console.log(`🚀 Starting test case generation with ${provider}...`, {
      provider,
      inputType: request.inputType,
      requirement: request.requirement?.substring(0, 50) + '...',
      geminiStatus: { ready: !!genAI && !geminiInitError, error: geminiInitError },
      openaiStatus: { ready: !!openai && !openaiInitError, error: openaiInitError }
    });

    // Validate request data
    if (!request.requirement || request.requirement.trim() === '') {
      console.log('⚠️ No requirement provided, using default');
      request.requirement = 'Basic system functionality test';
    }

    // Check which providers are actually available
    const availableProviders = [];
    if (genAI && !geminiInitError) availableProviders.push('gemini');
    if (openai && !openaiInitError) availableProviders.push('openai');

    console.log(`🔍 Available real AI providers: ${availableProviders.join(', ')}`);

    // If no real providers are available, return mock immediately with clear message
    if (availableProviders.length === 0) {
      console.log('⚠️ No AI providers available - API keys may not be configured correctly');
      const mockResponse = EnhancedAIService.getMockResponse(request);
      mockResponse.message = 'Generated using mock service (No AI providers configured - please check API keys)';
      return mockResponse;
    }

    // Try the requested provider first if it's available
    if (availableProviders.includes(provider)) {
      try {
        console.log(`🎯 Trying requested provider: ${provider}`);

        if (provider === 'gemini') {
          const result = await EnhancedAIService.generateWithGemini(request);
          console.log(`✅ Successfully generated with Gemini: ${result.testCases.length} test cases`);
          return result;
        } else if (provider === 'openai') {
          const result = await EnhancedAIService.generateWithOpenAI(request);
          console.log(`✅ Successfully generated with OpenAI: ${result.testCases.length} test cases`);
          return result;
        }
      } catch (error: any) {
        console.error(`❌ Requested provider ${provider} failed:`, {
          error: error.message,
          status: error.status,
          code: error.code
        });

        // Try other available providers as fallback
        for (const fallbackProvider of availableProviders) {
          if (fallbackProvider !== provider) {
            try {
              console.log(`🔄 Trying fallback provider: ${fallbackProvider}`);

              if (fallbackProvider === 'gemini') {
                const result = await EnhancedAIService.generateWithGemini(request);
                console.log(`✅ Fallback successful with Gemini: ${result.testCases.length} test cases`);
                return result;
              } else if (fallbackProvider === 'openai') {
                const result = await EnhancedAIService.generateWithOpenAI(request);
                console.log(`✅ Fallback successful with OpenAI: ${result.testCases.length} test cases`);
                return result;
              }
            } catch (fallbackError: any) {
              console.error(`❌ Fallback provider ${fallbackProvider} failed:`, fallbackError.message);
            }
          }
        }
      }
    } else {
      console.log(`⚠️ Requested provider ${provider} not available, trying others...`);
      
      // Try any available provider
      for (const availableProvider of availableProviders) {
        try {
          console.log(`🔄 Trying available provider: ${availableProvider}`);

          if (availableProvider === 'gemini') {
            const result = await EnhancedAIService.generateWithGemini(request);
            console.log(`✅ Successfully generated with Gemini: ${result.testCases.length} test cases`);
            return result;
          } else if (availableProvider === 'openai') {
            const result = await EnhancedAIService.generateWithOpenAI(request);
            console.log(`✅ Successfully generated with OpenAI: ${result.testCases.length} test cases`);
            return result;
          }
        } catch (error: any) {
          console.error(`❌ Provider ${availableProvider} failed:`, error.message);
        }
      }
    }

    // If all real providers failed, use mock service with informative message
    console.log('🎭 All real AI providers failed, using mock service');
    const mockResponse = EnhancedAIService.getMockResponse(request);
    mockResponse.message = `Generated using mock service (AI providers failed - ${availableProviders.join(', ')} attempted)`;
    return mockResponse;
  }

  private static async generateWithGemini(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!genAI) {
      throw new Error('Gemini client not initialized');
    }

    if (geminiInitError) {
      throw new Error(`Gemini initialization error: ${geminiInitError}`);
    }

    try {
      console.log('🔮 Attempting Gemini generation...');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3000,
        }
      });

      const prompt = EnhancedAIService.buildPrompt(request);
      console.log('📝 Sending prompt to Gemini (length: ' + prompt.length + ')');

      const result = await model.generateContent(prompt);
      console.log('📥 Gemini result received, processing response...');

      const response = await result.response;
      const text = response.text();

      console.log('🤖 Gemini raw response length:', text.length);

      const testCases = EnhancedAIService.parseAIResponse(text);

      if (!testCases || testCases.length === 0) {
        throw new Error('Gemini returned empty or invalid test cases');
      }

      console.log(`✅ Gemini successfully generated ${testCases.length} test cases`);

      return {
        testCases: testCases,
        analysis: {
          coverage: 'Comprehensive AI Analysis',
          complexity: EnhancedAIService.getComplexityLevel(request),
          focusAreas: EnhancedAIService.getFocusAreas(request),
          suggestions: EnhancedAIService.getSuggestions(request)
        },
        message: `Generated ${testCases.length} test cases using Google Gemini AI`,
        source: 'gemini-ai',
        provider: 'gemini',
        success: true
      };
    } catch (error: any) {
      console.error('🚨 Gemini generation failed:', {
        error: error.message,
        status: error.status,
        code: error.code
      });

      // Provide more specific error messages
      if (error.status === 429) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      } else if (error.status === 403) {
        throw new Error('Gemini API access forbidden. Please check your API key permissions.');
      } else if (error.status === 400) {
        throw new Error('Gemini API request was invalid. Please check the input data.');
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }

  private static async generateWithOpenAI(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!openai || openaiInitError) {
      throw new Error(openaiInitError || 'OpenAI not initialized');
    }

    const prompt = EnhancedAIService.buildPrompt(request);
    console.log('📝 Sending prompt to OpenAI (length: ' + prompt.length + ')');

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

        console.log(`🤖 OpenAI response received using ${model}`);

        const testCases = EnhancedAIService.parseAIResponse(content);

        if (!testCases || testCases.length === 0) {
          throw new Error('OpenAI returned empty or invalid test cases');
        }

        return {
          testCases: testCases,
          analysis: {
            coverage: 'Comprehensive AI Analysis',
            complexity: EnhancedAIService.getComplexityLevel(request),
            focusAreas: EnhancedAIService.getFocusAreas(request),
            suggestions: EnhancedAIService.getSuggestions(request)
          },
          message: `Generated ${testCases.length} test cases using OpenAI ${model}`,
          source: 'openai',
          provider: 'openai',
          success: true
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

  private static parseAIResponse(text: string): GeneratedTestCase[] {
    try {
      // Clean the response text to extract JSON
      let cleanedText = text.trim();

      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON array in the response
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
      }

      const testCases = JSON.parse(cleanedText);

      if (!Array.isArray(testCases)) {
        throw new Error('Response is not an array');
      }

      // Validate and enhance test cases
      return testCases.map((tc, index) => ({
        feature: tc.feature || `Generated Test Case ${index + 1}`,
        testObjective: tc.testObjective || 'Verify system functionality',
        preConditions: tc.preConditions || 'System is ready for testing',
        testSteps: tc.testSteps || '1. Execute test\n2. Verify results',
        expectedResult: tc.expectedResult || 'System functions correctly',
        priority: tc.priority || 'Medium',
        testType: tc.testType || 'functional',
        coverage: tc.coverage || 'Core functionality',
        category: tc.category || 'AI Generated',
        tags: Array.isArray(tc.tags) ? tc.tags : ['ai-generated']
      })).filter(tc => tc.feature && tc.testObjective);

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private static buildPrompt(request: TestCaseGenerationRequest): string {
    return `Generate comprehensive test cases based on this requirement:

REQUIREMENT: ${request.requirement}
${request.projectContext ? `PROJECT: ${request.projectContext}` : ''}
${request.moduleContext ? `MODULE: ${request.moduleContext}` : ''}
TEST TYPE: ${request.testType || 'functional'}
PRIORITY: ${request.priority || 'Medium'}

Generate 3-5 detailed test cases that cover:
1. Happy path scenarios
2. Edge cases and boundary conditions
3. Error scenarios and validation
4. Integration points

Return ONLY a valid JSON array with this exact structure:
[
  {
    "feature": "Clear feature name",
    "testObjective": "Specific test objective",
    "preConditions": "Required prerequisites",
    "testSteps": "1. Step one\\n2. Step two\\n3. Step three",
    "expectedResult": "Expected outcome",
    "priority": "High",
    "testType": "${request.testType || 'functional'}",
    "coverage": "What this test covers",
    "category": "Test category",
    "tags": ["tag1", "tag2"]
  }
]

Return ONLY valid JSON, no other text.`;
  }

  private static getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
    console.log('🎭 Generating mock response as fallback...');

    const mockTestCases: GeneratedTestCase[] = [
      {
        feature: `${request.requirement || 'System Feature'} - Happy Path`,
        testObjective: `Verify successful ${(request.requirement || 'system functionality').toLowerCase()} with valid data`,
        preConditions: "System is accessible and feature is available",
        testSteps: "1. Access the system/feature\n2. Enter valid input data\n3. Submit the form/execute action\n4. Verify successful completion\n5. Validate expected results",
        expectedResult: "System should process the request successfully and return expected results",
        priority: (request.priority as 'High' | 'Medium' | 'Low') || "High",
        testType: request.testType || "functional",
        coverage: "Core Functionality",
        category: "Primary Flow",
        tags: ["mock-generated", "core-functionality", "positive-testing"]
      },
      {
        feature: `${request.requirement || 'System Feature'} - Input Validation`,
        testObjective: `Verify input validation and error handling for ${(request.requirement || 'system functionality').toLowerCase()}`,
        preConditions: "System is accessible",
        testSteps: "1. Access the system/feature\n2. Enter invalid or malformed data\n3. Submit the form/execute action\n4. Verify error handling\n5. Check error messages are displayed",
        expectedResult: "System should handle errors gracefully and display appropriate error messages",
        priority: (request.priority as 'High' | 'Medium' | 'Low') || "Medium",
        testType: request.testType || "functional",
        coverage: "Input Validation",
        category: "Negative Testing",
        tags: ["mock-generated", "validation", "negative-testing"]
      }
    ];

    return {
      testCases: mockTestCases,
      analysis: {
        coverage: 'Basic Mock Coverage',
        complexity: EnhancedAIService.getComplexityLevel(request),
        focusAreas: EnhancedAIService.getFocusAreas(request),
        suggestions: EnhancedAIService.getSuggestions(request)
      },
      message: `Generated ${mockTestCases.length} test cases using mock service (AI providers not available)`,
      source: 'mock-service',
      provider: request.aiProvider || 'gemini',
      success: true
    };
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
