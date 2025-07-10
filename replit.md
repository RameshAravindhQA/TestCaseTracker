# TestCaseTracker - Test Case Management System

## Overview

TestCaseTracker is a comprehensive test case management system built with modern web technologies. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and traceability matrices with real-time communication features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
- **Frontend**: React 18+ with TypeScript, built using Vite
- **Backend**: Express.js with TypeScript running in ES modules mode
- **Database**: Dual storage system - in-memory for development, PostgreSQL with Drizzle ORM for production
- **Real-time Features**: WebSocket integration for chat and live collaboration
- **UI Framework**: Tailwind CSS with shadcn/ui components (Radix UI primitives)
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: Wouter for lightweight client-side routing

### Project Structure (Updated July 2025)
The project has been reorganized into a clean, structured folder hierarchy:
- **organized_testcase_tracker/**: Main project directory with organized structure
- **docs/**: All documentation files consolidated
- **config/**: Configuration files (TypeScript, Vite, Tailwind, etc.)
- **scripts/**: Build and deployment scripts
- **assets/**: Project assets including attached files and static content
- **client/**: React frontend application
- **server/**: Express backend application
- **shared/**: Shared code between client and server
- **db/**: Database connection and setup
- **uploads/**: File upload directories

### Key Components

#### Frontend Architecture
- **Component Structure**: Modular React components with TypeScript interfaces
- **Form Management**: React Hook Form with Zod validation schemas
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Charts and Visualization**: Recharts for analytics and reporting
- **File Handling**: Support for CSV import/export, image uploads, and document management
- **Icon System**: Lucide React for consistent iconography
- **Theme Support**: Dark/light mode with next-themes integration

#### Backend Architecture
- **API Design**: RESTful endpoints with comprehensive CRUD operations
- **Authentication**: JWT-based with role-based access control (Admin, Manager, Developer, Tester)
- **File Storage**: Multer for uploads with Sharp for image processing
- **Real-time Communication**: WebSocket server for chat and notifications
- **Email Service**: Nodemailer integration for user notifications
- **GitHub Integration**: Direct issue creation from bug reports

#### Storage Layer
- **Primary Storage**: In-memory storage system for development and testing
- **Database Integration**: PostgreSQL with Drizzle ORM for production
- **Migration System**: Drizzle Kit for schema migrations and database management
- **Data Persistence**: Automatic fallback to in-memory when database unavailable

## Data Flow

### Authentication Flow
1. User registers/logs in through React frontend
2. Backend validates credentials and issues JWT token
3. Token stored in client and included in API requests
4. Role-based permissions enforced on protected routes

### Real-time Communication
1. WebSocket connection established on user login
2. Chat messages broadcast to project participants
3. Typing indicators and presence status updates
4. File attachments and mentions supported

### Project Management Flow
1. Projects created with modules and test cases
2. Traceability matrix tracks relationships between modules
3. Bug reports linked to test cases and GitHub issues
4. Time tracking and Kanban boards for agile management

## External Dependencies

### Core Dependencies
- **React Router**: react-router-dom for navigation (newer version 7.6.3)
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: Drizzle ORM with migrations support
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Validation**: React Hook Form with Zod schemas
- **Charts**: Recharts for data visualization
- **File Processing**: Multer and Sharp for uploads
- **Authentication**: bcrypt and jsonwebtoken
- **Email**: Nodemailer for notifications
- **WebSocket**: ws for real-time communication

### Development Dependencies
- **Build Tool**: Vite with TypeScript support
- **Testing**: Vitest with coverage reporting
- **Linting**: ESLint with TypeScript configuration
- **CSS**: Tailwind CSS with PostCSS

## Deployment Strategy

### Development Environment
- Single command startup: `npm run dev`
- Hot module replacement with Vite
- In-memory storage for quick development
- WebSocket server on separate path to avoid conflicts

### Production Environment
- PostgreSQL database required
- Environment variables for configuration
- Static file serving through Express
- WebSocket integration for real-time features

### Database Setup
- Drizzle migrations for schema management
- Automatic fallback to in-memory storage
- Connection pooling with Neon serverless
- Schema validation with Zod

## Key Features

### Test Case Management
- Complete CRUD operations for test cases
- Module-based organization
- Priority and status tracking
- CSV import/export functionality

### Bug Tracking
- GitHub integration for issue creation
- Screenshot and attachment support
- Severity and priority classification
- Status workflow management

### Team Collaboration
- Real-time chat with WebSocket
- Project-based messaging
- File sharing capabilities
- User presence indicators

### Reporting and Analytics
- Dashboard with metrics visualization
- Traceability matrix with custom markers
- CSV export for external reporting
- Time tracking and productivity metrics

### Advanced Features
- Kanban board for agile management
- Document management system
- Automated test execution tracking
- Role-based access control
- Dark/light theme support