# TestCaseTracker - Replit.md

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, and team collaboration. The application features AI-powered test case generation, real-time messaging, GitHub integration, traceability matrix management, and automated testing capabilities. It supports both in-memory storage for development and PostgreSQL for production deployments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
- **Frontend**: React 18+ with TypeScript using Vite as the build tool
- **Backend**: Express.js with TypeScript in ES modules
- **Database**: Dual storage strategy - in-memory storage with optional PostgreSQL support via Drizzle ORM
- **Real-time Communication**: WebSocket integration for chat and collaboration
- **UI Framework**: Tailwind CSS with Radix UI components (shadcn/ui)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

### Key Architectural Decisions

#### Frontend Architecture
- **Component Structure**: Modular React components organized by feature domains
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Data Visualization**: Recharts for analytics dashboards and reporting
- **Animations**: Framer Motion for smooth UI interactions and transitions

#### Backend Architecture
- **API Design**: RESTful API with Express.js following resource-based URL patterns
- **Authentication**: JWT-based authentication with role-based access control (Admin, Manager, Developer, Tester)
- **File Handling**: Multer for file uploads with Sharp for image processing and optimization
- **WebSocket**: Dedicated WebSocket server for real-time features (chat, notifications, live updates)
- **Middleware**: Custom authentication, error handling, and logging middleware

#### Database Layer
- **Primary Storage**: In-memory storage system for rapid development and testing
- **Production Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Migration Strategy**: Automatic fallback from PostgreSQL to in-memory storage if database is unavailable
- **Schema Management**: Drizzle Kit for database migrations and schema evolution

#### AI Integration Layer
- **Multi-Provider Support**: Google Gemini (primary), OpenAI, Claude, and other AI providers
- **Fallback Strategy**: Mock test case generation when AI services are unavailable
- **Input Methods**: Text prompts, URL analysis, image uploads, and element inspection
- **Configuration Management**: Runtime API key configuration with secure storage

#### Real-time Features
- **WebSocket Architecture**: Separate WebSocket server on dedicated path (/ws) to avoid conflicts
- **Chat System**: Project-based messaging with typing indicators and user presence
- **Live Updates**: Real-time notifications for test case updates, bug reports, and project changes
- **Session Management**: WebSocket session persistence with automatic reconnection

#### File Management
- **Upload Strategy**: Local file storage with organized directory structure
- **File Types**: Profile pictures, documents, bug attachments, and test artifacts
- **Processing**: Server-side image optimization and validation
- **Organization**: Categorized storage by file type and project association

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+, React DOM, React Hook Form, React Query
- **Backend Framework**: Express.js with TypeScript support
- **Build Tools**: Vite for frontend bundling, tsx for TypeScript execution
- **Database**: Drizzle ORM with PostgreSQL adapter, Neon serverless connector

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom configuration and shadcn/ui components
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization and analytics

### AI and Integration Services
- **AI Providers**: Google Generative AI SDK, OpenAI API client
- **GitHub Integration**: Octokit REST client for repository management
- **Email Service**: Nodemailer for notification emails
- **File Processing**: Multer, Sharp for image handling

### Development and Testing
- **Testing**: Vitest for unit and integration testing, Playwright for E2E automation
- **Code Quality**: ESLint, TypeScript compiler for type checking
- **Development**: Concurrently for running multiple processes, dotenv for configuration

### Real-time and Communication
- **WebSocket**: ws library for WebSocket server implementation
- **Session Management**: Express session with memory store
- **Security**: JWT for authentication, bcryptjs for password hashing, helmet for security headers

### Utilities and Helpers
- **Date Management**: date-fns for date manipulation
- **Validation**: Zod for schema validation and type inference
- **UUID Generation**: nanoid for unique identifier generation
- **CSV Processing**: PapaParse for import/export functionality