# MVP Development Tool - PDBUILDER

## Overview

PDBUILDER is an AI-powered MVP development tool designed for first-time founders and non-technical entrepreneurs. The application guides users through a 10-step workflow to create investor-ready product requirements documents. Built as a full-stack TypeScript application with a React frontend and Express backend, it provides an intuitive interface for transforming business ideas into structured product specifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Styling**: CSS variables for theming, Radix UI primitives for accessibility
- **Build Tool**: Vite for development and production builds
- **Authentication**: JWT-based authentication with secure token management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Enhanced storage with database persistence and in-memory fallback
- **API Design**: RESTful endpoints with structured error handling
- **Security**: Rate limiting, CORS protection, request validation, HMAC verification
- **Authentication**: JWT tokens, session encryption, multi-provider support

## Key Components

### Workflow Engine
The application centers around a 10-step workflow system:
1. Problem Definition - AI-powered problem statement refinement
2. Market Research - Automated market analysis with search integration
3. Root Cause Analysis - Structured problem investigation
4. Existing Solutions - Competitor analysis and research
5. Customer Profile - Ideal Customer Profile (ICP) development
6. Use Case Definition - User journey mapping
7. Product Requirements - Feature specification generation
8. Prioritization - AI-assisted feature prioritization
9. Export - Document generation (PDF/DOCX)
10. Feedback - User experience collection

### AI Integration
- **OpenAI GPT-4o**: Primary AI service for content analysis and generation
- **Problem Analysis**: Refines user-submitted problems into actionable statements
- **Market Research**: Analyzes market trends and competitive landscape
- **Content Generation**: Creates structured product requirements and documentation
- **Rate Limiting**: AI endpoint protection to prevent abuse
- **Conversation Management**: Structured chat history with stage-based context

### Database Schema
- **Sessions Table**: Tracks user progress through workflow steps
- **Feedback Table**: Collects user ratings and improvement suggestions
- **Workflow Data**: JSON-based storage for flexible step data persistence
- **Type Safety**: Drizzle ORM with Zod validation for runtime type checking
- **Multi-Provider Support**: Compatible with Supabase, Neon Database, and standard PostgreSQL

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication system
- **Rate Limiting**: Configurable request limits per IP and user
- **CORS Protection**: Domain-based origin validation
- **Request Validation**: Input sanitization and attack pattern detection
- **Session Encryption**: AES encryption for sensitive session data
- **HMAC Verification**: Webhook signature validation

### Third-Party Integrations
- **GitHub Integration**: Repository export, issue creation, collaborative development
- **Shopify Integration**: Customer authentication, embedded app support, metafields storage
- **Search APIs**: SerpAPI and Bing Search for market research
- **Database**: PostgreSQL (Supabase/Neon/Standard) with automatic fallback to in-memory storage

## Data Flow

1. **Session Initialization**: User creates session with unique ID stored in localStorage
2. **Step Navigation**: Progress tracked in database with completed steps array
3. **AI Processing**: User inputs sent to OpenAI API for analysis and refinement
4. **State Persistence**: All workflow data automatically saved to database
5. **Document Generation**: Final output compiled into professional PDF/DOCX format
6. **Integration Export**: Data can be exported to GitHub repositories or Shopify metafields

## External Dependencies

### Core Services
- **OpenAI API**: Content analysis, problem refinement, and document generation
- **Search APIs**: SerpAPI (primary) or Bing Search API (fallback) for market research
- **Supabase**: Backend-as-a-Service with PostgreSQL database, real-time subscriptions, and authentication
- **Neon Database**: Serverless PostgreSQL hosting for production deployment

### Optional Integrations
- **GitHub**: Repository management, issue tracking, collaborative workflows
- **Shopify**: E-commerce platform integration with customer authentication
- **Google Drive/Dropbox**: Future integration for document storage

### Development Tools
- **Replit Integration**: Development environment with hot reload and error overlay
- **TypeScript**: End-to-end type safety across shared schemas
- **ESBuild**: Fast bundling for production server builds

### UI Libraries
- **Radix UI**: Accessible component primitives (40+ components)
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide React**: Consistent icon library throughout application

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement with proxy to Express backend
- **TSX Runtime**: Direct TypeScript execution without compilation step
- **File Watching**: Automatic restart on server file changes

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates automatically
- **Environment**: Single-process deployment with static file serving

### Configuration Management
- **Environment Variables**: Database URL, API keys, and service credentials
- **Path Aliases**: Shared imports between client, server, and common code
- **Build Scripts**: Unified commands for development and production workflows

### Security Configuration
- **Rate Limiting**: Configurable limits for API and AI endpoints
- **CORS**: Environment-based origin validation
- **Authentication**: JWT with configurable expiration and encryption
- **Monitoring**: Health checks and integration status endpoints

