# SDDD Workflow Application

## Overview

This is a Spec-Driven Development (SDDD) workflow application that helps teams execute specification-driven development processes using AI agents. The application provides a structured workflow where different AI agents (Decision Author, Analyst, Architect, Scrum Master, Developer) generate formal specifications, architecture documents, and implementation plans. The core philosophy treats specifications as the authoritative source of truth, with code as a downstream artifact.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for a Linear/VS Code-inspired technical interface
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api` prefix
- **AI Integration**: OpenAI API (via Replit AI Integrations) for agent execution
- **Storage**: In-memory storage with interface abstraction (IStorage) for easy database migration

### Key Design Patterns
- **Agent-Based Workflow**: Five specialized AI agents execute in sequence, each producing specific document types
- **Context Variables**: Template variables that get substituted into agent prompts for customization
- **Streaming Responses**: Server-Sent Events (SSE) support for real-time AI output streaming
- **Constitution Pattern**: Global configuration document that governs all agent behavior and outputs

### Data Models
- **Workflows**: Container for a complete SDDD process with status tracking and context variables
- **Documents**: Generated outputs from agent executions, linked to workflows and agent types
- **Prompt Templates**: Customizable prompts for each agent type with variable substitution

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Path Aliases**: `@/` for client source, `@shared/` for shared types

## External Dependencies

### AI Services
- **OpenAI API**: Accessed via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Model**: GPT-based models for text generation and agent responses
- **Image Generation**: `gpt-image-1` model for optional image generation features

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` and `shared/models/`
- **Migrations**: Drizzle Kit with migrations in `/migrations`
- **Current State**: Schema defined but using in-memory storage; ready for PostgreSQL when provisioned

### Third-Party Libraries
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns
- **Batch Processing**: p-limit and p-retry for rate-limited API calls
- **Session Management**: connect-pg-simple for database-backed sessions (when database is enabled)