import { Router } from 'express';
import { storage } from './storage';
import { logger } from './logger';

const router = Router();

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await storage.authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/auth/me', isAuthenticated, (req, res) => {
  res.json({ user: req.session.user });
});

// User routes
router.get('/users', isAuthenticated, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Conversation routes
router.get('/conversations', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const conversations = await storage.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/conversations', isAuthenticated, async (req, res) => {
  try {
    const { participantIds, type = 'direct' } = req.body;
    const userId = req.session.user.id;

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Participant IDs are required' });
    }

    // For direct conversations, check if it already exists
    if (type === 'direct' && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      const existingConversation = await storage.getDirectConversation(userId, otherUserId);

      if (existingConversation) {
        return res.json(existingConversation);
      }
    }

    const participants = [userId, ...participantIds];
    const conversation = await storage.createDirectConversation({
      type,
      participants,
      createdBy: userId
    });

    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const messages = await storage.getConversationMessages(conversationId);
    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversations/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message, type = 'text' } = req.body;
    const userId = req.session.user.id;
    const userName = req.session.user.name;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const newMessage = await storage.createMessage({
      conversationId,
      senderId: userId,
      senderName: userName,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Test Sheets routes
router.get('/test-sheets', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.query;
    const sheets = await storage.getProjectTestSheets(projectId ? parseInt(projectId as string) : undefined);
    res.json(sheets);
  } catch (error) {
    logger.error('Get test sheets error:', error);
    res.status(500).json({ error: 'Failed to fetch test sheets' });
  }
});

router.post('/test-sheets', isAuthenticated, async (req, res) => {
  try {
    const { name, projectId, type, content = '' } = req.body;
    const userId = req.session.user.id;

    if (!name || !projectId || !type) {
      return res.status(400).json({ error: 'Name, project ID, and type are required' });
    }

    const testSheet = await storage.createTestSheet({
      name,
      projectId: parseInt(projectId),
      type,
      content,
      createdBy: userId
    });

    res.status(201).json(testSheet);
  } catch (error) {
    logger.error('Create test sheet error:', error);
    res.status(500).json({ error: 'Failed to create test sheet' });
  }
});

router.get('/test-sheets/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const testSheet = await storage.getTestSheet(id);

    if (!testSheet) {
      return res.status(404).json({ error: 'Test sheet not found' });
    }

    res.json(testSheet);
  } catch (error) {
    logger.error('Get test sheet error:', error);
    res.status(500).json({ error: 'Failed to fetch test sheet' });
  }
});

router.put('/test-sheets/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, content, type } = req.body;
    const userId = req.session.user.id;

    const updatedSheet = await storage.updateTestSheet(id, {
      name,
      content,
      type,
      updatedBy: userId
    });

    if (!updatedSheet) {
      return res.status(404).json({ error: 'Test sheet not found' });
    }

    res.json(updatedSheet);
  } catch (error) {
    logger.error('Update test sheet error:', error);
    res.status(500).json({ error: 'Failed to update test sheet' });
  }
});

router.delete('/test-sheets/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteTestSheet(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Test sheet not found' });
    }

    res.json({ message: 'Test sheet deleted successfully' });
  } catch (error) {
    logger.error('Delete test sheet error:', error);
    res.status(500).json({ error: 'Failed to delete test sheet' });
  }
});

// Chat routes for messaging functionality
router.get('/chats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const conversations = await storage.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    logger.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/chats/direct', isAuthenticated, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.session.user.id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Check if conversation already exists
    const existingConversation = await storage.getDirectConversation(userId, targetUserId);

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new direct conversation
    const conversation = await storage.createDirectConversation({
      type: 'direct',
      participants: [userId, targetUserId],
      createdBy: userId
    });

    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Create direct chat error:', error);
    res.status(500).json({ error: 'Failed to create direct conversation' });
  }
});

