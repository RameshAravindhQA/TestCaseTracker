import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface GenerateTestCasesRequest {
  type: 'description' | 'url' | 'image';
  content: string;
  images?: Express.Multer.File[];
  projectId: number;
  moduleId: number;
}

interface GeneratedTestCase {
  title: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
}

interface TestCaseGenerationRequest {
  description: string;
  testingType?: string;
  requirements?: string;
  websiteUrl?: string;
  imageBase64?: string;
}

class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  private visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  async generateTestCases(request: GenerateTestCasesRequest): Promise<GeneratedTestCase[]> {
    try {
      logger.info(`Generating test cases using ${request.type} input`);

      let prompt = this.buildPrompt(request);
      let result;

      switch (request.type) {
        case 'description':
          result = await this.generateFromDescription(prompt);
          break;
        case 'url':
          result = await this.generateFromUrl(request.content, prompt);
          break;
        case 'image':
          result = await this.generateFromImages(request.images || [], prompt);
          break;
        default:
          throw new Error('Invalid generation type');
      }

      const testCases = this.parseTestCases(result);
      logger.info(`Generated ${testCases.length} test cases`);

      return testCases;
    } catch (error) {
      logger.error('Error generating test cases:', error);
      throw error;
    }
  }

  private buildPrompt(request: GenerateTestCasesRequest): string {
    return `
You are an expert QA engineer. Generate comprehensive test cases based on the provided input.

IMPORTANT: Return ONLY a valid JSON array of test cases, no other text or markdown formatting.

Each test case should have this exact structure:
{
  "title": "Clear, descriptive test case title",
  "description": "Brief description of what this test validates",
  "preconditions": "Prerequisites needed before executing this test",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "expectedResult": "What should happen when test passes",
  "priority": "Low|Medium|High|Critical",
  "tags": ["tag1", "tag2"]
}

Generate 5-10 test cases covering:
- Happy path scenarios
- Edge cases
- Error handling
- UI/UX validation
- Security considerations
- Performance aspects (if applicable)

Context:
- Project ID: ${request.projectId}
- Module ID: ${request.moduleId}
- Input Type: ${request.type}

Make test cases practical, specific, and actionable. Include relevant tags for categorization.
`;
  }

  private async generateFromDescription(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateFromUrl(url: string, prompt: string): Promise<string> {
    // For URL analysis, we'll use the description method with enhanced prompt
    const enhancedPrompt = `${prompt}

Analyze this website URL: ${url}

Based on the URL and typical web application patterns, generate test cases for:
- Page loading and rendering
- Navigation functionality
- Form submissions (if applicable)
- Responsive design
- Browser compatibility
- Security (HTTPS, input validation)
- Performance (load times, caching)

Consider common web application features that might be present.
`;

    return this.generateFromDescription(enhancedPrompt);
  }

  private async generateFromImages(images: Express.Multer.File[], prompt: string): Promise<string> {
    if (images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    try {
      // Convert first image to base64 for Gemini Vision
      const firstImage = images[0];
      const imageData = await fs.readFile(firstImage.path);
      const base64Image = imageData.toString('base64');

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: firstImage.mimetype
        }
      };

      const enhancedPrompt = `${prompt}

Analyze the provided UI image(s) and generate test cases for:
- UI element interactions (buttons, forms, links)
- Visual design validation
- Responsive layout
- Accessibility features
- User workflow testing
- Error states and validation
- Cross-browser compatibility

Focus on testing the specific UI elements and functionality visible in the image.
`;

      const result = await this.visionModel.generateContent([enhancedPrompt, imagePart]);
      const response = await result.response;
      return response.text();

    } catch (error) {
      logger.error('Error processing images:', error);
      // Fallback to text-based generation
      const fallbackPrompt = `${prompt}

Generate test cases for a UI application based on common interface patterns:
- Form validation and submission
- Button interactions
- Navigation elements
- Data display and filtering
- User authentication
- Error handling
`;
      return this.generateFromDescription(fallbackPrompt);
    }
  }

  private parseTestCases(response: string): GeneratedTestCase[] {
    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to find JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const testCases = JSON.parse(jsonStr);

      if (!Array.isArray(testCases)) {
        throw new Error('Response is not an array');
      }

      // Validate and sanitize test cases
      return testCases.map((tc, index) => ({
        title: tc.title || `Generated Test Case ${index + 1}`,
        description: tc.description || 'AI generated test case',
        preconditions: tc.preconditions || 'None',
        steps: Array.isArray(tc.steps) ? tc.steps : ['Execute test'],
        expectedResult: tc.expectedResult || 'Test should pass',
        priority: ['Low', 'Medium', 'High', 'Critical'].includes(tc.priority) ? tc.priority : 'Medium',
        tags: Array.isArray(tc.tags) ? tc.tags : ['ai-generated']
      }));

    } catch (error) {
      logger.error('Error parsing AI response:', error);
      logger.error('Raw response:', response);

      // Return fallback test cases
      return [{
        title: 'Basic Functionality Test',
        description: 'Verify basic application functionality',
        preconditions: 'Application is accessible',
        steps: ['Access the application', 'Verify main functionality', 'Check for errors'],
        expectedResult: 'Application works as expected',
        priority: 'Medium',
        tags: ['basic', 'functionality']
      }];
    }
  }

  async generateTestCasesFromSpecs(request: TestCaseGenerationRequest): Promise<any[]> {
    if (!this.genAI) {
      throw new Error('Google AI not configured');
    }

    try {
      let prompt = `Generate comprehensive test cases for the following requirements:

Description: ${request.description}
Testing Type: ${request.testingType || 'functional'}
Requirements: ${request.requirements || 'Not specified'}

Please generate test cases in the following JSON format:
[
  {
    "title": "Test case title",
    "description": "Detailed test case description",
    "priority": "High|Medium|Low",
    "type": "Positive|Negative|Edge Case",
    "preconditions": "Prerequisites for the test",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "expectedResult": "Expected outcome",
    "category": "Functional|UI|Integration|API"
  }
]

Generate at least 10-15 comprehensive test cases covering positive, negative, and edge cases.`;

      if (request.websiteUrl) {
        prompt += `\nWebsite URL for reference: ${request.websiteUrl}`;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse the text response into structured format
      return this.parseTextToTestCases(text);
    } catch (error) {
      console.error('Error generating test cases from specs:', error);
      throw error;
    }
  }

  async generateTestCasesFromImage(request: TestCaseGenerationRequest & { imageBase64: string }): Promise<any[]> {
    if (!this.genAI) {
      throw new Error('Google AI not configured');
    }

    try {
      const prompt = `Analyze this UI screenshot and generate comprehensive test cases for the interface shown.

Description: ${request.description}
Testing Focus: UI/UX Testing, Functional Testing

Generate test cases that cover:
1. UI element validation
2. User interaction flows
3. Input validation
4. Error handling
5. Responsive design (if applicable)
6. Accessibility considerations

Format the response as JSON array with test case objects.`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: request.imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.parseTextToTestCases(text);
    } catch (error) {
      console.error('Error generating test cases from image:', error);
      throw error;
    }
  }

  private parseTextToTestCases(text: string): any[] {
    // Fallback parser for non-JSON responses
    const testCases: any[] = [];
    const lines = text.split('\n');
    let currentTestCase: any = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('test case') && trimmed.includes(':')) {
        if (currentTestCase.title) {
          testCases.push(currentTestCase);
        }
        currentTestCase = {
          title: trimmed.split(':')[1]?.trim() || trimmed,
          description: '',
          priority: 'Medium',
          type: 'Functional',
          preconditions: '',
          steps: [],
          expectedResult: '',
          category: 'Functional'
        };
      } else if (trimmed.toLowerCase().includes('description:')) {
        currentTestCase.description = trimmed.split(':')[1]?.trim() || '';
      } else if (trimmed.toLowerCase().includes('expected:')) {
        currentTestCase.expectedResult = trimmed.split(':')[1]?.trim() || '';
      } else if (trimmed.toLowerCase().includes('steps:') || trimmed.match(/^\d+\./)) {
        if (!currentTestCase.steps) currentTestCase.steps = [];
        currentTestCase.steps.push(trimmed.replace(/^\d+\./, '').trim());
      }
    }

    if (currentTestCase.title) {
      testCases.push(currentTestCase);
    }

    return testCases.length > 0 ? testCases : [{
      title: "Generated Test Case",
      description: text.substring(0, 200),
      priority: "Medium",
      type: "Functional",
      preconditions: "System should be accessible",
      steps: ["Navigate to the application", "Perform the required action", "Verify the result"],
      expectedResult: "Expected functionality should work as described",
      category: "Functional"
    }];
  }
}

export const aiService = new AIService();
module.exports = { generateTestCases: (req: GenerateTestCasesRequest) => aiService.generateTestCases(req) };