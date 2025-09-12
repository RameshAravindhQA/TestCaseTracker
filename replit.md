# TestCaseTracker - Replit.md

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and real-time communication. The system features AI-powered test case generation, automation testing capabilities, document management, traceability matrices, and integrated workflow tools for quality assurance teams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
- **Frontend**: React 18+ with TypeScript using Vite as the build tool
- **Backend**: Express.js with TypeScript in ES modules  
- **Database**: Flexible storage layer with in-memory fallback and PostgreSQL support via Drizzle ORM
- **Real-time Communication**: WebSocket integration for chat and collaboration
- **UI Framework**: Tailwind CSS with shadcn/ui components (Radix UI primitives)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

### Key Components

#### Frontend Architecture
- **Component Structure**: Modular React components with TypeScript
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Form Handling**: React Hook Form with Zod validation (@hookform/resolvers)
- **Charts**: Recharts for data visualization and reporting
- **UI Components**: shadcn/ui component library with consistent design patterns
- **Build Tool**: Vite with optimized bundling and hot module replacement

#### Backend Architecture
- **API Design**: RESTful API with Express.js using TypeScript
- **Authentication**: JWT-based authentication with role-based access control
- **File Handling**: Multer for file uploads with Sharp for image processing
- **Email Service**: Nodemailer integration for notifications and user management
- **WebSocket**: Real-time chat and collaboration features on `/ws` path
- **Error Handling**: Comprehensive error handling with logging service

#### Storage Layer
- **Primary Storage**: In-memory storage system for development and testing
- **Database Integration**: Optional PostgreSQL with Drizzle ORM using Neon serverless
- **Schema**: Comprehensive database schema supporting:
  - Users, Projects, and Project Members
  - Modules, Test Cases, and Bug tracking
  - Time sheets and Customer management
  - Sprint planning and Kanban boards
  - Traceability matrices and Custom markers
  - Document management and Chat messages
- **Migration System**: Drizzle Kit for database migrations and schema management

### AI Integration
- **Multi-Provider Support**: Google Gemini, OpenAI, Claude, and other AI providers
- **Test Case Generation**: Automated test case creation from requirements, URLs, or images
- **Configuration Management**: Secure API key storage with validation
- **Fallback System**: Mock AI service when API keys are not configured

### Automation Features
- **Playwright Integration**: Browser automation and test recording
- **Selenium WebDriver**: Alternative automation framework support
- **Test Execution**: Automated test script execution and reporting
- **Recording Sessions**: Live test recording and playback capabilities

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL for production data storage
- **Drizzle ORM**: Type-safe database operations and migrations

### AI Services
- **Google Gemini API**: Primary AI provider for test case generation
- **OpenAI API**: Alternative AI provider support
- **Claude API**: Anthropic's AI service integration
- **Multiple AI Providers**: Support for Grok, DeepSeek, Hugging Face, Cohere, and Mistral

### Authentication & Security
- **JSON Web Tokens**: Secure user authentication
- **bcrypt**: Password hashing and validation
- **CORS**: Cross-origin resource sharing configuration

### File Processing
- **Multer**: File upload handling
- **Sharp**: Image processing and optimization
- **Archiver**: Archive creation for exports
- **JSZip**: Client-side archive handling

### Communication
- **Nodemailer**: Email notifications and user communication
- **WebSocket**: Real-time messaging and collaboration
- **GitHub API**: Issue reporting via Octokit

### Testing & Automation
- **Playwright**: Browser automation and testing
- **Puppeteer**: Alternative browser automation
- **Vitest**: Unit and integration testing framework

### Visualization & Export
- **Recharts**: Data visualization and charts
- **Mermaid**: Flow diagram generation
- **jsPDF**: PDF export functionality
- **html2canvas**: Screenshot capture
- **ReactFlow**: Interactive flow diagrams

### Development Tools
- **TypeScript**: Type safety and development experience
- **Vite**: Fast development server and build tool
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first styling framework