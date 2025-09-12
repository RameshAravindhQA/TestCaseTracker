
# AI Test Case Generator - Usage Guide

## Overview
The AI Test Case Generator uses various AI providers (Google Gemini, OpenAI, etc.) to automatically generate comprehensive test cases based on your requirements.

## Setup Instructions

### 1. Configure API Keys
1. Go to **Settings** → **AI API Configuration**
2. Select your preferred AI provider (Google Gemini recommended)
3. Enter your API key:
   - **Gemini**: Get from [Google AI Studio](https://makersuite.google.com)
   - **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com)

### 2. API Key Formats
- **Gemini**: Should start with `AIza...`
- **OpenAI**: Should start with `sk-...`

## How to Use

### 1. Access the Generator
- Navigate to **Projects** → Select a project → **Test Cases**
- Click the **AI Test Generator** button

### 2. Input Methods
- **Text Prompt**: Describe your requirements in natural language
- **Website URL**: Analyze a website for test case generation
- **Image Upload**: Upload screenshots for UI testing

### 3. Configuration
- Select project and module (optional)
- Choose test type: Functional, Integration, Security, etc.
- Set priority: High, Medium, Low

### 4. Generation Process
1. Click **Generate AI Test Cases**
2. Review generated test cases
3. Select which ones to merge into your project
4. Click **Merge Selected** to add them

## Best Practices

### Writing Good Prompts
- Be specific about requirements
- Include business rules and constraints
- Mention user roles and scenarios
- Specify edge cases if needed

### Example Prompts
```
Good: "User registration form with email validation, password strength requirements, and CAPTCHA verification"

Better: "User registration form for e-commerce site with:
- Email validation (format and uniqueness)
- Password requirements (8+ chars, uppercase, number, special char)
- CAPTCHA verification
- Terms and conditions acceptance
- Automatic welcome email sending"
```

## Debugging

### Debug Tools
1. Click the **Debug** button in the AI generator
2. Check the console for detailed logs
3. Use `/api/ai/debug-status` endpoint for status

### Common Issues
1. **"API key not configured"**: Set up your API key in Settings
2. **"Invalid test case data"**: Check that all required fields are present
3. **"Gemini API error"**: Verify your API key format and quota

### Environment Variables
If setting via environment variables:
```bash
GOOGLE_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
```

## Troubleshooting

### AI Generation Fails
1. Check API key configuration
2. Verify internet connectivity
3. Check AI provider quotas/limits
4. Try with a simpler prompt

### Test Case Creation Fails
1. Ensure project and module exist
2. Check user permissions
3. Verify all required fields are present

### Performance Issues
1. Use shorter, more focused prompts
2. Generate fewer test cases at once
3. Choose appropriate AI provider based on your needs

## API Provider Comparison

| Provider | Free Tier | Strengths | Best For |
|----------|-----------|-----------|----------|
| Gemini | Yes | Fast, good quality | General testing |
| OpenAI | Limited | High quality | Complex scenarios |
| DeepSeek | Yes | Code-focused | Technical testing |
| Hugging Face | Yes | Open source | Basic testing |

## Support
For issues or questions, check the application logs or contact your administrator.
