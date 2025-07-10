# TestCaseTracker - Replit.md

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and reporting. The application features a modern web architecture with real-time capabilities, comprehensive testing workflows, and integrated project management tools.

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

## Data Flow

### User Authentication Flow
1. User registers/logs in through React frontend
2. Backend validates credentials and issues JWT token
3. Token stored in client and sent with subsequent requests
4. Role-based access control enforced on API endpoints
5. User roles: Admin, Manager, Developer, Tester with hierarchical permissions

### Test Case Management Flow
1. Projects created by Admin/Manager users
2. Modules organized within projects
3. Test cases created with auto-generated IDs (TC-001, TC-002, etc.)
4. Test execution tracked with status updates
5. Results and metrics aggregated for reporting

### Real-time Features
1. WebSocket connection established on `/ws` path
2. Chat messages broadcast to project participants
3. Live collaboration indicators and typing status
4. Real-time notifications for bug assignments and updates

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **Authentication**: jsonwebtoken and bcrypt for security
- **File Processing**: multer and sharp for uploads
- **Email**: nodemailer for notifications
- **WebSocket**: ws for real-time communication

### Frontend Dependencies
- **UI Components**: @radix-ui/* components for accessibility
- **State Management**: @tanstack/react-query for server state
- **Forms**: react-hook-form with @hookform/resolvers
- **Validation**: zod for type-safe validation
- **Charts**: recharts for data visualization
- **Styling**: tailwindcss with @tailwindcss/vite

### Development Tools
- **Build**: vite with @vitejs/plugin-react
- **Testing**: vitest for unit and integration tests
- **TypeScript**: Full TypeScript support with strict configuration
- **Linting**: ESLint configuration for code quality

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR on port 24678
- Express server on port 5000 (configurable via PORT env var)
- WebSocket server integrated with HTTP server
- In-memory storage as fallback when no database configured

### Production Considerations
- Environment variables for database connection (DATABASE_URL)
- JWT secret configuration for security
- Email service configuration for notifications
- File upload directory management
- WebSocket scaling considerations for multiple instances

### Configuration Files
- `drizzle.config.ts`: Database configuration and migration settings
- `vite.config.ts`: Frontend build configuration with path aliases
- `tailwind.config.ts`: Design system and theming configuration
- `tsconfig.json`: TypeScript configuration with path mapping

The application is designed to work seamlessly in Replit's environment with automatic fallback to in-memory storage when PostgreSQL is not available, making it easy to develop and test without complex setup requirements.

## Recent Changes

### Project Organization (July 10, 2025)
- Successfully consolidated project structure into single TestCaseTracker directory
- Cleaned up duplicate folders and configuration files  
- Organized into clean folder structure: docs/, config/, scripts/, assets/, client/, server/, shared/, uploads/
- Updated Replit configuration files (replit.toml, main.js, run scripts) for proper deployment
- Verified application functionality with database connection, WebSocket server, and all systems operational
- Application confirmed running successfully on port 5000 with all features functional

### Deployment Status
- TestCaseTracker application successfully organized and ready for deployment
- All components verified working: database connectivity, real-time chat, file uploads, test management
- Clean project structure maintained for easy development and maintenance
- Replit configuration optimized for seamless deployment experience

### Bug Fixes (July 10, 2025)
- **Fixed blurred screen issue**: Removed LoginMotivationDialog that was causing screen blur after login
- **Eliminated DOM nesting warnings**: Resolved Badge component nesting issues in dialogs
- **Streamlined login flow**: Users now navigate directly to dashboard without interruption
- **Improved user experience**: No more dialog overlays blocking dashboard interaction
- **Application confirmed stable**: All systems operational with proper authentication flow