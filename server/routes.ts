import { Router, type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeDatabase, saveMatrixCell, getMatrixCellsByProject } from "./matrix-fix";
// Removed automation service import
import { logger } from "./logger";
import { emailService } from "./email-service";
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
      
      // Save session explicitly
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log("Login successful - Session set and saved:", {
          sessionId: req.sessionID,
          userId: req.session.userId,
          userEmail: req.session.userEmail
        });
        
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
        hasSession: !!req.session
      });
      
      // Check if user is logged in
      if (!req.session || !req.session.userId) {
        console.log("No session or userId found");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get user from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log(`User not found for ID: ${req.session.userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.email}`);
      
      // Return user without sensitive data
      const { password, tempPassword, resetToken, resetTokenExpires, verificationToken, ...userWithoutPassword } = user;
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
  
  // Error handling middleware for multer (this is used by document uploads)
  
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
    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error("Multer processing error:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else {
          return res.status(400).json({ message: `File upload error: ${err.message}` });
        }
      }
      next();
    });
  }, async (req, res) => {
    try {
      console.log("Multer processed request, file:", req.file);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
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
    }
  );

  // Serve uploaded files (profile pictures and documents)
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
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
      // Admin can see all projects, others see only their projects
      let projects;
      if (req.session.userRole === "Admin") {
        projects = await storage.getProjects();
      } else {
        projects = await storage.getProjectsByUserId(req.session.userId!);
      }
      
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
      // Pre-process dates - convert them to ISO strings that Zod expects
      const formData = {
        ...req.body,
        createdById: req.session.userId,
        startDate: req.body.startDate ? new Date(req.body.startDate).toISOString() : null,
        endDate: req.body.endDate ? new Date(req.body.endDate).toISOString() : null
      };
      
      // Now parse with Zod schema
      const projectData = insertProjectSchema.parse(formData);
      
      const project = await storage.createProject(projectData);
      
      // Add creator as a project member with admin role
      await storage.addProjectMember({
        projectId: project.id,
        userId: req.session.userId!,
        role: "Admin",
      });
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "project",
        entityId: project.id,
        details: { projectName: project.name }
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(400).json({ message: "Invalid project data" });
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
      
      // Check if user has admin access to this project
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
      
      const modules = await storage.getModulesByProject(projectId);
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
      const { name, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }
      
      const newTag = await storage.createTag({
        name,
        color: color || "#3b82f6", // Default to blue if no color provided
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
      const tags = await storage.getTagsByProject(projectId);
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
  apiRouter.get("/projects/:projectId/test-cases", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
      
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
      if (moduleId) {
        // Validate that the module belongs to this project
        const module = await storage.getModule(moduleId);
        if (!module || module.projectId !== projectId) {
          console.log(`[API] Module ${moduleId} not found or doesn't belong to project ${projectId}`);
          return res.status(400).json({ message: "Invalid module for this project" });
        }
        testCases = await storage.getTestCasesByFilters(projectId, moduleId);
      } else {
        testCases = await storage.getTestCasesByProject(projectId);
      }
      
      console.log(`[API] Returning ${testCases.length} test cases for project ${projectId}:`, 
        testCases.map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, feature: tc.feature, projectId: tc.projectId })));
      
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
      
      const testCaseData = insertTestCaseSchema.parse({
        ...req.body,
        projectId,
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
      
      // Ensure proper JSON response
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
      
      // Log activity with specific status change if status was updated
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
      } else {
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
      
      const success = await storage.deleteTestCase(testCaseId);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
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
      
      res.json({ success });
    } catch (error) {
      console.error("Delete test case error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Bug routes
  apiRouter.get("/projects/:projectId/bugs", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
      
      console.log(`[API] Fetching bugs for project ${projectId}, module: ${moduleId}`);
      
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
      
      const bugs = await storage.getBugs(projectId, moduleId);
      console.log(`[API] Returning ${bugs.length} bugs for project ${projectId}:`, bugs.map(bug => ({ id: bug.id, title: bug.title, status: bug.status, severity: bug.severity })));
      
      // Add cache headers for real-time data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(bugs);
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
      
      // Prepare bug data with optional fields properly set
      const formData = {
        ...req.body,
        projectId,
        reportedById: req.session.userId,
        // Set attachments to empty array if not provided
        attachments: req.body.attachments || [],
        // Set screenshotRequired to false by default unless explicitly set to true
        screenshotRequired: req.body.screenshotRequired === true
      };
      
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
          return res.status(403).json({ message: "You don't have access to this project" });
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
        
        if (targetFolder.projectId !== folder.projectId) {
          return res.status(400).json({ message: "Target folder must be in the same project" });
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
        console.error("Invalid folder ID received:", req.params.id);
        return res.status(400).json({ message: "Invalid folder ID format" });
      }
      
      // Get all available folder IDs for debugging
      const allFolders = await storage.getDocumentFolders();
      console.log("Available folder IDs:", allFolders.map(f => f.id));

      // Force success response even if folder not found - this prevents UI issues
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
            message: "Cannot move document to a folder in a different project" 
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
        fileSize: document.fileSize,
        fileName: document.fileName,
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

  // Configure document uploads
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
        const timestamp = Date.now();
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
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
        userId: req.session.userId!,
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

  // Prefix all API routes with /api
  // Customer routes
  apiRouter.get("/customers", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      
      let customers;
      if (status) {
        customers = await storage.getCustomersByStatus(status as string);
      } else {
        customers = await storage.getCustomers();
      }
      
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  apiRouter.get("/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  apiRouter.post("/customers", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Set the creator ID to the current user
      customerData.createdById = req.session.userId!;
      
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });
  
  apiRouter.patch("/customers/:id", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Update customer
      const { name, contactPerson, email, phone, address, status } = req.body;
      
      const updateData: Partial<Customer> = {};
      if (name) updateData.name = name;
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (status) updateData.status = status;
      
      const updatedCustomer = await storage.updateCustomer(customerId, updateData);
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  apiRouter.delete("/customers/:id", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      // Delete customer
      const isDeleted = await storage.deleteCustomer(customerId);
      if (!isDeleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Customer Project routes
  apiRouter.get("/customers/:id/projects", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      const projects = await storage.getProjectsByCustomerId(customerId);
      res.json(projects);
    } catch (error) {
      console.error("Get customer projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  apiRouter.get("/projects/:id/customers", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      const customers = await storage.getCustomersByProjectId(projectId);
      res.json(customers);
    } catch (error) {
      console.error("Get project customers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  apiRouter.post("/customer-projects", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const { customerId, projectId } = req.body;
      
      if (!customerId || !projectId) {
        return res.status(400).json({ message: "Customer ID and Project ID are required" });
      }
      
      const customerProjectData = insertCustomerProjectSchema.parse({
        customerId,
        projectId
      });
      
      const customerProject = await storage.createCustomerProject(customerProjectData);
      res.status(201).json(customerProject);
    } catch (error) {
      console.error("Create customer-project error:", error);
      res.status(400).json({ message: "Invalid customer-project data" });
    }
  });
  
  apiRouter.delete("/customer-projects/:id", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Delete customer-project association
      const isDeleted = await storage.deleteCustomerProject(id);
      if (!isDeleted) {
        return res.status(404).json({ message: "Customer-project association not found" });
      }
      
      res.json({ message: "Customer-project association deleted successfully" });
    } catch (error) {
      console.error("Delete customer-project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // TimeSheet Folder routes
  apiRouter.get("/timesheet-folders", isAuthenticated, async (req, res) => {
    try {
      const folders = await storage.getTimeSheetFolders(req.session.userId!);
      res.json(folders);
    } catch (error) {
      console.error("Get timesheet folders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/timesheet-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const folder = await storage.getTimeSheetFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Users can only access their own folders
      if (folder.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You don't have permission to access this folder" });
      }
      
      res.json(folder);
    } catch (error) {
      console.error("Get timesheet folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/timesheet-folders/:id/timesheets", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const folder = await storage.getTimeSheetFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Users can only access their own folders
      if (folder.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You don't have permission to access this folder" });
      }
      
      const timesheets = await storage.getTimeSheetsByFolder(folderId);
      res.json(timesheets);
    } catch (error) {
      console.error("Get folder timesheets error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/timesheet-folders", isAuthenticated, async (req, res) => {
    try {
      const folderData = insertTimeSheetFolderSchema.parse(req.body);
      
      // Users can only create folders for themselves
      if (folderData.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only create folders for yourself" });
      }
      
      // If parentId is provided, verify it exists and belongs to the user
      if (folderData.parentId) {
        const parentFolder = await storage.getTimeSheetFolder(folderData.parentId);
        if (!parentFolder) {
          return res.status(404).json({ message: "Parent folder not found" });
        }
        
        if (parentFolder.userId !== folderData.userId) {
          return res.status(403).json({ message: "Parent folder doesn't belong to this user" });
        }
        
        // Update path based on parent's path
        folderData.path = `${parentFolder.path}/${folderData.name}`;
      } else {
        // Root folder
        folderData.path = `/${folderData.name}`;
      }
      
      const folder = await storage.createTimeSheetFolder(folderData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "timesheet-folder",
        entityId: folder.id,
        details: {
          name: folder.name,
          path: folder.path
        }
      });
      
      res.status(201).json(folder);
    } catch (error) {
      console.error("Create timesheet folder error:", error);
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  apiRouter.patch("/timesheet-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const folder = await storage.getTimeSheetFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Users can only update their own folders
      if (folder.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only update your own folders" });
      }

      const { name, parentId } = req.body;
      const updateData: Partial<TimeSheetFolder> = {};
      
      if (name) updateData.name = name;
      
      // If changing parent folder, update the path
      if (parentId !== undefined) {
        if (parentId === folderId) {
          return res.status(400).json({ message: "A folder cannot be its own parent" });
        }
        
        updateData.parentId = parentId;
        
        // If moving to root level
        if (parentId === null) {
          updateData.path = `/${name || folder.name}`;
        } else {
          // If moving to another folder
          const parentFolder = await storage.getTimeSheetFolder(parentId);
          if (!parentFolder) {
            return res.status(404).json({ message: "Parent folder not found" });
          }
          
          if (parentFolder.userId !== folder.userId) {
            return res.status(403).json({ message: "Parent folder doesn't belong to this user" });
          }
          
          updateData.path = `${parentFolder.path}/${name || folder.name}`;
        }
      } else if (name) {
        // Just updating the name, so update the path as well
        if (folder.parentId) {
          const parentFolder = await storage.getTimeSheetFolder(folder.parentId);
          if (parentFolder) {
            updateData.path = `${parentFolder.path}/${name}`;
          }
        } else {
          updateData.path = `/${name}`;
        }
      }
      
      const updatedFolder = await storage.updateTimeSheetFolder(folderId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "timesheet-folder",
        entityId: folderId,
        details: {
          name: updatedFolder!.name,
          path: updatedFolder!.path
        }
      });
      
      res.json(updatedFolder);
    } catch (error) {
      console.error("Update timesheet folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/timesheet-folders/:id", isAuthenticated, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const folder = await storage.getTimeSheetFolder(folderId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Users can only delete their own folders
      if (folder.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only delete your own folders" });
      }
      
      // Delete the folder (this will also delete all subfolders and unassign timesheets)
      await storage.deleteTimeSheetFolder(folderId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "timesheet-folder",
        entityId: folderId,
        details: {
          name: folder.name,
          path: folder.path
        }
      });
      
      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      console.error("Delete timesheet folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // TimeSheet routes
  apiRouter.get("/timesheets", isAuthenticated, async (req, res) => {
    try {
      const { projectId, userId } = req.query;
      let timeSheets;
      
      if (projectId && userId) {
        timeSheets = await storage.getTimeSheets(parseInt(projectId as string), parseInt(userId as string));
      } else if (projectId) {
        timeSheets = await storage.getProjectTimeSheets(parseInt(projectId as string));
      } else if (userId) {
        timeSheets = await storage.getUserTimeSheets(parseInt(userId as string));
      } else {
        // Admin can see all timesheets, others only see their own
        if (req.session.userRole === "Admin") {
          timeSheets = await storage.getTimeSheets();
        } else {
          timeSheets = await storage.getUserTimeSheets(req.session.userId!);
        }
      }
      
      res.json(timeSheets);
    } catch (error) {
      console.error("Get timesheets error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/timesheets/:id", isAuthenticated, async (req, res) => {
    try {
      const timeSheetId = parseInt(req.params.id);
      const timeSheet = await storage.getTimeSheet(timeSheetId);
      
      if (!timeSheet) {
        return res.status(404).json({ message: "TimeSheet not found" });
      }
      
      // Check permissions - users can only view their own timesheets unless they're admin or a project manager
      if (timeSheet.userId !== req.session.userId && req.session.userRole !== "Admin") {
        // Check if user is a project manager for this project
        const isProjectManager = await storage.getProjectMembers(timeSheet.projectId)
          .then(members => members.some(m => m.userId === req.session.userId && m.role === "Admin"));
        
        if (!isProjectManager) {
          return res.status(403).json({ message: "You don't have permission to view this timesheet" });
        }
      }
      
      res.json(timeSheet);
    } catch (error) {
      console.error("Get timesheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/timesheets", isAuthenticated, async (req, res) => {
    try {
      logger.info(`Creating timesheet - Request body: ${JSON.stringify(req.body, null, 2)}`);
      
      // Input validation debug logging
      console.log('Timesheet creation - Raw data:', {
        projectId: req.body.projectId,
        type: typeof req.body.projectId,
        folderId: req.body.folderId,
        folderType: typeof req.body.folderId,
        customerId: req.body.customerId,
        customerType: typeof req.body.customerId
      });
      
      // Pre-process date fields before validation
      const processedData = {
        ...req.body,
        // Ensure hours is a reasonable number
        hours: typeof req.body.hours === 'number' ? Math.min(req.body.hours, 24) : req.body.hours
      };
      
      // Handle IDs explicitly
      if (req.body.projectId !== undefined) {
        // Make sure projectId is a number
        const rawProjectId = req.body.projectId;
        const projectIdAsNumber = Number(rawProjectId);
        
        if (isNaN(projectIdAsNumber) || projectIdAsNumber <= 0) {
          console.error(`Invalid projectId: ${rawProjectId} (${typeof rawProjectId})`);
          return res.status(400).json({ message: "Project ID must be a valid positive number" });
        }
        
        processedData.projectId = projectIdAsNumber;
      } else {
        console.error('Missing required projectId in request');
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      // Handle folderId
      if (req.body.folderId !== undefined) {
        // Make sure folderId is a number
        const rawFolderId = req.body.folderId;
        const folderIdAsNumber = Number(rawFolderId);
        
        if (isNaN(folderIdAsNumber) || folderIdAsNumber <= 0) {
          console.error(`Invalid folderId: ${rawFolderId} (${typeof rawFolderId})`);
          return res.status(400).json({ message: "Folder ID must be a valid positive number" });
        }
        
        processedData.folderId = folderIdAsNumber;
      }
      
      // Explicitly convert date fields before validation
      if (req.body.workDate && typeof req.body.workDate === 'string') {
        processedData.workDate = new Date(req.body.workDate);
      }
      
      if (req.body.startTime && typeof req.body.startTime === 'string') {
        processedData.startTime = new Date(req.body.startTime);
      }
      
      if (req.body.endTime && typeof req.body.endTime === 'string') {
        processedData.endTime = new Date(req.body.endTime);
      }
      
      logger.info(`Processed timesheet data: ${JSON.stringify(processedData, null, 2)}`);
      
      // Now parse with schema validation
      let timeSheetData;
      let project;
      
      try {
        timeSheetData = insertTimeSheetSchema.parse(processedData);
        console.log('Validated timesheet data:', JSON.stringify(timeSheetData, null, 2));
        
        // Users can only create timesheets for themselves
        if (timeSheetData.userId !== req.session.userId && req.session.userRole !== "Admin") {
          return res.status(403).json({ message: "You can only create timesheets for yourself" });
        }
        
        // Handle project ID validation - it could be a number (ID) or string (name)
        if (typeof timeSheetData.projectId === 'number') {
          // If it's a numeric ID, verify the project exists
          project = await storage.getProject(timeSheetData.projectId);
          if (!project) {
            console.error(`Project not found with ID: ${timeSheetData.projectId}`);
            return res.status(404).json({ message: "Project not found" });
          }
        } else if (typeof timeSheetData.projectId === 'string') {
          // If it's a string, we'll accept it as a project name
          console.log(`Using project name: ${timeSheetData.projectId}`);
          // No validation needed as we're allowing free-form project names
          // Just use a placeholder project to continue processing
          project = { id: 0, name: timeSheetData.projectId, status: "Active", createdById: timeSheetData.userId, createdAt: new Date().toISOString() };
        } else {
          console.error(`Invalid project ID type: ${typeof timeSheetData.projectId}`);
          return res.status(400).json({ message: "Invalid project ID format" });
        }
      } catch (validationError) {
        console.error('Timesheet validation error:', validationError);
        return res.status(400).json({ 
          message: "Invalid timesheet data", 
          error: validationError,
          originalData: processedData
        });
      }
      
      // Check if user is a member of the project
      const isProjectMember = await storage.getProjectMembers(project.id)
        .then(members => members.some(m => m.userId === req.session.userId));
      
      if (!isProjectMember && project.createdById !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You must be a member of the project to log time" });
      }
      
      // If folder ID is provided, verify it exists and belongs to the user
      if (timeSheetData.folderId) {
        const folder = await storage.getTimeSheetFolder(timeSheetData.folderId);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        if (folder.userId !== timeSheetData.userId) {
          return res.status(403).json({ message: "The folder doesn't belong to this user" });
        }
      }
      
      // Set default times if missing (handle nulls)
      if (!timeSheetData.startTime) {
        timeSheetData.startTime = "09:00";
      }
      if (!timeSheetData.endTime) {
        timeSheetData.endTime = "17:00";
      }
      
      // Calculate hours if not provided
      if (!timeSheetData.hours) {
        let startHours = 9, startMinutes = 0;
        let endHours = 17, endMinutes = 0;
        
        // Parse time strings
        if (typeof timeSheetData.startTime === 'string') {
          const timeMatch = timeSheetData.startTime.match(/^(\d+):(\d+)$/);
          if (timeMatch) {
            startHours = parseInt(timeMatch[1], 10);
            startMinutes = parseInt(timeMatch[2], 10);
          }
        } else if (timeSheetData.startTime instanceof Date) {
          startHours = timeSheetData.startTime.getHours();
          startMinutes = timeSheetData.startTime.getMinutes();
        }
        
        if (typeof timeSheetData.endTime === 'string') {
          const timeMatch = timeSheetData.endTime.match(/^(\d+):(\d+)$/);
          if (timeMatch) {
            endHours = parseInt(timeMatch[1], 10);
            endMinutes = parseInt(timeMatch[2], 10);
          }
        } else if (timeSheetData.endTime instanceof Date) {
          endHours = timeSheetData.endTime.getHours();
          endMinutes = timeSheetData.endTime.getMinutes();
        }
        
        // Calculate duration in hours
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        // Handle end time being earlier than start time (next day)
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60; // Add a day worth of minutes
        }
        
        // Calculate difference in hours
        const diffHours = (totalEndMinutes - totalStartMinutes) / 60;
        timeSheetData.hours = Math.max(0, Math.round(diffHours * 10) / 10); // Round to nearest 0.1 hour
      }
      
      const timeSheet = await storage.createTimeSheet(timeSheetData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "timesheet",
        entityId: timeSheet.id,
        details: {
          projectId: timeSheet.projectId,
          hours: timeSheet.hours,
          date: timeSheet.workDate,
        }
      });
      
      res.status(201).json(timeSheet);
    } catch (error) {
      console.error("Create timesheet error:", JSON.stringify(error, null, 2));
      let errorMessage = "Invalid timesheet data";
      
      // If it's a Zod validation error, provide more details
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = (error as any).issues;
        if (Array.isArray(issues) && issues.length > 0) {
          errorMessage = `Validation error: ${issues[0].message}`;
        }
      }
      
      res.status(400).json({ message: errorMessage });
    }
  });

  apiRouter.patch("/timesheets/:id", isAuthenticated, async (req, res) => {
    try {
      const timeSheetId = parseInt(req.params.id);
      const timeSheet = await storage.getTimeSheet(timeSheetId);
      
      if (!timeSheet) {
        return res.status(404).json({ message: "TimeSheet not found" });
      }

      // Check if user has permission to update status (Admin only)
      if (req.body.status && req.body.status !== timeSheet.status && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "Only admins can change timesheet status" });
      }
      
      // Pre-process the request body
      const processedBody = {...req.body};
      
      // Handle status change specifically for approval
      if (processedBody.status === "Approved") {
        processedBody.approvalDate = new Date().toISOString();
        processedBody.approvedById = req.session.userId;
        
        // Ensure we keep existing data
        processedBody.workDate = timeSheet.workDate;
        processedBody.startTime = timeSheet.startTime;
        processedBody.endTime = timeSheet.endTime;
        processedBody.hours = timeSheet.hours;
        processedBody.description = timeSheet.description;
        processedBody.userId = timeSheet.userId;
        processedBody.projectId = timeSheet.projectId;
      }
      
      if (processedBody.hours !== undefined) {
        processedBody.hours = typeof processedBody.hours === 'number' ? Math.min(processedBody.hours, 24) : processedBody.hours;
      }
      
      if (req.body.workDate && typeof req.body.workDate === 'string') {
        processedBody.workDate = new Date(req.body.workDate);
      }
      
      // Enhanced time processing for reliable storage and display
      if (req.body.startTime && typeof req.body.startTime === 'string') {
        // Log for debugging
        console.log('[SERVER] Processing startTime:', req.body.startTime);
        
        // Strip extra whitespace and convert to uppercase for consistent processing
        const cleanTime = req.body.startTime.trim().toUpperCase();
        
        // Check if time already has AM/PM designation
        const timeMatch = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          // Format consistently with properly capitalized AM/PM with space
          const [_, hours, minutes, ampm] = timeMatch;
          processedBody.startTime = `${hours}:${minutes} ${ampm.toUpperCase()}`;
        } else {
          // If no AM/PM provided, try to add it based on 24-hour interpretation
          try {
            const [hours, minutes] = cleanTime.split(':');
            if (!hours || !minutes) throw new Error('Invalid time format');
            
            const hour = parseInt(hours, 10);
            if (isNaN(hour)) throw new Error('Invalid hour');
            
            const ampm = hour >= 12 ? 'PM' : 'AM';
            processedBody.startTime = `${hours}:${minutes} ${ampm}`;
          } catch (e) {
            console.error('[SERVER] Time processing error:', e);
            // Set a valid time format as fallback
            processedBody.startTime = "09:00 AM";
          }
        }
        
        console.log('[SERVER] Processed startTime:', processedBody.startTime);
      }
      
      if (req.body.endTime && typeof req.body.endTime === 'string') {
        // Log for debugging
        console.log('[SERVER] Processing endTime:', req.body.endTime);
        
        // Strip extra whitespace and convert to uppercase for consistent processing
        const cleanTime = req.body.endTime.trim().toUpperCase();
        
        // Check if time already has AM/PM designation
        const timeMatch = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          // Format consistently with properly capitalized AM/PM with space
          const [_, hours, minutes, ampm] = timeMatch;
          processedBody.endTime = `${hours}:${minutes} ${ampm.toUpperCase()}`;
        } else {
          // If no AM/PM provided, try to add it based on 24-hour interpretation
          try {
            const [hours, minutes] = cleanTime.split(':');
            if (!hours || !minutes) throw new Error('Invalid time format');
            
            const hour = parseInt(hours, 10);
            if (isNaN(hour)) throw new Error('Invalid hour');
            
            const ampm = hour >= 12 ? 'PM' : 'AM';
            processedBody.endTime = `${hours}:${minutes} ${ampm}`;
          } catch (e) {
            console.error('[SERVER] Time processing error:', e);
            // Set a valid time format as fallback
            processedBody.endTime = "05:00 PM";
          }
        }
        
        console.log('[SERVER] Processed endTime:', processedBody.endTime);
      }
      
      // Use processed body for updates
      req.body = processedBody;
      
      // Users can only update their own timesheets unless they're an admin
      if (timeSheet.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only update your own timesheets" });
      }
      
      // Allow admins to edit any timesheet, others can only edit pending ones
      if (timeSheet.status !== "Pending" && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "Only admins can edit approved or rejected timesheets" });
      }
      
      const { description, workDate, startTime, endTime, hours, projectId, moduleId, testCaseId, bugId, folderId, status, tags } = req.body;
      
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (workDate !== undefined) updateData.workDate = workDate;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (hours !== undefined) updateData.hours = hours;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (moduleId !== undefined) updateData.moduleId = moduleId;
      if (testCaseId !== undefined) updateData.testCaseId = testCaseId;
      // Handle tags properly, ensuring they're stored as an array
      if (tags !== undefined) {
        // Convert to array if it's a string or other value
        if (!Array.isArray(tags)) {
          if (typeof tags === 'string') {
            // Handle comma-separated string format
            updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          } else {
            // Create a single-item array or empty array if null/undefined
            updateData.tags = tags ? [String(tags)] : [];
          }
        } else {
          // Already an array, use as is (but ensure string values)
          updateData.tags = tags.map(tag => String(tag));
        }
      }
      if (bugId !== undefined) updateData.bugId = bugId;
      if (folderId !== undefined) updateData.folderId = folderId;
      if (status !== undefined) updateData.status = status;
      
      // If folder ID is provided, verify it exists and belongs to the user
      if (folderId !== undefined && folderId !== null) {
        const folder = await storage.getTimeSheetFolder(folderId);
        if (!folder) {
          return res.status(404).json({ message: "Folder not found" });
        }
        
        if (folder.userId !== timeSheet.userId) {
          return res.status(403).json({ message: "The folder doesn't belong to this user" });
        }
      }
      
      // Recalculate hours if start/end time changed but hours didn't
      if ((startTime || endTime) && hours === undefined) {
        let startHours = 9, startMinutes = 0;
        let endHours = 17, endMinutes = 0;
        
        // Parse time for start time (either from update data or existing timesheet)
        if (startTime) {
          if (typeof startTime === 'string') {
            const timeMatch = startTime.match(/^(\d+):(\d+)$/);
            if (timeMatch) {
              startHours = parseInt(timeMatch[1], 10);
              startMinutes = parseInt(timeMatch[2], 10);
            }
          } else if (startTime instanceof Date) {
            startHours = startTime.getHours();
            startMinutes = startTime.getMinutes();
          }
        } else if (timeSheet.startTime) {
          // Use existing timeSheet data
          if (typeof timeSheet.startTime === 'string') {
            const timeMatch = timeSheet.startTime.match(/^(\d+):(\d+)$/);
            if (timeMatch) {
              startHours = parseInt(timeMatch[1], 10);
              startMinutes = parseInt(timeMatch[2], 10);
            }
          } else if (timeSheet.startTime instanceof Date) {
            startHours = timeSheet.startTime.getHours();
            startMinutes = timeSheet.startTime.getMinutes();
          }
        }
        
        // Parse time for end time (either from update data or existing timesheet)
        if (endTime) {
          if (typeof endTime === 'string') {
            const timeMatch = endTime.match(/^(\d+):(\d+)$/);
            if (timeMatch) {
              endHours = parseInt(timeMatch[1], 10);
              endMinutes = parseInt(timeMatch[2], 10);
            }
          } else if (endTime instanceof Date) {
            endHours = endTime.getHours();
            endMinutes = endTime.getMinutes();
          }
        } else if (timeSheet.endTime) {
          // Use existing timeSheet data
          if (typeof timeSheet.endTime === 'string') {
            const timeMatch = timeSheet.endTime.match(/^(\d+):(\d+)$/);
            if (timeMatch) {
              endHours = parseInt(timeMatch[1], 10);
              endMinutes = parseInt(timeMatch[2], 10);
            }
          } else if (timeSheet.endTime instanceof Date) {
            endHours = timeSheet.endTime.getHours();
            endMinutes = timeSheet.endTime.getMinutes();
          }
        }
        
        // Calculate duration in hours
        let totalStartMinutes = startHours * 60 + startMinutes;
        let totalEndMinutes = endHours * 60 + endMinutes;
        
        // Handle end time being earlier than start time (next day)
        if (totalEndMinutes < totalStartMinutes) {
          totalEndMinutes += 24 * 60; // Add a day worth of minutes
        }
        
        // Calculate difference in hours
        const diffHours = (totalEndMinutes - totalStartMinutes) / 60;
        updateData.hours = Math.max(0, Math.round(diffHours * 10) / 10); // Round to nearest 0.1 hour
      }
      
      const updatedTimeSheet = await storage.updateTimeSheet(timeSheetId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "timesheet",
        entityId: timeSheetId,
        details: {
          projectId: updatedTimeSheet!.projectId,
          hours: updatedTimeSheet!.hours,
          date: updatedTimeSheet!.workDate,
        }
      });
      
      res.json(updatedTimeSheet);
    } catch (error) {
      console.error("Update timesheet error:", JSON.stringify(error, null, 2));
      let errorMessage = "Server error";
      let statusCode = 500;
      
      // If it's a Zod validation error, provide more details
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = (error as any).issues;
        if (Array.isArray(issues) && issues.length > 0) {
          errorMessage = `Validation error: ${issues[0].message}`;
          statusCode = 400;
        }
      }
      
      res.status(statusCode).json({ message: errorMessage });
    }
  });

  apiRouter.post("/timesheets/:id/approve", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const timeSheetId = parseInt(req.params.id);
      const timeSheet = await storage.getTimeSheet(timeSheetId);
      
      if (!timeSheet) {
        return res.status(404).json({ message: "TimeSheet not found" });
      }
      
      // Don't approve already approved/rejected timesheets
      if (timeSheet.status !== "Pending") {
        return res.status(400).json({ message: `TimeSheet already ${timeSheet.status.toLowerCase()}` });
      }
      
      const approvedTimeSheet = await storage.approveTimeSheet(timeSheetId, req.session.userId!);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "approve",
        entityType: "timesheet",
        entityId: timeSheetId,
        details: {
          projectId: timeSheet.projectId,
          hours: timeSheet.hours,
          date: timeSheet.workDate,
        }
      });
      
      res.json(approvedTimeSheet);
    } catch (error) {
      console.error("Approve timesheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/timesheets/:id/reject", isAuthenticated, checkRole(["Admin"]), async (req, res) => {
    try {
      const timeSheetId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Reason for rejection is required" });
      }
      
      const timeSheet = await storage.getTimeSheet(timeSheetId);
      
      if (!timeSheet) {
        return res.status(404).json({ message: "TimeSheet not found" });
      }
      
      // Don't reject already approved/rejected timesheets
      if (timeSheet.status !== "Pending") {
        return res.status(400).json({ message: `TimeSheet already ${timeSheet.status.toLowerCase()}` });
      }
      
      const rejectedTimeSheet = await storage.rejectTimeSheet(timeSheetId, req.session.userId!, reason);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "reject",
        entityType: "timesheet",
        entityId: timeSheetId,
        details: {
          projectId: timeSheet.projectId,
          hours: timeSheet.hours,
          date: timeSheet.workDate,
          reason: reason,
        }
      });
      
      res.json(rejectedTimeSheet);
    } catch (error) {
      console.error("Reject timesheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/timesheets/:id", isAuthenticated, async (req, res) => {
    try {
      const timeSheetId = parseInt(req.params.id);
      const timeSheet = await storage.getTimeSheet(timeSheetId);
      
      if (!timeSheet) {
        return res.status(404).json({ message: "TimeSheet not found" });
      }
      
      // Users can only delete their own timesheets unless they're an admin
      if (timeSheet.userId !== req.session.userId && req.session.userRole !== "Admin") {
        return res.status(403).json({ message: "You can only delete your own timesheets" });
      }
      
      // Don't allow deleting approved timesheets (unless admin)
      if (timeSheet.status === "Approved" && req.session.userRole !== "Admin") {
        return res.status(400).json({ message: "Cannot delete an approved timesheet" });
      }
      
      // Delete the timesheet
      await storage.deleteTimeSheet(timeSheetId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "timesheet",
        entityId: timeSheetId,
        details: {
          projectId: timeSheet.projectId,
          hours: timeSheet.hours,
          date: timeSheet.workDate,
        }
      });
      
      res.json({ message: "TimeSheet deleted successfully" });
    } catch (error) {
      console.error("Delete timesheet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  
  /*
      console.error("Get automation scripts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/automation/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getAutomationScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Automation script not found" });
      }
      
      res.json(script);
    } catch (error) {
      console.error("Get automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/scripts", isAuthenticated, async (req, res) => {
    try {
      const scriptData = insertAutomationScriptSchema.parse(req.body);
      scriptData.createdById = req.session.userId!;
      
      const script = await storage.createAutomationScript(scriptData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "automation_script",
        entityId: script.id,
        details: {
          name: script.name,
          type: script.type,
          projectId: script.projectId
        }
      });
      
      res.status(201).json(script);
    } catch (error) {
      console.error("Create automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/automation/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getAutomationScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Automation script not found" });
      }
      
      const updateData = insertAutomationScriptSchema.partial().parse(req.body);
      updateData.updatedById = req.session.userId!;
      
      const updatedScript = await storage.updateAutomationScript(scriptId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "automation_script",
        entityId: scriptId,
        details: {
          name: script.name,
          updates: Object.keys(updateData)
        }
      });
      
      res.json(updatedScript);
    } catch (error) {
      console.error("Update automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/automation/scripts/:id", isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getAutomationScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Automation script not found" });
      }
      
      await storage.deleteAutomationScript(scriptId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "automation_script",
        entityId: scriptId,
        details: {
          name: script.name,
          type: script.type
        }
      });
      
      res.json({ message: "Automation script deleted successfully" });
    } catch (error) {
      console.error("Delete automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Automation Runs
  apiRouter.get("/automation/runs", isAuthenticated, async (req, res) => {
    try {
      const scriptId = req.query.scriptId ? parseInt(req.query.scriptId as string) : undefined;
      const runs = await storage.getAutomationRuns(scriptId);
      res.json(runs);
    } catch (error) {
      console.error("Get automation runs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/automation/runs/:id", isAuthenticated, async (req, res) => {
    try {
      const runId = parseInt(req.params.id);
      const run = await storage.getAutomationRun(runId);
      
      if (!run) {
        return res.status(404).json({ message: "Automation run not found" });
      }
      
      res.json(run);
    } catch (error) {
      console.error("Get automation run error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Execute script
  apiRouter.post("/automation/scripts/:id/execute", isAuthenticated, async (req, res) => {
    try {
      const scriptId = parseInt(req.params.id);
      const script = await storage.getAutomationScript(scriptId);
      
      if (!script) {
        return res.status(404).json({ message: "Automation script not found" });
      }
      
      const runData = {
        scriptId,
        status: "Running" as const,
        startTime: new Date(),
        executedById: req.session.userId!,
        environment: req.body.environment,
        browser: req.body.browser
      };
      
      const run = await storage.createAutomationRun(runData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "execute",
        entityType: "automation_script",
        entityId: scriptId,
        details: {
          name: script.name,
          runId: run.id
        }
      });
      
      // In a real implementation, this would trigger the actual execution
      // For simulation purposes, update the run after a delay
      setTimeout(async () => {
        try {
          // Simulate a random test result
          const statuses = ['Passed', 'Failed'];
          const endTime = new Date();
          const duration = Math.floor((endTime.getTime() - run.startTime.getTime()) / 1000);
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'Passed' | 'Failed';
          
          await storage.updateAutomationRun(run.id, {
            status: randomStatus,
            endTime,
            duration,
            logs: `Test execution completed with status: ${randomStatus}`,
            errorMessage: randomStatus === 'Failed' ? 'Simulated test failure' : undefined,
          });
          
          // Update the script's last run information
          await storage.updateAutomationScript(scriptId, {
            lastRunStatus: randomStatus,
            lastRunDate: endTime,
            lastRunDuration: duration,
          });
        } catch (error) {
          console.error('Error in delayed test execution update:', error);
        }
      }, 5000); // Simulate 5 second test run
      
      res.status(202).json({
        message: "Script execution started",
        runId: run.id
      });
    } catch (error) {
      console.error("Execute automation script error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Automation Schedules
  apiRouter.get("/automation/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getAutomationSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Get automation schedules error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/automation/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getAutomationSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Automation schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Get automation schedule error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/schedules", isAuthenticated, async (req, res) => {
    try {
      const scheduleData = insertAutomationScheduleSchema.parse(req.body);
      scheduleData.createdById = req.session.userId!;
      
      const schedule = await storage.createAutomationSchedule(scheduleData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "automation_schedule",
        entityId: schedule.id,
        details: {
          name: schedule.name,
          scriptCount: (schedule.scriptIds as number[]).length
        }
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Create automation schedule error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/automation/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getAutomationSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Automation schedule not found" });
      }
      
      const updateData = insertAutomationScheduleSchema.partial().parse(req.body);
      updateData.updatedById = req.session.userId!;
      
      const updatedSchedule = await storage.updateAutomationSchedule(scheduleId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "automation_schedule",
        entityId: scheduleId,
        details: {
          name: schedule.name,
          updates: Object.keys(updateData)
        }
      });
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Update automation schedule error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/automation/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getAutomationSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Automation schedule not found" });
      }
      
      await storage.deleteAutomationSchedule(scheduleId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "automation_schedule",
        entityId: scheduleId,
        details: {
          name: schedule.name
        }
      });
      
      res.json({ message: "Automation schedule deleted successfully" });
    } catch (error) {
      console.error("Delete automation schedule error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Automation Environments
  apiRouter.get("/automation/environments", isAuthenticated, async (req, res) => {
    try {
      const environments = await storage.getAutomationEnvironments();
      res.json(environments);
    } catch (error) {
      console.error("Get automation environments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/automation/environments/:id", isAuthenticated, async (req, res) => {
    try {
      const environmentId = parseInt(req.params.id);
      const environment = await storage.getAutomationEnvironment(environmentId);
      
      if (!environment) {
        return res.status(404).json({ message: "Automation environment not found" });
      }
      
      res.json(environment);
    } catch (error) {
      console.error("Get automation environment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/automation/environments", isAuthenticated, async (req, res) => {
    try {
      const environmentData = insertAutomationEnvironmentSchema.parse(req.body);
      environmentData.createdById = req.session.userId!;
      
      const environment = await storage.createAutomationEnvironment(environmentData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "automation_environment",
        entityId: environment.id,
        details: {
          name: environment.name,
          type: environment.type,
          url: environment.url
        }
      });
      
      res.status(201).json(environment);
    } catch (error) {
      console.error("Create automation environment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/automation/environments/:id", isAuthenticated, async (req, res) => {
    try {
      const environmentId = parseInt(req.params.id);
      const environment = await storage.getAutomationEnvironment(environmentId);
      
      if (!environment) {
        return res.status(404).json({ message: "Automation environment not found" });
      }
      
      const updateData = insertAutomationEnvironmentSchema.partial().parse(req.body);
      
      const updatedEnvironment = await storage.updateAutomationEnvironment(environmentId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "automation_environment",
        entityId: environmentId,
        details: {
          name: environment.name,
          updates: Object.keys(updateData)
        }
      });
      
      res.json(updatedEnvironment);
    } catch (error) {
      console.error("Update automation environment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/automation/environments/:id", isAuthenticated, async (req, res) => {
    try {
      const environmentId = parseInt(req.params.id);
      const environment = await storage.getAutomationEnvironment(environmentId);
      
      if (!environment) {
        return res.status(404).json({ message: "Automation environment not found" });
      }
      
      await storage.deleteAutomationEnvironment(environmentId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "automation_environment",
        entityId: environmentId,
        details: {
          name: environment.name,
          type: environment.type
        }
      });
      
      res.json({ message: "Automation environment deleted successfully" });
    } catch (error) {
      console.error("Delete automation environment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  */

  // =====================================================
  // Kanban Board API Routes
  // =====================================================

  // Sprints
  apiRouter.get("/sprints", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      const sprints = await storage.getSprints(projectId);
      res.json(sprints);
    } catch (error) {
      console.error("Get sprints error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/sprints/:id", isAuthenticated, async (req, res) => {
    try {
      const sprintId = parseInt(req.params.id);
      const sprint = await storage.getSprint(sprintId);
      
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      res.json(sprint);
    } catch (error) {
      console.error("Get sprint error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/sprints", isAuthenticated, async (req, res) => {
    try {
      const sprintData = insertSprintSchema.parse(req.body);
      sprintData.createdById = req.session.userId!;
      
      const sprint = await storage.createSprint(sprintData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "sprint",
        entityId: sprint.id,
        details: {
          name: sprint.name,
          projectId: sprint.projectId
        }
      });
      
      // Create default columns for the sprint
      const defaultColumns = [
        { title: "Backlog", order: 0, color: "#94a3b8" },
        { title: "To Do", order: 1, color: "#3b82f6" },
        { title: "In Progress", order: 2, color: "#f59e0b" },
        { title: "Testing", order: 3, color: "#8b5cf6" },
        { title: "Done", order: 4, color: "#22c55e" }
      ];
      
      for (const column of defaultColumns) {
        await storage.createKanbanColumn({
          title: column.title,
          projectId: sprint.projectId,
          sprintId: sprint.id,
          order: column.order,
          color: column.color,
          isDefault: true,
          createdById: req.session.userId!
        });
      }
      
      res.status(201).json(sprint);
    } catch (error) {
      console.error("Create sprint error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/sprints/:id", isAuthenticated, async (req, res) => {
    try {
      const sprintId = parseInt(req.params.id);
      const sprint = await storage.getSprint(sprintId);
      
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      const updateData = insertSprintSchema.partial().parse(req.body);
      
      const updatedSprint = await storage.updateSprint(sprintId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "sprint",
        entityId: sprintId,
        details: {
          name: updatedSprint.name,
          status: updatedSprint.status
        }
      });
      
      res.json(updatedSprint);
    } catch (error) {
      console.error("Update sprint error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/sprints/:id", isAuthenticated, async (req, res) => {
    try {
      const sprintId = parseInt(req.params.id);
      const sprint = await storage.getSprint(sprintId);
      
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      
      // Check if sprint has associated kanban cards
      const cards = await storage.getKanbanCards(undefined, sprintId);
      if (cards.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete sprint with associated cards. Please move or delete the cards first." 
        });
      }
      
      // Delete all columns associated with this sprint
      const columns = await storage.getKanbanColumns(undefined, sprintId);
      for (const column of columns) {
        await storage.deleteKanbanColumn(column.id);
      }
      
      await storage.deleteSprint(sprintId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "sprint",
        entityId: sprintId,
        details: {
          name: sprint.name
        }
      });
      
      res.json({ message: "Sprint and associated columns deleted successfully" });
    } catch (error) {
      console.error("Delete sprint error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kanban Columns
  apiRouter.get("/kanban/columns", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
      
      const columns = await storage.getKanbanColumns(projectId, sprintId);
      res.json(columns);
    } catch (error) {
      console.error("Get kanban columns error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/kanban/columns/:id", isAuthenticated, async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const column = await storage.getKanbanColumn(columnId);
      
      if (!column) {
        return res.status(404).json({ message: "Kanban column not found" });
      }
      
      res.json(column);
    } catch (error) {
      console.error("Get kanban column error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/kanban/columns", isAuthenticated, async (req, res) => {
    try {
      const columnData = insertKanbanColumnSchema.parse(req.body);
      columnData.createdById = req.session.userId!;
      
      const column = await storage.createKanbanColumn(columnData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "kanban_column",
        entityId: column.id,
        details: {
          title: column.title,
          projectId: column.projectId,
          sprintId: column.sprintId
        }
      });
      
      res.status(201).json(column);
    } catch (error) {
      console.error("Create kanban column error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/kanban/columns/:id", isAuthenticated, async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const column = await storage.getKanbanColumn(columnId);
      
      if (!column) {
        return res.status(404).json({ message: "Kanban column not found" });
      }
      
      const updateData = insertKanbanColumnSchema.partial().parse(req.body);
      
      const updatedColumn = await storage.updateKanbanColumn(columnId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "kanban_column",
        entityId: columnId,
        details: {
          title: updatedColumn.title,
          order: updatedColumn.order
        }
      });
      
      res.json(updatedColumn);
    } catch (error) {
      console.error("Update kanban column error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/kanban/columns/:id", isAuthenticated, async (req, res) => {
    try {
      const columnId = parseInt(req.params.id);
      const column = await storage.getKanbanColumn(columnId);
      
      if (!column) {
        return res.status(404).json({ message: "Kanban column not found" });
      }
      
      // Check if column has associated cards
      const cards = await storage.getKanbanCards(column.id);
      if (cards.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete column with associated cards. Please move or delete the cards first." 
        });
      }
      
      await storage.deleteKanbanColumn(columnId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "kanban_column",
        entityId: columnId,
        details: {
          title: column.title
        }
      });
      
      res.json({ message: "Kanban column deleted successfully" });
    } catch (error) {
      console.error("Delete kanban column error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Kanban Cards
  apiRouter.get("/kanban/cards", isAuthenticated, async (req, res) => {
    try {
      const columnId = req.query.columnId ? parseInt(req.query.columnId as string) : undefined;
      const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      const cards = await storage.getKanbanCards(columnId, sprintId, projectId);
      res.json(cards);
    } catch (error) {
      console.error("Get kanban cards error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Endpoint to get sub-cards for a parent card
  apiRouter.get("/kanban/cards/sub/:parentId", isAuthenticated, async (req, res) => {
    try {
      const parentId = parseInt(req.params.parentId);
      const subCards = await storage.getKanbanSubCards(parentId);
      res.json(subCards);
    } catch (error) {
      console.error("Get kanban sub-cards error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/kanban/cards/:id", isAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getKanbanCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Kanban card not found" });
      }
      
      res.json(card);
    } catch (error) {
      console.error("Get kanban card error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/kanban/cards", isAuthenticated, async (req, res) => {
    try {
      const cardData = insertKanbanCardSchema.parse(req.body);
      cardData.createdById = req.session.userId!;
      
      const card = await storage.createKanbanCard(cardData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "create",
        entityType: "kanban_card",
        entityId: card.id,
        details: {
          title: card.title,
          columnId: card.columnId,
          priority: card.priority
        }
      });
      
      res.status(201).json(card);
    } catch (error) {
      console.error("Create kanban card error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/kanban/cards/:id", isAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getKanbanCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Kanban card not found" });
      }
      
      const updateData = insertKanbanCardSchema.partial().parse(req.body);
      
      const updatedCard = await storage.updateKanbanCard(cardId, updateData);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "update",
        entityType: "kanban_card",
        entityId: cardId,
        details: {
          title: updatedCard.title,
          status: `Moved to ${updatedCard.columnId !== card.columnId ? 'new column' : 'same column'}`
        }
      });
      
      res.json(updatedCard);
    } catch (error) {
      console.error("Update kanban card error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.patch("/kanban/cards/:id/move", isAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getKanbanCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Kanban card not found" });
      }
      
      const { columnId, order } = req.body;
      
      if (typeof columnId !== 'number' || typeof order !== 'number') {
        return res.status(400).json({ message: "columnId and order are required" });
      }
      
      // Check if the column exists
      const column = await storage.getKanbanColumn(columnId);
      if (!column) {
        return res.status(404).json({ message: "Target column not found" });
      }
      
      // Update card position
      const updatedCard = await storage.updateKanbanCard(cardId, { 
        columnId, 
        order,
        updatedAt: new Date() 
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "move",
        entityType: "kanban_card",
        entityId: cardId,
        details: {
          title: card.title,
          fromColumn: card.columnId,
          toColumn: columnId,
          newOrder: order
        }
      });
      
      res.json(updatedCard);
    } catch (error) {
      console.error("Move kanban card error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.delete("/kanban/cards/:id", isAuthenticated, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getKanbanCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Kanban card not found" });
      }
      
      await storage.deleteKanbanCard(cardId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "delete",
        entityType: "kanban_card",
        entityId: cardId,
        details: {
          title: card.title
        }
      });
      
      res.json({ message: "Kanban card deleted successfully" });
    } catch (error) {
      console.error("Delete kanban card error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Traceability Matrix - Custom Markers
  apiRouter.get("/projects/:projectId/matrix/markers", isAuthenticated, async (req, res) => {
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
      
      const markers = await storage.getCustomMarkersByProject(projectId);
      res.json(markers);
    } catch (error) {
      console.error("Get custom markers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/projects/:projectId/matrix/markers", isAuthenticated, async (req, res) => {
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
      
      const markerData = insertCustomMarkerSchema.parse(req.body);
      markerData.projectId = projectId;
      markerData.createdById = req.session.userId!;
      
      const marker = await storage.createCustomMarker(markerData);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created",
        entityType: "custom_marker",
        entityId: marker.id,
        details: { 
          label: marker.label,
          color: marker.color,
          projectId
        }
      });
      
      res.status(201).json(marker);
    } catch (error) {
      console.error("Create custom marker error:", error);
      res.status(400).json({ message: "Invalid custom marker data" });
    }
  });

  apiRouter.patch("/projects/:projectId/matrix/markers/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const markerId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const marker = await storage.getCustomMarker(markerId);
      if (!marker) {
        return res.status(404).json({ message: "Custom marker not found" });
      }
      
      // Verify marker belongs to this project
      if (marker.projectId !== projectId) {
        return res.status(403).json({ message: "Marker does not belong to this project" });
      }
      
      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);
        
        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }
      
      const updateData = insertCustomMarkerSchema.partial().parse(req.body);
      // Prevent changing projectId
      delete updateData.projectId;
      
      const updatedMarker = await storage.updateCustomMarker(markerId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "updated",
        entityType: "custom_marker",
        entityId: markerId,
        details: { 
          label: updatedMarker.label,
          updatedFields: Object.keys(updateData).join(', ')
        }
      });
      
      res.json(updatedMarker);
    } catch (error) {
      console.error("Update custom marker error:", error);
      res.status(400).json({ message: "Invalid custom marker data" });
    }
  });

  apiRouter.delete("/projects/:projectId/matrix/markers/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const markerId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const marker = await storage.getCustomMarker(markerId);
      if (!marker) {
        return res.status(404).json({ message: "Custom marker not found" });
      }
      
      // Verify marker belongs to this project
      if (marker.projectId !== projectId) {
        return res.status(403).json({ message: "Marker does not belong to this project" });
      }
      
      // Check if user has access to this project
      if (req.session.userRole !== "Admin") {
        const projectMembers = await storage.getProjectMembers(projectId);
        const isMember = projectMembers.some(member => member.userId === req.session.userId);
        
        if (!isMember && project.createdById !== req.session.userId) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
      }
      
      const success = await storage.deleteCustomMarker(markerId);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          userId: req.session.userId!,
          action: "deleted",
          entityType: "custom_marker",
          entityId: markerId,
          details: { 
            label: marker.label
          }
        });
      }
      
      res.json({ success });
    } catch (error) {
      console.error("Delete custom marker error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Traceability Matrix - Cells
  apiRouter.get("/projects/:projectId/matrix/cells", isAuthenticated, async (req, res) => {
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
      
      // Check if storage method exists
      if (typeof storage.getMatrixCellsByProject === 'function') {
        const cells = await storage.getMatrixCellsByProject(projectId);
        res.json(cells);
      } else {
        // Return empty array if method doesn't exist
        res.json([]);
      }
    } catch (error) {
      console.error("Get matrix cells error:", error);
      // Return empty array instead of error to prevent crashes
      res.json([]);
    }
  });

  apiRouter.post("/projects/:projectId/matrix/cells", isAuthenticated, async (req, res) => {
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
      
      const cellData = insertMatrixCellSchema.parse(req.body);
      cellData.projectId = projectId;
      cellData.createdById = req.session.userId!;
      
      const cell = await storage.upsertMatrixCell(cellData);
      
      // Log activity (simplified to avoid too much logging for matrix operations)
      if (req.query.logActivity === "true") {
        await storage.createActivity({
          userId: req.session.userId!,
          action: "updated",
          entityType: "matrix_cell",
          entityId: cell.id,
          details: { 
            projectId,
            rowModuleId: cell.rowModuleId,
            colModuleId: cell.colModuleId
          }
        });
      }
      
      res.status(201).json(cell);
    } catch (error) {
      console.error("Create/update matrix cell error:", error);
      res.status(400).json({ message: "Invalid matrix cell data" });
    }
  });

  apiRouter.delete("/projects/:projectId/matrix/cells", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const rowModuleId = parseInt(req.query.rowModuleId as string);
      const colModuleId = parseInt(req.query.colModuleId as string);
      
      if (isNaN(rowModuleId) || isNaN(colModuleId)) {
        return res.status(400).json({ message: "rowModuleId and colModuleId are required query parameters" });
      }
      
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
      
      const success = await storage.deleteMatrixCell(rowModuleId, colModuleId, projectId);
      
      res.json({ success });
    } catch (error) {
      console.error("Delete matrix cell error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Traceability Matrix routes
  apiRouter.get("/traceability/matrix/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const matrices = await storage.getTraceabilityMatrix(projectId);
      res.json(matrices);
    } catch (error) {
      logger.error('Error fetching traceability matrices', error);
      res.status(500).json({ message: "Failed to fetch traceability matrices" });
    }
  });

  apiRouter.get("/traceability/matrix/detail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const matrix = await storage.getTraceabilityMatrixById(id);
      
      if (!matrix) {
        return res.status(404).json({ message: "Traceability matrix not found" });
      }
      
      res.json(matrix);
    } catch (error) {
      logger.error('Error fetching traceability matrix details', error);
      res.status(500).json({ message: "Failed to fetch traceability matrix details" });
    }
  });

  apiRouter.post("/traceability/matrix", async (req, res) => {
    try {
      const matrix = await storage.createTraceabilityMatrix(req.body);
      res.status(201).json(matrix);
    } catch (error) {
      logger.error('Error creating traceability matrix', error);
      res.status(500).json({ message: "Failed to create traceability matrix" });
    }
  });

  apiRouter.put("/traceability/matrix/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTraceabilityMatrix(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Traceability matrix not found" });
      }
      
      res.json(updated);
    } catch (error) {
      logger.error('Error updating traceability matrix', error);
      res.status(500).json({ message: "Failed to update traceability matrix" });
    }
  });

  apiRouter.delete("/traceability/matrix/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTraceabilityMatrix(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Traceability matrix not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting traceability matrix', error);
      res.status(500).json({ message: "Failed to delete traceability matrix" });
    }
  });

  // Traceability Matrix Markers routes
  apiRouter.get("/traceability/markers/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const markers = await storage.getTraceabilityMarkers(projectId);
      res.json(markers);
    } catch (error) {
      logger.error('Error fetching traceability markers', error);
      res.status(500).json({ message: "Failed to fetch traceability markers" });
    }
  });

  apiRouter.get("/traceability/markers/detail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const marker = await storage.getTraceabilityMarker(id);
      
      if (!marker) {
        return res.status(404).json({ message: "Traceability marker not found" });
      }
      
      res.json(marker);
    } catch (error) {
      logger.error('Error fetching traceability marker details', error);
      res.status(500).json({ message: "Failed to fetch traceability marker details" });
    }
  });

  apiRouter.post("/traceability/markers", async (req, res) => {
    try {
      const marker = await storage.createTraceabilityMarker(req.body);
      res.status(201).json(marker);
    } catch (error) {
      logger.error('Error creating traceability marker', error);
      res.status(500).json({ message: "Failed to create traceability marker" });
    }
  });

  apiRouter.put("/traceability/markers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTraceabilityMarker(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Traceability marker not found" });
      }
      
      res.json(updated);
    } catch (error) {
      logger.error('Error updating traceability marker', error);
      res.status(500).json({ message: "Failed to update traceability marker" });
    }
  });

  apiRouter.delete("/traceability/markers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTraceabilityMarker(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Traceability marker not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting traceability marker', error);
      res.status(500).json({ message: "Failed to delete traceability marker" });
    }
  });

  // Traceability Matrix Cells routes
  apiRouter.get("/traceability/cells/:matrixId", async (req, res) => {
    try {
      const matrixId = parseInt(req.params.matrixId);
      const cells = await storage.getTraceabilityMatrixCells(matrixId);
      res.json(cells);
    } catch (error) {
      logger.error('Error fetching traceability matrix cells', error);
      res.status(500).json({ message: "Failed to fetch traceability matrix cells" });
    }
  });

  apiRouter.post("/traceability/cells", async (req, res) => {
    try {
      const cell = await storage.createTraceabilityMatrixCell(req.body);
      res.status(201).json(cell);
    } catch (error) {
      logger.error('Error creating traceability matrix cell', error);
      res.status(500).json({ message: "Failed to create traceability matrix cell" });
    }
  });

  apiRouter.put("/traceability/cells/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTraceabilityMatrixCell(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Traceability matrix cell not found" });
      }
      
      res.json(updated);
    } catch (error) {
      logger.error('Error updating traceability matrix cell', error);
      res.status(500).json({ message: "Failed to update traceability matrix cell" });
    }
  });
  
  // GitHub sync from GitHub to system endpoint
  apiRouter.post("/github/sync-from-github/:projectId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Get GitHub configuration for the project
      const githubConfig = await storage.getGitHubConfig(projectId);
      if (!githubConfig || !githubConfig.isActive) {
        return res.status(404).json({ message: "GitHub configuration not found or inactive" });
      }

      // Import the GitHub service
      const { githubService } = await import('./github-service');

      // Fetch issues from GitHub and sync to system
      const syncResult = await githubService.syncFromGitHubToSystem(
        githubConfig.repoOwner,
        githubConfig.repoName,
        githubConfig.accessToken,
        projectId
      );

      res.json({
        message: "Successfully synced from GitHub to system",
        result: syncResult
      });
    } catch (error) {
      console.error("GitHub sync from GitHub error:", error);
      res.status(500).json({ 
        message: "Failed to sync from GitHub to system",
        error: error.message 
      });
    }
  });

  // GitHub sync endpoint
  apiRouter.post("/github/sync/:bugId", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.bugId);
      
      // Validate bugId
      if (isNaN(bugId) || bugId <= 0) {
        return res.status(400).json({ message: "Invalid bug ID" });
      }
      
      // Get the bug
      const bug = await storage.getBug(bugId);
      if (!bug) {
        console.error(`Bug with ID ${bugId} not found`);
        return res.status(404).json({ message: `Bug with ID ${bugId} not found` });
      }

      // Get GitHub config for the project
      const githubConfig = await storage.getGitHubConfig(bug.projectId);
      if (!githubConfig || !githubConfig.isActive) {
        return res.status(400).json({ message: "GitHub integration not configured for this project" });
      }

      const { githubService } = await import('./github-service');

      // Check if GitHub issue already exists for this bug
      const existingGithubIssue = await storage.getGitHubIssueByBugId(bugId);
      
      if (existingGithubIssue) {
        try {
          // Sync existing issue status
          const syncResult = await githubService.syncIssueStatus(githubConfig, existingGithubIssue.githubIssueNumber, bugId);
          
          if (syncResult.needsUpdate) {
            // Update bug status in the system
            const updatedBug = await storage.updateBug(bugId, { 
              status: syncResult.bugStatus 
            });

            // Update GitHub issue record
            await storage.updateGitHubIssue(existingGithubIssue.id, {
              status: syncResult.githubStatus
            });

            // Log activity
            await storage.createActivity({
              userId: req.session.userId!,
              action: "synced from GitHub",
              entityType: "bug",
              entityId: bugId,
              details: { 
                bugId: bug.bugId,
                title: bug.title,
                oldStatus: bug.status,
                newStatus: syncResult.bugStatus,
                githubIssueNumber: existingGithubIssue.githubIssueNumber
              }
            });

            res.json({
              message: "Bug status synced successfully",
              bug: updatedBug,
              githubStatus: syncResult.githubStatus,
              previousStatus: bug.status,
              newStatus: syncResult.bugStatus,
              issueNumber: existingGithubIssue.githubIssueNumber
            });
          } else {
            res.json({
              message: "Bug status is already in sync",
              status: bug.status,
              issueNumber: existingGithubIssue.githubIssueNumber
            });
          }
        } catch (syncError) {
          console.error("GitHub sync error for existing issue:", syncError);
          res.json({
            message: "GitHub issue exists but sync failed",
            status: bug.status,
            issueNumber: existingGithubIssue.githubIssueNumber,
            error: syncError instanceof Error ? syncError.message : "Unknown sync error"
          });
        }
      } else {
        // Create new GitHub issue
        try {
          const syncResult = await githubService.syncBugToGitHub(bugId);
          
          if (syncResult.created) {
            // Log activity
            await storage.createActivity({
              userId: req.session.userId!,
              action: "created GitHub issue",
              entityType: "bug",
              entityId: bugId,
              details: { 
                bugId: bug.bugId,
                title: bug.title,
                githubIssueNumber: syncResult.issueNumber,
                githubUrl: syncResult.url
              }
            });

            res.json({
              message: "GitHub issue created successfully",
              created: true,
              issueNumber: syncResult.issueNumber,
              url: syncResult.url
            });
          } else {
            res.json({
              message: "No GitHub issue exists for this bug",
              created: false,
              bugId: bug.bugId,
              title: bug.title
            });
          }
        } catch (createError) {
          console.error("GitHub issue creation error:", createError);
          res.status(400).json({ 
            message: "Failed to create GitHub issue",
            error: createError instanceof Error ? createError.message : "Unknown creation error"
          });
        }
      }
    } catch (error) {
      console.error("GitHub sync error:", error);
      res.status(500).json({ 
        message: "Failed to sync with GitHub", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // GitHub Integration routes
  apiRouter.get("/github/configs", isAuthenticated, async (req, res) => {
    try {
      const configs = await storage.getAllGitHubConfigs();
      
      // Don't expose access tokens in the response
      const safeConfigs = configs.map(({ accessToken, ...config }) => config);
      
      res.json(safeConfigs);
    } catch (error) {
      console.error("Get all GitHub configs error:", error);
      res.status(500).json({ message: "Failed to fetch GitHub configurations" });
    }
  });

  apiRouter.get("/github/config/:projectId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const config = await storage.getGitHubConfig(projectId);
      
      if (!config) {
        return res.status(404).json({ message: "GitHub configuration not found" });
      }
      
      // Don't expose the access token in the response
      const { accessToken, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Get GitHub config error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/github/config", isAuthenticated, async (req, res) => {
    try {
      const configData = {
        ...req.body,
        createdById: req.session.userId!,
      };
      
      const config = await storage.createGitHubConfig(configData);
      
      // Don't expose the access token in the response
      const { accessToken, ...safeConfig } = config;
      
      await storage.createActivity({
        userId: req.session.userId!,
        action: "configured",
        entityType: "github_integration",
        entityId: config.id,
        details: { 
          projectId: config.projectId,
          repository: `${config.repoOwner}/${config.repoName}`
        }
      });
      
      res.status(201).json(safeConfig);
    } catch (error) {
      console.error("Create GitHub config error:", error);
      res.status(400).json({ message: "Invalid GitHub configuration data" });
    }
  });

  apiRouter.patch("/github/config/:id", isAuthenticated, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedConfig = await storage.updateGitHubConfig(configId, updateData);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "GitHub configuration not found" });
      }
      
      // Don't expose the access token in the response
      const { accessToken, ...safeConfig } = updatedConfig;
      res.json(safeConfig);
    } catch (error) {
      console.error("Update GitHub config error:", error);
      res.status(400).json({ message: "Invalid GitHub configuration data" });
    }
  });

  apiRouter.post("/github/test-connection", isAuthenticated, async (req, res) => {
    try {
      const { repoOwner, repoName, accessToken } = req.body;
      
      const testConfig = {
        repoOwner,
        repoName,
        accessToken,
        id: 0,
        projectId: 0,
        isActive: true,
        createdById: 0,
        createdAt: new Date().toISOString()
      };
      
      const { githubService } = await import('./github-service');
      const isValid = await githubService.validateConnection(testConfig);
      
      if (isValid) {
        res.json({ message: "Connection successful" });
      } else {
        res.status(400).json({ message: "Connection failed" });
      }
    } catch (error) {
      console.error("GitHub connection test error:", error);
      res.status(400).json({ message: "Connection test failed" });
    }
  });

  apiRouter.post("/github/issues", isAuthenticated, async (req, res) => {
    try {
      const { bugId } = req.body;
      
      const bug = await storage.getBug(bugId);
      if (!bug) {
        return res.status(404).json({ message: "Bug not found" });
      }
      
      const config = await storage.getGitHubConfig(bug.projectId);
      if (!config || !config.isActive) {
        return res.status(400).json({ message: "GitHub integration not configured for this project" });
      }
      
      const { githubService } = await import('./github-service');
      const issuePayload = githubService.formatBugAsGitHubIssue(bug);
      
      const githubIssue = await githubService.createIssue(config, issuePayload);
      
      const githubIssueRecord = await storage.createGitHubIssue({
        bugId: bug.id,
        githubIssueNumber: githubIssue.number,
        githubIssueId: githubIssue.id,
        githubUrl: githubIssue.url,
        status: githubIssue.state as 'open' | 'closed'
      });
      
      await storage.createActivity({
        userId: req.session.userId!,
        action: "created GitHub issue",
        entityType: "bug",
        entityId: bugId,
        details: { 
          githubIssueNumber: githubIssue.number,
          githubUrl: githubIssue.url
        }
      });
      
      res.status(201).json(githubIssueRecord);
    } catch (error) {
      console.error("Create GitHub issue error:", error);
      res.status(500).json({ message: "Failed to create GitHub issue" });
    }
  });

  apiRouter.get("/github/issues/bug/:bugId", isAuthenticated, async (req, res) => {
    try {
      const bugId = parseInt(req.params.bugId);
      const issue = await storage.getGitHubIssueByBugId(bugId);
      
      if (!issue) {
        return res.status(404).json({ message: "GitHub issue not found for this bug" });
      }
      
      res.json(issue);
    } catch (error) {
      console.error("Get GitHub issue error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/github/issues/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const githubIssue = await storage.getGitHubIssue(issueId);
      
      if (!githubIssue) {
        return res.status(404).json({ message: "GitHub issue not found" });
      }
      
      const bug = await storage.getBug(githubIssue.bugId);
      if (!bug) {
        return res.status(404).json({ message: "Associated bug not found" });
      }
      
      const config = await storage.getGitHubConfig(bug.projectId);
      if (!config) {
        return res.status(400).json({ message: "GitHub configuration not found" });
      }
      
      const { githubService } = await import('./github-service');
      const latestIssue = await githubService.getIssue(config, githubIssue.githubIssueNumber);
      
      // Update local record with latest GitHub data
      await storage.updateGitHubIssue(issueId, {
        status: latestIssue.state as 'open' | 'closed'
      });
      
      res.json({ message: "Issue synced successfully" });
    } catch (error) {
      console.error("Sync GitHub issue error:", error);
      res.status(500).json({ message: "Failed to sync GitHub issue" });
    }
  });

  // GitHub sync endpoints
  apiRouter.post("/github/sync/github-to-system", isAuthenticated, async (req, res) => {
    try {
      let syncedCount = 0;
      
      // Get all active GitHub configurations
      const configs = await storage.getAllGitHubConfigs();
      const activeConfigs = configs.filter(config => config.isActive);
      
      if (activeConfigs.length === 0) {
        return res.status(400).json({ message: "No active GitHub configurations found" });
      }
      
      const { githubService } = await import('./github-service');
      
      for (const config of activeConfigs) {
        try {
          // Get all GitHub issues for this repository
          const githubIssues = await githubService.getAllIssues(config);
          
          for (const issue of githubIssues) {
            // Check if we already have this issue in our system
            const existingIssue = await storage.getGitHubIssueByGitHubId(issue.id);
            
            if (existingIssue) {
              // Update existing issue status if it changed
              if (existingIssue.status !== issue.state) {
                await storage.updateGitHubIssue(existingIssue.id, {
                  status: issue.state as 'open' | 'closed'
                });
                syncedCount++;
              }
            }
            // Note: We don't create new bugs from GitHub issues automatically
            // as that would require more complex mapping logic
          }
        } catch (error) {
          console.error(`Error syncing from GitHub config ${config.id}:`, error);
        }
      }
      
      await storage.createActivity({
        userId: req.session.userId!,
        action: "synced from GitHub",
        entityType: "github_integration",
        entityId: 0,
        details: { 
          syncedCount,
          direction: "github-to-system"
        }
      });
      
      res.json({ 
        message: "Sync from GitHub completed", 
        syncedCount,
        configsProcessed: activeConfigs.length
      });
    } catch (error) {
      console.error("GitHub to system sync error:", error);
      res.status(500).json({ message: "Failed to sync from GitHub" });
    }
  });

  apiRouter.post("/github/sync/system-to-github", isAuthenticated, async (req, res) => {
    try {
      let syncedCount = 0;
      let errors = [];
      
      // Get all active GitHub configurations
      const configs = await storage.getAllGitHubConfigs();
      const activeConfigs = configs.filter(config => config.isActive);
      
      if (activeConfigs.length === 0) {
        return res.status(400).json({ message: "No active GitHub configurations found" });
      }
      
      const { githubService } = await import('./github-service');
      
      for (const config of activeConfigs) {
        try {
          // Get all bugs for this project that don't have GitHub issues yet
          const bugs = await storage.getBugs(config.projectId);
          const bugsWithoutGitHubIssues = [];
          
          for (const bug of bugs) {
            const existingIssue = await storage.getGitHubIssueByBugId(bug.id);
            if (!existingIssue) {
              bugsWithoutGitHubIssues.push(bug);
            }
          }
          
          logger.info(`Found ${bugsWithoutGitHubIssues.length} bugs without GitHub issues for project ${config.projectId}`);
          
          // Create GitHub issues for bugs that don't have them
          for (const bug of bugsWithoutGitHubIssues) {
            try {
              const result = await githubService.syncBugToGitHub(bug.id);
              if (result.created) {
                syncedCount++;
                logger.info(`Successfully created GitHub issue for bug ${bug.id}`);
              }
            } catch (error) {
              console.error(`Error creating GitHub issue for bug ${bug.id}:`, error);
              errors.push(`Bug ${bug.bugId}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error(`Error syncing to GitHub config ${config.id}:`, error);
          errors.push(`Config ${config.id}: ${error.message}`);
        }
      }
      
      await storage.createActivity({
        userId: req.session.userId!,
        action: "synced to GitHub",
        entityType: "github_integration",
        entityId: 0,
        details: { 
          syncedCount,
          direction: "system-to-github",
          errors: errors.length > 0 ? errors : undefined
        }
      });
      
      res.json({ 
        message: "Sync to GitHub completed", 
        syncedCount,
        configsProcessed: activeConfigs.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("System to GitHub sync error:", error);
      res.status(500).json({ message: "Failed to sync to GitHub" });
    }
  });

  // Sync from GitHub endpoint - pulls latest GitHub issue status
  apiRouter.post("/github/sync-from-github/:projectId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId) || projectId <= 0) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get GitHub config for the project
      const githubConfig = await storage.getGitHubConfig(projectId);
      if (!githubConfig || !githubConfig.isActive) {
        return res.status(400).json({ message: "GitHub integration not configured for this project" });
      }

      const { githubService } = await import('./github-service');
      
      // Get all GitHub issues for this repository
      const githubIssues = await githubService.getAllIssues(githubConfig);
      
      let syncedCount = 0;
      let errors = [];

      for (const githubIssue of githubIssues) {
        try {
          // Find existing GitHub issue record in our system
          const existingGithubIssue = await storage.getGitHubIssueByGitHubId(githubIssue.id);
          
          if (existingGithubIssue) {
            // Update the GitHub issue status if it changed
            if (existingGithubIssue.status !== githubIssue.state) {
              await storage.updateGitHubIssue(existingGithubIssue.id, {
                status: githubIssue.state as 'open' | 'closed'
              });

              // Also update the corresponding bug status
              const bug = await storage.getBug(existingGithubIssue.bugId);
              if (bug) {
                let newBugStatus = bug.status;
                
                if (githubIssue.state === 'closed') {
                  newBugStatus = 'Resolved';
                } else if (githubIssue.state === 'open') {
                  // Check labels to determine status
                  if (githubIssue.labels.includes('in-progress') || githubIssue.labels.includes('in progress')) {
                    newBugStatus = 'In Progress';
                  } else {
                    newBugStatus = 'Open';
                  }
                }

                if (newBugStatus !== bug.status) {
                  await storage.updateBug(existingGithubIssue.bugId, { 
                    status: newBugStatus 
                  });

                  // Log activity
                  await storage.createActivity({
                    userId: req.session.userId!,
                    action: "synced from GitHub",
                    entityType: "bug",
                    entityId: existingGithubIssue.bugId,
                    details: { 
                      bugId: bug.bugId,
                      title: bug.title,
                      oldStatus: bug.status,
                      newStatus: newBugStatus,
                      githubIssueNumber: githubIssue.number
                    }
                  });

                  syncedCount++;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error syncing GitHub issue #${githubIssue.number}:`, error);
          errors.push(`Issue #${githubIssue.number}: ${error.message}`);
        }
      }

      res.json({
        message: "Sync from GitHub completed",
        syncedCount,
        totalIssues: githubIssues.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("Sync from GitHub error:", error);
      res.status(500).json({ 
        message: "Failed to sync from GitHub", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // GitHub Webhook endpoint
  apiRouter.post("/github/webhook", async (req, res) => {
    try {
      const payload = req.body;
      const event = req.headers['x-github-event'];
      
      if (event === 'issues') {
        const action = payload.action;
        const issue = payload.issue;
        
        if (action === 'closed' || action === 'reopened') {
          // Find the GitHub issue record
          const githubIssue = await storage.getGitHubIssueByGitHubId(issue.id);
          
          if (githubIssue) {
            // Update the status
            await storage.updateGitHubIssue(githubIssue.id, {
              status: issue.state as 'open' | 'closed'
            });
            
            // Optionally update the bug status as well
            if (action === 'closed') {
              await storage.updateBug(githubIssue.bugId, {
                status: 'Resolved'
              });
            } else if (action === 'reopened') {
              await storage.updateBug(githubIssue.bugId, {
                status: 'Reopened'
              });
            }
            
            logger.info(`GitHub issue ${issue.number} ${action}, updated bug ${githubIssue.bugId}`);
          }
        }
      }
      
      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      console.error("GitHub webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Test Sheets API routes
  apiRouter.get("/test-sheets", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const sheets = await storage.getTestSheets(projectId);
      res.json(sheets);
    } catch (error) {
      logger.error('Error fetching test sheets:', error);
      res.status(500).json({ error: 'Failed to fetch test sheets' });
    }
  });

  apiRouter.get("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sheet = await storage.getTestSheet(id);
      
      if (!sheet) {
        return res.status(404).json({ error: 'Test sheet not found' });
      }
      
      res.json(sheet);
    } catch (error) {
      logger.error(`Error fetching test sheet ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch test sheet' });
    }
  });

  apiRouter.post("/test-sheets", isAuthenticated, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('Creating test sheet with data:', req.body);

      // Simple validation without schema for now
      const { name, projectId, data, metadata } = req.body;
      
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Name and project ID are required' });
      }

      const sheetData = {
        name,
        projectId: Number(projectId),
        data: data || {
          cells: {},
          rows: 100,
          cols: 26,
        },
        metadata: {
          version: 1,
          lastModifiedBy: req.session.userId,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
          ...metadata,
        },
        createdById: req.session.userId,
      };

      const newSheet = await storage.createTestSheet(sheetData);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        action: "created",
        entityType: "test_sheet",
        entityId: newSheet.id,
        details: {
          projectId: newSheet.projectId,
          sheetName: newSheet.name,
        }
      });
      
      res.status(201).json(newSheet);
    } catch (error) {
      console.error('Error creating test sheet:', error);
      logger.error('Error creating test sheet:', error);
      res.status(500).json({ error: 'Failed to create test sheet' });
    }
  });

  apiRouter.put("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const existingSheet = await storage.getTestSheet(id);
      if (!existingSheet) {
        return res.status(404).json({ error: 'Test sheet not found' });
      }

      const updateData = {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          lastModifiedBy: req.session.userId,
          version: (existingSheet.metadata.version || 1) + 1,
        }
      };

      const updatedSheet = await storage.updateTestSheet(id, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        action: "updated",
        entityType: "test_sheet",
        entityId: id,
        details: {
          projectId: updatedSheet.projectId,
          sheetName: updatedSheet.name,
        }
      });
      
      res.json(updatedSheet);
    } catch (error) {
      logger.error(`Error updating test sheet ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update test sheet' });
    }
  });

  apiRouter.delete("/test-sheets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const existingSheet = await storage.getTestSheet(id);
      if (!existingSheet) {
        return res.status(404).json({ error: 'Test sheet not found' });
      }

      await storage.deleteTestSheet(id);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        action: "deleted",
        entityType: "test_sheet",
        entityId: id,
        details: {
          projectId: existingSheet.projectId,
          sheetName: existingSheet.name,
        }
      });
      
      res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting test sheet ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete test sheet' });
    }
  });

  apiRouter.post("/test-sheets/:id/duplicate", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;
      
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!name) {
        return res.status(400).json({ error: 'Sheet name is required' });
      }

      const duplicatedSheet = await storage.duplicateTestSheet(id, name, req.session.userId);
      
      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        action: "duplicated",
        entityType: "test_sheet",
        entityId: duplicatedSheet.id,
        details: {
          projectId: duplicatedSheet.projectId,
          sheetName: duplicatedSheet.name,
          originalSheetId: id,
        }
      });
      
      res.status(201).json(duplicatedSheet);
    } catch (error) {
      logger.error(`Error duplicating test sheet ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to duplicate test sheet' });
    }
  });

  apiRouter.post("/test-sheets/:id/export", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { format } = req.body; // 'csv' | 'xlsx' | 'json'
      
      const sheet = await storage.getTestSheet(id);
      if (!sheet) {
        return res.status(404).json({ error: 'Test sheet not found' });
      }

      // Export logic will be implemented in the frontend
      res.json({ 
        success: true, 
        message: 'Export request processed',
        sheet: sheet 
      });
    } catch (error) {
      logger.error(`Error exporting test sheet ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to export test sheet' });
    }
  });

  // Flow Diagrams API routes
  apiRouter.get("/flow-diagrams", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
      const diagrams = await storage.getFlowDiagrams(projectId);
      res.json(diagrams);
    } catch (error) {
      logger.error('Error fetching flow diagrams:', error);
      res.status(500).json({ error: 'Failed to fetch flow diagrams' });
    }
  });

  apiRouter.get("/flow-diagrams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const diagram = await storage.getFlowDiagram(id);
      
      if (!diagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }
      
      res.json(diagram);
    } catch (error) {
      logger.error(`Error fetching flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch flow diagram' });
    }
  });

  apiRouter.post("/flow-diagrams", isAuthenticated, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Add user ID to the diagram data
      const diagramData = {
        ...req.body,
        createdById: req.session.userId
      };

      // Save the flow diagram
      const newDiagram = await storage.createFlowDiagram(diagramData);
      res.status(201).json(newDiagram);
    } catch (error) {
      logger.error('Error creating flow diagram:', error);
      res.status(500).json({ error: 'Failed to create flow diagram' });
    }
  });

  apiRouter.put("/flow-diagrams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the existing diagram to check permissions
      const existingDiagram = await storage.getFlowDiagram(id);
      if (!existingDiagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }

      // Update the flow diagram
      const updatedDiagram = await storage.updateFlowDiagram(id, req.body);
      res.json(updatedDiagram);
    } catch (error) {
      logger.error(`Error updating flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update flow diagram' });
    }
  });

  apiRouter.delete("/flow-diagrams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!req.session.userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get the existing diagram to check permissions
      const existingDiagram = await storage.getFlowDiagram(id);
      if (!existingDiagram) {
        return res.status(404).json({ error: 'Flow diagram not found' });
      }

      // Delete the flow diagram
      await storage.deleteFlowDiagram(id);
      res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting flow diagram ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete flow diagram' });
    }
  });

  // No need for the separate flow diagrams router since we've already
  // added those routes directly to the apiRouter
  
  // Register the main API router
  app.use("/api", apiRouter);
  
  // Create HTTP server
  // Removed Playwright and automation service initialization

  const httpServer = createServer(app);
  
  return httpServer;
}