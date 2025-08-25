
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { logger } from './logger';

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'grok' | 'deepseek' | 'perplexity' | 'together' | 'groq';

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
  source: string;
  provider: AIProvider;
}

export interface AIProviderConfig {
  provider: AIProvider;
  name: string;
  description: string;
  keyFormat: string;
  baseUrl?: string;
  available: boolean;
  error?: string;
  isFree: boolean;
}

// Initialize AI services
let genAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;
let claude: any = null;
let grok: OpenAI | null = null;
let deepseek: OpenAI | null = null;
let perplexity: OpenAI | null = null;
let together: OpenAI | null = null;
let groq: OpenAI | null = null;

// Error tracking
const initErrors: Record<AIProvider, string | null> = {
  gemini: null,
  openai: null,
  claude: null,
  grok: null,
  deepseek: null,
  perplexity: null,
  together: null,
  groq: null
};

// Initialize all AI services
function initializeAIServices() {
  // Google Gemini
  try {
    const geminiApiKey = process.env.GOOGLE_API_KEY;
    if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key' && geminiApiKey.trim() !== '' && geminiApiKey.startsWith('AIza')) {
      genAI = new GoogleGenerativeAI(geminiApiKey);
      console.log('✅ Gemini AI initialized successfully');
    } else {
      initErrors.gemini = 'Google Gemini API key not configured or invalid format';
      console.warn('❌ Google Gemini API key issue');
    }
  } catch (error: any) {
    initErrors.gemini = `Gemini initialization failed: ${error.message}`;
    console.error('❌ Gemini initialization error:', error);
  }

  // OpenAI
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey && openaiApiKey !== 'your-openai-api-key' && openaiApiKey.trim() !== '' && openaiApiKey.startsWith('sk-')) {
      openai = new OpenAI({ apiKey: openaiApiKey });
      console.log('✅ OpenAI initialized successfully');
    } else {
      initErrors.openai = 'OpenAI API key not configured or invalid format';
      console.warn('❌ OpenAI API key issue');
    }
  } catch (error: any) {
    initErrors.openai = `OpenAI initialization failed: ${error.message}`;
    console.error('❌ OpenAI initialization error:', error);
  }

  // Claude (Anthropic)
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (claudeApiKey && claudeApiKey !== 'your-claude-api-key' && claudeApiKey.trim() !== '' && claudeApiKey.startsWith('sk-ant-')) {
      claude = new OpenAI({
        apiKey: claudeApiKey,
        baseURL: 'https://api.anthropic.com/v1',
        defaultHeaders: {
          'anthropic-version': '2023-06-01',
        },
      });
      console.log('✅ Claude AI initialized successfully');
    } else {
      initErrors.claude = 'Claude API key not configured or invalid format';
      console.warn('❌ Claude API key issue');
    }
  } catch (error: any) {
    initErrors.claude = `Claude initialization failed: ${error.message}`;
    console.error('❌ Claude initialization error:', error);
  }

  // Grok (xAI)
  try {
    const grokApiKey = process.env.GROK_API_KEY;
    if (grokApiKey && grokApiKey !== 'your-grok-api-key' && grokApiKey.trim() !== '') {
      grok = new OpenAI({
        apiKey: grokApiKey,
        baseURL: 'https://api.x.ai/v1',
      });
      console.log('✅ Grok AI initialized successfully');
    } else {
      initErrors.grok = 'Grok API key not configured';
      console.warn('❌ Grok API key issue');
    }
  } catch (error: any) {
    initErrors.grok = `Grok initialization failed: ${error.message}`;
    console.error('❌ Grok initialization error:', error);
  }

  // DeepSeek
  try {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (deepseekApiKey && deepseekApiKey !== 'your-deepseek-api-key' && deepseekApiKey.trim() !== '') {
      deepseek = new OpenAI({
        apiKey: deepseekApiKey,
        baseURL: 'https://api.deepseek.com/v1',
      });
      console.log('✅ DeepSeek AI initialized successfully');
    } else {
      initErrors.deepseek = 'DeepSeek API key not configured';
      console.warn('❌ DeepSeek API key issue');
    }
  } catch (error: any) {
    initErrors.deepseek = `DeepSeek initialization failed: ${error.message}`;
    console.error('❌ DeepSeek initialization error:', error);
  }

  // Perplexity
  try {
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (perplexityApiKey && perplexityApiKey !== 'your-perplexity-api-key' && perplexityApiKey.trim() !== '') {
      perplexity = new OpenAI({
        apiKey: perplexityApiKey,
        baseURL: 'https://api.perplexity.ai',
      });
      console.log('✅ Perplexity AI initialized successfully');
    } else {
      initErrors.perplexity = 'Perplexity API key not configured';
      console.warn('❌ Perplexity API key issue');
    }
  } catch (error: any) {
    initErrors.perplexity = `Perplexity initialization failed: ${error.message}`;
    console.error('❌ Perplexity initialization error:', error);
  }

  // Together AI
  try {
    const togetherApiKey = process.env.TOGETHER_API_KEY;
    if (togetherApiKey && togetherApiKey !== 'your-together-api-key' && togetherApiKey.trim() !== '') {
      together = new OpenAI({
        apiKey: togetherApiKey,
        baseURL: 'https://api.together.xyz/v1',
      });
      console.log('✅ Together AI initialized successfully');
    } else {
      initErrors.together = 'Together AI API key not configured';
      console.warn('❌ Together AI API key issue');
    }
  } catch (error: any) {
    initErrors.together = `Together AI initialization failed: ${error.message}`;
    console.error('❌ Together AI initialization error:', error);
  }

  // Groq
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && groqApiKey !== 'your-groq-api-key' && groqApiKey.trim() !== '') {
      groq = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      console.log('✅ Groq AI initialized successfully');
    } else {
      initErrors.groq = 'Groq API key not configured';
      console.warn('❌ Groq API key issue');
    }
  } catch (error: any) {
    initErrors.groq = `Groq initialization failed: ${error.message}`;
    console.error('❌ Groq initialization error:', error);
  }
}

