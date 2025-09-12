
import { describe, it, expect } from 'vitest';
import { geminiService } from '../gemini-service';

describe('AI Generation Debug', () => {
  it('should debug registration test case generation', async () => {
    const request = {
      requirement: 'Registration test case with first last name phone number email id sign up button with both positive and negative test cases',
      projectContext: 'User management system',
      moduleContext: 'Registration',
      testType: 'functional',
      priority: 'Medium',
      websiteUrl: '',
      elementInspection: '',
      userFlows: '',
      businessRules: '',
      inputType: 'text' as const,
      images: []
    };

    console.log('🔍 Debug: Testing registration test case generation');
    console.log('📋 Request:', request);

    const response = await geminiService.generateTestCases(request);

    console.log('📤 Response:', {
      testCasesCount: response.testCases.length,
      source: response.source,
      message: response.message,
      analysis: response.analysis
    });

    console.log('📋 Generated test cases:');
    response.testCases.forEach((tc, index) => {
      console.log(`${index + 1}. ${tc.feature}`);
      console.log(`   Objective: ${tc.testObjective}`);
      console.log(`   Priority: ${tc.priority}`);
      console.log(`   Type: ${tc.testType}`);
      console.log('   ---');
    });

    expect(response).toBeDefined();
    expect(response.testCases).toBeDefined();
    expect(Array.isArray(response.testCases)).toBe(true);
    expect(response.testCases.length).toBeGreaterThan(0);
    
    // Check for registration-specific content
    const hasRegistrationTests = response.testCases.some(tc => 
      tc.feature.toLowerCase().includes('registration') ||
      tc.testObjective.toLowerCase().includes('registration')
    );
    expect(hasRegistrationTests).toBe(true);

    // Check for positive and negative test cases
    const hasPositiveTests = response.testCases.some(tc =>
      tc.testObjective.toLowerCase().includes('valid') ||
      tc.feature.toLowerCase().includes('valid') ||
      tc.testObjective.toLowerCase().includes('successful')
    );
    
    const hasNegativeTests = response.testCases.some(tc =>
      tc.testObjective.toLowerCase().includes('invalid') ||
      tc.feature.toLowerCase().includes('validation') ||
      tc.testObjective.toLowerCase().includes('error')
    );

    console.log('✅ Validation results:', {
      hasRegistrationTests,
      hasPositiveTests,
      hasNegativeTests
    });

    expect(hasPositiveTests).toBe(true);
    expect(hasNegativeTests).toBe(true);
  });

  it('should test mock service directly', async () => {
    // Force mock service by using an empty requirement
    const request = {
      requirement: 'Registration form testing',
      projectContext: '',
      moduleContext: 'Registration',
      testType: 'functional',
      priority: 'Medium',
      websiteUrl: '',
      elementInspection: '',
      userFlows: '',
      businessRules: '',
      inputType: 'text' as const,
      images: []
    };

    const response = await geminiService.generateTestCases(request);
    
    expect(response.source).toBe('mock-service');
    expect(response.testCases.length).toBeGreaterThan(0);
    
    console.log('🎭 Mock service test cases:');
    response.testCases.forEach((tc, index) => {
      console.log(`${index + 1}. ${tc.feature}: ${tc.testObjective}`);
    });
  });
});
