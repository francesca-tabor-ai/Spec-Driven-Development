import { z } from "zod";
import { pgTable, text, varchar, timestamp, jsonb, serial, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Agent types for the SDDD workflow
export const agentTypes = [
  "decision_author",
  "analyst",
  "architect",
  "scrum_master",
  "developer"
] as const;

export type AgentType = typeof agentTypes[number];

// Agent metadata
export interface AgentInfo {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  outputTypes: string[];
}

export const agents: AgentInfo[] = [
  {
    id: "decision_author",
    name: "Decision Specification Author",
    description: "Produces formal, decision-oriented specifications for SDDD tool and methodology selection",
    icon: "FileText",
    outputTypes: ["SDDD Decision Specification"]
  },
  {
    id: "analyst",
    name: "Analyst / Product Manager",
    description: "Produces professional documentation including Project Briefs, PRDs, and Initial Specifications",
    icon: "ClipboardList",
    outputTypes: ["Project Brief", "PRD", "Initial Specification"]
  },
  {
    id: "architect",
    name: "Architect Agent",
    description: "Translates requirements into coherent system architecture with constitutional compliance",
    icon: "Building2",
    outputTypes: ["Architecture Overview", "Component Definition", "ADRs"]
  },
  {
    id: "scrum_master",
    name: "Scrum Master Agent",
    description: "Decomposes plans into hyper-detailed, testable user stories and tasks",
    icon: "ListTodo",
    outputTypes: ["User Stories", "Task Breakdown", "Sprint Plan"]
  },
  {
    id: "developer",
    name: "Developer Agent",
    description: "Produces implementation code following specifications and architectural decisions",
    icon: "Code2",
    outputTypes: ["Implementation Code", "Tests", "Documentation"]
  }
];

// Context variable type
export interface ContextVariable {
  key: string;
  value: string;
  description?: string;
}

export const contextVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional()
});

// Drizzle table definitions
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  currentAgent: varchar("current_agent", { length: 50 }),
  contextVariables: jsonb("context_variables").$type<ContextVariable[]>().default([]),
  constitutionContent: text("constitution_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  outputType: varchar("output_type", { length: 100 }).notNull(),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const workflowsRelations = relations(workflows, ({ many }) => ({
  documents: many(documents)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [documents.workflowId],
    references: [workflows.id]
  }),
  versions: many(documentVersions)
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  })
}));

// Insert schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true
});

// Types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

// Execution step schema (not persisted, runtime only)
export const executionStepSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  agentType: z.enum(agentTypes),
  status: z.enum(["pending", "running", "completed", "error"]),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  error: z.string().optional()
});

export type ExecutionStep = z.infer<typeof executionStepSchema>;

// Default context variables for each agent
export const defaultContextVariables: Record<AgentType, ContextVariable[]> = {
  decision_author: [
    { key: "target_audience", value: "", description: "Intended audience for the specification" },
    { key: "organization_type", value: "", description: "Type of organization (startup, enterprise, etc.)" },
    { key: "regulatory_level", value: "", description: "Level of regulatory sensitivity (low, medium, high)" },
    { key: "ai_maturity_level", value: "", description: "Organization's AI maturity (beginner, intermediate, advanced)" },
    { key: "tool_1", value: "AWS Kiro", description: "First tool/method to evaluate" },
    { key: "tool_2", value: "GitHub Spec Kit", description: "Second tool/method to evaluate" },
    { key: "tool_3", value: "OpenSpec", description: "Third tool/method to evaluate" },
    { key: "tool_4", value: "BMAD Method", description: "Fourth tool/method to evaluate" },
    { key: "project_type", value: "", description: "Type of project (web app, API, mobile, etc.)" },
    { key: "system_complexity", value: "", description: "Complexity level of the system" },
    { key: "governance_priority", value: "", description: "Priority level for governance" },
    { key: "existing_codebase_state", value: "", description: "State of existing codebase (greenfield, legacy, etc.)" }
  ],
  analyst: [
    { key: "input_sources", value: "", description: "Sources of requirements (stakeholders, documents, etc.)" },
    { key: "organization_type", value: "", description: "Type of organization" },
    { key: "product_domain", value: "", description: "Domain of the product" },
    { key: "target_users", value: "", description: "Target user personas" },
    { key: "regulatory_level", value: "", description: "Regulatory sensitivity level" },
    { key: "delivery_constraints", value: "", description: "Delivery timeline and constraints" }
  ],
  architect: [
    { key: "constitution_file", value: "constitution.md", description: "Path to constitution/standards file" },
    { key: "organizational_constraints", value: "", description: "Organizational constraints and policies" },
    { key: "system_type", value: "", description: "Type of system being designed" },
    { key: "deployment_environment", value: "", description: "Target deployment environment" },
    { key: "scalability_requirements", value: "", description: "Scalability expectations" },
    { key: "availability_targets", value: "", description: "Availability and uptime targets" },
    { key: "regulatory_level", value: "", description: "Regulatory sensitivity level" }
  ],
  scrum_master: [
    { key: "constitution_file", value: "constitution.md", description: "Path to constitution/standards file" },
    { key: "sprint_duration", value: "2 weeks", description: "Duration of sprints" },
    { key: "team_size", value: "", description: "Size of development team" },
    { key: "velocity_baseline", value: "", description: "Team velocity baseline" }
  ],
  developer: [
    { key: "constitution_file", value: "constitution.md", description: "Path to constitution/standards file" },
    { key: "coding_standards", value: "", description: "Coding standards to follow" },
    { key: "testing_requirements", value: "", description: "Testing requirements (TDD, coverage, etc.)" },
    { key: "tech_stack", value: "", description: "Technology stack to use" }
  ]
};
