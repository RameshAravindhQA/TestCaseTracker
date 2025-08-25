
// Simple in-memory storage for AI API keys
// In production, this should be stored in a secure database or environment variables

interface AIConfig {
  provider: string;
  apiKey: string;
  updatedAt: string;
  updatedBy: number;
}

class AIConfigStorage {
  private configs: Map<string, AIConfig> = new Map();

  constructor() {
    // Initialize with environment variables if they exist
    this.initializeFromEnvironment();
  }

  private initializeFromEnvironment(): void {
    const envVarMap: Record<string, string> = {
      gemini: 'GOOGLE_API_KEY',
      openai: 'OPENAI_API_KEY',
      claude: 'CLAUDE_API_KEY',
      grok: 'GROK_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      huggingface: 'HUGGINGFACE_API_KEY',
      cohere: 'COHERE_API_KEY',
      mistral: 'MISTRAL_API_KEY'
    };

    Object.entries(envVarMap).forEach(([provider, envVar]) => {
      const apiKey = process.env[envVar];
      if (apiKey && apiKey !== `your-${provider}-api-key` && apiKey.trim() !== '') {
        this.configs.set(provider, {
          provider,
          apiKey,
          updatedAt: new Date().toISOString(),
          updatedBy: 0 // System initialization
        });
        console.log(`🔑 Initialized ${provider} from environment`);
      }
    });
  }

  setApiKey(provider: string, apiKey: string, userId: number): void {
    this.configs.set(provider, {
      provider,
      apiKey,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    });
    
    // Also set in process.env for immediate use
    const envVarMap: Record<string, string> = {
      gemini: 'GOOGLE_API_KEY',
      openai: 'OPENAI_API_KEY',
      claude: 'CLAUDE_API_KEY',
      grok: 'GROK_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      huggingface: 'HUGGINGFACE_API_KEY',
      cohere: 'COHERE_API_KEY',
      mistral: 'MISTRAL_API_KEY'
    };
    
    const envVar = envVarMap[provider];
    if (envVar) {
      process.env[envVar] = apiKey;
      console.log(`🔑 Set ${envVar} in process.env:`, `${apiKey.substring(0, 15)}...`);
    }
  }

  getApiKey(provider: string): string | null {
    const config = this.configs.get(provider);
    return config?.apiKey || null;
  }

  hasApiKey(provider: string): boolean {
    const config = this.configs.get(provider);
    return !!config?.apiKey;
  }

  getStatus(): Record<string, boolean> {
    const providers = ['gemini', 'openai', 'claude', 'grok', 'deepseek', 'huggingface', 'cohere', 'mistral'];
    const status: Record<string, boolean> = {};
    
    providers.forEach(provider => {
      status[provider] = this.hasApiKey(provider);
    });
    
    return status;
  }

  getAllConfigs(): AIConfig[] {
    return Array.from(this.configs.values()).map(config => ({
      ...config,
      apiKey: `${config.apiKey.substring(0, 10)}...` // Mask the key
    }));
  }
}

export const aiConfigStorage = new AIConfigStorage();
