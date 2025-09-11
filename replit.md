# TestCaseTracker

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, team collaboration, real-time communication, AI-powered test generation, and functional flow design. The system includes advanced features like traceability matrices, test automation with Playwright, document management, sprint planning with Kanban boards, and integrated GitHub issue reporting.

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
- **Animations**: Framer Motion for smooth UI interactions

#### Backend Architecture
- **API Design**: RESTful API with Express.js using TypeScript
- **Authentication**: JWT-based authentication with role-based access control (Admin, Manager, Developer, Tester)
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
  - Automation scripts and execution results
  - BRD documents with version control
- **Migration System**: Drizzle Kit for database migrations and schema management

#### AI Integration
- **Multi-Provider Support**: Google Gemini, OpenAI, Claude, Grok, DeepSeek, HuggingFace, Cohere, Mistral, GitHub Copilot
- **Test Case Generation**: AI-powered test case generation from text, URLs, or images
- **Configurable API Keys**: Runtime configuration of AI provider credentials
- **Mock Fallback**: Graceful degradation to mock service when AI providers are unavailable

#### Test Automation
- **Playwright Integration**: Browser automation and test recording capabilities
- **Multi-Browser Support**: Chrome, Firefox, Edge support
- **Test Execution**: Automated test runs with results tracking
- **Recording Sessions**: Live test recording with session management

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Email Service**: Gmail SMTP via Nodemailer for notifications
- **File Storage**: Local file system with Multer for uploads

### AI Services
- **Google Gemini**: Primary AI provider for test case generation
- **OpenAI**: Alternative AI provider with GPT models
- **Claude**: Anthropic's AI service integration
- **Multiple Providers**: Support for Grok, DeepSeek, HuggingFace, Cohere, Mistral, GitHub Copilot

### Development Tools
- **Playwright**: Browser automation and testing framework
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast build tool with HMR for development

### Third-Party Integrations
- **GitHub API**: Issue creation and repository integration via Octokit
- **OAuth Providers**: Google and GitHub authentication support
- **Replit Environment**: Optimized for Replit deployment with runtime error overlay

### UI/UX Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Flow**: Flow diagram creation and editing
- **Recharts**: Data visualization and charts
- **Mermaid**: Diagram generation support