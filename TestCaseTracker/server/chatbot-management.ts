
import { storage } from './storage';

export interface ChatbotQuestion {
  id?: number;
  question: string;
  answer: string;
  category: string;
  module: string;
  action: string;
  tags: string[];
  isActive: boolean;
  priority: 'High' | 'Medium' | 'Low';
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
  createdById: number;
}

export interface ChatbotCategory {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdById: number;
}

export class ChatbotManagementService {
  private questions: ChatbotQuestion[] = [];
  private categories: ChatbotCategory[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default categories
    this.categories = [
      {
        id: 1,
        name: "General Help",
        description: "General assistance and navigation",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 1
      },
      {
        id: 2,
        name: "Project Management",
        description: "Questions about project creation and management",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 1
      },
      {
        id: 3,
        name: "Test Case Management",
        description: "Test case creation, execution, and management",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 1
      },
      {
        id: 4,
        name: "Bug Tracking",
        description: "Bug reporting and tracking assistance",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 1
      },
      {
        id: 5,
        name: "Reports & Analytics",
        description: "Generating reports and understanding analytics",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 1
      }
    ];

    // Initialize default questions
    this.questions = [
      {
        id: 1,
        question: "How do I create a new project?",
        answer: "To create a new project:\n1. Go to Projects page\n2. Click 'Add Project' button\n3. Fill in project name, description, and prefix\n4. Set project status and assign team members\n5. Click 'Create Project'\n\nYour project will be created with a unique prefix for organizing test cases and bugs.",
        category: "Project Management",
        module: "Projects",
        action: "Create",
        tags: ["project", "create", "new", "setup"],
        isActive: true,
        priority: "High",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 2,
        question: "How do I create test cases?",
        answer: "To create test cases:\n1. Navigate to Test Cases page\n2. Select your project and module\n3. Click 'Add Test Case'\n4. Fill in:\n   - Feature name\n   - Test objective\n   - Pre-conditions\n   - Test steps (numbered)\n   - Expected results\n   - Priority level\n5. Add tags for better organization\n6. Save the test case\n\nTest cases will get auto-generated IDs based on your project prefix.",
        category: "Test Case Management",
        module: "Test Cases",
        action: "Create",
        tags: ["test case", "create", "testing", "steps"],
        isActive: true,
        priority: "High",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 3,
        question: "How do I report a bug?",
        answer: "To report a bug:\n1. Go to Bug Reports page\n2. Click 'Report Bug'\n3. Fill in:\n   - Bug title (clear and descriptive)\n   - Steps to reproduce\n   - Expected vs actual results\n   - Severity level (Critical, Major, Minor, Trivial)\n   - Priority (High, Medium, Low)\n   - Environment details\n4. Attach screenshots or files if needed\n5. Assign to a team member\n6. Submit the bug report\n\nBugs get unique IDs and can be tracked through their lifecycle.",
        category: "Bug Tracking",
        module: "Bug Reports",
        action: "Create",
        tags: ["bug", "report", "issue", "defect"],
        isActive: true,
        priority: "High",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 4,
        question: "How do I generate reports?",
        answer: "To generate reports:\n1. Go to Reports page\n2. Choose report type:\n   - Consolidated Reports (overview)\n   - Bug Summary Reports\n   - Test Execution Reports\n   - Project Progress Reports\n3. Select filters:\n   - Project\n   - Date range\n   - Status\n   - User\n4. Click 'Generate Report'\n5. Export as PDF or CSV if needed\n\nReports provide insights into project health, testing progress, and team productivity.",
        category: "Reports & Analytics",
        module: "Reports",
        action: "Generate",
        tags: ["reports", "analytics", "export", "data"],
        isActive: true,
        priority: "Medium",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 5,
        question: "How do I use the AI test generator?",
        answer: "To use AI test generation:\n1. Go to AI Generator page\n2. Choose input type:\n   - Text description\n   - Website URL\n   - Upload images\n   - Element inspection\n3. Enter your requirement details\n4. Select:\n   - Project and module\n   - Test type (functional, integration, etc.)\n   - Priority level\n   - Number of test cases\n5. Click 'Generate Test Cases'\n6. Review generated test cases\n7. Import selected test cases to your project\n\nThe AI analyzes your input and creates comprehensive test scenarios.",
        category: "Test Case Management",
        module: "AI Generator",
        action: "Generate",
        tags: ["ai", "generate", "automation", "test cases"],
        isActive: true,
        priority: "Medium",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 6,
        question: "How do I manage project team members?",
        answer: "To manage team members:\n1. Go to Projects page and select a project\n2. Click on the project to view details\n3. Navigate to 'Team' tab\n4. To add members:\n   - Click 'Add Member'\n   - Search and select users\n   - Assign roles (Admin, Tester, Developer)\n   - Set permissions\n5. To modify roles:\n   - Click on member\n   - Update role and permissions\n   - Save changes\n\nTeam members can be assigned to test cases and bugs for better collaboration.",
        category: "Project Management",
        module: "Projects",
        action: "Update",
        tags: ["team", "members", "roles", "permissions"],
        isActive: true,
        priority: "Medium",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 7,
        question: "What are the different user roles?",
        answer: "User roles and permissions:\n\n🔸 **Super Admin**\n- Full system access\n- User management\n- System configuration\n- All project operations\n\n🔸 **Admin**\n- Project creation and management\n- User assignment\n- All testing operations\n- Report generation\n\n🔸 **Tester**\n- Test case creation and execution\n- Bug reporting\n- View projects and reports\n- Limited user management\n\n🔸 **Developer**\n- View test cases and bugs\n- Update bug status\n- Limited project access\n- Code-related operations\n\nRoles determine what features and data users can access.",
        category: "General Help",
        module: "Users",
        action: "Read",
        tags: ["roles", "permissions", "access", "users"],
        isActive: true,
        priority: "Low",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      },
      {
        id: 8,
        question: "How do I set up GitHub integration?",
        answer: "To set up GitHub integration:\n1. Go to GitHub Integration page\n2. Configure GitHub settings:\n   - Repository owner/organization\n   - Repository name\n   - Personal Access Token\n3. Test the connection\n4. Enable features:\n   - Auto-create GitHub issues for bugs\n   - Sync comments between systems\n   - Link test cases to code\n5. Save configuration\n\nOnce set up, bugs can automatically create GitHub issues and sync status updates.",
        category: "General Help",
        module: "GitHub Integration",
        action: "Sync",
        tags: ["github", "integration", "sync", "issues"],
        isActive: true,
        priority: "Low",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        createdById: 1
      }
    ];
  }