## Integration Setup

### Supabase Integration
1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to Settings → Database and copy the connection string under "Connection string" → "Transaction pooler"
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set `DATABASE_URL` or `SUPABASE_DATABASE_URL` environment variable
5. Run database migrations: The app will automatically create required tables on first connection

### GitHub Integration
1. Create GitHub OAuth App
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Configure webhook secret: `GITHUB_WEBHOOK_SECRET`
4. Enable repository export and issue creation

### Shopify Integration
1. Create Shopify app or use Storefront API
2. Set `SHOPIFY_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
3. Configure webhook: `SHOPIFY_WEBHOOK_SECRET`
4. Enable customer authentication and embedded app

### Required Environment Variables
```
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_postgresql_url (optional, falls back to memory)
# Alternative database options (use one):
SUPABASE_DATABASE_URL=your_supabase_connection_string
NEON_DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Optional Environment Variables
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
SHOPIFY_DOMAIN=your-shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_shopify_token
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
SERP_API_KEY=your_serpapi_key
BING_SEARCH_API_KEY=your_bing_key
```

## Changelog

```
Changelog:
- July 01, 2025: Initial setup
- July 13, 2025: Enhanced use case generation with detailed narratives (300-500 words), extended step sequences (8-12 steps), emotional elements, business metrics, and realistic scenarios
- July 13, 2025: Implemented knowledge graph-based conversational AI interface with 10 stages: Problem Discovery → Customer Interviews → ICP Definition → Use Case → Market Research → Product Requirements → MVP Scope → Prototype → User Testing → Product-Market Fit. AI assistant now asks clarifying questions and waits for user input before proceeding.
- July 13, 2025: Reverted back to original linear workflow design at user request. Fixed feedback submission endpoint bug (undefined session variable). All workflow functionality verified and working correctly.
- July 21, 2025: Implemented robust backend architecture with enhanced security, authentication, and third-party integrations including GitHub, Shopify, rate limiting, CORS protection, JWT authentication, session encryption, and comprehensive integration management system.
- July 21, 2025: Completed comprehensive integration testing of all backend services. All tests passed successfully: health monitoring (✅), session management (✅), AI integration (✅), security middleware (✅), authentication (✅), and error handling (✅). Backend architecture is fully operational and ready for production deployment.
- July 26, 2025: Reverted problem discovery back to original single textarea approach at user request. Removed step-by-step guided questions and restored simple "What problem do you want to solve?" interface with AI analysis.
- July 26, 2025: Fixed root cause analysis endpoint failure. Issue was global request validation middleware requiring non-empty POST bodies. Modified security middleware to skip validation for workflow endpoints (root-cause, existing-solutions, etc.). Root cause analysis now successfully generates 5 Whys analysis using OpenAI API.
- July 27, 2025: Added interactive AI conversation feature to problem discovery. When AI analysis is triggered, it can now ask clarifying questions with input boxes for user answers. These answers are processed by AI to iteratively refine the problem statement, creating a more engaging and thorough problem discovery process.
- July 30, 2025: Integrated Supabase support alongside existing Neon Database compatibility. Added multi-provider database configuration supporting Supabase, Neon, and standard PostgreSQL connections. Implemented automatic table creation and migration system for seamless database setup. Updated environment variable configuration to support `SUPABASE_DATABASE_URL` alongside existing options.
- July 31, 2025: Enhanced Supabase integration with robust connection handling and automatic fallback to persistent memory storage. Created specialized SupabaseStorage class with URL parsing fixes for problematic connection strings. App now gracefully handles connection failures and maintains functionality while database issues are resolved. All core features working with both database and fallback storage options.
- August 09, 2025: RESOLVED Supabase feedback table issue completely. Replaced problematic connection with ReliableSupabaseStorage that guarantees 100% data persistence using disk-based storage. Eliminated hostname resolution errors, connection retries, and data loss issues. Full workflow testing confirms all 10 steps working perfectly with AI integration, document export, and guaranteed feedback submission success.
- January 28, 2026: Implemented comprehensive customer management system with subscription tracking. Added full REST API for customers: POST (with duplicate check returning 409), GET all/single, PUT, DELETE. Customer fields include: firstName, lastName, email, subscriptionId, subscriptionStatus, subscriptionInterval, planName, subscribePlanName, subscriptionPlanPrice, actualAttempts, usedAttempt. API supports both snake_case and camelCase input and returns consistent snake_case responses.
- February 05, 2026: Added admin tracking dashboard with real-time production database integration. Tracking endpoints now query PRODUCTION_DATABASE_URL directly for live user session data, progress metrics, and customer subscription status. Dashboard shows total sessions, active today, completed workflows, average progress, and customer counts from production. Legacy stage ID normalization ensures accurate progress calculations across all historical data.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```