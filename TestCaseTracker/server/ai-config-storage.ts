// Simple in-memory storage for AI API keys
// In production, this should be stored in a secure database or environment variables

interface AIConfig {
  provider: string;
  apiKey: string;
  updatedAt: string;
  updatedBy: number;
}

export class AIConfigStorage {
  private apiKeys: Map<string, string> = new Map();
  private keyHistory: Map<string, Array<{ timestamp: Date; userId: number }>> = new Map();

  setApiKey(provider: string, apiKey: string, userId: number): void {
    console.log(`🔑 Setting API key for ${provider} by user ${userId}`);

    // Validate API key format
    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
      throw new Error('Invalid Gemini API key format. Should start with "AIza"');
    }
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. Should start with "sk-"');
    }

    // Store the API key
    this.apiKeys.set(provider, apiKey);

    // Also set environment variable for immediate use
    if (provider === 'gemini') {
      process.env.GOOGLE_API_KEY = apiKey;
    } else if (provider === 'openai') {
      process.env.OPENAI_API_KEY = apiKey;
    } else if (provider === 'claude') {
      process.env.CLAUDE_API_KEY = apiKey;
    } else if (provider === 'grok') {
      process.env.GROK_API_KEY = apiKey;
    } else if (provider === 'deepseek') {
      process.env.DEEPSEEK_API_KEY = apiKey;
    } else if (provider === 'huggingface') {
      process.env.HUGGINGFACE_API_KEY = apiKey;
    } else if (provider === 'cohere') {
      process.env.COHERE_API_KEY = apiKey;
    } else if (provider === 'mistral') {
      process.env.MISTRAL_API_KEY = apiKey;
    }

    // Track usage history
    if (!this.keyHistory.has(provider)) {
      this.keyHistory.set(provider, []);
    }

    const history = this.keyHistory.get(provider)!;
    history.push({ timestamp: new Date(), userId });

    // Keep only last 10 entries
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  getApiKey(provider: string): string | null {
    // Check storage first, then environment variables
    const storedKey = this.apiKeys.get(provider);
    if (storedKey) return storedKey;

    // Fallback to environment variables
    switch (provider) {
      case 'gemini': return process.env.GOOGLE_API_KEY || null;
      case 'openai': return process.env.OPENAI_API_KEY || null;
      case 'claude': return process.env.CLAUDE_API_KEY || null;
      case 'grok': return process.env.GROK_API_KEY || null;
      case 'deepseek': return process.env.DEEPSEEK_API_KEY || null;
      case 'huggingface': return process.env.HUGGINGFACE_API_KEY || null;
      case 'cohere': return process.env.COHERE_API_KEY || null;
      case 'mistral': return process.env.MISTRAL_API_KEY || null;
      default: return null;
    }
  }

  hasApiKey(provider: string): boolean {
    const key = this.getApiKey(provider);
    return !!key && key.trim() !== '' && !key.includes('your-') && !key.includes('api-key');
  }

  getStatus(): Record<string, boolean> {
    const providers = ['gemini', 'openai', 'claude', 'grok', 'deepseek', 'huggingface', 'cohere', 'mistral'];
    const status: Record<string, boolean> = {};

    providers.forEach(provider => {
      status[provider] = this.hasApiKey(provider);
    });

    return status;
  }

  getHistory(provider: string): Array<{ timestamp: Date; userId: number }> {
    return this.keyHistory.get(provider) || [];
  }

  clearApiKey(provider: string): void {
    this.apiKeys.delete(provider);

    // Also clear environment variable
    switch (provider) {
      case 'gemini': delete process.env.GOOGLE_API_KEY; break;
      case 'openai': delete process.env.OPENAI_API_KEY; break;
      case 'claude': delete process.env.CLAUDE_API_KEY; break;
      case 'grok': delete process.env.GROK_API_KEY; break;
      case 'deepseek': delete process.env.DEEPSEEK_API_KEY; break;
      case 'huggingface': delete process.env.HUGGINGFACE_API_KEY; break;
      case 'cohere': delete process.env.COHERE_API_KEY; break;
      case 'mistral': delete process.env.MISTRAL_API_KEY; break;
    }

    console.log(`🗑️ API key cleared for ${provider}`);
  }

  clearAllKeys(): void {
    this.apiKeys.clear();
    this.keyHistory.clear();
    console.log('🗑️ All API keys cleared');
  }
}

export const aiConfigStorage = new AIConfigStorage();