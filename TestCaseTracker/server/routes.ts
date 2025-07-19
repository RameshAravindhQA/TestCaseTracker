import { Router, type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeDatabase, saveMatrixCell, getMatrixCellsByProject } from "./matrix-fix";
// Removed automation service import
import { logger } from "./logger";
import { emailService } from "./email-service";
import githubIntegrationsRouter from "./api/github-integrations";
import { geminiService } from "./gemini-service";
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
  insertTimeSheetFolderSchema,
  insertCustomerSchema,
  insertCustomerProjectSchema,

  insertSprintSchema,
  insertKanbanColumnSchema,
  insertKanbanCardSchema,
  insertTraceabilityMarkerSchema,
  insertTraceabilityMatrixSchema,
  insertTraceabilityMatrixCellSchema,
  insertTestSheetSchema,
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
          hasIssues: repoData.has_issues
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

  // GitHub integrations routes
  apiRouter.use("/github", githubIntegrationsRouter);

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
      const user = Array.from((await storage.getProjects()) as any)
        .find((user: any) => user.resetToken === token && user.resetTokenExpires > new Date());

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

  // Configure multer for document uploads
  const documentUpload = (() => {
    const { documentsDir } = createUploadDirectories();

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, documentsDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp and original extension
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `document-${uniqueId}-${timestamp}${ext}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    });
  })();

  // Traceability Matrix routes
  apiRouter.get("/projects/:projectId/matrix/markers", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const markers = await storage.getCustomMarkers(projectId);
      res.json(markers);
    } catch (error) {
      console.error("Get custom markers error:", error);
      res.status(500).json({ message: "Failed to fetch custom markers" });
    }
  });

  apiRouter.post("/custom-markers", isAuthenticated, async (req, res) => {
    try {
      const markerData = req.body;
      const newMarker = await storage.createCustomMarker(markerData);
      res.status(201).json(newMarker);
    } catch (error) {
      console.error("Create custom marker error:", error);
      res.status(500).json({ message: "Failed to create custom marker" });
    }
  });

  apiRouter.put("/custom-markers/:id", isAuthenticated, async (req, res) => {
    try {
      const markerId = req.params.id;
      const markerData = req.body;
      const updatedMarker = {
        id: markerId,
        ...markerData,
        updatedAt: new Date().toISOString()
      };
      res.json(updatedMarker);
    } catch (error) {
      console.error("Update custom marker error:", error);
      res.status(500).json({ message: "Failed to update custom marker" });
    }
  });

  apiRouter.delete("/custom-markers/:id", isAuthenticated, async (req, res) => {
    try {
      const markerId = req.params.id;
      // TODO: Implement deleteCustomMarker in storage
      res.json({ success: true });
    } catch (error) {
      console.error("Delete custom marker error:", error);
      res.status(500).json({ message: "Failed to delete custom marker" });
    }
  });

  apiRouter.get("/projects/:projectId/matrix/cells", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const cells = await storage.getMatrixCells(projectId);
      res.json(cells);
    } catch (error) {
      console.error("Get matrix cells error:", error);
      res.status(500).json({ message: "Failed to fetch matrix cells" });
    }
  });

  apiRouter.post("/matrix-cells", isAuthenticated, async (req, res) => {
    try {
      const cellData = req.body;

      // Use createOrUpdateMatrixCell for proper upsert behavior
      const cell = await storage.createOrUpdateMatrixCell(cellData);

      if (cell === null) {
        // Cell was deleted (empty value)
        res.status(200).json({ message: "Matrix cell removed" });
      } else {
        res.status(200).json(cell);
      }
    } catch (error) {
      console.error("Create/update matrix cell error:", error);
      res.status(500).json({ message: "Failed to save matrix cell" });
    }
  });

  apiRouter.post("/traceability-matrix/save", isAuthenticated, async (req, res) => {
    try {
      const { projectId, matrixData } = req.body;

      if (!projectId || !Array.isArray(matrixData)) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      // TODO: Implement saveMatrixData in storage
      res.json({ 
        success: true, 
        message: "Matrix saved successfully",
        savedCells: matrixData.length 
      });
    } catch (error) {
      console.error("Save matrix error:", error);
      res.status(500).json({ message: "Failed to save matrix" });
    }
  });


// Basic automation endpoints
app.get('/api/automation/health', (req, res) => {
  res.json({ status: 'ok', message: 'Automation service is running' });
});

app.get('/api/automation/scripts', isAuthenticated, (req, res) => {
  res.json([]);
});

app.get('/api/automation/recordings', isAuthenticated, (req, res) => {
  res.json([]);
});

app.post('/api/automation/start-recording', isAuthenticated, (req, res) => {
  const { url, projectId, moduleId, testCaseId } = req.body;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL is required' 
    });
  }

  // For now, return a mock response indicating the feature is in development
  res.json({
    success: false,
    message: 'Automation recording feature is currently under development. This is a placeholder endpoint.',
    sessionId: `mock-session-${Date.now()}`,
    filename: `test-recording-${Date.now()}.js`,
    details: {
      url,
      projectId,
      moduleId,
      testCaseId,
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/automation/stop-recording', isAuthenticated, (req, res) => {
  const { sessionId } = req.body;

  res.json({
    success: false,
    message: 'Automation recording feature is currently under development.',
    sessionId,
    filename: `test-recording-${Date.now()}.js`
  });
});


  // Error handling middleware for multer (this is used by document uploads)

  // Update user avatar endpoint
  apiRouter.put("/users/update-avatar", isAuthenticated, async (req, res) => {
    try {
      const { profilePicture, avatarType, avatarData } = req.body;

      if (!profilePicture) {
        return res.status(400).json({ message: "Profile picture is required" });
      }

      const userId = req.session.userId!;

      // Update user with new avatar data
      const updateData: any = {
        profilePicture: profilePicture
      };

      // If it's a Lottie avatar, store the additional data
      if (avatarType === 'lottie' && avatarData) {
        updateData.avatarType = avatarType;
        updateData.avatarData = JSON.stringify(avatarData);
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await storage.createActivity({
        userId: userId,
        action: "updated",
        entityType: "user",
        entityId: userId,
        details: { 
          field: "avatar",
          avatarType: avatarType || "image"
        }
      });

      // Return user without sensitive data
      const { password, tempPassword, resetToken, resetTokenExpires, verificationToken, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update avatar error:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Upload Lottie files endpoint
  apiRouter.post("/users/upload-lottie", isAuthenticated, bugAttachmentUpload.single('lottieFile'), async (req, res) => {
    try {
      console.log("Processing Lottie file upload request");

      if (!req.file) {
        return res.status(400).json({ message: "No Lottie file uploaded" });
      }

      // Validate that it's a JSON file
      if (!req.file.mimetype.includes('json') && !req.file.originalname.endsWith('.json')) {
        return res.status(400).json({ message: "Only JSON files are supported for Lottie animations" });
      }

      // Read and validate the Lottie JSON
      try {
        const fileContent = await fs.promises.readFile(req.file.path, 'utf-8');
        const lottieData = JSON.parse(fileContent);

        // Basic Lottie validation
        if (!lottieData.v && !lottieData.version) {
          return res.status(400).json({ message: "Invalid Lottie file: missing version" });
        }

        if (!lottieData.layers || !Array.isArray(lottieData.layers)) {
          return res.status(400).json({ message: "Invalid Lottie file: missing or invalid layers" });
        }

        // Generate file URL
        const fileName = path.basename(req.file.path);
        const fileUrl = `/uploads/bug-attachment/${fileName}`;

        // Parse animation data from request
        let animationData = {};
        if (req.body.animationData) {
          try {
            animationData = JSON.parse(req.body.animationData);
          } catch (e) {
            console.warn("Failed to parse animation data:", e);
          }
        }

        res.json({
          success: true,
          message: "Lottie file uploaded successfully",
          path: fileUrl,
          animationData: animationData,
          lottieData: lottieData
        });

      } catch (parseError) {
        console.error("Failed to parse Lottie file:", parseError);
        return res.status(400).json({ message: "Invalid JSON in Lottie file" });
      }

    } catch (error) {
      console.error("Lottie file upload error:", error);
      res.status(500).json({ message: "Failed to upload Lottie file" });
    }
  });

  // Change password endpoint
  apiRouter.post("/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const userId = req.session.userId!;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user with new password
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/user/upload-profile-picture", isAuthenticated, (req, res, next) => {
    console.log("Processing profile picture upload request");
    console.log("Request headers:", req.headers);
    console.log("Request content-type:", req.headers['content-type']);

    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error("Multer processing error:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: "File too large. Maximum size is 2MB." });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else {
          return res.status(400).json({ message: `File upload error: ${err.message}` });
        }
      }
      console.log("Multer processing completed successfully");
      next();
    });
  }, async (req, res) => {
    try {
      console.log("Multer processed request, file:", req.file);
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("File details:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path
      });

      // Get file path relative to the server root for serving in the browser
      const fileName = path.basename(req.file.path);
      // Ensure the path has the correct format for access via the /uploads route
      const relativePath = `/uploads/profile-pictures/${fileName}`;
      console.log("Profile picture path:", relativePath);
      console.log("Full file path:", req.file.path);

      // Update user profile with the new picture path
      const updatedUser = await storage.updateUser(req.session.userId!, {
        profilePicture: relativePath
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return the updated profile data
      const { password, ...userWithoutPassword } = updatedUser;

      // Set strong cache control headers to prevent the browser from caching the API response
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        ...userWithoutPassword,
        message: "Profile picture uploaded successfully",
        timestamp: Date.now() // Add timestamp to help with cache busting on the client
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Note: GitHub integration endpoints are now handled by the dedicated GitHub router above

  // Add a duplicate route for handling bug attachment uploads with /api prefix for client compatibility
  app.post('/api/uploads/bug-attachment', isAuthenticated, 
    (req, res, next) => {
      console.log('File upload via alternate route detected');
      console.log('Request headers:', req.headers);
      console.log('Request content type:', req.headers['content-type']);

      bugAttachmentUpload.single('file')(req, res, (err) => {
        if (err) {
          console.error('Multer error during file upload:', err);
          return handleMulterError(err, req, res, next);
        }
        console.log('File upload middleware processed successfully');
        next();
      });
    },
    async (req, res) => {
      try {
        console.log('Processing bug attachment upload request via /api route');

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
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

        console.log('Uploaded file details:', fileAttachment);

        res.status(201).json(fileAttachment);
      } catch (error) {
        console.error('Bug attachment upload error:', error);
        res.status(500).json({ message: 'Failed to upload attachment' });
      }


// Gemini API Debug endpoint
  apiRouter.get("/ai/debug-gemini", isAuthenticated, async (req, res) => {
    try {
      const hasApiKey = !!process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your-gemini-api-key';

      if (!hasApiKey) {
        return res.json({
          configured: false,
          error: 'Google Gemini API key is not configured',
          message: 'Please set GOOGLE_API_KEY environment variable in .env file',
          envFile: '.env file exists: ' + require('fs').existsSync(path.join(process.cwd(), '.env'))
        });
      }

      // Test Gemini service
      try {

        const testRequest = {
          requirement: 'Test registration form with email and password',
          projectContext: 'Test project',
          moduleContext: 'Registration',
          testType: 'functional',
          priority: 'Medium',
          inputType: 'text',
          images: []
        };

        console.log('🧪 Testing Gemini service...');
        const testResponse = await geminiService.generateTestCases(testRequest);

        return res.json({
          configured: true,
          apiKeyPrefix: process.env.GOOGLE_API_KEY.substring(0, 10) + '...',
          message: 'Gemini API key is configured and service is working',
          testResult: {
            success: true,
            testCasesGenerated: testResponse.testCases.length,
            hasAnalysis: !!testResponse.analysis
          },
          timestamp: new Date().toISOString()
        });

      } catch (serviceError: any) {
        console.error('❌ Gemini service test failed:', serviceError);
        return res.json({
          configured: true,
          apiKeyPrefix: process.env.GOOGLE_API_KEY.substring(0, 10) + '...',
          message: 'Gemini API key is configured but service failed',
          error: serviceError.message,
          fallbackActive: true,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error: any) {
      console.error('❌ Gemini debug error:', error);
      res.status(500).json({
        configured: false,
        error: error.message,
        message: 'Failed to test Gemini configuration'
      });
    }
  });

  // AI Test Case Generation endpoint
  apiRouter.post("/ai/generate-test-cases", isAuthenticated, async (req, res) => {
    try {
      // Ensure JSON response header
      res.setHeader('Content-Type', 'application/json');

      const { requirement, projectContext, moduleContext, testType, priority } = req.body;

      if (!requirement) {
        return res.status(400).json({ error: 'Requirement is required' });
      }

      // Mock AI generation for now (replace with actual OpenAI integration when API key is available)
      const mockTestCases = [
        {
          feature: `Test ${requirement} - Happy Path`,
          testObjective: `Verify that ${requirement} works correctly under normal conditions`,
          preConditions: "User is logged in and has appropriate permissions",
          testSteps: `1. Navigate to the ${requirement} section\n2. Enter valid data\n3. Click submit/save\n4. Verify the action completes successfully`,
          expectedResult: `${requirement} should complete successfully with appropriate confirmation`,
          priority: priority || "Medium",
          testType: testType || "functional",
          coverage: `Happy path scenario for ${requirement}`
        },
        {
          feature: `Test ${requirement} - Error Handling`,
          testObjective: `Verify that ${requirement} handles errors gracefully`,
          preConditions: "User is logged in and has appropriate permissions",
          testSteps: `1. Navigate to the ${requirement} section\n2. Enter invalid data\n3. Click submit/save\n4. Verify appropriate error message is displayed`,
          expectedResult: "System should display clear error message and prevent invalid operation",
          priority: priority || "Medium",
          testType: testType || "functional",
          coverage: `Error handling for ${requirement}`
        },
        {
          feature: `Test ${requirement} - Boundary Conditions`,
          testObjective: `Verify that ${requirement} handles boundary conditions correctly`,
          preConditions: "User is logged in and has appropriate permissions",
          testSteps: `1. Navigate to the ${requirement} section\n2. Enter boundary values (min/max)\n3. Click submit/save\n4. Verify system handles boundaries correctly`,
          expectedResult: "System should handle boundary conditions appropriately",
          priority: priority || "Low",
          testType: testType || "functional",
          coverage: `Boundary testing for ${requirement}`
        }
      ];

      res.json({
        testCases: mockTestCases,
        message: `Generated ${mockTestCases.length} test cases for: ${requirement}`
      });
    } catch (error) {
      console.error('AI test case generation error:', error);
      res.status(500).json({ error: 'Failed to generate test cases' });
    }
  });



  // Enhanced AI Test Case Generation endpoint with multipart form data support
  apiRouter.post("/ai/generate-enhanced-test-cases", isAuthenticated, 
    (req, res, next) => {
      console.log('🔍 AI Generation endpoint hit - Initial request processing');

      // Set response headers early to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).json({ success: true, message: 'Options OK' });
      }

      // Handle file upload with error handling
      bugAttachmentUpload.array('images', 10)(req, res, (err) => {
        if (err) {
          console.error("❌ Enhanced AI file upload error:", err);
          return res.status(400).json({ 
            success: false,
            error: 'File upload failed',
            details: err.message,
            timestamp: new Date().toISOString()
          });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        console.log('🤖 Enhanced AI Generation - Handler started');
This code integrates enhanced AI test case generation with Gemini AI fallback, ensuring proper JSON responses and authentication.
``````tool_code
      // Validate authentication
        if (!req.session || !req.session.userId) {
          console.log('❌ Authentication failed for AI generation');
          return res.status(401).json({ 
            success: false,
            error: 'Authentication required',
            timestamp: new Date().toISOString()
          });
        }

        console.log('🔧 Processing AI generation request:', {
          userId: req.session.userId,
          hasFiles: req.files ? req.files.length : 0,
          bodyKeys: Object.keys(req.body || {}),
          requirement: req.body?.requirement?.substring(0, 50) + '...'
        });

        // Extract form data with proper defaults
        const {
          requirement = '',
          projectContext = '',
          moduleContext = '',
          testType = 'functional',
          priority = 'Medium',
          websiteUrl = '',
          elementInspection = '',
          userFlows = '',
          businessRules = '',
          inputType = 'text'
        } = req.body || {};

        const files = req.files as Express.Multer.File[] || [];

        console.log('📋 Extracted request data:', {
          requirement: requirement.substring(0, 100) + '...',
          inputType,
          testType,
          priority,
          moduleContext,
          filesCount: files.length,
          hasWebsiteUrl: !!websiteUrl,
          hasElementInspection: !!elementInspection
        });

        // Validate required data based on input type
        if (inputType === 'text' && !requirement.trim()) {
          return res.status(400).json({ 
            success: false,
            error: 'Requirement text is required for text input type',
            timestamp: new Date().toISOString()
          });
        }

        if (inputType === 'url' && !websiteUrl.trim()) {
          return res.status(400).json({ 
            success: false,
            error: 'Website URL is required for URL input type',
            timestamp: new Date().toISOString()
          });
        }

        if (inputType === 'image' && files.length === 0) {
          return res.status(400).json({ 
            success: false,
            error: 'At least one image is required for image input type',
            timestamp: new Date().toISOString()
          });
        }

        if (inputType === 'inspect' && !elementInspection.trim()) {
          return res.status(400).json({ 
            success: false,
            error: 'Element inspection data is required for inspect input type',
            timestamp: new Date().toISOString()
          });
        }

        console.log('✅ Validation passed, generating test cases...');

        // Try Gemini AI first, then fallback to mock
        try {
          const aiRequest = {
            requirement,
            projectContext,
            moduleContext,
            testType,
            priority,
            websiteUrl,
            elementInspection,
            userFlows,
            businessRules,
            inputType,
            images: files
          };

          console.log('🤖 Attempting to use Gemini AI service...');
          const geminiResponse = await geminiService.generateTestCases(aiRequest);

          console.log('✅ Gemini AI response received');
          return res.status(200).json({
            success: true,
            testCases: geminiResponse.testCases,
            analysis: geminiResponse.analysis,
            message: geminiResponse.message,
            source: geminiResponse.source,
            timestamp: new Date().toISOString()
          });

        } catch (geminiError) {
          console.error('❌ Gemini AI failed, using fallback:', geminiError);

          // Fallback to mock generation
          let mockTestCases: any[] = [];
          let analysisResults = {
            coverage: 'Comprehensive',
            complexity: 'Medium',
            focusAreas: 'User Interface, Data Validation, Error Handling',
            suggestions: ['Consider adding performance tests', 'Include accessibility testing']
          };

          const isRegistrationTest = requirement && requirement.toLowerCase().includes('register');

          if (isRegistrationTest || (moduleContext && moduleContext.toLowerCase().includes('registration'))) {
            console.log('🎭 Generating registration test cases');
            mockTestCases = generateRegistrationTestCases(requirement, testType, priority);
            analysisResults.focusAreas = 'Registration Forms, Input Validation, Security';
          } else {
            console.log('🎭 Generating based on input type:', inputType);
            switch (inputType) {
              case 'text':
                mockTestCases = generateTextBasedTestCases(requirement, businessRules, testType, priority);
                break;
              case 'url':
                mockTestCases = generateUrlBasedTestCases(websiteUrl, userFlows, testType, priority);
                analysisResults.focusAreas = 'Navigation, UI Components, Cross-browser Testing';
                break;
              case 'image':
                mockTestCases = generateImageBasedTestCases(files, requirement, testType, priority);
                analysisResults.focusAreas = 'Visual Elements, Layout, Responsive Design';
                break;
              case 'inspect':
                mockTestCases = generateInspectionBasedTestCases(elementInspection, requirement, testType, priority);
                analysisResults.focusAreas = 'Element Interactions, JavaScript Functionality';
                break;
              default:
                mockTestCases = generateTextBasedTestCases(requirement, businessRules, testType, priority);
            }
          }

          console.log('✅ Generated fallback test cases:', mockTestCases.length);

          const response = {
            success: true,
            testCases: mockTestCases,
            analysis: analysisResults,
            message: `Generated ${mockTestCases.length} comprehensive test cases using intelligent mock service`,
            source: 'mock-service',
            timestamp: new Date().toISOString()
          };

          console.log('📤 Sending fallback response:', {
            success: response.success,
            testCasesCount: response.testCases.length,
            source: response.source
          });

          return res.status(200).json(response);
        }

      } catch (error) {
        console.error('❌ Enhanced AI Generation error:', error);

        const errorResponse = {
          success: false,
          error: 'Internal server error during AI generation',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };

        return res.status(500).json(errorResponse);
      }
    });

  // Helper functions for mock test case generation
  function generateRegistrationTestCases(requirement: string, testType: string, priority: string) {
    return [
      {
        feature: "User Registration - Valid Data Entry",
        testObjective: "Verify successful user registration with valid data",
        preConditions: "Registration page is accessible and all required fields are displayed",
        testSteps: "1. Navigate to registration page\n2. Enter valid first name (e.g., 'John')\n3. Enter valid last name (e.g., 'Doe')\n4. Enter valid email address\n5. Enter strong password\n6. Confirm password\n7. Accept terms and conditions\n8. Click 'Register' button\n9. Verify success message\n10. Check user receives confirmation email",
        expectedResult: "User should be successfully registered, receive confirmation message, and get verification email",
        priority: "High",
        testType: testType || "functional",
        coverage: "Positive Testing",
        category: "Registration - Happy Path",
        tags: ["registration", "positive-testing", "user-creation", "email-verification"]
      },
      {
        feature: "User Registration - Email Validation",
        testObjective: "Verify email field validation with invalid email formats",
        preConditions: "Registration page is loaded",
        testSteps: "1. Navigate to registration page\n2. Enter valid first and last name\n3. Enter invalid email formats:\n   - Missing @ symbol\n   - Missing domain\n   - Invalid characters\n   - Empty email field\n4. Attempt to register\n5. Verify validation error messages",
        expectedResult: "Appropriate error messages should be displayed for each invalid email format",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "Input Validation",
        category: "Registration - Validation",
        tags: ["registration", "negative-testing", "email-validation", "error-handling"]
      },
      {
        feature: "User Registration - Password Security",
        testObjective: "Verify password field validation and security requirements",
        preConditions: "Registration page is accessible",
        testSteps: "1. Navigate to registration page\n2. Fill valid details except password\n3. Test weak passwords:\n   - Too short (< 8 characters)\n   - No uppercase letters\n   - No special characters\n   - Common passwords\n4. Test password confirmation mismatch\n5. Verify validation messages\n6. Test strong password acceptance",
        expectedResult: "Weak passwords should be rejected with specific error messages. Strong passwords should be accepted",
        priority: "High",
        testType: "security",
        coverage: "Password Security",
        category: "Registration - Security",
        tags: ["registration", "password-security", "validation", "security-testing"]
      },
      {
        feature: "User Registration - Duplicate Prevention",
        testObjective: "Verify system prevents registration with existing email addresses",
        preConditions: "At least one user already registered in the system",
        testSteps: "1. Navigate to registration page\n2. Enter valid first name, last name\n3. Enter email address that already exists\n4. Enter valid password and confirmation\n5. Accept terms and conditions\n6. Click 'Register' button\n7. Verify error message appears",
        expectedResult: "System should display error message indicating email already exists",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "Duplicate Prevention",
        category: "Registration - Business Logic",
        tags: ["registration", "duplicate-prevention", "negative-testing", "business-rules"]
      }
    ];
  }

  function generateTextBasedTestCases(requirement: string, businessRules: string, testType: string, priority: string) {
    const feature = requirement || 'Text-based functionality';
    return [
      {
        feature: `${feature} - Happy Path`,
        testObjective: `Verify successful ${feature.toLowerCase()} with valid data`,
        preConditions: "Application is accessible and feature is available",
        testSteps: "1. Navigate to the feature\n2. Enter valid input data\n3. Submit the form\n4. Verify successful completion",
        expectedResult: "Feature should work correctly with valid input",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "Happy Path",
        category: "Core Functionality",
        tags: ["positive-testing", "core-flow", "happy-path"]
      },
      {
        feature: `${feature} - Input Validation`,
        testObjective: `Verify input validation for ${feature.toLowerCase()}`,
        preConditions: "Feature is accessible",
        testSteps: "1. Navigate to the feature\n2. Enter invalid data formats\n3. Submit form\n4. Verify validation messages\n5. Test boundary conditions",
        expectedResult: "Appropriate validation messages should be displayed",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "Input Validation",
        category: "Data Validation",
        tags: ["validation", "negative-testing", "error-handling"]
      }
    ];
  }

  function generateUrlBasedTestCases(websiteUrl: string, userFlows: string, testType: string, priority: string) {
    return [
      {
        feature: "Website Navigation - Menu Links",
        testObjective: "Verify all navigation menu links work correctly",
        preConditions: `Website ${websiteUrl} is accessible`,
        testSteps: "1. Load the website\n2. Click on each menu item\n3. Verify pages load correctly\n4. Check for broken links",
        expectedResult: "All menu links should navigate to correct pages without errors",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "Navigation Testing",
        category: "User Interface",
        tags: ["navigation", "ui-testing", "links"]
      }
    ];
  }

  function generateImageBasedTestCases(files: Express.Multer.File[], requirement: string, testType: string, priority: string) {
    const imageCount = files ? files.length : 0;
    return [
      {
        feature: "UI Layout - Visual Elements",
        testObjective: "Verify UI elements are positioned correctly according to design",
        preConditions: `${imageCount} design mockup(s) are available for reference`,
        testSteps: "1. Compare actual UI with design mockups\n2. Verify element positioning\n3. Check color schemes\n4. Validate typography",
        expectedResult: "UI should match the provided design specifications",
        priority: priority || "High",
        testType: testType || "ui",
        coverage: "Visual Design",
        category: "UI Validation",
        tags: ["ui-testing", "visual-validation", "design-compliance"]
      }
    ];
  }

  function generateInspectionBasedTestCases(elementInspection: string, requirement: string, testType: string, priority: string) {
    return [
      {
        feature: "DOM Element Validation",
        testObjective: "Verify DOM elements are properly structured and accessible",
        preConditions: "Web page is loaded with the specified elements",
        testSteps: "1. Inspect DOM structure\n2. Validate element attributes\n3. Check for proper semantic markup\n4. Test element accessibility",
        expectedResult: "All DOM elements should be properly structured and accessible",
        priority: priority || "High",
        testType: testType || "functional",
        coverage: "DOM Validation",
        category: "Technical Validation",
        tags: ["dom", "structure", "accessibility"]
      }
    ];
  }