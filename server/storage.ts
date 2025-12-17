import { randomUUID } from "crypto";
import type {
  Workflow,
  InsertWorkflow,
  Document,
  InsertDocument,
  PromptTemplate,
  InsertPromptTemplate,
  ContextVariable,
  AgentType,
  defaultContextVariables
} from "@shared/schema";

export interface IStorage {
  // Workflows
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getAllWorkflows(): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<void>;
  duplicateWorkflow(id: string): Promise<Workflow | undefined>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByWorkflow(workflowId: string): Promise<Document[]>;
  getDocumentsByAgent(agentType: AgentType): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  // Constitution
  getConstitution(): Promise<string>;
  setConstitution(content: string): Promise<void>;

  // Stats
  getStats(): Promise<{ totalWorkflows: number; completedWorkflows: number; documentsGenerated: number }>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private documents: Map<string, Document>;
  private constitution: string;

  constructor() {
    this.workflows = new Map();
    this.documents = new Map();
    this.constitution = "";
  }

  // Workflows
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createWorkflow(data: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id,
      name: data.name,
      description: data.description,
      status: data.status || "draft",
      currentAgent: data.currentAgent,
      contextVariables: data.contextVariables || [],
      constitutionContent: data.constitutionContent,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updated: Workflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async deleteWorkflow(id: string): Promise<void> {
    this.workflows.delete(id);
    // Delete associated documents
    for (const [docId, doc] of this.documents) {
      if (doc.workflowId === id) {
        this.documents.delete(docId);
      }
    }
  }

  async duplicateWorkflow(id: string): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    return this.createWorkflow({
      name: `${workflow.name} (Copy)`,
      description: workflow.description,
      status: "draft",
      currentAgent: workflow.currentAgent,
      contextVariables: [...workflow.contextVariables],
      constitutionContent: workflow.constitutionContent
    });
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByWorkflow(workflowId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.workflowId === workflowId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDocumentsByAgent(agentType: AgentType): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.agentType === agentType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const document: Document = {
      id,
      workflowId: data.workflowId,
      agentType: data.agentType,
      title: data.title,
      content: data.content,
      outputType: data.outputType,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updated: Document = {
      ...document,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }

  // Constitution
  async getConstitution(): Promise<string> {
    return this.constitution;
  }

  async setConstitution(content: string): Promise<void> {
    this.constitution = content;
  }

  // Stats
  async getStats(): Promise<{ totalWorkflows: number; completedWorkflows: number; documentsGenerated: number }> {
    const workflows = Array.from(this.workflows.values());
    return {
      totalWorkflows: workflows.length,
      completedWorkflows: workflows.filter(w => w.status === "completed").length,
      documentsGenerated: this.documents.size
    };
  }
}

export const storage = new MemStorage();
