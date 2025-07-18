import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'your-gemini-api-key');

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
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  private visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResponse> {
    try {
      logger.info('Generating test cases with Gemini AI', { inputType: request.inputType });

      let prompt = this.buildBasePrompt(request);
      let response;

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

      return this.parseResponse(response);
    } catch (error) {
      logger.error('Error generating test cases with Gemini:', error);
      throw new Error(`Test case generation failed: ${error.message}`);
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

  private parseResponse(response: string): TestCaseGenerationResponse {
    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate the structure
      if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
        throw new Error('Invalid response structure: missing testCases array');
      }

      // Ensure all test cases have required fields
      parsed.testCases = parsed.testCases.map((tc: any, index: number) => ({
        feature: tc.feature || `Generated Feature ${index + 1}`,
        testObjective: tc.testObjective || 'Validate functionality',
        preConditions: tc.preConditions || 'System should be accessible',
        testSteps: tc.testSteps || '1. Perform action\n2. Verify result',
        expectedResult: tc.expectedResult || 'Expected outcome achieved',
        priority: tc.priority || 'Medium',
        testType: tc.testType || 'functional',
        coverage: tc.coverage || 'Basic functionality',
        category: tc.category || 'General',
        tags: tc.tags || ['ai-generated']
      }));

      // Ensure analysis object exists
      if (!parsed.analysis) {
        parsed.analysis = {
          coverage: 'Comprehensive',
          complexity: 'Medium',
          focusAreas: 'Core functionality',
          suggestions: ['Review generated test cases', 'Consider additional edge cases']
        };
      }

      return {
        testCases: parsed.testCases,
        analysis: parsed.analysis,
        message: parsed.message || `Generated ${parsed.testCases.length} test cases successfully`
      };

    } catch (error) {
      logger.error('Error parsing Gemini response:', error);
      logger.debug('Raw response:', response);

      // Fallback: create a basic test case from the response
      return {
        testCases: [{
          feature: 'AI Generated Test Case',
          testObjective: 'Validate the specified functionality',
          preConditions: 'System should be in a testable state',
          testSteps: '1. Execute the test scenario\n2. Verify the expected behavior\n3. Document the results',
          expectedResult: 'The functionality works as expected',
          priority: 'Medium' as const,
          testType: 'functional',
          coverage: 'Basic functionality',
          category: 'Generated',
          tags: ['ai-generated', 'needs-review']
        }],
        analysis: {
          coverage: 'Basic',
          complexity: 'Unknown',
          focusAreas: 'Manual review required',
          suggestions: ['Review and refine the generated test case', 'Add more specific details']
        },
        message: 'Generated basic test case - manual review recommended'
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

export const geminiService = new GeminiAIService();

const genAI2 = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model2 = genAI2.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

// Debug logging
console.log('🔧 Gemini API Key configured:', !!process.env.GOOGLE_API_KEY);
console.log('🔧 Gemini service initialized');

// Export the service instance for use in routes
export default geminiService;