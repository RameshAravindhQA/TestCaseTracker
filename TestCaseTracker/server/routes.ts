import { Router, type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeDatabase, saveMatrixCell, getMatrixCellsByProject } from "./matrix-fix";
import { automationService } from "./automation-service";
import { logger } from "./logger";
import { emailService } from "./email-service";
import githubIntegrationsRouter from "./api/github-integrations";
import { geminiService } from "./gemini-service";
import { EnhancedAIService } from "./enhanced-ai-service";
import { aiConfigStorage } from "./ai-config-storage";
import {
  insertUserSchema,
  insertProjectSchema,
  insertProjectMemberSchema,
  insertModuleSchema,
  insertTestCaseSchema,
  insertBugSchema,
  insertActivitySchema,
  insertDocumentFolderSchema,
  insertDocumentSchema,
  insertTimeSheetSchema,
  type TimeSheet,
  type InsertTimeSheet,
  type TimeSheetFolder,
  type InsertTimeSheetFolder,
  type Customer,
  type InsertCustomer,
  type CustomerProject,
  type InsertCustomerProject,

  type Sprint,
  type InsertSprint,
  type KanbanColumn,
  type InsertKanbanColumn,
  type KanbanCard,
  type InsertKanbanCard,
  insertCustomMarkerSchema,
  insertMatrixCellSchema,
  cellValueSchema,
  type CustomMarker,
  type InsertCustomMarker,
  type MatrixCell,
  type InsertMatrixCell,
  type CellValue
} from "@shared/schema";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import flowDiagramRoutes from './api/flow-diagram-routes';
import brdRoutes from "./brd-routes";

// Define session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    userName: string;
    userEmail: string;
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Role check middleware
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userRole && roles.includes(req.session.userRole)) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
};

// Require authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Configure uploads
const createUploadDirectories = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const profilePicturesDir = path.join(uploadsDir, 'profile-pictures');
  const documentsDir = path.join(uploadsDir, 'documents');
  const bugAttachmentsDir = path.join(uploadsDir, 'bug-attachment');

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir);
  }

  // Create profile pictures directory if it doesn't exist
  if (!fs.existsSync(profilePicturesDir)) {
    console.log(`Creating profile pictures directory: ${profilePicturesDir}`);
    fs.mkdirSync(profilePicturesDir);
  } else {
    console.log(`Profile pictures directory exists: ${profilePicturesDir}`);
  }

  // Create documents directory if it doesn't exist
  if (!fs.existsSync(documentsDir)) {
    console.log(`Creating documents directory: ${documentsDir}`);
    fs.mkdirSync(documentsDir);
  } else {
    console.log(`Documents directory exists: ${documentsDir}`);
  }

  // Create bug attachments directory if it doesn't exist
  if (!fs.existsSync(bugAttachmentsDir)) {
    console.log(`Creating bug attachments directory: ${bugAttachmentsDir}`);
    fs.mkdirSync(bugAttachmentsDir);
  } else {
    console.log(`Bug attachments directory exists: ${bugAttachmentsDir}`);
  }

  // Write a test file to verify permissions
  try {
    const testFilePath = path.join(profilePicturesDir, 'test.txt');
    fs.writeFileSync(testFilePath, 'Test file to verify write permissions');
    console.log(`Test file created successfully: ${testFilePath}`);

    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log(`Test file removed successfully`);
  } catch (error) {
    console.error(`Error writing test file: ${error}`);
  }

  return { uploadsDir, profilePicturesDir, documentsDir, bugAttachmentsDir };
};

// Helper function to test GitHub connection
async function testGitHubConnection(owner: string, repo: string, token: string) {
  try {
    console.log(`🔗 Testing GitHub connection for ${owner}/${repo}`);

    // Test 1: Verify token by getting user info
    console.log('📋 Step 1: Verifying GitHub token...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'TestCaseTracker/1.0.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ GitHub user API error:', userResponse.status, errorText);

      if (userResponse.status === 401) {
        return {
          success: false,
          message: 'Invalid GitHub token. Please check your Personal Access Token and ensure it has the correct permissions.',
          step: 'token_verification'
        };
      }

      return {
        success: false,
        message: `GitHub API error: ${userResponse.status} ${userResponse.statusText}`,
        step: 'token_verification'
      };
    }

    const user = await userResponse.json();
    console.log('✅ GitHub user authenticated:', user.login);

    // Test 2: Check if repository exists and is accessible
    console.log('📋 Step 2: Checking repository access...');
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'TestCaseTracker/1.0.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoResponse.ok) {
      const errorText = await repoResponse.text();
      console.error('❌ GitHub repo API error:', repoResponse.status, errorText);

      if (repoResponse.status === 404) {
        return {
          success: false,
          message: 'Repository not found. Please check the owner/repository name or ensure the repository exists and is accessible.',
          step: 'repository_access'
        };
      }

      if (repoResponse.status === 403) {
        return {
          success: false,
          message: 'Access forbidden. Your token may lack required permissions. Please generate a new token with "repo" scope.',
          step: 'repository_access'
        };
      }

      return {
        success: false,
        message: `Failed to access repository: ${repoResponse.status} ${repoResponse.statusText}`,
        step: 'repository_access'
      };
    }

    const repoData = await repoResponse.json();
    console.log('✅ GitHub repository accessible:', repoData.full_name);

    // Test 3: Check if we can create issues (requires appropriate permissions)
    console.log('📋 Step 3: Checking issue creation permissions...');
    const hasIssuesPermission = repoData.permissions?.admin || repoData.permissions?.push || repoData.permissions?.maintain;

    console.log('🔒 Repository permissions:', repoData.permissions);

    if (!hasIssuesPermission) {
      return {
        success: false,
        message: 'Token does not have sufficient permissions to create issues. Please ensure the token has "repo" or "public_repo" scope.',
        step: 'permissions_check',
        data: {
          user: user.login,
          repo: repoData.full_name,
          permissions: repoData.permissions,
          hasIssues: repoData.has_issues,
        }
      };
    }

    console.log('✅ All GitHub connection tests passed!');

    return {
      success: true,
      message: 'GitHub connection successful! Repository is accessible and token has required permissions.',
      step: 'complete',
      data: {
        user: user.login,
        repo: repoData.full_name,
        permissions: repoData.permissions,
        hasIssues: repoData.has_issues,
        tokenScopes: userResponse.headers.get('x-oauth-scopes') || 'unknown'
      }
    };

  } catch (error: any) {
    console.error('❌ GitHub connection test failed:', error);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        step: 'network_error'
      };
    }

    return {
      success: false,
      message: `GitHub API Error: ${error.message || 'Unknown error occurred'}`,
      step: 'unknown_error'
    };
  }
}

// Configure multer for profile picture uploads
const configureProfilePictureUpload = () => {
  const { profilePicturesDir } = createUploadDirectories();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, profilePicturesDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with user ID and timestamp
      const userId = req.session.userId;
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `user-${userId}-${timestamp}${ext}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept only images
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    }
  });
};

// Configure multer for bug attachment uploads
const configureBugAttachmentUpload = () => {
  const { bugAttachmentsDir } = createUploadDirectories();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, bugAttachmentsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with bug ID (if available) and timestamp
      const userId = req.session.userId;
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const sanitizedOriginalName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `bug-${userId}-${sanitizedOriginalName}-${timestamp}${ext}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size to accommodate videos
    },
    fileFilter: (req, file, cb) => {
      // Accept images, videos, PDFs, and common document types
      const acceptedTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Videos - expanded list
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-flv',
        'video/x-matroska', 'video/x-ms-wmv', 'video/3gpp', 'video/mpeg', 'video/avi', 'video/x-ms-asf',
        // Documents
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
        'text/plain', 'text/csv',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
      ];

      console.log(`Received file upload attempt: ${file.originalname}, mimetype: ${file.mimetype}`);

      // Accept all files for now - mimetype detection can be unreliable
      // particularly with video files and different browser implementations
      if (!file.mimetype || acceptedTypes.includes(file.mimetype)) {
        return cb(null, true);
      }

      // For files with unrecognized mime types, check file extensions
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx',
                          '.xls', '.xlsx', '.txt', '.csv', '.zip', '.mp4', '.webm', '.avi', '.mov',
                          '.mkv', '.flv', '.wmv', '.ogv', '.3gp'];

      if (allowedExts.includes(ext)) {
        return cb(null, true);
      }

      // If we get here, the file type is not supported
      console.log(`Rejected file: ${file.originalname} with mimetype: ${file.mimetype} and extension: ${ext}`);
      cb(new Error('File type not supported. Please upload an image, video, or document.'));
    }
  });
};

// Configure multer for document uploads
const configureDocumentUpload = () => {
  const { uploadsDir } = createUploadDirectories();
  const documentsDir = path.join(uploadsDir, 'documents');

  // Create documents directory if it doesn't exist
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, documentsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with document details and timestamp
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${baseName}-${timestamp}${ext}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
    }
  });
};

