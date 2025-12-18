import {
  workflows,
  documents,
  documentVersions,
  settings,
  users,
  type Workflow,
  type InsertWorkflow,
  type Document,
  type InsertDocument,
  type DocumentVersion,
  type InsertDocumentVersion,
  type ContextVariable,
  type AgentType,
  type User,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Workflows
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getAllWorkflows(userId?: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<void>;
  duplicateWorkflow(id: number, userId?: string): Promise<Workflow | undefined>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByWorkflow(workflowId: number): Promise<Document[]>;
  getDocumentsByAgent(agentType: AgentType): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<void>;

  // Document versions
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;

  // Constitution
  getConstitution(): Promise<string>;
  setConstitution(content: string): Promise<void>;

  // Stats
  getStats(): Promise<{ totalWorkflows: number; completedWorkflows: number; documentsGenerated: number }>;
}

export class DatabaseStorage implements IStorage {
  // Users (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workflows
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow || undefined;
  }

  async getAllWorkflows(userId?: string): Promise<Workflow[]> {
    if (userId) {
      return db.select().from(workflows)
        .where(eq(workflows.userId, userId))
        .orderBy(desc(workflows.createdAt));
    }
    return db.select().from(workflows).orderBy(desc(workflows.createdAt));
  }

  async createWorkflow(data: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values({
      userId: data.userId,
      name: data.name,
      description: data.description,
      status: data.status || "draft",
      currentAgent: data.currentAgent,
      contextVariables: data.contextVariables || [],
      constitutionContent: data.constitutionContent
    }).returning();
    return workflow;
  }

  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [workflow] = await db.update(workflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return workflow || undefined;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  async duplicateWorkflow(id: number, userId?: string): Promise<Workflow | undefined> {
    const original = await this.getWorkflow(id);
    if (!original) return undefined;

    return this.createWorkflow({
      userId: userId || original.userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      status: "draft",
      currentAgent: original.currentAgent,
      contextVariables: [...(original.contextVariables || [])],
      constitutionContent: original.constitutionContent
    });
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentsByWorkflow(workflowId: number): Promise<Document[]> {
    return db.select().from(documents)
      .where(eq(documents.workflowId, workflowId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByAgent(agentType: AgentType): Promise<Document[]> {
    return db.select().from(documents)
      .where(eq(documents.agentType, agentType))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values({
      workflowId: data.workflowId,
      agentType: data.agentType,
      title: data.title,
      content: data.content,
      outputType: data.outputType,
      version: 1
    }).returning();
    return document;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    // Get current document for versioning
    const current = await this.getDocument(id);
    if (!current) return undefined;

    // Save previous version
    await this.createDocumentVersion({
      documentId: id,
      version: current.version || 1,
      content: current.content
    });

    // Update document with incremented version
    const [document] = await db.update(documents)
      .set({
        ...updates,
        version: (current.version || 1) + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Document versions
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return db.select().from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.version));
  }

  async createDocumentVersion(data: InsertDocumentVersion): Promise<DocumentVersion> {
    const [version] = await db.insert(documentVersions).values({
      documentId: data.documentId,
      version: data.version,
      content: data.content
    }).returning();
    return version;
  }

  // Constitution
  async getConstitution(): Promise<string> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, "constitution"));
    return setting?.value || "";
  }

  async setConstitution(content: string): Promise<void> {
    await db.insert(settings)
      .values({ key: "constitution", value: content })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: content, updatedAt: new Date() }
      });
  }

  // Stats
  async getStats(): Promise<{ totalWorkflows: number; completedWorkflows: number; documentsGenerated: number }> {
    const allWorkflows = await db.select().from(workflows);
    const allDocuments = await db.select().from(documents);

    return {
      totalWorkflows: allWorkflows.length,
      completedWorkflows: allWorkflows.filter(w => w.status === "completed").length,
      documentsGenerated: allDocuments.length
    };
  }
}

export const storage = new DatabaseStorage();