router.get('/chats/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const messages = await storage.getConversationMessages(conversationId);
    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/chats/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message, type = 'text' } = req.body;
    const userId = req.session.user.id;
    const userName = req.session.user.name;

    console.log('[API] Sending message to conversation:', conversationId, 'by user:', userId);

    if (!message || !message.trim()) {
      console.warn('[API] Empty message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if conversation exists
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      console.error('[API] Conversation not found:', conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const newMessage = await storage.createMessage({
      conversationId,
      senderId: userId,
      senderName: userName,
      message: message.trim(),
      type,
      timestamp: new Date().toISOString()
    });

    console.log('[API] Message created successfully:', newMessage.id);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('[API] Send message error details:', error);
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Users routes for getting available users to chat with
router.get('/users/public', isAuthenticated, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    // Remove password from response and current user
    const currentUserId = req.session.user.id;
    const safeUsers = users
      .filter(user => user.id !== currentUserId)
      .map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    logger.error('Get public users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Project routes for test sheets
router.get('/projects', isAuthenticated, async (req, res) => {
  try {
    // For now, return sample projects since we don't have a project storage system
    const sampleProjects = [
      { id: 1, name: 'Sample Project 1', status: 'active' },
      { id: 2, name: 'Sample Project 2', status: 'active' },
      { id: 3, name: 'Sample Project 3', status: 'active' }
    ];
    res.json(sampleProjects);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// OnlyOffice document routes
router.get('/onlyoffice/documents', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.query;
    const testSheets = await storage.getProjectTestSheets(projectId ? parseInt(projectId as string) : undefined);

    // Transform test sheets to OnlyOffice document format
    const documents = testSheets.map(sheet => ({
      id: sheet.id.toString(),
      title: sheet.name,
      type: sheet.type,
      projectId: sheet.projectId,
      createdAt: sheet.createdAt,
      createdBy: sheet.createdBy.toString(),
      lastModified: sheet.updatedAt,
      fileType: sheet.type === 'text' ? 'docx' : sheet.type === 'spreadsheet' ? 'xlsx' : 'pptx',
      key: `doc_${sheet.id}_${Date.now()}`,
      url: `/api/onlyoffice/documents/${sheet.id}/content`
    }));

    res.json(documents);
  } catch (error) {
    logger.error('Get OnlyOffice documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/onlyoffice/documents', isAuthenticated, async (req, res) => {
  try {
    const { title, type, projectId, description } = req.body;
    const userId = req.session.user.id;

    if (!title || !type || !projectId) {
      return res.status(400).json({ error: 'Title, type, and project ID are required' });
    }

    const testSheet = await storage.createTestSheet({
      name: title,
      projectId: parseInt(projectId),
      type,
      content: description || '',
      createdBy: userId
    });

    // Transform to OnlyOffice document format
    const document = {
      id: testSheet.id.toString(),
      title: testSheet.name,
      type: testSheet.type,
      projectId: testSheet.projectId,
      createdAt: testSheet.createdAt,
      createdBy: testSheet.createdBy.toString(),
      lastModified: testSheet.updatedAt,
      fileType: testSheet.type === 'text' ? 'docx' : testSheet.type === 'spreadsheet' ? 'xlsx' : 'pptx',
      key: `doc_${testSheet.id}_${Date.now()}`,
      url: `/api/onlyoffice/documents/${testSheet.id}/content`
    };

    res.status(201).json(document);
  } catch (error) {
    logger.error('Create OnlyOffice document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// OnlyOffice document content endpoint
router.get('/onlyoffice/documents/:id/content', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const testSheet = await storage.getTestSheet(documentId);

    if (!testSheet) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Return document content in proper format for OnlyOffice
    const documentContent = {
      documentType: testSheet.type,
      key: `doc_${testSheet.id}_${Date.now()}`,
      title: testSheet.name,
      url: `${req.protocol}://${req.get('host')}/api/onlyoffice/documents/${testSheet.id}/download`,
      fileType: testSheet.type === 'text' ? 'docx' : testSheet.type === 'spreadsheet' ? 'xlsx' : 'pptx',
      content: testSheet.content || '',
      permissions: {
        edit: true,
        download: true,
        print: true
      }
    };

    res.json(documentContent);
  } catch (error) {
    logger.error('Get OnlyOffice document content error:', error);
    res.status(500).json({ error: 'Failed to get document content' });
  }
});

// OnlyOffice document download endpoint
router.get('/onlyoffice/documents/:id/download', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const testSheet = await storage.getTestSheet(documentId);

    if (!testSheet) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Create a simple document content based on type
    let content = '';
    let contentType = '';
    let filename = '';

    if (testSheet.type === 'text') {
      content = `${testSheet.name}\n\n${testSheet.content || 'This is a new text document created in TestCaseTracker.'}`;
      contentType = 'text/plain';
      filename = `${testSheet.name}.txt`;
    } else if (testSheet.type === 'spreadsheet') {
      content = `${testSheet.name}\n${testSheet.content || 'A1,B1,C1\nA2,B2,C2\nA3,B3,C3'}`;
      contentType = 'text/csv';
      filename = `${testSheet.name}.csv`;
    } else {
      content = `${testSheet.name}\n\n${testSheet.content || 'This is a new presentation created in TestCaseTracker.'}`;
      contentType = 'text/plain';
      filename = `${testSheet.name}.txt`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    logger.error('Download OnlyOffice document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// OnlyOffice document editor endpoint
router.get('/onlyoffice/editor/:id', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const testSheet = await storage.getTestSheet(documentId);

    if (!testSheet) {
      return res.status(404).send('<h1>Document not found</h1>');
    }

    // Create OnlyOffice editor HTML
    const editorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>OnlyOffice Editor - ${testSheet.name}</title>
    <script type="text/javascript" src="https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js"></script>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #editor { width: 100%; height: 100vh; }
        .header { background: #f0f0f0; padding: 10px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h3>OnlyOffice Document Editor</h3>
        <p>Document: <strong>${testSheet.name}</strong></p>
        <p>Type: <strong>${testSheet.type}</strong></p>
    </div>
    <div id="editor"></div>

    <script type="text/javascript">
        // OnlyOffice Document Server integration
        const config = {
            "documentType": "${testSheet.type === 'text' ? 'text' : testSheet.type === 'spreadsheet' ? 'spreadsheet' : 'presentation'}",
            "document": {
                "fileType": "${testSheet.type === 'text' ? 'docx' : testSheet.type === 'spreadsheet' ? 'xlsx' : 'pptx'}",
                "key": "doc_${testSheet.id}_${Date.now()}",
                "title": "${testSheet.name}",
                "url": "${req.protocol}://${req.get('host')}/api/onlyoffice/documents/${testSheet.id}/download"
            },
            "editorConfig": {
                "mode": "edit",
                "callbackUrl": "${req.protocol}://${req.get('host')}/api/onlyoffice/documents/${testSheet.id}/callback"
            },
            "width": "100%",
            "height": "100%"
        };

        // Initialize OnlyOffice editor
        try {
            new DocsAPI.DocEditor("editor", config);
        } catch (error) {
            console.error('OnlyOffice initialization error:', error);
            document.getElementById('editor').innerHTML = \`
                <div style="padding: 20px; text-align: center;">
                    <h2>OnlyOffice Document Editor</h2>
                    <p>Document: <strong>${testSheet.name}</strong></p>
                    <p>Type: <strong>${testSheet.type}</strong></p>
                    <br>
                    <p>OnlyOffice Document Server integration is ready.</p>
                    <p style="color: #666;">Configure your OnlyOffice Document Server URL to enable full editing capabilities.</p>
                    <br>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; max-width: 500px; margin: 0 auto;">
                        <h4>Document Content:</h4>
                        <textarea style="width: 100%; height: 200px; padding: 10px;" readonly>${testSheet.content || 'No content yet...'}</textarea>
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>`;

    res.send(editorHtml);
  } catch (error) {
    logger.error('OnlyOffice editor error:', error);
    res.status(500).send('<h1>Error loading editor</h1>');
  }
});

// OnlyOffice document callback endpoint
router.post('/onlyoffice/documents/:id/callback', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const { status, url } = req.body;

    // Handle OnlyOffice callback based on status
    // Status 2 means document is being edited
    // Status 3 means document save error
    // Status 4 means document is closed with changes
    // Status 6 means document is being edited, but current user is not editing
    // Status 7 means error has occurred while force saving the document

    if (status === 4 && url) {
      // Document was saved, we could download and update content here
      logger.info(`Document ${documentId} was saved with URL: ${url}`);
    }

    res.json({ error: 0 });
  } catch (error) {
    logger.error('OnlyOffice callback error:', error);
    res.json({ error: 1 });
  }
});

export function setupRoutes(app: any) {
  app.use('/api', router);
}