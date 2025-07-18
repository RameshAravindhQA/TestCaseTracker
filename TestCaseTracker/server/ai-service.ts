import { GoogleGenerativeAI } from '@google/generative-ai';

interface AITestCaseRequest {
  type: string;
  content: string;
  projectId: number;
  moduleId: number;
  images?: any[];
}

interface GeneratedTestCase {
  feature: string;
  testObjective: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  priority: string;
  testType: string;
  coverage: string;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateTestCases(request: AITestCaseRequest): Promise<GeneratedTestCase[]> {
    console.log('AI Service - Generating test cases for:', request);

    if (!this.genAI) {
      console.log('AI Service - No API key found, returning mock data');
      return this.generateMockTestCases(request.content);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = this.buildPrompt(request);
      console.log('AI Service - Generated prompt:', prompt);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('AI Service - Raw AI response:', text);

      return this.parseAIResponse(text);
    } catch (error) {
      console.error('AI Service - Error calling Gemini API:', error);
      return this.generateMockTestCases(request.content);
    }
  }

  private buildPrompt(request: AITestCaseRequest): string {
    return `Generate detailed test cases for the following requirement:

"${request.content}"

Please generate 3-5 comprehensive test cases in JSON format with the following structure:
[
  {
    "feature": "Feature name",
    "testObjective": "Clear test objective",
    "preConditions": "Prerequisites for the test",
    "testSteps": "Step-by-step test instructions",
    "expectedResult": "Expected outcome",
    "priority": "High/Medium/Low",
    "testType": "functional/ui/integration/api",
    "coverage": "What aspect this test covers"
  }
]

Focus on:
- Happy path scenarios
- Edge cases
- Error handling
- User experience
- Data validation

Return only valid JSON without any markdown formatting or extra text.`;
  }

  private parseAIResponse(response: string): GeneratedTestCase[] {
    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Find JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed)) {
        return parsed.map(tc => ({
          feature: tc.feature || 'Generated Test Case',
          testObjective: tc.testObjective || tc.objective || 'Test objective',
          preConditions: tc.preConditions || tc.preconditions || 'No specific preconditions',
          testSteps: tc.testSteps || tc.steps || 'Test steps to be defined',
          expectedResult: tc.expectedResult || tc.expected || 'Expected result to be defined',
          priority: tc.priority || 'Medium',
          testType: tc.testType || tc.type || 'functional',
          coverage: tc.coverage || 'General functionality'
        }));
      }

      return this.generateMockTestCases('Parsed response');
    } catch (error) {
      console.error('AI Service - Error parsing AI response:', error);
      return this.generateMockTestCases('Parse error fallback');
    }
  }

  private generateMockTestCases(requirement: string): GeneratedTestCase[] {
    return [
      {
        feature: `Test ${requirement} - Happy Path`,
        testObjective: `Verify that ${requirement} works correctly under normal conditions`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter valid data\n3. Click submit/save\n4. Verify the action completes successfully`,
        expectedResult: `${requirement} should complete successfully with appropriate confirmation`,
        priority: "Medium",
        testType: "functional",
        coverage: `Happy path scenario for ${requirement}`
      },
      {
        feature: `Test ${requirement} - Error Handling`,
        testObjective: `Verify that ${requirement} handles errors gracefully`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter invalid data\n3. Click submit/save\n4. Verify appropriate error message is displayed`,
        expectedResult: "System should display clear error message and prevent invalid operation",
        priority: "High",
        testType: "functional",
        coverage: `Error handling for ${requirement}`
      },
      {
        feature: `Test ${requirement} - Boundary Conditions`,
        testObjective: `Verify that ${requirement} handles boundary conditions correctly`,
        preConditions: "User is logged in and has appropriate permissions",
        testSteps: `1. Navigate to the ${requirement} section\n2. Enter boundary values (min/max)\n3. Click submit/save\n4. Verify system handles boundaries correctly`,
        expectedResult: "System should handle boundary conditions appropriately",
        priority: "Low",
        testType: "functional",
        coverage: `Boundary testing for ${requirement}`
      }
    ];
  }
}

export const aiService = new AIService();