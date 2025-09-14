import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { logger } from "./logger";
import { initializeDatabase } from "./init-db";
import { storage } from "./db-storage";
import { testConnection } from "./db";


const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    console.log("🚀 Starting Test Case Management System...");
    const app = express();

    // Basic middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(cors());

    // Add error handling for malformed JSON
    app.use((error: any, req: any, res: any, next: any) => {
      if (error instanceof SyntaxError && 'body' in error) {
        console.error('JSON parsing error:', error.message);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
      next(error);
    });

    // Basic request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }

          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }

          log(logLine);
        }
      });

      next();
    });

    // CRITICAL: Register API routes BEFORE any static file serving
    console.log("📡 Registering API routes...");
    const httpServer = await registerRoutes(app);
    console.log("✅ API routes registered successfully");

    // Static file serving - MUST come after API routes
    app.use(express.static(path.join(import.meta.dirname, '../client/dist')));

    // Add middleware to protect API routes from being caught by static file serving
    app.use('/api/*', (req, res, next) => {
      console.log(`🚨 API route not found: ${req.method} ${req.path}`);
      res.status(404).json({
        success: false,
        error: `API endpoint not found: ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      });
    });

    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.log("⚠️  Database connection failed, using in-memory storage");
    } else {
      console.log("✅ Database connection established");

      // Initialize database with default data
      try {
        await initializeDatabase();
      } catch (error) {
        console.error("❌ Failed to initialize database:", error);
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup WebSocket server with session store
    let chatWsServer;
    try {
      const { ChatWebSocketServer } = await import('./websocket.js');
      const sessionStore = app.locals.sessionStore;

      if (!sessionStore) {
        logger.error('Session store not available for WebSocket server');
        throw new Error('Session store required for WebSocket authentication');
      }

      chatWsServer = new ChatWebSocketServer(httpServer, sessionStore);
      logger.info('Chat WebSocket server initialized with session store');

      // Store reference for user registration notifications
      app.locals.chatWsServer = chatWsServer;
    } catch (error: any) {
      logger.warn('ChatWebSocketServer not available:', error.message);
    }

    // Add small delay before setting up Vite to ensure WebSocket is properly initialized
    await new Promise(resolve => setTimeout(resolve, 100));

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    // Start the server on the specified port
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`WebSocket server initialized for real-time chat`);
      logger.info(`Server started on port ${PORT} with WebSocket support`);
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    logger.error("Server startup failed:", error);
    process.exit(1);
  }
}

(async () => {
  await startServer();
})();