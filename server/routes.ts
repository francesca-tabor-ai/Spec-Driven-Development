import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import { getPromptForAgent, getOutputTypeForAgent } from "./prompts";
import { 
  defaultContextVariables, 
  agentTypes,
  insertWorkflowSchema,
  contextVariableSchema,
  type AgentType, 
  type ContextVariable 
} from "@shared/schema";

const createWorkflowBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  startingAgent: z.enum(agentTypes).optional()
});

const executeAgentBodySchema = z.object({
  agentType: z.enum(agentTypes),
  contextVariables: z.array(contextVariableSchema).optional()
});

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Stats
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Workflows
  app.get("/api/workflows", async (req: Request, res: Response) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error getting workflows:", error);
      res.status(500).json({ error: "Failed to get workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error getting workflow:", error);
      res.status(500).json({ error: "Failed to get workflow" });
    }
  });

  app.post("/api/workflows", async (req: Request, res: Response) => {
    try {
      const parseResult = createWorkflowBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.flatten() 
        });
      }

      const { name, description, startingAgent } = parseResult.data;
      const agentType = startingAgent || "analyst";
      const contextVariables = [...(defaultContextVariables[agentType] || [])];

      const workflow = await storage.createWorkflow({
        name,
        description,
        status: "draft",
        currentAgent: agentType,
        contextVariables
      });

      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ error: "Failed to create workflow" });
    }
  });

  app.patch("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const workflow = await storage.duplicateWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error duplicating workflow:", error);
      res.status(500).json({ error: "Failed to duplicate workflow" });
    }
  });

  // Workflow documents
  app.get("/api/workflows/:id/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocumentsByWorkflow(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Execute workflow
  app.post("/api/workflows/:id/execute", async (req: Request, res: Response) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const constitution = await storage.getConstitution();
      const contextVariables = workflow.contextVariables;

      // Update workflow status
      await storage.updateWorkflow(req.params.id, { status: "in_progress" });

      // Get the starting agent
      const agentType = workflow.currentAgent || "analyst";
      const prompt = getPromptForAgent(agentType, contextVariables, constitution);
      const outputType = getOutputTypeForAgent(agentType);

      res.write(`data: ${JSON.stringify({ stepIndex: 0 })}\n\n`);

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Generate the specification document based on the provided context. Be thorough and professional." }
          ],
          stream: true,
          max_completion_tokens: 8192
        });

        let fullContent = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Save the document
        const document = await storage.createDocument({
          workflowId: req.params.id,
          agentType,
          title: `${outputType} - ${new Date().toLocaleDateString()}`,
          content: fullContent,
          outputType
        });

        // Update workflow status
        await storage.updateWorkflow(req.params.id, { status: "completed" });

        res.write(`data: ${JSON.stringify({ done: true, document })}\n\n`);
      } catch (error) {
        console.error("OpenAI error:", error);
        await storage.updateWorkflow(req.params.id, { status: "error" });
        res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error("Error executing workflow:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to execute workflow" });
      }
    }
  });

  // Documents by agent type
  app.get("/api/documents/:agentType", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocumentsByAgent(req.params.agentType as AgentType);
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Execute individual agent
  app.post("/api/agents/execute", async (req: Request, res: Response) => {
    try {
      const parseResult = executeAgentBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.flatten() 
        });
      }

      const { agentType, contextVariables } = parseResult.data;

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const constitution = await storage.getConstitution();
      const prompt = getPromptForAgent(agentType, contextVariables || [], constitution);
      const outputType = getOutputTypeForAgent(agentType);

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Generate the specification document based on the provided context. Be thorough and professional." }
          ],
          stream: true,
          max_completion_tokens: 8192
        });

        let fullContent = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Create a standalone document (no workflow)
        const document = await storage.createDocument({
          workflowId: "standalone",
          agentType,
          title: `${outputType} - ${new Date().toLocaleDateString()}`,
          content: fullContent,
          outputType
        });

        res.write(`data: ${JSON.stringify({ done: true, document })}\n\n`);
      } catch (error) {
        console.error("OpenAI error:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error("Error executing agent:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to execute agent" });
      }
    }
  });

  // Constitution
  app.get("/api/constitution", async (req: Request, res: Response) => {
    try {
      const content = await storage.getConstitution();
      res.json({ content });
    } catch (error) {
      console.error("Error getting constitution:", error);
      res.status(500).json({ error: "Failed to get constitution" });
    }
  });

  app.put("/api/constitution", async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      await storage.setConstitution(content || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating constitution:", error);
      res.status(500).json({ error: "Failed to update constitution" });
    }
  });

  return httpServer;
}