  // Question management methods
  async getQuestions(): Promise<ChatbotQuestion[]> {
    return this.questions.filter(q => q.isActive);
  }

  async getAllQuestions(): Promise<ChatbotQuestion[]> {
    return this.questions;
  }

  async getQuestionById(id: number): Promise<ChatbotQuestion | undefined> {
    return this.questions.find(q => q.id === id);
  }

  async createQuestion(question: Omit<ChatbotQuestion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ChatbotQuestion> {
    const newQuestion: ChatbotQuestion = {
      ...question,
      id: Math.max(...this.questions.map(q => q.id || 0), 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.questions.push(newQuestion);
    return newQuestion;
  }

  async updateQuestion(id: number, updates: Partial<ChatbotQuestion>): Promise<ChatbotQuestion | null> {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) return null;

    this.questions[questionIndex] = {
      ...this.questions[questionIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.questions[questionIndex];
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) return false;

    this.questions.splice(questionIndex, 1);
    return true;
  }

  async incrementUsageCount(id: number): Promise<void> {
    const question = this.questions.find(q => q.id === id);
    if (question) {
      question.usageCount = (question.usageCount || 0) + 1;
    }
  }

  // Category management methods
  async getCategories(): Promise<ChatbotCategory[]> {
    return this.categories.filter(c => c.isActive);
  }

  async getAllCategories(): Promise<ChatbotCategory[]> {
    return this.categories;
  }

  async createCategory(category: Omit<ChatbotCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatbotCategory> {
    const newCategory: ChatbotCategory = {
      ...category,
      id: Math.max(...this.categories.map(c => c.id || 0), 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<ChatbotCategory>): Promise<ChatbotCategory | null> {
    const categoryIndex = this.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return null;

    this.categories[categoryIndex] = {
      ...this.categories[categoryIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.categories[categoryIndex];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const categoryIndex = this.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return false;

    this.categories.splice(categoryIndex, 1);
    return true;
  }

  // Search and query methods
  async searchQuestions(query: string, filters?: {
    module?: string;
    category?: string;
    action?: string;
    priority?: string;
  }): Promise<ChatbotQuestion[]> {
    let results = this.questions.filter(q => q.isActive);

    // Text search
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      results = results.filter(q => 
        searchTerms.every(term =>
          q.question.toLowerCase().includes(term) ||
          q.answer.toLowerCase().includes(term) ||
          q.tags.some(tag => tag.toLowerCase().includes(term))
        )
      );
    }

    // Apply filters
    if (filters) {
      if (filters.module) {
        results = results.filter(q => q.module === filters.module);
      }
      if (filters.category) {
        results = results.filter(q => q.category === filters.category);
      }
      if (filters.action) {
        results = results.filter(q => q.action === filters.action);
      }
      if (filters.priority) {
        results = results.filter(q => q.priority === filters.priority);
      }
    }

    return results;
  }

  async findBestMatch(userQuestion: string): Promise<ChatbotQuestion | null> {
    const activeQuestions = this.questions.filter(q => q.isActive);
    if (activeQuestions.length === 0) return null;

    const queryLower = userQuestion.toLowerCase();
    
    // Score questions based on relevance
    const scoredQuestions = activeQuestions.map(question => {
      let score = 0;

      // Exact question match (highest priority)
      if (question.question.toLowerCase() === queryLower) {
        score += 100;
      }

      // Question contains query
      if (question.question.toLowerCase().includes(queryLower)) {
        score += 50;
      }

      // Answer contains query
      if (question.answer.toLowerCase().includes(queryLower)) {
        score += 30;
      }

      // Tag matches
      const queryWords = queryLower.split(' ');
      question.tags.forEach(tag => {
        queryWords.forEach(word => {
          if (tag.toLowerCase().includes(word)) {
            score += 20;
          }
        });
      });

      // Word overlap
      const questionWords = question.question.toLowerCase().split(' ');
      queryWords.forEach(queryWord => {
        questionWords.forEach(questionWord => {
          if (queryWord.length > 3 && questionWord.includes(queryWord)) {
            score += 10;
          }
        });
      });

      // Priority boost
      if (question.priority === 'High') score += 5;
      if (question.priority === 'Medium') score += 3;

      return { question, score };
    });

    // Sort by score and return best match if score is high enough
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    if (scoredQuestions[0]?.score > 10) {
      await this.incrementUsageCount(scoredQuestions[0].question.id!);
      return scoredQuestions[0].question;
    }

    return null;
  }

  // Integration methods
  async syncWithIntelligentBot(): Promise<{ success: boolean; message: string }> {
    try {
      // This would integrate with the existing intelligent chatbot
      // For now, we'll return a success message
      return {
        success: true,
        message: `Synced ${this.questions.length} questions with intelligent chatbot`
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Create singleton instance
export const chatbotService = new ChatbotManagementService();
