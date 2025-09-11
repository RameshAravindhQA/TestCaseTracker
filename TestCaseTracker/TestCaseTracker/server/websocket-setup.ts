import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { chatService } from './chat-service';
import { logger } from './logger';

export function setupWebSocket(server: Server) {
  // Create WebSocket server on /ws path to avoid conflict with Vite's HMR
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws'
  });

  const connectedClients = new Map<any, { userId?: number, userName?: string }>();

  wss.on('connection', (ws, req) => {
    logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);
    
    // Initialize client data
    connectedClients.set(ws, {});

    // Set up ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, 30000); // Ping every 30 seconds

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const clientInfo = connectedClients.get(ws);

        switch (message.type) {
          case 'authenticate':
            // Store user information
            clientInfo!.userId = message.data.userId;
            clientInfo!.userName = message.data.userName;
            
            // Send authentication confirmation
            ws.send(JSON.stringify({
              type: 'authenticated',
              message: 'Successfully authenticated',
              onlineUsers: Array.from(connectedClients.values()).filter(c => c.userId).map(c => ({
                userId: c.userId,
                userName: c.userName
              }))
            }));
            
            logger.info(`User ${message.data.userName} (ID: ${message.data.userId}) authenticated`);
            
            // Broadcast user online status to others
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === client.OPEN) {
                client.send(JSON.stringify({
                  type: 'user_online',
                  userId: message.data.userId,
                  userName: message.data.userName
                }));
              }
            });
            break;

          case 'ping':
            // Respond to heartbeat
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          case 'send_message':
            if (clientInfo?.userId) {
              try {
                // Extract data from the message structure
                const messageData = message.data || message;
                const receiverId = messageData.receiverId;
                const messageText = messageData.message || message.message;
                
                if (!messageText) {
                  throw new Error('Missing message content');
                }

                // Create the chat message directly in storage
                const chatMessage = await storage.createChatMessage({
                  userId: clientInfo.userId,
                  userName: clientInfo.userName || 'Unknown User',
                  receiverId: receiverId,
                  message: messageText,
                  type: messageData.messageType || 'text'
                });

                // Broadcast to all connected clients
                wss.clients.forEach(client => {
                  if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({
                      type: 'new_message',
                      message: chatMessage
                    }));
                  }
                });
              } catch (error) {
                logger.error('Error sending message:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  error: 'Failed to send message'
                }));
              }
            }
            break;

          case 'typing':
            if (clientInfo?.userId && clientInfo?.userName) {
              // Broadcast typing indicator to other clients
              wss.clients.forEach(client => {
                if (client !== ws && client.readyState === client.OPEN) {
                  client.send(JSON.stringify({
                    type: 'user_typing',
                    userId: clientInfo.userId,
                    userName: clientInfo.userName,
                    isTyping: message.isTyping
                  }));
                }
              });
            }
            break;

          default:
            logger.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }));
        }
      }
    });

    ws.on('close', (code, reason) => {
      clearInterval(pingInterval);
      const clientInfo = connectedClients.get(ws);
      if (clientInfo?.userId) {
        logger.info(`User ${clientInfo.userName} (ID: ${clientInfo.userId}) disconnected`);
        
        // Broadcast user offline status to others
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
              type: 'user_offline',
              userId: clientInfo.userId,
              userName: clientInfo.userName
            }));
          }
        });
      }
      connectedClients.delete(ws);
      logger.info(`WebSocket connection closed: ${code} - ${reason}`);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      clearInterval(pingInterval);
      const clientInfo = connectedClients.get(ws);
      if (clientInfo?.userId) {
        // Broadcast user offline status to others
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
              type: 'user_offline',
              userId: clientInfo.userId,
              userName: clientInfo.userName
            }));
          }
        });
      }
      connectedClients.delete(ws);
    });

    ws.on('pong', () => {
      // Connection is alive
    });

    // Send welcome message
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Test Case Management System',
        timestamp: new Date().toISOString()
      }));
    }
  });

  wss.on('error', (error) => {
    logger.error('WebSocket Server error:', error);
  });

  // Clean up inactive connections
  setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.readyState !== ws.OPEN) {
        const clientInfo = connectedClients.get(ws);
        if (clientInfo) {
          connectedClients.delete(ws);
        }
      }
    });
  }, 60000); // Check every minute

  logger.info(`WebSocket server started on path /ws`);
  
  return wss;
}