import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/dist'));

// Simple test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test Case Tracker API is running' });
});

// Basic frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test Case Tracker running on http://0.0.0.0:${PORT}`);
  console.log('Preview should be available in Replit');
});