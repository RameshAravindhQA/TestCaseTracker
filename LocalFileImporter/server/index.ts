import express from "express";
import { createServer } from "http";
import cors from "cors";
import session from "express-session";
import { logger } from "./logger";
import { initializeDatabase } from "../shared/matrix-fix";
import { EnhancedChatWebSocketServer } from './websocket';
import { storage } from './storage';
import { setupRoutes } from "./routes";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info("Database initialized successfully");

    // Create Express app
    const app = express();

    // Middleware
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Session configuration
    app.use(session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Serve static files
    app.use('/uploads', express.static('uploads'));
    app.use('/static', express.static('static'));

    // Setup API routes
    if (typeof setupRoutes === 'function') {
      setupRoutes(app);
    }

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket server
    const wsServer = new EnhancedChatWebSocketServer(server);
    logger.info("WebSocket server initialized");

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();