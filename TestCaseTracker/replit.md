# TestCaseTracker - Replit.md

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and includes advanced features like AI-powered test case generation, functional flow designer, real-time chat, test automation integration, and GitHub issue tracking.

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

#### AI Integration Layer
- **Multi-Provider Support**: Google Gemini, OpenAI, Claude, and other AI providers
- **Test Case Generation**: Automated test case creation from requirements, URLs, or images
- **Dynamic Configuration**: Runtime API key configuration through admin interface
- **Fallback System**: Mock service when AI providers are unavailable

#### Automation Layer
- **Playwright Integration**: Browser automation for test recording and execution
- **Test Recording**: Visual test case recording with browser instrumentation
- **Execution Engine**: Automated test execution with detailed reporting
- **Environment Management**: Multiple test environment configurations

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless (optional, with in-memory fallback)
- **File Storage**: Local file system with multer for uploads
- **Email Service**: Nodemailer with Gmail integration
- **Build System**: Vite for frontend bundling and development server

### AI Services
- **Google Gemini**: Primary AI provider for test case generation
- **OpenAI**: Alternative AI provider with GPT models
- **Multiple Providers**: Support for Claude, Grok, DeepSeek, Hugging Face, Cohere, Mistral

### External Integrations
- **GitHub**: Issue tracking and repository integration via Octokit
- **Playwright**: Browser automation and test execution
- **WebSocket**: Real-time collaboration features
- **JWT**: Token-based authentication system

### UI and Visualization
- **Radix UI**: Component primitives for consistent design
- **React Flow**: Interactive flow diagrams and functional flows
- **Mermaid**: Diagram generation for test case visualization
- **Recharts**: Data visualization and reporting charts
- **Framer Motion**: UI animations and transitions