# Spec-Driven Development (SDDD) Workflow Application

A comprehensive web application that orchestrates AI agents to produce formal specifications, architecture documents, and implementation plans. This application treats specifications as the authoritative source of truth, with code as a downstream artifact.

## 🎯 Overview

The SDDD Workflow Application helps teams execute specification-driven development processes using specialized AI agents. It provides a structured workflow where different AI agents (Decision Author, Analyst, Architect, Scrum Master, Developer) generate formal specifications, architecture documents, and implementation plans in a sequential, traceable manner.

### Core Philosophy

- **Specifications First**: Specifications are the source of truth
- **Traceability**: Every decision and requirement is traceable
- **Constitutional Compliance**: All outputs must align with defined standards
- **Agent-Based Workflow**: Specialized agents handle distinct phases of development

## ✨ Features

### Workflow Management
- Create, execute, and track multi-agent workflows
- Real-time progress tracking with visual timeline
- Workflow status management (draft, in_progress, completed, error)
- Duplicate and export workflows

### AI Agent Orchestration
- **Decision Author**: Produces decision-oriented specifications for SDDD tool selection
- **Analyst/Product Manager**: Creates Project Briefs, PRDs, and Initial Specifications
- **Architect**: Translates requirements into system architecture with constitutional compliance
- **Scrum Master**: Decomposes plans into detailed, testable user stories and tasks
- **Developer**: Produces implementation code following specifications

### Document Management
- Document versioning with full history tracking
- Real-time streaming of AI-generated content (Server-Sent Events)
- Document validation using AI-powered quality checks
- Export capabilities (Markdown, JSON, HTML, Plain Text)

### Context & Configuration
- **Context Variables**: Customizable template variables that get substituted into agent prompts
- **Constitution Pattern**: Global configuration document that governs all agent behavior
- **File Upload**: Support for PDF and TXT file uploads as input sources

### User Interface
- Modern, minimalist design inspired by Linear and VS Code
- Dark/light theme support
- Responsive layout with collapsible sidebars
- Real-time document viewing and editing

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with HMR support

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api` prefix
- **AI Integration**: OpenAI API (via Replit AI Integrations) for agent execution
- **Storage**: Drizzle ORM with PostgreSQL (interface abstraction for easy migration)

### Key Design Patterns
- **Agent-Based Workflow**: Five specialized AI agents execute in sequence
- **Context Variables**: Template variables for prompt customization
- **Streaming Responses**: Server-Sent Events (SSE) for real-time AI output
- **Constitution Pattern**: Global configuration governing all agent behavior

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL (for production) or in-memory storage (for development)
- OpenAI API access (via Replit AI Integrations or direct API key)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Spec-Driven-Development
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database (PostgreSQL)
   DATABASE_URL=postgresql://user:password@localhost:5432/sddd_db
   
   # OpenAI API (via Replit AI Integrations)
   AI_INTEGRATIONS_OPENAI_BASE_URL=https://openai-proxy.replit.com/v1
   AI_INTEGRATIONS_OPENAI_API_KEY=your_api_key_here
   ```

4. **Set up the database** (if using PostgreSQL)
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 📖 Usage

### Creating a Workflow

1. Navigate to the Dashboard
2. Click "New Specification" button
3. Fill in the workflow details:
   - Name and description
   - Starting agent (defaults to Analyst)
   - Context variables (customize agent prompts)
   - Optional: Upload a PDF or TXT file as input

### Executing a Workflow

1. Open a workflow from the workflows list
2. Review and customize context variables in Settings
3. Click "Execute" to run all 5 agents sequentially
4. Watch real-time streaming of agent outputs
5. Review generated documents in the sidebar

### Managing Documents

- **View**: Click on any document in the sidebar to view its content
- **Edit**: Documents can be edited directly in the viewer
- **Validate**: Use the validation feature to check document quality
- **Export**: Export individual documents or entire workflows
- **Version History**: View and restore previous document versions

### Constitution Management

1. Navigate to the Constitution page
2. Edit the global constitution document
3. This document governs all agent behavior and outputs
4. Changes apply to all future agent executions

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot module reloading
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes to PostgreSQL

## 📁 Project Structure

```
Spec-Driven-Development/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
│   └── public/           # Static assets
├── server/               # Backend Express application
│   ├── routes.ts         # API route definitions
│   ├── prompts.ts        # AI agent prompt templates
│   ├── storage.ts        # Database storage interface
│   └── db.ts            # Database connection
├── shared/               # Shared code between frontend and backend
│   ├── schema.ts        # Database schema and types
│   └── models/          # Shared data models
├── script/              # Build scripts
└── migrations/          # Database migrations (generated)
```

## 🔌 API Endpoints

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create new workflow
- `PATCH /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow (SSE stream)
- `POST /api/workflows/:id/duplicate` - Duplicate workflow

### Documents
- `GET /api/workflows/:id/documents` - Get documents for workflow
- `GET /api/documents/:agentType` - Get documents by agent type
- `GET /api/documents/:id` - Get document by ID
- `PATCH /api/documents/:id` - Update document (creates version)
- `GET /api/documents/:id/versions` - Get document version history
- `GET /api/documents/:id/export` - Export document
- `POST /api/documents/:id/validate` - Validate document quality

### Agents
- `POST /api/agents/execute` - Execute individual agent (SSE stream)

### Constitution
- `GET /api/constitution` - Get constitution content
- `PUT /api/constitution` - Update constitution content

### Utilities
- `GET /api/stats` - Get application statistics
- `POST /api/upload` - Upload PDF or TXT file
- `POST /api/decision-framework/recommend` - Get SDDD tool recommendations

## 🎨 Design System

The application follows a Linear/VS Code hybrid design approach:
- **Typography**: Inter for UI, JetBrains Mono for technical content
- **Layout**: Three-panel layout (sidebar, main content, optional right panel)
- **Components**: Built on Radix UI primitives with Tailwind CSS
- **Theme**: Dark/light mode support with system preference detection

See `design_guidelines.md` for detailed design specifications.

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `DATABASE_URL` | PostgreSQL connection string | Yes (for production) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI API base URL | Yes |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key | Yes |

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [Express](https://expressjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [OpenAI](https://openai.com/) for AI agent execution
- Database management with [Drizzle ORM](https://orm.drizzle.team/)

## 📚 Additional Resources

- [Design Guidelines](./design_guidelines.md) - Detailed design system documentation
- [Replit Integration](./replit.md) - Replit-specific setup and configuration

---

**Note**: This application is designed for teams practicing Spec-Driven Development. It emphasizes clarity, traceability, and formal documentation over rapid prototyping.
