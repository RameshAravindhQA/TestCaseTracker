
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TestCaseGenerationRequest {
  requirement: string;
  projectContext?: string;
  moduleContext?: string;
  testType?: 'functional' | 'integration' | 'unit' | 'e2e';
  priority?: 'High' | 'Medium' | 'Low';
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
}

export class OpenAIService {
  static async generateTestCases(request: TestCaseGenerationRequest): Promise<GeneratedTestCase[]> {
    const prompt = `
You are an expert QA engineer. Generate comprehensive test cases based on the following requirement:

Requirement: ${request.requirement}
${request.projectContext ? `Project Context: ${request.projectContext}` : ''}
${request.moduleContext ? `Module Context: ${request.moduleContext}` : ''}
Test Type: ${request.testType || 'functional'}
Priority: ${request.priority || 'Medium'}

Generate 3-5 detailed test cases that cover:
1. Happy path scenarios
2. Edge cases
3. Error scenarios
4. Boundary conditions
5. Integration points

For each test case, provide:
- Feature name
- Test objective
- Pre-conditions
- Detailed test steps (numbered)
- Expected result
- Priority level
- Test type
- Coverage area

Format as JSON array with the following structure:
[
  {
    "feature": "Feature name",
    "testObjective": "Clear objective",
    "preConditions": "Prerequisites",
    "testSteps": "1. Step one\n2. Step two\n3. Step three",
    "expectedResult": "Expected outcome",
    "priority": "High|Medium|Low",
    "testType": "functional|integration|unit|e2e",
    "coverage": "What this test covers"
  }
]
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Updated to use the latest OpenAI model
        messages: [
          {
            role: "system",
            content: "You are an expert QA engineer who generates comprehensive test cases. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const testCases = JSON.parse(content);
      return testCases;
    } catch (error) {
      console.error('Error generating test cases:', error);
      throw new Error('Failed to generate test cases');
    }
  }

  static async suggestTestCoverage(existingTestCases: any[], requirement: string): Promise<string[]> {
    const prompt = `
Analyze the existing test cases and suggest additional test coverage areas:

Requirement: ${requirement}

Existing Test Cases:
${existingTestCases.map(tc => `- ${tc.feature}: ${tc.testObjective}`).join('\n')}

Suggest 5-10 additional test coverage areas that might be missing, focusing on:
1. Boundary conditions
2. Error handling
3. Performance scenarios
4. Security aspects
5. Accessibility
6. Mobile responsiveness
7. Integration points
8. Data validation

Return as a JSON array of strings.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Updated to use the latest OpenAI model
        messages: [
          {
            role: "system",
            content: "You are an expert QA engineer. Provide test coverage suggestions as JSON array of strings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error suggesting coverage:', error);
      throw new Error('Failed to suggest test coverage');
    }
  }
}
