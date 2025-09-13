import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteDevServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteDevServer({
    server: { 
      middlewareMode: true,
      hmr: { port: 24678 }
    },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Ensure proper handling of client routes
  app.get('*', async (req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/uploads') || 
        req.path.includes('.')) {
      return next();
    }

    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(url, `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>TestCase Tracker - Test Case Management System</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (error: any) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist/public");
  const clientDistPath = path.resolve("client/dist");

  // Check multiple possible build locations
  let staticPath = distPath;
  if (!fs.existsSync(distPath) && fs.existsSync(clientDistPath)) {
    staticPath = clientDistPath;
  }

  if (!fs.existsSync(staticPath)) {
    console.warn(`Build directory not found at ${distPath} or ${clientDistPath}. Serving from client/public instead.`);
    staticPath = path.resolve("client/public");
  }

  app.use(express.static(staticPath));

  // Serve index.html for all non-API routes
  app.get("*", (req, res) => {
    // Skip API routes and file requests
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/uploads') || 
        req.path.includes('.')) {
      return res.status(404).send('Not found');
    }

    const indexPath = path.resolve(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback HTML if index.html doesn't exist
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>TestCase Tracker - Test Case Management System</title>
          </head>
          <body>
            <div id="root"></div>
            <script>
              document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>TestCase Tracker</h1><p>Application is starting...</p><p><a href="/login">Go to Login</a></p></div>';
            </script>
          </body>
        </html>
      `);
    }
  });
}