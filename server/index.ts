import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { logger } from "./logger";
import { initializeDatabase } from "./matrix-fix";
import { registerRoutes } from "./routes";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
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

    app.use(express.static(path.join(import.meta.dirname, '../client/dist')));

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

    const httpServer = await registerRoutes(app);

    // Initialize database with retry logic
    let dbInitialized = false;
    let retries = 3;
    while (!dbInitialized && retries > 0) {
      try {
        await initializeDatabase();
        dbInitialized = true;
        console.log("✅ Database initialized successfully");
      } catch (error) {
        console.log(`❌ Database initialization failed, retries left: ${retries - 1}`);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Initialize WebSocket server
    const { setupWebSocket } = await import("./websocket");
    const io = setupWebSocket(httpServer);
    (global as any).socketIO = io;

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