// Initialize all services
initializeAIServices();

export class EnhancedAIService {
  
  static getAvailableProviders(): AIProviderConfig[] {
    return [
      {
        provider: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s advanced AI model with multimodal capabilities',
        keyFormat: 'AIza...',
        available: !!genAI && !initErrors.gemini,
        error: initErrors.gemini || undefined,
        isFree: true
      },
      {
        provider: 'openai',
        name: 'OpenAI GPT-4',
        description: 'OpenAI\'s powerful language model',
        keyFormat: 'sk-...',
        available: !!openai && !initErrors.openai,
        error: initErrors.openai || undefined,
        isFree: false
      },
      {
        provider: 'claude',
        name: 'Anthropic Claude',
        description: 'Anthropic\'s constitutional AI assistant',
        keyFormat: 'sk-ant-...',
        available: !!claude && !initErrors.claude,
        error: initErrors.claude || undefined,
        isFree: false
      },
      {
        provider: 'grok',
        name: 'xAI Grok',
        description: 'Elon Musk\'s witty AI assistant',
        keyFormat: 'xai-...',
        available: !!grok && !initErrors.grok,
        error: initErrors.grok || undefined,
        isFree: true
      },
      {
        provider: 'deepseek',
        name: 'DeepSeek',
        description: 'Chinese AI model with strong reasoning capabilities',
        keyFormat: 'sk-...',
        available: !!deepseek && !initErrors.deepseek,
        error: initErrors.deepseek || undefined,
        isFree: true
      },
      {
        provider: 'perplexity',
        name: 'Perplexity AI',
        description: 'Search-focused AI with real-time information',
        keyFormat: 'pplx-...',
        available: !!perplexity && !initErrors.perplexity,
        error: initErrors.perplexity || undefined,
        isFree: true
      },
      {
        provider: 'together',
        name: 'Together AI',
        description: 'Open-source AI models platform',
        keyFormat: 'together-...',
        available: !!together && !initErrors.together,
        error: initErrors.together || undefined,
        isFree: true
      },
      {
        provider: 'groq',
        name: 'Groq',
        description: 'Ultra-fast AI inference platform',
        keyFormat: 'gsk_...',
        available: !!groq && !initErrors.groq,
        error: initErrors.groq || undefined,
        isFree: true
      }
    ];
  }

  static async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    const provider = request.aiProvider || 'gemini';
    
    console.log(`🚀 Starting test case generation with ${provider}...`);

