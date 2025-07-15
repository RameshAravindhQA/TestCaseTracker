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

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const clientInfo = connectedClients.get(ws);

        switch (message.type) {
          case 'authenticate':
            // Store user information
            clientInfo!.userId = message.data.userId;
            clientInfo!.userName = message.data.userName;
            
            // Add user to chat service
            chatService.addUserSocket(message.data.userId, ws);
            
            // Send authentication confirmation
            ws.send(JSON.stringify({
              type: 'authenticated',
              message: 'Successfully authenticated',
              onlineUsers: [] // TODO: Get actual online users
            }));
            
            logger.info(`User ${message.data.userName} (ID: ${message.data.userId}) authenticated`);
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
                const conversationId = messageData.conversationId || message.conversationId;
                const messageText = messageData.message || message.message;
                
                if (!conversationId || !messageText) {
                  throw new Error('Missing conversationId or message content');
                }

                // Create the chat message directly in storage
                const chatMessage = await chatService.createChatMessage({
                  conversationId: conversationId,
                  userId: clientInfo.userId,
                  userName: clientInfo.userName || 'Unknown User',
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
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format'
        }));
      }
    });

    ws.on('close', (code, reason) => {
      const clientInfo = connectedClients.get(ws);
      if (clientInfo?.userId) {
        chatService.removeUserSocket(clientInfo.userId, ws);
        logger.info(`User ${clientInfo.userName} (ID: ${clientInfo.userId}) disconnected`);
      }
      connectedClients.delete(ws);
      logger.info(`WebSocket connection closed: ${code} - ${reason}`);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      const clientInfo = connectedClients.get(ws);
      if (clientInfo?.userId) {
        chatService.removeUserSocket(clientInfo.userId, ws);
      }
      connectedClients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Test Case Management System'
    }));
  });

  wss.on('error', (error) => {
    logger.error('WebSocket Server error:', error);
  });

  logger.info(`WebSocket server started on path /ws`);
  
  return wss;
}