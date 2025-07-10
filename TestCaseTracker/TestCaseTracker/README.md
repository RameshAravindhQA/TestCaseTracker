# TestCaseTracker - Test Case Management System

A comprehensive web-based test case management system built with modern web technologies, featuring real-time collaboration, bug tracking, and traceability matrices.

## 🚀 Features

### Core Functionality
- **Project Management**: Create and manage multiple projects with team collaboration
- **Module Organization**: Organize test cases into logical modules within projects
- **Test Case Management**: Complete CRUD operations for test cases with detailed tracking
- **Bug Tracking**: Comprehensive bug reporting with GitHub integration
- **Traceability Matrix**: Visual module-to-module relationship mapping with custom markers
- **Real-time Chat**: WebSocket-based messaging system for team communication
- **Document Management**: Upload and organize project documentation
- **Time Tracking**: Timesheet management for team productivity
- **Kanban Board**: Agile project management interface
- **Reporting & Analytics**: Dashboard with metrics and export capabilities

### Advanced Features
- **GitHub Integration**: Create GitHub issues directly from bug reports
- **Screenshot & Screen Recording**: Built-in tools for bug reporting
- **CSV/PDF Export**: Export data in multiple formats
- **Onboarding Tutorials**: Interactive tutorials for new users
- **Role-based Access Control**: Admin, Manager, Developer, and Tester roles
- **Real-time Notifications**: Live updates for team activities
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode**: Full dark theme support

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components (Radix UI primitives)
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** in ES modules mode
- **JWT** authentication with session management
- **WebSocket** for real-time communication
- **Multer** for file uploads
- **Sharp** for image processing
- **Nodemailer** for email notifications

### Database
- **PostgreSQL** with Drizzle ORM
- **In-memory storage** fallback for development
- **Neon** serverless database adapter
- **Drizzle Kit** for migrations and schema management

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (optional - uses in-memory storage if not available)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TestCaseTracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration (Optional)
DATABASE_URL=postgresql://username:password@localhost:5432/testcasetracker

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Session Secret
SESSION_SECRET=your-session-secret-key-here

# Email Configuration (Optional)
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password

# GitHub Integration (Optional)
GITHUB_TOKEN=your-github-token
```

### 4. Database Setup (Optional)

#### Using PostgreSQL:
```bash
# Create database
createdb testcasetracker

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

#### Using In-memory Storage:
If you don't provide a `DATABASE_URL`, the application will automatically use in-memory storage, which is perfect for development and testing.

### 5. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔄 Switching from In-memory to Database Storage

### Step 1: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Step 2: Create Database
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb testcasetracker

# Create user (optional)
sudo -u postgres createuser --interactive testcasetracker
```

### Step 3: Configure Environment
Update your `.env` file with the database URL:
```env
DATABASE_URL=postgresql://testcasetracker:password@localhost:5432/testcasetracker
```

### Step 4: Initialize Database
```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### Step 5: Restart Application
```bash
npm run dev
```

The application will now use PostgreSQL for persistence.

## 📝 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

### Database Management
```bash
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:generate  # Generate migration files
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🎯 Getting Started

### First-time Setup

1. **Create an Account**: Register a new account or use the demo login
2. **Complete Onboarding**: Follow the interactive tutorial to learn the system
3. **Create a Project**: Start by creating your first project
4. **Add Modules**: Organize your project into logical modules
5. **Create Test Cases**: Begin adding test cases to your modules
6. **Invite Team Members**: Add collaborators to your project

### User Roles

- **Admin**: Full system access, user management, global settings
- **Manager**: Project management, team coordination, reporting
- **Developer**: Code-related tasks, bug fixing, test case creation
- **Tester**: Test execution, bug reporting, quality assurance

## 📊 Usage Examples

### Creating a Test Case
```javascript
// Test case structure
{
  id: "TC-001",
  title: "User Login Functionality",
  description: "Test user login with valid credentials",
  module: "Authentication",
  priority: "High",
  steps: [
    "Navigate to login page",
    "Enter valid credentials",
    "Click login button"
  ],
  expectedResult: "User should be successfully logged in",
  status: "Active"
}
```

### Reporting a Bug
```javascript
// Bug report structure
{
  id: "BUG-001",
  title: "Login button not responsive",
  description: "The login button doesn't respond when clicked",
  severity: "High",
  priority: "Critical",
  status: "Open",
  assignee: "developer@example.com",
  attachments: ["screenshot.png"],
  linkedTestCase: "TC-001"
}
```

### Creating Traceability Markers
```javascript
// Custom marker for traceability matrix
{
  id: "MARKER-001",
  label: "Dependencies",
  color: "#FF6B6B",
  type: "relationship",
  projectId: 1
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Input Validation**: Comprehensive data validation using Zod
- **CSRF Protection**: Cross-site request forgery protection
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **File Upload Security**: Secure file handling with type validation

## 🌐 API Documentation

### Authentication Endpoints
```
POST /api/auth/login     # User login
POST /api/auth/register  # User registration
POST /api/auth/logout    # User logout
GET  /api/auth/user      # Get current user
```

### Project Endpoints
```
GET    /api/projects           # Get all projects
POST   /api/projects           # Create project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
```

### Test Case Endpoints
```
GET    /api/projects/:id/test-cases    # Get test cases
POST   /api/projects/:id/test-cases    # Create test case
PUT    /api/test-cases/:id             # Update test case
DELETE /api/test-cases/:id             # Delete test case
```

### Bug Report Endpoints
```
GET    /api/projects/:id/bugs          # Get bug reports
POST   /api/projects/:id/bugs          # Create bug report
PUT    /api/bugs/:id                   # Update bug
DELETE /api/bugs/:id                   # Delete bug
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new features
- Update documentation as needed
- Ensure code passes linting and type checks

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l

# Test connection
psql -U testcasetracker -d testcasetracker -h localhost
```

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### WebSocket Connection Issues
- Ensure no firewall blocking port 5000
- Check if running behind a proxy
- Verify WebSocket support in browser

#### File Upload Issues
- Check `uploads/` directory permissions
- Verify disk space available
- Ensure file size within limits

### Performance Optimization

#### Database Performance
```bash
# Analyze query performance
npm run db:studio

# Create indexes for frequently queried columns
# Update schema.ts with appropriate indexes
```

#### Frontend Performance
```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize images
# Use WebP format for better compression
```

## 📈 Deployment

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-db:5432/testcasetracker
JWT_SECRET=production-jwt-secret
SESSION_SECRET=production-session-secret
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful UI components
- **Drizzle ORM** for type-safe database operations
- **TanStack Query** for excellent data fetching
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible components

## 📞 Support

For support, email support@testcasetracker.com or join our Slack channel.

---

Made with ❤️ by the TestCaseTracker Team