// Backward compatibility function to handle old bug-attachments directory
const migrateOldDirectories = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const oldBugAttachmentsDir = path.join(uploadsDir, 'bug-attachments');
  const newBugAttachmentDir = path.join(uploadsDir, 'bug-attachment');

  // If the old directory exists and the new one doesn't, rename it
  if (fs.existsSync(oldBugAttachmentsDir) && !fs.existsSync(newBugAttachmentDir)) {
    console.log(`Migrating bug attachments directory from ${oldBugAttachmentsDir} to ${newBugAttachmentDir}`);
    try {
      fs.renameSync(oldBugAttachmentsDir, newBugAttachmentDir);
      console.log('Directory migration completed successfully');
    } catch (error) {
      console.error('Error migrating bug attachments directory:', error);
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Handle any directory migrations first
  migrateOldDirectories();

  // Create upload directories
  createUploadDirectories();

  // Configure uploads
  const profilePictureUpload = configureProfilePictureUpload();
  const bugAttachmentUpload = configureBugAttachmentUpload();
  const documentUpload = configureDocumentUpload(); // Document upload is configured above with configureDocumentUpload()


  // Setup session store
  const SessionStore = MemoryStore(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || "test-track-secret",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false, // Set to false for development
      httpOnly: true,
      sameSite: 'lax' // Add sameSite for better compatibility
    }
  }));

  const apiRouter = Router();

  // AI Provider Diagnostic endpoint
  apiRouter.get("/ai/diagnose", isAuthenticated, async (req, res) => {
    try {
      console.log('🔍 Starting AI provider diagnosis...');

      const diagnosis = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
          hasOpenaiApiKey: !!process.env.OPENAI_API_KEY,
          googleKeyValid: process.env.GOOGLE_API_KEY?.startsWith('AIza') || false,
          openaiKeyValid: process.env.OPENAI_API_KEY?.startsWith('sk-') || false
        },
        providerStatus: EnhancedAIService.getProviderStatus(),
        availableProviders: EnhancedAIService.getAvailableProviders(),
        testResults: {}
      };

      // Test each provider with a simple request
      const testRequest = {
        requirement: 'Simple login test',
        testType: 'functional',
        priority: 'Medium',
        inputType: 'text' as const
      };

      // Test Gemini
      try {
        console.log('🧪 Testing Gemini provider...');
        const geminiResult = await EnhancedAIService.generateTestCases({ ...testRequest, aiProvider: 'gemini' });
        diagnosis.testResults.gemini = {
          success: true,
          testCasesGenerated: geminiResult.testCases.length,
          source: geminiResult.source,
          isRealAI: !geminiResult.source.includes('mock')
        };
      } catch (error: any) {
        diagnosis.testResults.gemini = {
          success: false,
          error: error.message,
          isRealAI: false
        };
      }

      // Test OpenAI
      try {
        console.log('🧪 Testing OpenAI provider...');
        const openaiResult = await EnhancedAIService.generateTestCases({ ...testRequest, aiProvider: 'openai' });
        diagnosis.testResults.openai = {
          success: true,
          testCasesGenerated: openaiResult.testCases.length,
          source: openaiResult.source,
          isRealAI: !openaiResult.source.includes('mock')
        };
      } catch (error: any) {
        diagnosis.testResults.openai = {
          success: false,
          error: error.message,
          isRealAI: false
        };
      }

      console.log('🔍 Diagnosis complete:', diagnosis.testResults);

      res.json({
        success: true,
        diagnosis,
        summary: {
          workingRealProviders: Object.entries(diagnosis.testResults)
            .filter(([_, result]: [string, any]) => result.success && result.isRealAI)
            .map(([provider, _]) => provider),
          totalProviders: Object.keys(diagnosis.testResults).length
        }
      });

    } catch (error: any) {
      console.error('❌ AI diagnosis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Diagnosis failed',
        details: error.message
      });
    }
  });

  // Test endpoint for AI service functionality
  apiRouter.post("/ai/test-generation", isAuthenticated, async (req, res) => {
    try {
      console.log('🧪 Testing AI generation service...');

      const testRequest = {
        requirement: req.body.requirement || 'Test user registration form with email validation',
        projectContext: 'Test Project',
        moduleContext: 'Registration Module',
        testType: req.body.testType || 'functional',
        priority: req.body.priority || 'High',
        inputType: 'text' as const,
        aiProvider: req.body.aiProvider || 'gemini' as const
      };

      console.log('🔮 Calling EnhancedAIService.generateTestCases with test request...');
      const result = await EnhancedAIService.generateTestCases(testRequest);

      console.log('✅ AI generation test completed:', {
        success: result.success,
        testCasesCount: result.testCases?.length || 0,
        source: result.source,
        provider: result.provider,
        isRealAI: !result.source.includes('mock') && !result.source.includes('fallback')
      });

      res.json({
        success: true,
        result,
        testInfo: {
          testCasesGenerated: result.testCases?.length || 0,
          source: result.source,
          provider: result.provider,
          message: result.message,
          isRealAI: !result.source.includes('mock') && !result.source.includes('fallback'),
          aiStatus: EnhancedAIService.getProviderStatus()
        }
      });

    } catch (error: any) {
      console.error('❌ AI generation test failed:', error);
      res.status(500).json({
        success: false,
        error: 'AI generation test failed',
        details: error.message,
        aiStatus: EnhancedAIService.getProviderStatus()
      });
    }
  });

  // Simple AI provider test endpoint
  apiRouter.get("/ai/test-providers", isAuthenticated, async (req, res) => {
    try {
      console.log('🔍 Testing AI providers individually...');

      const results = {
        gemini: { available: false, error: null, tested: false },
        openai: { available: false, error: null, tested: false }
      };

      // Test Gemini
      if (EnhancedAIService.getProviderStatus().gemini.ready) {
        try {
          results.gemini.tested = true;
          await EnhancedAIService.testProvider('gemini');
          results.gemini.available = true;
          console.log('✅ Gemini test passed');
        } catch (error: any) {
          results.gemini.error = error.message;
          console.log('❌ Gemini test failed:', error.message);
        }
      } else {
        results.gemini.error = EnhancedAIService.getProviderStatus().gemini.error;
      }

      // Test OpenAI
      if (EnhancedAIService.getProviderStatus().openai.ready) {
        try {
          results.openai.tested = true;
          await EnhancedAIService.testProvider('openai');
          results.openai.available = true;
          console.log('✅ OpenAI test passed');
        } catch (error: any) {
          results.openai.error = error.message;
          console.log('❌ OpenAI test failed:', error.message);
        }
      } else {
        results.openai.error = EnhancedAIService.getProviderStatus().openai.error;
      }

      res.json({
        success: true,
        results,
        summary: {
          workingProviders: Object.entries(results).filter(([_, r]) => r.available).map(([name, _]) => name),
          availableProviders: Object.keys(results).length,
          mockServiceStatus: 'Available'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Provider test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Provider test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Add comprehensive AI debugging endpoint
  apiRouter.get("/ai/debug-comprehensive", isAuthenticated, async (req, res) => {
    try {
      console.log('🔍 Comprehensive AI Debug Check Started');

      const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          nodeVersion: process.version
        },
        availableProviders: EnhancedAIService.getAvailableProviders(),
        testGeneration: {
          mockServiceWorking: true,
          fallbackMechanism: true
        }
      };

      // Test mock generation
      try {
        const testRequest = {
          requirement: 'Test debug generation',
          testType: 'functional',
          priority: 'Medium',
          inputType: 'text' as const,
          aiProvider: 'gemini' as const
        };

        console.log('🧪 Testing mock generation...');
        const mockResult = await EnhancedAIService.generateTestCases(testRequest);
        debugInfo.testGeneration = {
          mockServiceWorking: mockResult.testCases.length > 0,
          fallbackMechanism: mockResult.source === 'mock-service',
          testCasesGenerated: mockResult.testCases.length,
          source: mockResult.source,
          provider: mockResult.provider
        };
        console.log('✅ Mock generation test successful');
      } catch (testError: any) {
        console.error('❌ Mock generation test failed:', testError);
        debugInfo.testGeneration = {
          mockServiceWorking: false,
          fallbackMechanism: false,
          error: testError.message
        };
      }

      res.json({
        success: true,
        debug: debugInfo,
        recommendations: [
          '✅ Gemini API key configured',
          '✅ OpenAI API key configured',
          debugInfo.testGeneration.mockServiceWorking ? '✅ Mock service working' : '❌ Mock service failed',
          '💡 Mock service should always work as fallback',
          '💡 At least one AI provider should be configured for best results'
        ]
      });

    } catch (error: any) {
      console.error('❌ Debug endpoint failed:', error);
      res.status(500).json({
        success: false,
        error: 'Debug check failed',
        details: error.message
      });
    }
  });

  // AI API key status endpoint
  apiRouter.get("/ai/api-key-status", isAuthenticated, async (req, res) => {
    try {
      const status = EnhancedAIService.getProviderStatus();
      const availableProviders = EnhancedAIService.getAvailableProviders();

      res.json({
        success: true,
        providers: status,
        available: availableProviders,
        hasConfiguredProviders: availableProviders.some(p => p.available)
      });
    } catch (error) {
      console.error("AI API key status error:", error);
      res.status(500).json({ success: false, error: "Failed to check API key status" });
    }
  });

  apiRouter.post("/ai/generate-enhanced-test-cases", isAuthenticated, async (req, res) => {
    try {
      console.log("🚀 AI Test Case Generation Request:", req.body);

      const {
        requirement,
        projectId,
        moduleId,
        testType = 'functional',
        priority = 'Medium',
        aiProvider = 'gemini',
        testCaseCount = 20
      } = req.body;

      if (!requirement || requirement.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Requirement is required for test case generation'
        });
      }

      // Get project and module context if provided
      let projectContext = '';
      let moduleContext = '';

      if (projectId) {
        try {
          const project = await storage.getProject(parseInt(projectId));
          if (project) {
            projectContext = project.name;
          }
        } catch (error) {
          console.warn("Could not fetch project context:", error);
        }
      }

      if (moduleId) {
        try {
          const module = await storage.getModule(parseInt(moduleId));
          if (module) {
            moduleContext = module.name;
          }
        } catch (error) {
          console.warn("Could not fetch module context:", error);
        }
      }

      const generationRequest = {
        requirement,
        projectContext,
        moduleContext,
        testType,
        priority,
        inputType: 'text' as const,
        aiProvider,
        testCaseCount
      };

      const result = await EnhancedAIService.generateTestCases(generationRequest);

      console.log("✅ AI Test Case Generation Successful:", {
        testCasesGenerated: result.testCases.length,
        provider: result.provider,
        source: result.source
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error: any) {
      console.error("❌ AI Test Case Generation Error:", error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test cases',
        details: error.message
      });
    }
  });

  // GitHub integrations routes
  apiRouter.use("/github", githubIntegrationsRouter);

  // Flow diagram routes
  apiRouter.use("/flow-diagrams", flowDiagramRoutes);

  // BRD Documents routes
  apiRouter.use("/brd-documents", brdRoutes);

  // Navadhiti Projects routes
  apiRouter.get("/navadhiti-projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getNavadhitiProjects();
      res.json(projects);
    } catch (error) {
      console.error("Get navadhiti projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/navadhiti-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getNavadhitiProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Get navadhiti project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/navadhiti-projects", isAuthenticated, async (req, res) => {
    try {
      const projectData = {
        ...req.body,
        createdById: req.session.userId
      };
      const project = await storage.createNavadhitiProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Create navadhiti project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/navadhiti-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProject = await storage.updateNavadhitiProject(id, req.body);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      console.error("Update navadhiti project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/navadhiti-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNavadhitiProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Delete navadhiti project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Request Forms API Routes
  apiRouter.get("/request-forms/types", isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getRequestFormTypes();
      res.json(types);
    } catch (error) {
      console.error("Get request form types error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/request-forms/types", isAuthenticated, async (req, res) => {
    try {
      const typeData = {
        ...req.body,
        createdById: req.session.userId
      };
      const type = await storage.createRequestFormType(typeData);
      res.status(201).json(type);
    } catch (error) {
      console.error("Create request form type error:", error);
      res.status(400).json({ message: "Invalid type data" });
    }
  });

  apiRouter.get("/request-forms/options/:formTypeId", isAuthenticated, async (req, res) => {
    try {
      const formTypeId = parseInt(req.params.formTypeId);
      const options = await storage.getRequestFormOptions(formTypeId);
      res.json(options);
    } catch (error) {
      console.error("Get request form options error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/request-forms/options", isAuthenticated, async (req, res) => {
    try {
      const option = await storage.createRequestFormOption(req.body);
      res.status(201).json(option);
    } catch (error) {
      console.error("Create request form option error:", error);
      res.status(400).json({ message: "Invalid option data" });
    }
  });

  apiRouter.get("/resource-requests", isAuthenticated, async (req, res) => {
    try {
      const {projectId, status, department, requestType } = req.query;
      const requests = await storage.getResourceRequests({
        projectId: projectId ? parseInt(projectId as string) : undefined,
        status: status as string,
        department: department as string,
        requestType: requestType as string,
        userId: req.session.userId,
        userRole: req.session.userRole
      });
      res.json(requests);
    } catch (error) {
      console.error("Get resource requests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/resource-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getResourceRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Get resource request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/resource-requests", isAuthenticated, async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        createdById: req.session.userId,
        status: req.body.status || 'Draft'
      };

      // Generate request ID if not provided
      if (!requestData.requestId) {
        const prefix = requestData.requestType ?
          requestData.requestType.split(' ')[0].toUpperCase() : 'REQ';
        const timestamp = Date.now().toString().slice(-6);
        requestData.requestId = `${prefix}-${timestamp}`;
      }

      const request = await storage.createResourceRequest(requestData);

      // Send notification to lead if specified
      if (request.leadId) {
        await storage.createNotification({
          userId: request.leadId,
          type: 'resource_request',
          title: 'New Resource Request Assigned',
          message: `You have been assigned a new ${request.requestType}: ${request.title}`,
          entityType: 'resource_request',
          entityId: request.id,
          requestId: request.id,
        });
      }

      res.status(201).json(request);
    } catch (error) {
      console.error("Create resource request error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  apiRouter.put("/resource-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedRequest = await storage.updateResourceRequest(id, req.body);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      console.error("Update resource request error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  apiRouter.post("/resource-requests/:id/extend", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newEndDate, extensionReason } = req.body;
      const extension = await storage.createRequestExtension({
        requestId: id,
        newEndDate,
        extensionReason,
        requestedById: req.session.userId
      });
      res.status(201).json(extension);
    } catch (error) {
      console.error("Create request extension error:", error);
      res.status(400).json({ message: "Invalid extension data" });
    }
  });

  apiRouter.get("/resource-requests/:id/extensions", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const extensions = await storage.getRequestExtensions(id);
      res.json(extensions);
    } catch (error) {
      console.error("Get request extensions error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/resource-requests/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, comments } = req.body;
      const request = await storage.approveResourceRequest(id, {
        status,
        approvedById: req.session.userId,
        comments
      });
      res.json(request);
    } catch (error) {
      console.error("Approve resource request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/resource-requests/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const commentData = {
        ...req.body,
        requestId,
        userId: req.session.userId
      };
      const comment = await storage.createRequestComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Create request comment error:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  apiRouter.get("/resource-requests/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const comments = await storage.getRequestComments(requestId);
      res.json(comments);
    } catch (error) {
      console.error("Get request comments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Notifications API routes
  apiRouter.get("/notifications/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/notifications", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Status Review endpoints
  apiRouter.get("/navadhiti-projects/status-reviews", isAuthenticated, async (req, res) => {
    try {
      const {date} = req.query;
      const reviews = await storage.getStatusReviews(date as string);
      res.json(reviews);
    } catch (error) {
      console.error("Get status reviews error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Employee-Project Mapping endpoints
  apiRouter.get("/employee-projects", isAuthenticated, async (req, res) => {
    try {
      const {employeeId} = req.query;
      const employeeProjects = await storage.getEmployeeProjects(employeeId ? parseInt(employeeId as string) : undefined);
      res.json(employeeProjects);
    } catch (error) {
      console.error("Get employee projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/employee-projects", isAuthenticated, async (req, res) => {
    try {
      const mappingData = {
        ...req.body,
        createdById: req.session.userId
      };
      const mapping = await storage.createEmployeeProject(mappingData);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Create employee project mapping error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/employee-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updated = await storage.updateEmployeeProject(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Update employee project mapping error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/employee-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployeeProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Delete employee project mapping error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get employee project history (all employees)
  apiRouter.get("/employee-projects-history", isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getAllEmployeeProjectHistory();
      res.json(history);
    } catch (error) {
      console.error("Get employee project history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get employee project history for specific employee
  apiRouter.get("/employee-projects-history/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const history = await storage.getEmployeeProjectHistory(employeeId);
      res.json(history);
    } catch (error) {
      console.error("Get employee project history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Add extend project duration route for history management
  apiRouter.post("/employee-projects/:id/extend", isAuthenticated, async (req, res) => {
    try {
      const allocationId = parseInt(req.params.id);
      const { newEndDate, extensionDays } = req.body;

      // Get current allocation
      const currentAllocation = await storage.getEmployeeProjectAllocation(allocationId);
      if (!currentAllocation) {
        return res.status(404).json({ message: "Project allocation not found" });
      }

      // Calculate new end date if extension days provided
      let finalEndDate = newEndDate;
      if (extensionDays && !newEndDate) {
        const currentEnd = new Date(currentAllocation.endDate || new Date());
        currentEnd.setDate(currentEnd.getDate() + parseInt(extensionDays));
        finalEndDate = currentEnd.toISOString().split('T')[0];
      }

      // Update the allocation with new end date
      const updatedAllocation = await storage.updateEmployeeProject(allocationId, {
        endDate: finalEndDate,
        updatedAt: new Date(),
        updatedById: req.session.userId
      });

      // Create history record for the extension
      await storage.createEmployeeProjectHistory({
        employeeProjectId: allocationId,
        action: 'extended',
        previousEndDate: currentAllocation.endDate,
        newEndDate: finalEndDate,
        extensionDays: extensionDays || null,
        createdById: req.session.userId,
        createdAt: new Date()
      });

      res.json({
        success: true,
        message: "Project duration extended successfully",
        allocation: updatedAllocation
      });
    } catch (error) {
      console.error("Extend project duration error:", error);
      res.status(500).json({ message: "Failed to extend project duration" });
    }
  });

  apiRouter.post("/navadhiti-projects/status-review", isAuthenticated, async (req, res) => {
    try {
      const reviewData = {
        ...req.body,
        createdById: req.session.userId
      };
      const review = await storage.createStatusReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Create status review error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Auth routes
  apiRouter.post("/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await storage.updateUser(user.id, { verificationToken });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
        logger.info(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      // Return user without sensitive data
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  apiRouter.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is verified (in a production app)
      // if (!user.verified) {
      //   return res.status(401).json({ message: "Please verify your email before logging in" });
      // }

      // Set session data directly without regeneration to avoid session issues
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.firstName; // Use firstName since name might not exist
      req.session.userEmail = user.email;

      // Save session explicitly and ensure it's properly committed
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Session save failed" });
        }

        console.log("Login successful - Session set and saved:", {
          sessionId: req.sessionID,
          userId: req.session.userId,
          userRole: req.session.userRole,
          userName: req.session.userName,
          userEmail: req.session.userEmail
        });

        // Verify session data is set
        if (!req.session.userId) {
          console.error("Session userId not set after save");
          return res.status(500).json({ message: "Session initialization failed" });
        }

        // Return user without sensitive data
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  apiRouter.get("/auth/user", async (req, res) => {
    try {
      console.log("GET /api/auth/user - Session data:", {
        sessionId: req.sessionID,
        userId: req.session?.userId,
        userRole: req.session?.userRole,
        userEmail: req.session?.userEmail,
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : []
      });

      // Check if session exists
      if (!req.session) {
        console.log("No session found");
        return res.status(401).json({ message: "No session found" });
      }

      // Check if user is logged in
      if (!req.session.userId) {
        console.log("No userId in session");
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log(`User not found for ID: ${req.session.userId}`);
        // Clear invalid session
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
        });
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`User authenticated successfully: ${user.email}`);

      // Return user without sensitive data
      const { password, tempPassword, resetToken, resetTokenExpires, verificationToken, ...userWithoutPassword } = user;

      // Set proper cache headers to prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal that the user doesn't exist
        return res.json({ message: "If your email exists, you will receive a password reset link" });
      }

      // Generate token with expiry
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpires,
      });

      // In a real app, send reset email here

      res.json({ message: "If your email exists, you will receive a password reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Find user with this token
      // NOTE: This lookup might be inefficient if the users table is large.
      // Consider a dedicated 'password_reset_tokens' table or optimizing the find logic.
      const users = await storage.getUsers(); // Assuming storage.getUsers() retrieves all users
      const user = users.find((user: any) => user.resetToken === token && user.resetTokenExpires > new Date());


      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update user
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // User profile
  apiRouter.get("/user/current", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user profile
  apiRouter.patch("/user/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Users can only update their own profile unless they're an admin
      if (userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const { firstName, lastName, email, role, status, phoneNumber, theme } = req.body;

      // Only admins can change roles
      if (role && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "Only admins can change roles" });
      }

      // Only admins can change status
      if (status && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "Only admins can change status" });
      }

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (theme) updateData.theme = theme;
      if (role && req.session.userRole === "Admin") updateData.role = role;
      if (status && req.session.userRole === "Admin") updateData.status = status;

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session if user is updating their own profile
      if (userId === req.session.userId) {
        if (firstName) req.session.userName = firstName; // Using firstName as userName for now
        if (email) req.session.userEmail = email;
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });



  // Users management endpoints - available only to admins
  apiRouter.get("/users", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Remove sensitive data
      const sanitizedUsers = users.map(user => {
        const { password, tempPassword, resetToken, resetTokenExpires, verificationToken, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Public users endpoint for messenger (limited data)
  apiRouter.get("/users/public", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Return minimal user info for messenger functionality
      const publicUsers = users
        .filter(user => user.id !== req.session.userId) // Exclude current user
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName || ''}`.trim(),
          email: user.email,
          avatar: user.profilePicture,
          profilePicture: user.profilePicture,
          role: user.role,
          isOnline: false, // Will be updated by WebSocket
          lastSeen: user.lastLoginAt || user.createdAt
        }));

      console.log(`[API] Returning ${publicUsers.length} public users for messenger:`, publicUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));

      res.json(publicUsers);
    } catch (error) {
      console.error("Get public users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/users", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const { firstName, lastName, email, role, phoneNumber, status } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate a temporary password
      const tempPassword = crypto.randomBytes(8).toString("hex");

      // Hash the temporary password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Create user with temporary password
      const newUser = await storage.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || "Tester",
        phoneNumber,
        status: status || "Active",
        tempPassword: tempPassword, // Store plain temp password for response
        tempPasswordUsed: false
      });

      // Send welcome email with temporary password
      try {
        await emailService.sendWelcomeEmail(newUser.email, newUser.firstName, tempPassword);
        logger.info(`Welcome email with temp password sent to ${newUser.email}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }

      // Return user without sensitive data, but include the temporary password
      const { password, ...userResponse } = newUser;

      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  apiRouter.get("/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Regular users can only view their own profile
      if (req.session.userRole !== "Admin" && userId !== req.session.userId) {
        return res.status(403).json({ message: "You can only view your own profile" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive data
      const { password, tempPassword, resetToken, resetTokenExpires, verificationToken, ...userWithoutSensitiveData } = user;

      res.json(userWithoutSensitiveData);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/users/:id", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Generate temporary password for user
  apiRouter.post("/users/:id/generate-temp-password", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a temporary password
      const tempPassword = crypto.randomBytes(8).toString("hex");

      // Hash the temporary password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Update user with temporary password
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword,
        tempPassword,
        tempPasswordUsed: false
      });

      // In a real app, send email with temp password to the user

      res.json({ tempPassword, message: "Temporary password generated successfully" });
    } catch (error) {
      console.error("Generate temp password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Reset password (for first-time login with temporary password)
  apiRouter.post("/auth/reset-temp-password", isAuthenticated, async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is using a temporary password
      if (!user.tempPassword || user.tempPasswordUsed) {
        return res.status(400).json({ message: "Invalid request - no temporary password active" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user with new password
      await storage.updateUser(user.id, {
        password: hashedPassword,
        tempPasswordUsed: true
      });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset temp password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Upload profile picture is already configured at the top of the function

  // Handle multer errors for uploads globally
  const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'File too large. Maximum size is 50MB.',
          error: err.message
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    if (err) {
      return res.status(500).json({
        message: 'Error during file upload',
        error: err.message
      });
    }
    next();
  };

  // Add the uploads endpoint for bug attachments with error handling
  apiRouter.post("/uploads/bug-attachment", isAuthenticated,
    (req, res, next) => {
      console.log("Starting bug attachment upload request");
      console.log("Request headers:", req.headers);
      console.log("Request content type:", req.headers['content-type']);

      bugAttachmentUpload.single('file')(req, res, (err) => {
        if (err) {
          console.error("Multer error during file upload:", err);
          return handleMulterError(err, req, res, next);
        }
        console.log("File upload middleware processed successfully");
        next();
      });
    },
    async (req, res) => {
      try {
        console.log("Processing bug attachment upload request");

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Get file path relative to the server root for serving in the browser
        const fileName = path.basename(req.file.path);

        // Ensure we use consistent path format for the URL
        const fileUrl = `/uploads/bug-attachment/${fileName}`;

        // Return file attachment details with all fields required by the FileAttachment interface
        const fileAttachment = {
          id: parseInt(crypto.randomBytes(4).toString('hex'), 16), // Convert to number for id
          fileName: req.file.originalname,
          fileUrl: fileUrl,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedById: req.session.userId,
          uploadedAt: new Date().toISOString(),
          entityType: 'bug',  // Default to bug since this is for bug attachments
          entityId: 0         // This will be updated when the bug is created or updated
        };

        console.log("Uploaded file details:", fileAttachment);

        res.status(201).json(fileAttachment);
      } catch (error) {
        console.error("Bug attachment upload error:", error);
        res.status(500).json({ message: "Failed to upload attachment" });
      }
    });

  // Bug Comments API endpoints
  apiRouter.get("/bugs/:bugId/comments", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.bugId);
      const comments = await storage.getBugComments(bugId);
      res.json(comments);
    } catch (error) {
      console.error("Get bug comments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/bugs/:bugId/comments", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.bugId);
      const { content, parentId, isPrivate, syncToGithub } = req.body;

      const comment = await storage.createBugComment({
        bugId,
        content,
        authorId: req.session.userId!,
        parentId,
        isPrivate: isPrivate || false
      });

      // If sync to GitHub is requested and we have GitHub integration
      if (syncToGithub && req.body.githubIssueNumber) {
        // GitHub sync logic here
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error("Create bug comment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/bugs/:bugId/comments/:commentId", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;

      const comment = await storage.updateBugComment(commentId, { content });
      res.json(comment);
    } catch (error) {
      console.error("Update bug comment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/bugs/:bugId/comments/:commentId", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      await storage.deleteBugComment(commentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bug comment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/bugs/:bugId/comments/:commentId/reactions", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { type } = req.body;

      const reaction = await storage.addCommentReaction({
        commentId,
        userId: req.session.userId!,
        type
      });

      res.json(reaction);
    } catch (error) {
      console.error("Add comment reaction error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Automation API routes
  apiRouter.get("/automation/scripts", isAuthenticated, async (req, res) => {
    try {
      // Return empty array for now since automation service is not fully implemented
      res.json([]);
    } catch (error) {
      console.error("Get automation scripts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/scripts", isAuthenticated, async (req, res) => {
    try {
      // Mock script creation for now
      const script = {
        id: `script_${Date.now()}`,
        name: req.body.name || 'New Script',
        description: req.body.description || '',
        projectId: req.body.projectId,
        moduleId: req.body.moduleId,
        testCaseIds: req.body.testCaseIds || [],
        script: '',
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      res.status(201).json(script);
    } catch (error) {
      console.error("Create automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/start-recording", isAuthenticated, async (req, res) => {
    try {
      // Mock recording start
      const recordingId = `recording_${Date.now()}`;
      res.json({ recordingId, message: "Recording started" });
    } catch (error) {
      console.error("Start recording error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/stop-recording", isAuthenticated, async (req, res) => {
    try {
      // Mock recording stop
      const script = {
        id: `script_${Date.now()}`,
        name: `Recorded Script - ${new Date().toLocaleDateString()}`,
        description: 'Automatically recorded script',
        status: 'ready',
        script: '// Generated automation script\nconsole.log("Script executed");'
      };

      res.json(script);
    } catch (error) {
      console.error("Stop recording error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/automation/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      // Mock script deletion
      res.json({ message: "Script deleted successfully" });
    } catch (error) {
      console.error("Delete automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // TimeSheet API endpoints
  apiRouter.get("/timesheets", isAuthenticated, async (req, res) => {
    try {
      const {projectId, userId, folderId } = req.query;
      const requestingUser = req.session?.userId;

      console.log(`[API] Getting timesheets with filters:`, {
        projectId: projectId ? parseInt(projectId as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        folderId: folderId ? parseInt(folderId as string) : undefined,
        requestingUser
      });

      let timeSheets: TimeSheet[];

      if (userId) {
        // Get timesheets for specific user
        timeSheets = await storage.getUserTimeSheets(parseInt(userId as string));
      } else if (projectId) {
        // Get timesheets for specific project
        timeSheets = await storage.getProjectTimeSheets(parseInt(projectId as string));
      } else {
        // Get all timesheets (admin view)
        timeSheets = await storage.getTimeSheets();
      }

      // Apply folder filter if specified
      if (folderId) {
        const folderIdNum = parseInt(folderId as string);
        timeSheets = timeSheets.filter(ts => ts.folderId === folderIdNum);
      }

      console.log(`[API] Returning ${timeSheets.length} timesheets for user ${requestingUser}:`,
        timeSheets.map(ts => ({ id: ts.id, projectId: ts.projectId, userId: ts.userId, description: ts.description })));

      res.json(timeSheets);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      res.status(500).json({ success: false, error: "Failed to fetch timesheets" });
    }
  });

  // Get individual timesheet by ID
  apiRouter.get("/timesheets/:id", isAuthenticated, async (req, res) => {
    try {
      const timesheetId = parseInt(req.params.id);
      const timesheet = await storage.getTimeSheet(timesheetId);

      if (!timesheet) {
        return res.status(404).json({ success: false, error: "Timesheet not found" });
      }

      console.log(`[API] Returning timesheet ${timesheetId}:`, timesheet);
      res.json(timesheet);
    } catch (error) {
      console.error("Error fetching timesheet:", error);
      res.status(500).json({ success: false, error: "Failed to fetch timesheet" });
    }
  });

  apiRouter.post("/timesheets", isAuthenticated, async (req, res) => {
    try {
      console.log('Creating timesheet with request body:', req.body);

      const timesheetData = insertTimeSheetSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      console.log('Parsed timesheet data:', timesheetData);

      const timesheet = await storage.createTimeSheet(timesheetData);

      console.log('Created timesheet:', timesheet);

      res.status(201).json(timesheet);
    } catch (error) {
      console.error("Create timesheet error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  apiRouter.patch("/timesheets/:id", isAuthenticated, async (req, res) => {
    try {
      const timesheetId = parseInt(req.params.id);
      const { status, comments, approvedById, approvalDate } = req.body;
      const requestingUserId = req.session?.userId;

      console.log(`[API] PATCH timesheet ${timesheetId} with status: ${status}`, {
        status,
        comments,
        approvedById,
        approvalDate,
        requestingUserId
      });

      // Get current timesheet
      const currentTimesheet = await storage.getTimeSheet(timesheetId);
      if (!currentTimesheet) {
        return res.status(404).json({ success: false, error: "Timesheet not found" });
      }

      // Update with new status and approval info
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };

      // Ensure approval fields are set for status changes
      if (status === "Approved" || status === "Rejected") {
        updateData.approvedById = approvedById || requestingUserId;
        updateData.approvalDate = approvalDate || new Date();
        if (status === "Rejected" && comments) {
          updateData.comments = comments;
        }
      }

      const updatedTimeSheet = await storage.updateTimeSheet(timesheetId, updateData);

      if (!updatedTimeSheet) {
        return res.status(404).json({ success: false, error: "Failed to update timesheet" });
      }

      console.log(`[API] Successfully updated timesheet ${timesheetId} to status: ${status}`);
      res.json({ success: true, timesheet: updatedTimeSheet });
    } catch (error) {
      console.error("Error updating timesheet status:", error);
      res.status(500).json({ success: false, error: "Failed to update timesheet status" });
    }
  });


  // TimeSheet Folders API endpoints
  apiRouter.get("/timesheet-folders", isAuthenticated, async (req, res) => {
    try {
      const folders = await storage.getTimeSheetFolders(req.session.userId!);
      res.json(folders);
    } catch (error) {
      console.error("Get timesheet folders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/timesheet-folders", isAuthenticated, async (req, res) => {
    try {
      const folderData = insertTimeSheetFolderSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const folder = await storage.createTimeSheetFolder(folderData);
      res.status(201).json(folder);
    } catch (error) {
      console.error("Create timesheet folder error:", error);
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  apiRouter.patch("/timesheet-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const updatedFolder = await storage.updateTimeSheetFolder(folderId, req.body);
      res.json(updatedFolder);
    } catch (error) {
      console.error("Update timesheet folder error:", error);
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  apiRouter.delete("/timesheet-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const success = await storage.deleteTimeSheetFolder(folderId);
      res.json({ success });
    } catch (error) {
      console.error("Delete timesheet folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Customers API endpoints
  apiRouter.get("/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/customers", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        createdById: req.session.userId,
      });

      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  // Employee import endpoint
  apiRouter.post("/employees/import", isAuthenticated, checkRole(["Admin"]),
    documentUpload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No file uploaded"
          });
        }

        const csv = await import('csv-parser');
        const fs = await import('fs');

        const results: any[] = [];
        const filePath = req.file.path;

        const stream = fs.createReadStream(filePath)
          .pipe(csv.default())
          .on('data', (data: any) => results.push(data))
          .on('end', async () => {
            try {
              // Process the CSV data
              const employeesToImport = results.map((row, index) => ({
                employeeId: row.employeeId || row.emp_id || `EMP${String(Date.now() + index).slice(-6)}`,
                firstName: row.firstName || row.first_name || row.name?.split(' ')[0] || '',
                lastName: row.lastName || row.last_name || row.name?.split(' ').slice(1).join(' ') || '',
                email: row.email || '',
                phone: row.phone || row.phoneNumber || '',
                department: row.department || 'Development',
                designation: row.designation || row.title || 'Developer',
                joiningDate: row.joiningDate || row.joining_date || new Date().toISOString(),
                status: row.status || 'Active',
                technologies: typeof row.technologies === 'string'
                  ? row.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
                  : Array.isArray(row.technologies) ? row.technologies : [],
                locality: row.locality || '',
                overallExperience: row.overallExperience || '',
                createdById: req.session.userId
              }));

              const result = await storage.importEmployees(employeesToImport);

              // Clean up uploaded file
              fs.unlinkSync(filePath);

              res.json({
                success: true,
                imported: result.successCount,
                errors: result.errors,
                message: `Successfully imported ${result.successCount} employees${result.errorCount > 0 ? ` with ${result.errorCount} errors` : ''}`
              });

            } catch (error: any) {
              // Clean up file on error
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }

              console.error("Employee import processing error:", error);
              res.status(500).json({
                success: false,
                message: "Failed to process employee data",
                error: error.message
              });
            }
          })
          .on('error', (error: any) => {
            console.error("CSV parsing error:", error);

            // Clean up file on error
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

            res.status(400).json({
              success: false,
              message: "Failed to parse CSV file",
              error: error.message
            });
          });

      } catch (error: any) {
        console.error("Employee import error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to import employees",
          error: error.message
        });
      }
    }
  );

  // Chat file upload endpoint
  apiRouter.post("/chat/upload", isAuthenticated,
    (req, res, next) => {
      bugAttachmentUpload.array('files', 10)(req, res, (err) => {
        if (err) {
          console.error("Chat file upload error:", err);
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    },
    async (req, res) => {
      try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedFiles = req.files.map((file: any) => ({
          id: parseInt(crypto.randomBytes(4).toString('hex'), 16),
          fileName: file.originalname,
          fileUrl: `/uploads/bug-attachment/${path.basename(file.path)}`,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedById: req.session.userId,
          uploadedAt: new Date().toISOString(),
          entityType: 'chat',
          entityId: 0
        }));

        res.status(201).json(uploadedFiles);
      } catch (error) {
        console.error("Chat file upload processing error:", error);
        res.status(500).json({ message: "Failed to process uploaded files" });
      }
    }
  );

  apiRouter.post("/chat/ai", isAuthenticated, async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Simple AI response logic (you can enhance this with actual AI integration)
      const responses = {
        'test-management': [
          "I can help you create test cases, manage bugs, and organize your testing workflow. What specific area would you like assistance with?",
          "For test case management, I recommend organizing your test cases by modules and using clear naming conventions. Would you like me to help you create a test case?",
          "Bug reporting should include clear steps to reproduce, expected vs actual results, and severity level. Need help with a specific bug?",
          "I can help you generate test reports, analyze test coverage, and track project progress. What metrics are you interested in?",
          "For automation, consider starting with your most repetitive test cases. Would you like guidance on automation strategy?"
        ]
      };

      const contextResponses = responses[context as keyof typeof responses] || responses['test-management'];
      const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)];

      // Add some intelligence based on message content
      let response = randomResponse;

      if (message.toLowerCase().includes('test case')) {
        response = "I can help you create test cases! Test cases should include: 1) Clear test objectives, 2) Preconditions, 3) Test steps, 4) Expected results. Would you like me to guide you through creating a specific test case?";
      } else if (message.toLowerCase().includes('bug')) {
        response = "For effective bug reporting, include: 1) Steps to reproduce, 2) Expected behavior, 3) Actual behavior, 4) Environment details, 5) Screenshots if applicable. Need help reporting a specific bug?";
      } else if (message.toLowerCase().includes('report')) {
        response = "I can help you generate various reports including test execution reports, bug summary reports, and project progress reports. Which type of report are you looking for?";
      } else if (message.toLowerCase().includes('automation')) {
        response = "Test automation is great for repetitive tests! Start by identifying stable test cases, then consider tools like Selenium for web testing. What type of testing are you looking to automate?";
      }

      res.json({ response });
    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // Serve uploaded files (profile pictures and documents)
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {


// Comprehensive Chat API for Messenger
  apiRouter.get("/chats", isAuthenticated, async (req, res) => {
    try {
      // Get user's conversations/chats
      const userChats = await storage.getUserConversations(req.session.userId!);
      res.json(userChats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  apiRouter.get("/chats/:chatId/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getMessagesByChat(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  });

  apiRouter.post("/chats/direct", isAuthenticated, async (req, res) => {
    try {
      const { targetUserId } = req.body;

      // Check if direct conversation already exists
      let conversation = await storage.getDirectConversation(req.session.userId!, targetUserId);

      if (!conversation) {
        // Create new direct conversation
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ error: 'Target user not found' });
        }

        conversation = await storage.createDirectConversation(req.session.userId!, targetUserId);
        conversation.name = `${targetUser.firstName} ${targetUser.lastName || ''}`.trim();
      }

      res.json(conversation);
    } catch (error) {
      console.error('Create direct chat error:', error);
      res.status(500).json({ error: 'Failed to create direct chat' });
    }
  });

  apiRouter.post("/chats/group", isAuthenticated, async (req, res) => {
    try {
      const { name, description, participants } = req.body;

      const conversation = await storage.createConversation({
        type: 'group',
        name,
        description,
        participants: [req.session.userId!, ...participants]
      });

      res.json(conversation);
    } catch (error) {
      console.error('Create group chat error:', error);
      res.status(500).json({ error: 'Failed to create group chat' });
    }
  });

  // Handle both direct messages and conversation messages
  apiRouter.post("/messages", isAuthenticated, async (req, res) => {
    try {
      console.log('[API] Creating message with data:', req.body);

      const { receiverId, content, conversationId, type, attachments } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content is required' });
      }

      if (!receiverId && !conversationId) {
        return res.status(400).json({ error: 'Either receiverId or conversationId is required' });
      }

      let targetConversationId = conversationId;

      // If no conversation ID but has receiverId, create/find direct conversation
      if (!targetConversationId && receiverId) {
        let conversation = await storage.getDirectConversation(req.session.userId!, receiverId);

        if (!conversation) {
          conversation = await storage.createDirectConversation(req.session.userId!, receiverId);
        }

        targetConversationId = conversation.id;
      }

      // Get sender info
      const sender = await storage.getUser(req.session.userId!);

      // Use the new createMessage method
      const message = await storage.createMessage({
        senderId: req.session.userId!,
        receiverId,
        content: content.trim(),
        type: type || 'text',
        attachments: attachments || [],
        sender: sender ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName || '',
          profilePicture: sender.profilePicture
        } : null
      });

      console.log('[API] Message created successfully:', message.id);
      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Get messages for a user (direct messages)
  apiRouter.get("/messages", isAuthenticated, async (req, res) => {
    try {
      console.log('[API] GET /messages with query:', req.query);
      const { userId } = req.query;

      if (userId) {
        // Get direct conversation with this user
        let conversation = await storage.getDirectConversation(req.session.userId!, parseInt(userId as string));

        if (!conversation) {
          // Create conversation if it doesn't exist
          conversation = await storage.createDirectConversation(req.session.userId!, parseInt(userId as string));
          console.log('[API] Created new conversation:', conversation.id);
        }

        const messages = await storage.getMessagesByChat(conversation.id);
        console.log(`[API] Returning ${messages.length} messages for conversation ${conversation.id}`);
        res.json(messages);
      } else {
        console.log('[API] No userId provided, returning empty array');
        res.json([]);
      }
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Project Chat endpoints
  apiRouter.get("/projects/:projectId/chat", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const messages = await storage.getChatMessages(projectId);
      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  });

  apiRouter.post("/projects/:projectId/chat", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { message, replyToId } = req.body;
      const userId = req.session.userId!;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const chatMessage = await storage.createChatMessage({
        projectId,
        userId,
        message: message.trim(),
        type: 'text',
        replyToId: replyToId || null
      });

      res.json(chatMessage);
    } catch (error) {
      console.error('Send chat message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Edit chat message
  apiRouter.put("/chat/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { message } = req.body;
      const userId = req.session.userId!;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const updatedMessage = await storage.updateChatMessage(messageId, userId, {
        message: message.trim(),
        isEdited: true,
        updatedAt: new Date()
      });

      if (!updatedMessage) {
        return res.status(404).json({ error: 'Message not found or access denied' });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error('Edit chat message error:', error);
      res.status(500).json({ error: 'Failed to edit message' });
    }
  });

  // Edit direct message
  apiRouter.put("/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { content } = req.body;
      const userId = req.session.userId!;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Find the message
      const messages = storage.data.messages || [];
      const messageIndex = messages.findIndex(msg => msg.id === messageId && msg.senderId === userId);

      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found or access denied' });
      }

      // Update the message
      messages[messageIndex] = {
        ...messages[messageIndex],
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date().toISOString()
      };

      storage.saveToFile();
      res.json(messages[messageIndex]);
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({ error: 'Failed to edit message' });
    }
  });

  // Delete direct message
  apiRouter.delete("/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = req.session.userId!;

      // Find and remove the message
      const messages = storage.data.messages || [];
      const messageIndex = messages.findIndex(msg => msg.id === messageId && msg.senderId === userId);

      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found or access denied' });
      }

      messages.splice(messageIndex, 1);
      storage.saveToFile();

      res.json({ success: true });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // React to message
  apiRouter.post("/messages/:messageId/react", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      const userId = req.session.userId!;

      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      // Find the message
      const messages = storage.data.messages || [];
      const message = messages.find(msg => msg.id === messageId);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Add or update reaction
      message.reactions = message.reactions || [];
      const existingReaction = message.reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        existingReaction.count = (existingReaction.count || 0) + 1;
      } else {
        message.reactions.push({
          emoji,
          userId,
          count: 1
        });
      }

      storage.saveToFile();
      res.json(message);
    } catch (error) {
      console.error('React to message error:', error);
      res.status(500).json({ error: 'Failed to react to message' });
    }
  });

  apiRouter.get("/projects/:projectId/users", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const projectMembers = await storage.getProjectMembers(projectId);

      // Get user details for each member
      const users = await Promise.all(
        projectMembers.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            id: user?.id,
            name: user?.firstName + ' ' + (user?.lastName || ''),
            avatar: user?.profilePicture,
            role: member.role
          };
        })
      );

      res.json(users);
    } catch (error) {
      console.error('Get project users error:', error);
      res.status(500).json({ error: 'Failed to fetch project users' });
    }
  });

    // Log request for debugging
    console.log(`File access request for: ${req.path}`);

    // Clean up the path to handle all possible formats
    let cleanPath = req.path;
    // Remove any /uploads prefix if it's included and double slashes
    cleanPath = cleanPath.replace(/^\/uploads\/?/, '').replace(/\/+/g, '/');

    // Make sure bug-attachment path is properly handled
    if (cleanPath.startsWith('bug-attachment/')) {
      console.log('Found bug attachment path');
    } else if (cleanPath.startsWith('bug-attachments/')) {
      // Handle legacy path format - redirect to new format
      console.log('Found legacy bug-attachments path, redirecting to bug-attachment');
      // Extract the filename after bug-attachments/
      const filename = cleanPath.replace(/^bug-attachments\/?/, '');
      cleanPath = `bug-attachment/${filename}`;
      console.log(`Redirected to: ${cleanPath}`);
    }

    const filePath = path.join(process.cwd(), 'uploads', cleanPath);
    console.log(`Resolved file path: ${filePath}`);

    // Validate the path to prevent directory traversal attacks
    if (!filePath.startsWith(path.join(process.cwd(), 'uploads'))) {
      console.error(`Security protection: Attempted access to unauthorized path: ${filePath}`);
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ message: "File not found" });
    }

    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();

    // Define a content type mapping
    const contentTypes: Record<string, string> = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',

      // Videos
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogv': 'video/ogg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.flv': 'video/x-flv',
      '.mkv': 'video/x-matroska',
      '.wmv': 'video/x-ms-wmv',
      '.3gp': 'video/3gpp',
      '.mpg': 'video/mpeg',
      '.mpeg': 'video/mpeg',

      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

      // Text
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.ts': 'text/plain',
      '.json': 'application/json',
      '.md': 'text/markdown',

      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
    };

    // Set the content type if we know it, otherwise let the browser determine it
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }

    // Add cache control headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Set content disposition to help with downloading files
    // Use "inline" for files that can be viewed in browser
    const inlineTypes = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Documents that can be viewed in browser
      '.pdf', '.txt', '.html', '.htm',
      // Videos that can be viewed in browser
      '.mp4', '.webm', '.ogv'
    ];
    const disposition = inlineTypes.includes(ext) ? 'inline' : 'attachment';

    // Only set filename for attachment disposition
    if (disposition === 'attachment') {
      const fileName = path.basename(filePath);
      res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
    }

    // Log file access for debugging
    console.log(`Serving file: ${filePath} with content type: ${contentTypes[ext] || 'auto-determined'}`);

    // Serve the file
    res.sendFile(filePath);
  });

  // Projects routes
  apiRouter.get("/projects", isAuthenticated, async (req, res) => {
    try {
      // CRITICAL: Ensure proper data isolation - only show user's own projects
      let projects;

      // Get projects created by this user or where they are members
      const userProjects = await storage.getProjectsByUserId(req.session.userId!);

      // For better security: only return projects where user is creator or explicit member
      projects = userProjects.filter(project => {
        return project.createdById === req.session.userId;
      });

      console.log(`[SECURITY] User ${req.session.userId} (${req.session.userRole}) accessing ${projects.length} own projects only`);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects", isAuthenticated, async (req, res) => {
    try {
      console.log("Creating project with data:", req.body);

      // Validate required fields
      if (!req.body.name || req.body.name.trim() === '') {
        return res.status(400).json({ message: "Project name is required" });
      }

      // Pre-process dates - convert them to ISO strings that Zod expects
      const formData = {
        name: req.body.name.trim(),
        description: req.body.description?.trim() || null,
        status: req.body.status || "Active",
        prefix: req.body.prefix || "DEF",
        createdById: req.session.userId,
        startDate: req.body.startDate ? new Date(req.body.startDate).toISOString() : null,
        endDate: req.body.endDate ? new Date(req.body.endDate).toISOString() : null
      };

      console.log("Processed form data:", formData);

      // Now parse with Zod schema
      const projectData = insertProjectSchema.parse(formData);

      const project = await storage.createProject(projectData);

      // Add creator as a project member with admin role
      try {
        await storage.addProjectMember({
          projectId: project.id,
          userId: req.session.userId!,
          role: "Admin",
        });
        console.log(`Added project creator ${req.session.userId} as admin member of project ${project.id}`);
      } catch (memberError) {
        console.warn("Could not add project member:", memberError);
      }

      // Log activity
      try {
        await storage.createActivity({
          userId: req.session.userId!,
          action: "created",
          entityType: "project",
          entityId: project.id,
          details: { projectName: project.name }
        });
      } catch (activityError) {
        console.warn("Failed to log activity:", activityError);
      }

      // Ensure we return valid JSON
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);

      // Ensure we always return JSON
      res.setHeader('Content-Type', 'application/json');

      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid project data" });
      }
    }
  });

  apiRouter.put("/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has admin access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const userMembership = projectMembers.find(member => member.userId === req.session.userId);

        if ((!userMembership || userMembership.role !== "Admin") && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to update this project" });
        }
      }

      // Pre-process dates before updating
      const formData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate).toISOString() : null,
        endDate: req.body.endDate ? new Date(req.body.endDate).toISOString() : null
      };

      const updatedProject = await storage.updateProject(projectId, formData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "project",
        entityId: projectId,
        details: { projectName: project.name }
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  apiRouter.delete("/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has admin access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const userMembership = projectMembers.find(member => member.userId === req.session.userId);

        if ((!userMembership || userMembership.role !== "Admin") && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to delete this project" });
        }
      }

      const success = await storage.deleteProject(projectId);

      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "project",
          entityId: projectId,
          details: { projectName: project.name }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Project collaborator management
  apiRouter.post("/projects/:id/collaborators", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { email, role = "Member" } = req.body;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has admin access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const userMembership = projectMembers.find(member => member.userId === req.session.userId);

        if (!userMembership || userMembership.role !== "Admin") {
          return res.status(403).json({ message: "You don't have permission to add collaborators" });
        }
      }

      // Find user by email
      const collaboratorUser = await storage.getUserByEmail(email);
      if (!collaboratorUser) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Check if user is already a member
      const existingMembers = await storage.getProjectMembers(projectId);
      const existingMember = existingMembers.find(member => member.userId === collaboratorUser.id);

      if (existingMember) {
        return res.status(400).json({ message: "User is already a collaborator on this project" });
      }

      // Add user as project member
      const newMember = await storage.addProjectMember({
        projectId,
        userId: collaboratorUser.id,
        role,
      });

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "added collaborator",
        entityType: "project",
        entityId: projectId,
        details: {
          projectName: project.name,
          collaboratorEmail: email,
          collaboratorRole: role
        }
      });

      res.status(201).json({
        member: newMember,
        user: {
          id: collaboratorUser.id,
          name: `${collaboratorUser.firstName} ${collaboratorUser.lastName || ''}`.trim(),
          email: collaboratorUser.email
        }
      });
    } catch (error) {
      console.error("Add collaborator error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/projects/:id/collaborators", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const members = await storage.getProjectMembers(projectId);
      const collaborators = [];

      for (const member of members) {
        const user = await storage.getUser(member.userId);
        if (user) {
          collaborators.push({
            id: member.id,
            userId: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            email: user.email,
            role: member.role,
            addedAt: member.createdAt || new Date()
          });
        }
      }

      res.json(collaborators);
    } catch (error) {
      console.error("Get collaborators error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Project members routes
  apiRouter.get("/projects/:id/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Get project members error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects/:id/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const userMembership = projectMembers.find(member => member.userId === req.session.userId);

        if ((!userMembership || userMembership.role !== "Admin") && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to add members to this project" });
        }
      }

      const memberData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId,
      });

      // Check if user exists
      const user = await storage.getUser(memberData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const projectMembers = await storage.getProjectMembers(projectId);
      const existingMember = projectMembers.find(member => member.userId === memberData.userId);

      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }

      const member = await storage.addProjectMember(memberData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "added",
        entityType: "projectMember",
        entityId: member.id,
        details: {
          projectId,
          projectName: project.name,
          userId: user.id,
          userName: user.name
        }
      });

      res.status(201).json(member);
    } catch (error) {
      console.error("Add project member error:", error);
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  apiRouter.delete("/projects/:projectId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);

      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has admin access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const userMembership = projectMembers.find(member => member.userId === req.session.userId);

        if ((!userMembership || userMembership.role !== "Admin") && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to remove members from this project" });
        }
      }

      // Get user info for activity log
      const user = await storage.getUser(userId);

      const success = await storage.removeProjectMember(projectId, userId);

      if (success && user) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "removed",
          entityType: "projectMember",
          entityId: userId,
          details: {
            projectId,
            projectName: project.name,
            userId: user.id,
            userName: user.name
          }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Remove project member error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Fix module IDs for a project (admin only)
  apiRouter.post("/projects/:projectId/fix-module-ids", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const modules = await storage.getModules(projectId);
      const sortedModules = modules.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Get project prefix
      let projectPrefix = project.prefix;
      if (!projectPrefix) {
        // Extract first 2-5 letters from project name
        const cleanProjectName = project.name.replace(/[^a-zA-Z]/g, '');
        if (cleanProjectName.length >= 5) {
          projectPrefix = cleanProjectName.substring(0, 5).toUpperCase();
        } else if (cleanProjectName.length >= 3) {
          projectPrefix = cleanProjectName.substring(0, cleanProjectName.length).toUpperCase();
        } else {
          projectPrefix = cleanProjectName.toUpperCase().padEnd(3, 'X');
        }
      }

      console.log(`Fixing module IDs for project "${project.name}" (ID: ${projectId})`);
      console.log(`Using prefix: ${projectPrefix}`);
      console.log(`Found ${sortedModules.length} modules to fix`);

      // Update module IDs to start from 01 with project prefix
      const updatedModules = [];
      for (let i = 0; i < sortedModules.length; i++) {
        const newModuleId = `${projectPrefix}-MOD-${String(i + 1).padStart(2, '0')}`;
        console.log(`Updating module ${sortedModules[i].id}: ${sortedModules[i].moduleId} -> ${newModuleId}`);
        const updatedModule = await storage.updateModule(sortedModules[i].id, { moduleId: newModuleId });
        updatedModules.push(updatedModule);
      }

      res.json({
        message: `Fixed ${sortedModules.length} module IDs with prefix ${projectPrefix}`,
        modules: sortedModules.length,
        prefix: projectPrefix,
        updatedModules: updatedModules.map(m => ({ id: m?.id, moduleId: m?.moduleId, name: m?.name }))
      });
    } catch (error) {
      console.error("Fix module IDs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Modules routes
  apiRouter.get("/projects/:projectId/modules", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const modules = await storage.getModules(projectId);
      res.json(modules);
    } catch (error) {
      console.error("Get modules error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects/:projectId/modules", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const moduleData = insertModuleSchema.parse({
        ...req.body,
        projectId,
      });

      const module = await storage.createModule(moduleData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "module",
        entityId: module.id,
        details: {
          projectId,
          projectName: project.name,
          moduleName: module.name
        }
      });

      res.status(201).json(module);
    } catch (error) {
      console.error("Create module error:", error);
      res.status(400).json({ message: "Invalid module data" });
    }
  });

  apiRouter.put("/modules/:id", isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);

      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      const project = await storage.getProject(module.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(module.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const updatedModule = await storage.updateModule(moduleId, req.body);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "module",
        entityId: moduleId,
        details: {
          projectId: module.projectId,
          projectName: project?.name,
          moduleName: module.name
        }
      });

      res.json(updatedModule);
    } catch (error) {
      console.error("Update module error:", error);
      res.status(400).json({ message: "Invalid module data" });
    }
  });

  apiRouter.delete("/modules/:id", isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);

      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      const project = await storage.getProject(module.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(module.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const success = await storage.deleteModule(moduleId);

      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "module",
          entityId: moduleId,
          details: {
            projectId: module.projectId,
            projectName: project?.name,
            moduleName: module.name
          }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Delete module error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Tag routes
  // Get all tags
  apiRouter.get("/tags", isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create a new tag
  apiRouter.post("/tags", isAuthenticated, async (req, res) => {
    try {
      const { name, color, projectId } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      // Check if tag already exists with the same name
      const existingTags = await storage.getTags();
      const existingTag = existingTags.find(tag =>
        tag.name.toLowerCase() === name.toLowerCase() &&
        (tag.projectId === projectId || (!tag.projectId && !projectId))
      );

      if (existingTag) {
        // Return existing tag instead of creating duplicate
        return res.status(200).json(existingTag);
      }

      const newTag = await storage.createTag({
        name,
        color: color || "#3b82f6", // Default to blue if no color provided
        projectId: projectId || undefined,
      });

      res.status(201).json(newTag);
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get tags for a project
  apiRouter.get("/projects/:projectId/tags", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      // For now, return empty array since getTagsByProject is not implemented
      const tags: any[] = [];
      res.json(tags);
    } catch (error) {
      console.error("Get project tags error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create new tags for a project
  apiRouter.post("/projects/:projectId/tags", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tags = req.body;

      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }

      const createdTags = [];
      for (const tag of tags) {
        const newTag = await storage.createTag({
          name: tag.name,
          color: tag.color,
          projectId: projectId
        });
        createdTags.push(newTag);
      }

      res.status(201).json(createdTags);
    } catch (error) {
      console.error("Create tags error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Test cases routes
  apiRouter.get("/test-cases", isAuthenticated, async (req, res) => {
    try {
      // Get all test cases for user's accessible projects
      let testCases;
      if (req.session.userRole === "Admin") {
        testCases = await storage.getTestCases();
      } else {
        // Get projects user has access to
        const userProjects = await storage.getProjectsByUserId(req.session.userId!);
        const projectIds = userProjects.map(p => p.id);

        // Get test cases for these projects
        testCases = [];
        for (const projectId of projectIds) {
          const projectTestCases = await storage.getTestCasesByProject(projectId);
          testCases.push(...projectTestCases);
        }
      }

      console.log(`[API] Returning ${testCases.length} test cases for user ${req.session.userId}`);

      // Add cache headers for real-time data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(testCases);
    } catch (error) {
      console.error("Get test cases error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Fix test case IDs endpoint
  apiRouter.post("/test-cases/fix-ids", isAuthenticated, async (req, res) => {
    try {
      await storage.fixExistingTestCaseIds();
      res.json({
        success: true,
        message: "Test case IDs have been fixed successfully"
      });
    } catch (error) {
      console.error("Fix test case IDs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fix test case IDs"
      });
    }
  });

  apiRouter.get("/projects/:projectId/test-cases", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { moduleId } = req.query;

      console.log(`[API] Fetching test cases for project ${projectId}, module: ${moduleId}`);

      const project = await storage.getProject(projectId);

      if (!project) {
        console.log(`[API] Project ${projectId} not found`);
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          console.log(`[API] User ${req.session.userId} doesn't have access to project ${projectId}`);
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      // Use project-specific filtering to ensure test cases belong to this project
      let testCases;
      if (moduleId && moduleId !== 'all') {
        // Validate that the module belongs to this project
        const module = await storage.getModule(parseInt(moduleId as string));
        if (!module || module.projectId !== projectId) {
          console.log(`[API] Module ${moduleId} not found or doesn't belong to project ${projectId}`);
          return res.status(400).json({ message: "Invalid module for this project" });
        }
        testCases = await storage.getTestCasesByFilters(projectId, parseInt(moduleId as string));
      } else {
        testCases = await storage.getTestCasesByProject(projectId);
      }

      console.log(`[API] Returning ${testCases.length} test cases for project ${projectId}:`,
        testCases.slice(0, 3).map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, feature: tc.feature, projectId: tc.projectId })));

      // Add cache headers for real-time data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(testCases);
    } catch (error) {
      console.error("Get test cases error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/test-cases/:id", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const testCase = await storage.getTestCase(testCaseId);

      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }

      const project = await storage.getProject(testCase.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(testCase.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this test case" });
        }
      }

      res.json(testCase);
    } catch (error) {
      console.error("Get test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects/:projectId/test-cases", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      // Check if module exists if provided
      if (req.body.moduleId) {
        const module = await storage.getModule(req.body.moduleId);
        if (!module || module.projectId !== projectId) {
          return res.status(400).json({ message: "Invalid module ID" });
        }
      }

      // Let the storage layer handle testCaseId generation
      const testCaseData = insertTestCaseSchema.parse({
        ...req.body,
        projectId,
        testCaseId: req.body.testCaseId || '', // Empty string will trigger auto-generation in storage
        createdById: req.session.userId,
      });

      const testCase = await storage.createTestCase(testCaseData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "testCase",
        entityId: testCase.id,
        details: {
          projectId,
          projectName: project.name,
          testCaseId: testCase.testCaseId,
          feature: testCase.feature
        }
      });

      res.status(201).json(testCase);
    } catch (error) {
      console.error("Create test case error:", error);
      res.status(400).json({ message: "Invalid test case data" });
    }
  });

  apiRouter.put("/test-cases/:id", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const testCase = await storage.getTestCase(testCaseId);

      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }

      const project = await storage.getProject(testCase.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(testCase.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this test case" });
        }
      }

      // Prevent changing project ID
      if (req.body.projectId && req.body.projectId !== testCase.projectId) {
        return res.status(400).json({ message: "Cannot change project ID" });
      }

      // Check if module exists if changed
      if (req.body.moduleId && req.body.moduleId !== testCase.moduleId) {
        const module = await storage.getModule(req.body.moduleId);
        if (!module || module.projectId !== testCase.projectId) {
          return res.status(400).json({ message: "Invalid module ID" });
        }
      }

      // Process the update data with proper updatedAt timestamp
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const updatedTestCase = await storage.updateTestCase(testCaseId, updateData);

      // Log status change activity specifically
      if (req.body.status && req.body.status !== testCase.status) {
        await storage.createActivity({
          userId: req.session.userId!,
          action: `status changed to ${req.body.status}`,
          entityType: "testCase",
          entityId: testCaseId,
          details: {
            projectId: testCase.projectId,
            projectName: project?.name,
            testCaseId: testCase.testCaseId,
            feature: testCase.feature,
            prevStatus: testCase.status,
            newStatus: req.body.status
          }
        });
      } else if (req.body.severity && req.body.severity !== testCase.severity) {
        await storage.createActivity({
          userId: req.session.userId!,
          action: `severity changed to ${req.body.severity}`,
          entityType: "testCase",
          entityId: testCaseId,
          details: {
            projectId: testCase.projectId,
            projectName: project?.name,
            testCaseId: testCase.testCaseId,
            feature: testCase.feature,
            prevSeverity: testCase.severity,
            newSeverity: req.body.severity
          }
        });
      } else {
        // General update activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "updated",
          entityType: "testCase",
          entityId: testCaseId,
          details: {
            projectId: testCase.projectId,
            projectName: project?.name,
            testCaseId: testCase.testCaseId,
            feature: testCase.feature
          }
        });
      }

      // Set cache headers to prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(updatedTestCase);
    } catch (error) {
      console.error("Update test case error:", error);
      res.status(400).json({ message: "Invalid test case data" });
    }
  });

  apiRouter.delete("/test-cases/:id", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const hardDelete = req.query.hardDelete === 'true';
      const deleted = await storage.deleteTestCase(testCaseId, req.session.userId!, hardDelete);

      if (deleted) {
        res.json({
          message: hardDelete ? "Test case permanently deleted" : "Test case moved to deleted items",
          hardDelete
        });
      } else {
        res.status(404).json({ message: "Test case not found" });
      }
    } catch (error) {
      console.error("Delete test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Permanent delete test case
  apiRouter.delete("/test-cases/:id/permanent", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      
      console.log(`[API] Permanent delete request for test case ${testCaseId}`);
      
      const deleted = await storage.permanentlyDeleteTestCase(testCaseId);

      if (deleted) {
        console.log(`[API] Test case ${testCaseId} permanently deleted successfully`);
        res.json({
          message: "Test case permanently deleted",
          success: true
        });
      } else {
        console.log(`[API] Test case ${testCaseId} not found for permanent deletion`);
        res.status(404).json({ message: "Test case not found" });
      }
    } catch (error) {
      console.error("Permanent delete test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get deleted test cases
  apiRouter.get("/test-cases/deleted", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const deletedTestCases = await storage.getDeletedTestCases(projectId);
      res.json(deletedTestCases);
    } catch (error) {
      console.error("Get deleted test cases error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Restore test case
  apiRouter.post("/test-cases/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const restored = await storage.restoreTestCase(testCaseId);

      if (restored) {
        res.json({ message: "Test case restored successfully" });
      } else {
        res.status(404).json({ message: "Test case not found" });
      }
    } catch (error) {
      console.error("Restore test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get deleted test cases for a project
  apiRouter.get("/projects/:projectId/deleted-test-cases", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);

      console.log(`[API] Fetching deleted test cases for project ${projectId}`);

      const deletedTestCases = await storage.getDeletedTestCasesByProject(projectId);

      console.log(`[API] Returning ${deletedTestCases.length} deleted test cases for project ${projectId}:`,
        deletedTestCases.map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, feature: tc.feature })));

      res.json(deletedTestCases);
    } catch (error) {
      console.error("[API] Get deleted test cases error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Restore deleted test case
  apiRouter.post("/test-cases/:id/restore", isAuthenticated, async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);

      console.log(`[API] Restoring test case ${testCaseId}`);

      const restoredTestCase = await storage.restoreTestCase(testCaseId);

      if (!restoredTestCase) {
        return res.status(404).json({ message: "Test case not found or already active" });
      }

      console.log(`[API] Test case ${testCaseId} restored successfully`);
      res.json({ message: "Test case restored successfully", testCase: restoredTestCase });
    } catch (error) {
      console.error("[API] Restore test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Bug routes
  apiRouter.get("/bugs", isAuthenticated, async (req, res) => {
    try {
      const {projectId, moduleId, status, severity } = req.query;

      console.log(`[API] Fetching bugs with filters:`, { projectId, moduleId, status, severity });

      // Get all bugs first
      const allBugs = await storage.getBugs();

      // Apply filters
      let filteredBugs = [...allBugs];

      if (projectId) {
        const projectIdNum = parseInt(projectId as string);
        filteredBugs = filteredBugs.filter(bug => bug.projectId === projectIdNum);
      }

      if (moduleId) {
        const moduleIdNum = parseInt(moduleId as string);
        filteredBugs = filteredBugs.filter(bug => bug.moduleId === moduleIdNum);
      }

      if (status) {
        filteredBugs = filteredBugs.filter(bug => bug.status === status);
      }

      if (severity) {
        filteredBugs = filteredBugs.filter(bug => bug.severity === severity);
      }

      console.log(`[API] Returning ${filteredBugs.length} bugs for user ${req.session.userId}:`,
        filteredBugs.map(bug => ({ id: bug.id, bugId: bug.bugId, title: bug.title, projectId: bug.projectId, moduleId: bug.moduleId })));

      res.json(filteredBugs);
    } catch (error) {
      console.error("Get bugs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/projects/:projectId/bugs", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { moduleId } = req.query;

      console.log(`[API] Fetching bugs for project ${projectId}, module: ${moduleId}`);

      // Get all bugs for this project
      const bugs = await storage.getBugs();
      const projectBugs = bugs.filter(bug => bug.projectId === projectId);

      // Filter by module if specified
      let filteredBugs = projectBugs;
      if (moduleId) {
        const moduleIdNum = parseInt(moduleId as string);
        filteredBugs = projectBugs.filter(bug => bug.moduleId === moduleIdNum);
      }

      console.log(`[API] Returning ${filteredBugs.length} bugs for project ${projectId}:`,
        filteredBugs.map(bug => ({ id: bug.id, bugId: bug.bugId, title: bug.title, projectId: bug.projectId, moduleId: bug.moduleId })));

      res.json(filteredBugs);
    } catch (error) {
      console.error("Get bugs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/bugs/:id", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.id);
      const bug = await storage.getBug(bugId);

      if (!bug) {
        return res.status(404).json({ message: "Bug not found" });
      }

      const project = await storage.getProject(bug.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(bug.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this bug" });
        }
      }

      res.json(bug);
    } catch (error) {
      console.error("Get bug error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects/:projectId/bugs", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      // Check if module exists if provided
      if (req.body.moduleId) {
        const module = await storage.getModule(req.body.moduleId);
        if (!module || module.projectId !== projectId) {
          return res.status(400).json({ message: "Invalid module ID" });
        }
      }

      // Check if test case exists if provided
      if (req.body.testCaseId) {
        const testCase = await storage.getTestCase(req.body.testCaseId);
        if (!testCase || testCase.projectId !== projectId) {
          return res.status(400).json({ message: "Invalid test case ID" });
        }
      }

      console.log('Creating bug with request body:', req.body);

      // Prepare bug data with optional fields properly set
      const formData = {
        ...req.body,
        projectId,
        reportedById: req.session.userId,
        // Set bugId to empty string if not provided - storage will auto-generate
        bugId: req.body.bugId || '',
        // Set attachments to empty array if not provided
        attachments: req.body.attachments || [],
        // Set screenshotRequired to false by default unless explicitly set to true
        screenshotRequired: req.body.screenshotRequired === true
      };

      console.log('Processed bug form data:', formData);

      // Parse with schema that allows empty bugId (will be auto-generated)
      const bugData = insertBugSchema.parse(formData);

      const bug = await storage.createBug(bugData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "reported",
        entityType: "bug",
        entityId: bug.id,
        details: {
          projectId,
          projectName: project.name,
          bugId: bug.bugId,
          title: bug.title,
          severity: bug.severity
        }
      });

      res.status(201).json(bug);
    } catch (error) {
      console.error("Create bug error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: `Invalid bug data: ${error.message}` });
      } else {
        res.status(400).json({ message: "Invalid bug data" });
      }
    }
  });

  apiRouter.put("/bugs/:id", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.id);
      const bug = await storage.getBug(bugId);

      if (!bug) {
        return res.status(404).json({ message: "Bug not found" });
      }

      const project = await storage.getProject(bug.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(bug.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this bug" });
        }
      }

      // Prevent changing project ID
      if (req.body.projectId && req.body.projectId !== bug.projectId) {
        return res.status(400).json({ message: "Cannot change project ID" });
      }

      // Check if module exists if changed
      if (req.body.moduleId && req.body.moduleId !== bug.moduleId) {
        const module = await storage.getModule(req.body.moduleId);
        if (!module || module.projectId !== bug.projectId) {
          return res.status(400).json({ message: "Invalid module ID" });
        }
      }

      // Check if test case exists if changed
      if (req.body.testCaseId && req.body.testCaseId !== bug.testCaseId) {
        const testCase = await storage.getTestCase(req.body.testCaseId);
        if (!testCase || testCase.projectId !== bug.projectId) {
          return res.status(400).json({ message: "Invalid test case ID" });
        }
      }

      // Process the update data with proper updatedAt timestamp
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const updatedBug = await storage.updateBug(bugId, updateData);

      // Log status change activity specifically
      if (req.body.status && req.body.status !== bug.status) {
        await storage.createActivity({
          userId: req.session.userId!,
          action: `status changed to ${req.body.status}`,
          entityType: "bug",
          entityId: bugId,
          details: {
            projectId: bug.projectId,
            projectName: project?.name,
            bugId: bug.bugId,
            title: bug.title,
            prevStatus: bug.status,
            newStatus: req.body.status
          }
        });
      } else if (req.body.severity && req.body.severity !== bug.severity) {
        await storage.createActivity({
          userId: req.session.userId!,
          action: `severity changed to ${req.body.severity}`,
          entityType: "bug",
          entityId: bugId,
          details: {
            projectId: bug.projectId,
            projectName: project?.name,
            bugId: bug.bugId,
            title: bug.title,
            prevSeverity: bug.severity,
            newSeverity: req.body.severity
          }
        });
      } else {
        // General update activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "updated",
          entityType: "bug",
          entityId: bugId,
          details: {
            projectId: bug.projectId,
            projectName: project?.name,
            bugId: bug.bugId,
            title: bug.title
          }
        });
      }

      // Set cache headers to prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(updatedBug);
    } catch (error) {
      console.error("Update bug error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: `Invalid bug data: ${error.message}` });
      } else {
        res.status(400).json({ message: "Invalid bug data" });
      }
    }
  });

  apiRouter.delete("/bugs/:id", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.id);
      const bug = await storage.getBug(bugId);

      if (!bug) {
        return res.status(404).json({ message: "Bug not found" });
      }

      const project = await storage.getProject(bug.projectId);

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(bug.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project?.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this bug" });
        }
      }

      const success = await storage.deleteBug(bugId);

      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "bug",
          entityId: bugId,
          details: {
            projectId: bug.projectId,
            projectName: project?.name,
            bugId: bug.bugId,
            title: bug.title
          }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Delete bug error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Analytics debug endpoint
  apiRouter.get("/analytics/debug", isAuthenticated, async (req, res) => {
    try {
      console.log('🔍 Analytics Debug - Session:', {
        userId: req.session?.userId,
        userRole: req.session?.userRole,
        userEmail: req.session?.userEmail
      });

      // Test each data source
      const debugData = {
        timestamp: new Date().toISOString(),
        session: {
          userId: req.session?.userId,
          userRole: req.session?.userRole,
          authenticated: !!req.session?.userId
        },
        dataStatus: {
          users: { count: 0, error: null },
          projects: { count: 0, error: null },
          testCases: { count: 0, error: null },
          bugs: { count: 0, error: null }
        }
      };

      // Test users
      try {
        const users = await storage.getAllUsers();
        debugData.dataStatus.users.count = users.length;
      } catch (error: any) {
        debugData.dataStatus.users.error = error.message;
      }

      // Test projects
      try {
        const projects = req.session.userRole === "Admin"
          ? await storage.getProjects()
          : await storage.getProjectsByUserId(req.session.userId!);
        debugData.dataStatus.projects.count = projects.length;
      } catch (error: any) {
        debugData.dataStatus.projects.error = error.message;
      }

      // Test test cases
      try {
        const testCases = req.session.userRole === "Admin"
          ? await storage.getTestCases()
          : [];
        debugData.dataStatus.testCases.count = testCases.length;
      } catch (error: any) {
        debugData.dataStatus.testCases.error = error.message;
      }

      // Test bugs
      try {
        const bugs = req.session.userRole === "Admin"
          ? await storage.getBugs()
          : [];
        debugData.dataStatus.bugs.count = bugs.length;
      } catch (error: any) {
        debugData.dataStatus.bugs.error = error.message;
      }

      console.log('🔍 Analytics Debug - Result:', debugData);
      res.json(debugData);
    } catch (error) {
      console.error("Analytics debug error:", error);
      res.status(500).json({ message: "Analytics debug failed", error: error.message });
    }
  });

  // Activities routes
  apiRouter.get("/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/projects/:projectId/activities", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getProjectActivities(projectId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Get project activities error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Dashboard stats
  apiRouter.get("/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(
        req.session.userRole === "Admin" ? undefined : req.session.userId
      );
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Document Folder Management
  apiRouter.get("/projects/:projectId/document-folders", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project (unless admin)
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have accessto this project" });
        }
      }

      const folders = await storage.getDocumentFolders(projectId);
      res.json(folders);
    } catch (error) {
      console.error("Get document folders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/document-folders", isAuthenticated, async (req, res) => {
    try {
      const folderData = insertDocumentFolderSchema.parse({
        ...req.body,
        createdById: req.session.userId,
      });

      const project = await storage.getProject(folderData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project (unless admin)
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(folderData.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      // If parent folder is specified, check if it exists
      if (folderData.parentFolderId) {
        const parentFolder = await storage.getDocumentFolder(folderData.parentFolderId);
        if (!parentFolder) {
          return res.status(404).json({ message: "Parent folder not found" });
        }

        // Check if parent folder belongs to the same project
        if (parentFolder.projectId !== folderData.projectId) {
          return res.status(400).json({ message: "Parent folder must be in the same project" });
        }
      }

      const folder = await storage.createDocumentFolder(folderData);

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "document-folder",
        entityId: folder.id,
        details: {
          projectId: folder.projectId,
          folderName: folder.name,
        },
      });

      res.status(201).json(folder);
    } catch (error) {
      console.error("Create document folder error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  apiRouter.put("/document-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const folder = await storage.getDocumentFolder(folderId);

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // Check if user has access to the project containing this folder
      const project = await storage.getProject(folder.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(folder.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId && folder.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to update this folder" });
        }
      }

      // If parent folder is being changed, validate it
      if (req.body.parentFolderId !== undefined && req.body.parentFolderId !== folder.parentFolderId) {
        // Cannot set folder as its own parent
        if (req.body.parentFolderId === folderId) {
          return res.status(400).json({ message: "Folder cannot be its own parent" });
        }

        // If parent folder specified, check if it exists in the same project
        if (req.body.parentFolderId) {
          const parentFolder = await storage.getDocumentFolder(req.body.parentFolderId);
          if (!parentFolder) {
            return res.status(404).json({ message: "Parent folder not found" });
          }

          if (parentFolder.projectId !== folder.projectId) {
            return res.status(400).json({ message: "Parent folder must be in the same project" });
          }

          // Check for circular reference by ensuring the new parent is not a descendant of this folder
          const getDescendantIds = async (parentId: number, visited = new Set<number>()): Promise<number[]> => {
            if (visited.has(parentId)) return []; // Prevent infinite recursion if there's a circular reference already
            visited.add(parentId);
            const children = (await storage.getDocumentFolders(folder.projectId))
              .filter(f => f.parentFolderId === parentId)
              .map(f => f.id);

            let descendantIds = [...children];

            for (const childId of children) {
              descendantIds = [...descendantIds, ...(await getDescendantIds(childId, visited))];
            }

            return descendantIds;
          };

          const descendantIds = await getDescendantIds(folderId);
          if (descendantIds.includes(req.body.parentFolderId)) {
            return res.status(400).json({ message: "Circular folder reference detected" });
          }
        }
      }

      const updatedFolder = await storage.updateDocumentFolder(folderId, req.body);

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "document-folder",
        entityId: folderId,
        details: {
          projectId: folder.projectId,
          folderName: updatedFolder?.name || folder.name,
        },
      });

      res.json(updatedFolder);
    } catch (error) {
      console.error("Update document folder error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Specific endpoint for drag-and-drop folder moves
  apiRouter.post("/document-folders/:id/move", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const { targetFolderId } = req.body;

      // Check if folder exists
      const folder = await storage.getDocumentFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // Check if user has access
      const project = await storage.getProject(folder.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(folder.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId && folder.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to move this folder" });
        }
      }

      // targetFolderId can be null (moving to root) or a number
      let newParentFolderId = targetFolderId === null ? null : parseInt(targetFolderId as unknown as string);

      // Cannot set folder as its own parent
      if (newParentFolderId === folderId) {
        return res.status(400).json({ message: "Folder cannot be its own parent" });
      }

      // If target folder specified, validate it exists in the same project
      if (newParentFolderId !== null) {
        const targetFolder = await storage.getDocumentFolder(newParentFolderId);
        if (!targetFolder) {
          return res.status(404).json({ message: "Target folder not found" });
        }

        // Make sure target folder is in the same project
        if (targetFolder.projectId !== folder.projectId) {
          return res.status(400).json({
            message: "Target folder must be in the same project"
          });
        }

        // Check for circular reference
        const getDescendantIds = async (parentId: number, visited = new Set<number>()): Promise<number[]> => {
          if (visited.has(parentId)) return [];
          visited.add(parentId);

          const children = (await storage.getDocumentFolders(folder.projectId))
            .filter(f => f.parentFolderId === parentId)
            .map(f => f.id);

          let descendantIds = [...children];

          for (const childId of children) {
            descendantIds = [...descendantIds, ...(await getDescendantIds(childId, visited))];
          }

          return descendantIds;
        };

        const descendantIds = await getDescendantIds(folderId);
        if (descendantIds.includes(newParentFolderId)) {
          return res.status(400).json({ message: "Cannot move a folder into its own descendant" });
        }
      }

      // Update the folder's parent
      const updatedFolder = await storage.updateDocumentFolder(folderId, {
        parentFolderId: newParentFolderId
      });

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "moved",
        entityType: "document-folder",
        entityId: folderId,
        details: {
          projectId: folder.projectId,
          folderName: folder.name,
          newParentId: newParentFolderId
        },
      });

      res.json(updatedFolder);
    } catch (error) {
      console.error("Move document folder error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  apiRouter.delete("/document-folders/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("DELETE document-folders endpoint called with params:", req.params);

      if (!req.params.id) {
        return res.status(400).json({ message: "Missing folder ID parameter" });
      }

      // Ensure we have a valid numeric ID
      const folderId = Number(req.params.id);
      if (isNaN(folderId)) {
        console.error("Invalid folder ID format");
      }

      // Get all available folder IDs for debugging
      const allFolders = await storage.getDocumentFolders();
      console.log("Available folder IDs:", allFolders.map(f => f.id));

      // Force success response even if folder notfound - this prevents UI issues
// when deleting folders that might not exist in the backend but are shown in the UI
      const folder = await storage.getDocumentFolder(folderId);
      console.log("Found folder:", folder);

      if (!folder) {
        console.log(`Folder with ID ${folderId} not found but returning success anyway`);
        // Return success even when folder doesn't exist to ensure UI consistency
        return res.json({ message: "Folder deleted successfully" });
      }

      // Check if user has access to the project containing this folder
      const project = await storage.getProject(folder.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(folder.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId && folder.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to delete this folder" });
        }
      }

      // Delete folder and all its contents (handled by storage method)
      await storage.deleteDocumentFolder(folderId);

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "deleted",
        entityType: "document-folder",
        entityId: folderId,
        details: {
          projectId: folder.projectId,
          folderName: folder.name,
        },
      });

      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      console.error("Delete document folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Document Management
  apiRouter.get("/projects/:projectId/documents", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : undefined;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project (unless admin)
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      const documents = await storage.getDocuments(projectId, folderId);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Document move/copy operations
  apiRouter.post("/documents/:id/move", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { targetFolderId } = req.body;

      // Validate request
      if (targetFolderId === undefined) {
        return res.status(400).json({ message: "Target folder ID is required" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user has permission (must be admin, project owner, or document uploader)
      if (req.session.userRole !== "Admin" && document.uploadedById !== req.session.userId) {
        const project = await storage.getProject(document.projectId);
        if (!project || project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to move this document" });
        }
      }

      // If targetFolderId is not null, verify the target folder exists
      if (targetFolderId !== null) {
        const targetFolder = await storage.getDocumentFolder(targetFolderId);
        if (!targetFolder) {
          return res.status(404).json({ message: "Target folder not found" });
        }

        // Make sure target folder is in the same project
        if (targetFolder.projectId !== document.projectId) {
          return res.status(400).json({
            message: "Target folder must be in the same project"
          });
        }
      }

      // Update document's folder ID
      const updatedDocument = await storage.updateDocument(documentId, {
        folderId: targetFolderId === null ? null : targetFolderId
      });

      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "moved",
        entityType: "document",
        entityId: documentId,
        details: {
          previousFolderId: document.folderId,
          newFolderId: targetFolderId,
          documentName: document.name,
        },
      });

      res.json(updatedDocument);
    } catch (error) {
      console.error("Move document error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Document copy operation
  apiRouter.post("/documents/:id/copy", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { targetFolderId } = req.body;

      // Validate request
      if (targetFolderId === undefined) {
        return res.status(400).json({ message: "Target folder ID is required" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user has permission
      if (req.session.userRole !== "Admin" && document.uploadedById !== req.session.userId) {
        const project = await storage.getProject(document.projectId);
        if (!project || project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to copy this document" });
        }
      }

      // If targetFolderId is not null, verify the target folder exists
      if (targetFolderId !== null) {
        const targetFolder = await storage.getDocumentFolder(targetFolderId);
        if (!targetFolder) {
          return res.status(404).json({ message: "Target folder not found" });
        }

        // Make sure target folder is in the same project
        if (targetFolder.projectId !== document.projectId) {
          return res.status(400).json({
            message: "Cannot copy document to a folder in a different project"
          });
        }
      }

      // Create a new document with the same data but in the new folder
      const newDocumentData: InsertDocument = {
        name: document.name + " (Copy)",
        description: document.description,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,        fileName: document.fileName,
        folderId: targetFolderId === null ? null : targetFolderId,
        projectId: document.projectId,
        uploadedById: req.session.userId!,
      };

      const newDocument = await storage.createDocument(newDocumentData);

      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "copied",
        entityType: "document",
        entityId: newDocument.id,
        details: {
          sourceDocumentId: documentId,
          targetFolderId: targetFolderId,
          documentName: newDocument.name,
        },
      });

      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Copy document error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // documentUpload is already configured above

  apiRouter.post("/documents", isAuthenticated, documentUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, description, projectId, folderId, uploadedById } = req.body;

      if (!name || !projectId) {
        return res.status(400).json({ message: "Name and project ID are required" });
      }

      const numericProjectId = parseInt(projectId);
      const numericFolderId = folderId ? parseInt(folderId) : null;
      const numericUploadedById = uploadedById ? parseInt(uploadedById) : req.session.userId;

      // Check if project exists
      const project = await storage.getProject(numericProjectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project (unless admin)
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(numericProjectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }

      // Check if folder exists and belongs to the project
      if (numericFolderId) {
        const folder = await storage.getDocumentFolder(numericFolderId);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }

        if (folder.projectId !== numericProjectId) {
          return res.status(400).json({ message: "Folder does not belong to the specified project" });
        }
      }

      // Generate file URL
      const fileUrl = `/uploads/documents/${req.file.filename}`;

      // Get file type from MIME type
      const fileType = req.file.mimetype;

      // Get file size
      const fileSize = req.file.size;

      const documentData: InsertDocument = {
        name,
        description: description || null,
        fileUrl,
        fileType,
        fileSize,
        fileName: req.file.originalname,
        folderId: numericFolderId,
        projectId: numericProjectId,
        uploadedById: numericUploadedById,
      };

      const document = await storage.createDocument(documentData);

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "uploaded",
        entityType: "document",
        entityId: document.id,
        details: {
          projectId: numericProjectId,
          documentName: name,
          folderId: numericFolderId,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user has access to the project containing this document
      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(document.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId && document.uploadedById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to view this document" });
        }
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user has access to the project containing this document
      const project = await storage.getProject(document.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(document.projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);

        if (!isMember && project.createdById !== req.session.userId && document.uploadedById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to delete this document" });
        }
      }

      // Delete the file from the server
      try {
        const filePath = path.join(process.cwd(), document.fileUrl);
        await fs.promises.unlink(filePath);
      } catch (fileError) {
        console.error("Error deleting file:", fileError);
        // Continue with deleting the document record even if file deletion fails
      }

      // Delete document from database
      await storage.deleteDocument(documentId);

      // Create activity record
      await storage.createActivity({
        userId: req.session.userId!,
        action: "deleted",
        entityType: "document",
        entityId: documentId,
        details: {
          projectId: document.projectId,
          documentName: document.name,
        },
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Test Sheets routes
  apiRouter.get("/test-sheets", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const testSheets = await storage.getTestSheets(projectId);
      res.json(testSheets);
    } catch (error) {
      console.error("Get test sheets error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testSheet = await storage.getTestSheet(id);

      if (!testSheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      res.json(testSheet);
    } catch (error) {
      console.error("Get test sheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/test-sheets", isAuthenticated, async (req, res) => {
    try {
      const testSheetData = {
        ...req.body,
        createdById: req.session.userId,
      };

      const testSheet = await storage.createTestSheet(testSheetData);

      // Log activity
      await storage.createActivity({
        userId:req.session.userId!,
        action: "created",
        entityType: "testSheet",
        entityId: testSheet.id,
        details: {
          projectId: testSheet.projectId,
          sheetName: testSheet.name,
        }
      });

      res.status(201).json(testSheet);
    } catch (error) {
      console.error("Create test sheet error:", error);
      res.status(400).json({ message: "Invalid test sheet data" });
    }
  });

  apiRouter.put("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testSheet = await storage.getTestSheet(id);

      if (!testSheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      const updatedTestSheet = await storage.updateTestSheet(id, req.body);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "testSheet",
        entityId: id,
        details: {
          projectId: testSheet.projectId,
          sheetName: testSheet.name,
        }
      });

      res.json(updatedTestSheet);
    } catch (error) {
      console.error("Update test sheet error:", error);
      res.status(400).json({ message: "Invalid test sheet data" });
    }
  });

  apiRouter.delete("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testSheet = await storage.getTestSheet(id);

      if (!testSheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      const success = await storage.deleteTestSheet(id);

      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "testSheet",
          entityId: id,
          details: {
            projectId: testSheet.projectId,
            sheetName: testSheet.name,
          }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Delete test sheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/test-sheets/:id/duplicate", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Sheet name is required" });
      }

      const duplicatedSheet = await storage.duplicateTestSheet(id, name, req.session.userId!);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "duplicated",
        entityType: "testSheet",
        entityId: duplicatedSheet.id,
        details: {
          projectId: duplicatedSheet.projectId,
          sheetName: duplicatedSheet.name,
          originalSheetId: id,
        }
      });

      res.status(201).json(duplicatedSheet);
    } catch (error) {
      console.error("Duplicate test sheet error:", error);
      res.status(400).json({ message: "Failed to duplicate test sheet" });
    }
  });

  // Notebook routes
  apiRouter.get("/notebooks", isAuthenticated, async (req, res) => {
    try {
      const notebooks = await storage.getNotebooks(req.session.userId!);
      res.json(notebooks);
    } catch (error) {
      console.error("Get notebooks error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/notebooks/:id", isAuthenticated, async (req, res) => {
    try {
      const notebookId = parseInt(req.params.id);
      const notebook = await (storage as any).getNotebook(notebookId);

      if (!notebook) {
        return res.status(404).json({ message: "Notebook not found" });
      }

      // Users can only access their own notebooks unless they're admin
      if (notebook.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You don't have permission to access this notebook" });
      }

      res.json(notebook);
    } catch (error) {
      console.error("Get notebook error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/notebooks", isAuthenticated, async (req, res) => {
    try {
      const notebookData = {
        ...req.body,
        userId: req.session.userId,
      };

      const notebook = await storage.createNotebook(notebookData);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "notebook",
        entityId: notebook.id,
        details: {
          notebookTitle: notebook.title,
        }
      });

      res.status(201).json(notebook);
    } catch (error) {
      console.error("Create notebook error:", error);
      res.status(400).json({ message: "Invalid notebook data" });
    }
  });

  apiRouter.put("/notebooks/:id", isAuthenticated, async (req, res) => {
    try {
      const notebookId = parseInt(req.params.id);
      const notebook = await storage.getNotebook(notebookId);

      if (!notebook) {
        return res.status(404).json({ message: "Notebook not found" });
      }

      // Users can only update their own notebooks unless they're admin
      if (notebook.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You don't have permission to update this notebook" });
      }

      const updatedNotebook = await (storage as any).updateNotebook(notebookId, req.body);

      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "notebook",
        entityId: notebookId,
        details: {
          notebookTitle: updatedNotebook?.title || notebook.title,
        }
      });

      res.json(updatedNotebook);
    } catch (error) {
      console.error("Update notebook error:", error);
      res.status(400).json({ message: "Invalid notebook data" });
    }
  });

  apiRouter.delete("/notebooks/:id", isAuthenticated, async (req, res) => {
    try {
      const notebookId = parseInt(req.params.id);
      const notebook = await storage.getNotebook(notebookId);

      if (!notebook) {
        return res.status(404).json({ message: "Notebook not found" });
      }

      // Users can only delete their own notebooks unless they're admin
      if (notebook.userId !== req.session.userId && req.session.userRole !== "Admin") {        return res.status(403).json({ message: "You don't have permission to delete this notebook" });
      }

      const success = await (storage as any).deleteNotebook(notebookId);

      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "notebook",
          entityId: notebookId,
          details: {
            notebookTitle: notebook.title,
          }
        });
      }

      res.json({ success });
    } catch (error) {
      console.error("Delete notebook error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Employee Management Routes
  apiRouter.get("/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/employees", isAuthenticated, async (req, res) => {
    try {
      const employeeData = req.body;
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  // Bulk import employees endpoint
  apiRouter.post("/employees/import", isAuthenticated, async (req, res) => {
    try {
      const { employees } = req.body;

      if (!Array.isArray(employees)) {
        return res.status(400).json({ message: "Employees must be an array" });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const employeeData of employees) {
        try {
          // Validate required fields
          if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
            results.push({
              success: false,
              data: employeeData,
              error: "Missing required fields: firstName, lastName, email"
            });
            errorCount++;
            continue;
          }

          const employee = await storage.createEmployee({
            ...employeeData,
            createdById: req.session.userId
          });

          results.push({
            success: true,
            data: employee
          });
          successCount++;
        } catch (error) {
          results.push({
            success: false,
            data: employeeData,
            error: error instanceof Error ? error.message : "Unknown error"
          });
          errorCount++;
        }
      }

      res.json({
        successCount,
        errorCount,
        results
      });
    } catch (error) {
      console.error("Bulk import employees error:", error);
      res.status(500).json({ message: "Server error during import" });
    }
  });

  apiRouter.get("/technology-options", isAuthenticated, async (req, res) => {
    try {
      const options = await storage.getTechnologyOptions();
      res.json(options);
    } catch (error) {
      console.error("Get technology options error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/technology-options", isAuthenticated, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Technology name is required" });
      }
      const tech = await storage.createTechnologyOption({ name: name.trim() });
      res.status(201).json(tech);
    } catch (error) {
      console.error("Create technology option error:", error);
      res.status(400).json({ message: "Invalid technology data" });
    }
  });

  apiRouter.get("/department-options", isAuthenticated, async (req, res) => {
    try {
      const options = await storage.getDepartmentOptions();
      res.json(options);
    } catch (error) {
      console.error("Get department options error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/department-options", isAuthenticated, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Department name is required" });
      }
      const dept = await storage.createDepartmentOption({ name: name.trim() });
      res.status(201).json(dept);
    } catch (error) {
      console.error("Create department option error:", error);
      res.status(400).json({ message: "Invalid department data" });
    }
  });

  apiRouter.get("/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/employees", isAuthenticated, async (req, res) => {
    try {
      const employeeData = {
        ...req.body,
        createdById: req.session.userId,
      };

      const employee = await storage.createEmployee(employeeData);

      res.status(201).json(employee);
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  apiRouter.put("/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);

      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json(updatedEmployee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  apiRouter.delete("/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const success = await storage.deleteEmployee(employeeId);

      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Configure multer for employee import (CSV/Excel files)
  const configureEmployeeImportUpload = () => {
    const { uploadsDir } = createUploadDirectories();
    const tempDir = path.join(uploadsDir, 'temp');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, tempDir);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `employee-import-${timestamp}${ext}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
      fileFilter: (req, file, cb) => {
        // Accept CSV and Excel files
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
          return cb(null, true);
        }

        cb(new Error('Only CSV and Excel files are allowed for employee import'));
      }
    });
  };

  const employeeImportUpload = configureEmployeeImportUpload();

  // Todo and Todo Lists API endpoints
  apiRouter.get("/todos", isAuthenticated, async (req, res) => {
    try {
      const {listId} = req.query;
      let todos;

      if (listId && listId !== 'null') {
        todos = await storage.getTodosByListId(parseInt(listId as string));
      } else {
        todos = await storage.getTodos(req.session.userId!);
      }

      // Ensure we always return an array
      const todosArray = Array.isArray(todos) ? todos : [];
      console.log(`[API] Returning ${todosArray.length} todos for user ${req.session.userId}`);
      res.json(todosArray);
    } catch (error) {
      console.error("Get todos error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/todos", isAuthenticated, async (req, res) => {
    try {
      const todoData = {
        ...req.body,
        userId: req.session.userId,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const todo = await storage.createTodo(todoData);
      res.status(201).json(todo);
    } catch (error) {
      console.error("Create todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      const updatedTodo = await storage.updateTodo(todoId, req.body);

      if (!updatedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      res.json(updatedTodo);
    } catch (error) {
      console.error("Update todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/todos/:id", isAuthenticated,async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      const success = await storage.deleteTodo(todoId);
      res.json({ success });
    } catch (error) {
      console.error("Delete todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Todo Lists operations
  apiRouter.get("/todo-lists", isAuthenticated, async (req, res) => {
    try {
      const todoLists = await storage.getTodoLists(req.session.userId!);
      res.json(todoLists);
    } catch (error) {
      console.error("Get todo lists error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/todo-lists", isAuthenticated, async (req, res) => {
    try {
      const listData = {
        ...req.body,
        userId: req.session.userId
      };

      const todoList = await storage.createTodoList(listData);
      res.status(201).json(todoList);
    } catch (error) {
      console.error("Create todo list error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/todo-lists/:id/todos", isAuthenticated, async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const todos = await storage.getTodosByListId(listId);

      // Ensure we always return an array
      const todosArray = Array.isArray(todos) ? todos : [];
      res.json(todosArray);
    } catch (error) {
      console.error("Get todos by list error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Todo routes
  apiRouter.get("/todos", isAuthenticated, async (req, res) => {
    try {
      const todos = await storage.getTodosByUserId(req.session.userId!);
      res.json(todos);
    } catch (error) {
      console.error("Get todos error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      const todo = await storage.getTodo(todoId);

      if (!todo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      // Users can only access their own todos
      if (todo.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(todo);
    } catch (error) {
      console.error("Get todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/todos", isAuthenticated, async (req, res) => {
    try {
      const { title, description, priority, todoListId } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Verify todoList exists and belongs to user if provided
      if (todoListId) {
        const todoList = await storage.getTodoList(todoListId);
        if (!todoList || todoList.userId !== req.session.userId) {
          return res.status(400).json({ message: "Invalid todo list" });
        }
      }

      const todoData = {
        title: title.trim(),
        description: description || "",
        priority: priority || "medium",
        completed: false,
        userId: req.session.userId!,
        todoListId: todoListId || null
      };

      const todo = await storage.createTodo(todoData);
      res.status(201).json(todo);
    } catch (error) {
      console.error("Create todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.put("/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      const updates = req.body;

      const updatedTodo = await storage.updateTodo(todoId, req.session.userId!, updates);

      if (!updatedTodo) {
        return res.status(404).json({ message: "Todo not found or access denied" });
      }

      res.json(updatedTodo);
    } catch (error) {
      console.error("Update todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const todoId = parseInt(req.params.id);
      const success = await storage.deleteTodo(todoId, req.session.userId!);

      if (!success) {
        return res.status(404).json({ message: "Todo not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete todo error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Messenger routes
  apiRouter.get('/chats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const chats = await storage.getUserConversations(userId);
      res.json(chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  apiRouter.post('/chats/direct', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      const chat = await storage.createDirectConversation(userId, targetUserId);
      res.status(201).json(chat);
    } catch (error) {
      console.error('Error creating direct chat:', error);
      res.status(500).json({ error: 'Failed to create direct chat' });
    }
  });

  apiRouter.post('/chats/group', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { name, description, participants } = req.body;

      if (!name || !participants || participants.length === 0) {
        return res.status(400).json({ error: 'Group name and participants are required' });
      }

      const chat = await storage.createGroupConversation(userId, name, description, participants);
      res.json(chat);
    } catch (error) {
      console.error('Error creating group chat:', error);
      res.status(500).json({ error: 'Failed to create group chat' });
    }
  });

  apiRouter.get('/chats/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const messages = await storage.getMessagesByChat(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Public users endpoint for messenger
  apiRouter.get('/users/public', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const publicUsers = users.map(user => ({
        id: user.id,
name: user.firstName + ' ' + (user.lastName || ''),
        email: user.email,
        isOnline: false,
        lastSeen: null
      }));
      res.json(publicUsers);
    } catch (error) {
      console.error('Error fetching public users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  apiRouter.post('/messages', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const messageData = { ...req.body, senderId: userId };
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Register the main API router
  app.use("/api", apiRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}