    try {
      switch (provider) {
        case 'gemini':
          return await this.generateWithGemini(request);
        case 'openai':
          return await this.generateWithOpenAI(request);
        case 'claude':
          return await this.generateWithClaude(request);
        case 'grok':
          return await this.generateWithGrok(request);
        case 'deepseek':
          return await this.generateWithDeepSeek(request);
        case 'perplexity':
          return await this.generateWithPerplexity(request);
        case 'together':
          return await this.generateWithTogether(request);
        case 'groq':
          return await this.generateWithGroq(request);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} AI failed, falling back to mock service:`, error);
      return this.getMockResponse(request);
    }
  }

  private static async generateWithGemini(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!genAI || initErrors.gemini) {
      throw new Error(initErrors.gemini || 'Gemini not initialized');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = this.buildPrompt(request);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const testCases = JSON.parse(text);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using Google Gemini AI`,
      source: 'gemini-ai',
      provider: 'gemini'
    };
  }

  private static async generateWithOpenAI(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!openai || initErrors.openai) {
      throw new Error(initErrors.openai || 'OpenAI not initialized');
    }

    const prompt = this.buildPrompt(request);
    const models = ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
    
    for (const model of models) {
      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error(`No response from OpenAI using model ${model}`);

        const testCases = JSON.parse(content);
        
        return {
          testCases: testCases,
          analysis: this.getAnalysis(request),
          message: `Generated ${testCases.length} test cases using OpenAI ${model}`,
          source: 'openai',
          provider: 'openai'
        };
      } catch (error: any) {
        if (error.status === 404) continue;
        throw error;
      }
    }
    throw new Error('All OpenAI models failed');
  }

  private static async generateWithClaude(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!claude || initErrors.claude) {
      throw new Error(initErrors.claude || 'Claude not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await claude.chat.completions.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Claude');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using Anthropic Claude`,
      source: 'claude',
      provider: 'claude'
    };
  }

  private static async generateWithGrok(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!grok || initErrors.grok) {
      throw new Error(initErrors.grok || 'Grok not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await grok.chat.completions.create({
      model: "grok-beta",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Grok');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using xAI Grok`,
      source: 'grok',
      provider: 'grok'
    };
  }

  private static async generateWithDeepSeek(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!deepseek || initErrors.deepseek) {
      throw new Error(initErrors.deepseek || 'DeepSeek not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from DeepSeek');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using DeepSeek AI`,
      source: 'deepseek',
      provider: 'deepseek'
    };
  }

  private static async generateWithPerplexity(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!perplexity || initErrors.perplexity) {
      throw new Error(initErrors.perplexity || 'Perplexity not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await perplexity.chat.completions.create({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Perplexity');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using Perplexity AI`,
      source: 'perplexity',
      provider: 'perplexity'
    };
  }

  private static async generateWithTogether(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!together || initErrors.together) {
      throw new Error(initErrors.together || 'Together AI not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await together.chat.completions.create({
      model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Together AI');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using Together AI`,
      source: 'together',
      provider: 'together'
    };
  }

  private static async generateWithGroq(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    if (!groq || initErrors.groq) {
      throw new Error(initErrors.groq || 'Groq not initialized');
    }

    const prompt = this.buildPrompt(request);
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Groq');

    const testCases = JSON.parse(content);
    
    return {
      testCases: testCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${testCases.length} test cases using Groq`,
      source: 'groq',
      provider: 'groq'
    };
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

  private static getAnalysis(request: TestCaseGenerationRequest) {
    return {
      coverage: 'Comprehensive',
      complexity: this.getComplexityLevel(request),
      focusAreas: this.getFocusAreas(request),
      suggestions: this.getSuggestions(request)
    };
  }

  private static getMockResponse(request: TestCaseGenerationRequest): TestCaseGenerationResponse {
    const mockTestCases = this.generateMockTestCases(request);

    return {
      testCases: mockTestCases,
      analysis: this.getAnalysis(request),
      message: `Generated ${mockTestCases.length} comprehensive test cases using intelligent mock service`,
      source: 'mock-service',
      provider: request.aiProvider || 'gemini'
    };
  }

  private static generateMockTestCases(request: TestCaseGenerationRequest): GeneratedTestCase[] {
    const feature = request.requirement || 'Application functionality';
    return [
      {
        feature: `${feature} - Happy Path`,
        testObjective: `Verify successful ${feature.toLowerCase()} with valid data`,
        preConditions: "Application is accessible and feature is available",
        testSteps: "1. Navigate to the feature\n2. Enter valid input data\n3. Submit the form\n4. Verify successful completion",
        expectedResult: "Feature should work correctly with valid input",
        priority: request.priority as any || "High",
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
        priority: request.priority as any || "High",
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

  // API Key Management
  static async updateAPIKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    try {
      // In a real application, you would save this to a secure database
      // For now, we'll update the environment variable temporarily
      process.env[`${provider.toUpperCase()}_API_KEY`] = apiKey;
      
      // Reinitialize the specific service
      initializeAIServices();
      
      return true;
    } catch (error) {
      console.error(`Failed to update ${provider} API key:`, error);
      return false;
    }
  }

  static getAPIKeyStatus(provider: AIProvider): { configured: boolean; format: string } {
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envKey];
    
    const formats: Record<AIProvider, string> = {
      gemini: 'AIza...',
      openai: 'sk-...',
      claude: 'sk-ant-...',
      grok: 'xai-...',
      deepseek: 'sk-...',
      perplexity: 'pplx-...',
      together: 'together-...',
      groq: 'gsk_...'
    };

    return {
      configured: !!apiKey && apiKey !== `your-${provider}-api-key`,
      format: formats[provider]
    };
  }
}
