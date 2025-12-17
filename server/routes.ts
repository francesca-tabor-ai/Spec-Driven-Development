import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { storage } from "./storage";
import { getPromptForAgent, getOutputTypeForAgent } from "./prompts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are allowed"));
    }
  }
});
import { 
  defaultContextVariables, 
  agentTypes,
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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      const workflow = await storage.getWorkflow(id);
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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      const workflow = await storage.updateWorkflow(id, req.body);
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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      await storage.deleteWorkflow(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      const workflow = await storage.duplicateWorkflow(id);
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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      const documents = await storage.getDocumentsByWorkflow(id);
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Execute workflow
  app.post("/api/workflows/:id/execute", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const constitution = await storage.getConstitution();
      const contextVariables = workflow.contextVariables || [];

      await storage.updateWorkflow(id, { status: "in_progress" });

      const agentType = (workflow.currentAgent || "analyst") as AgentType;
      const prompt = getPromptForAgent(agentType, contextVariables, constitution);
      const outputType = getOutputTypeForAgent(agentType);

      res.write(`data: ${JSON.stringify({ stepIndex: 0 })}\n\n`);

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Generate the specification document based on the provided context. Be thorough and professional." }
          ],
          stream: true,
          max_tokens: 8192
        });

        let fullContent = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        const document = await storage.createDocument({
          workflowId: id,
          agentType,
          title: `${outputType} - ${new Date().toLocaleDateString()}`,
          content: fullContent,
          outputType
        });

        await storage.updateWorkflow(id, { status: "completed" });

        res.write(`data: ${JSON.stringify({ done: true, document })}\n\n`);
      } catch (error) {
        console.error("OpenAI error:", error);
        await storage.updateWorkflow(id, { status: "error" });
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

  // Get document versions
  app.get("/api/documents/:id/versions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      const versions = await storage.getDocumentVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Error getting document versions:", error);
      res.status(500).json({ error: "Failed to get document versions" });
    }
  });

  // Update document (creates version)
  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      const document = await storage.updateDocument(id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
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

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const constitution = await storage.getConstitution();
      const prompt = getPromptForAgent(agentType, contextVariables || [], constitution);
      const outputType = getOutputTypeForAgent(agentType);

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Generate the specification document based on the provided context. Be thorough and professional." }
          ],
          stream: true,
          max_tokens: 8192
        });

        let fullContent = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        const document = await storage.createDocument({
          workflowId: null,
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

  // Export document
  app.get("/api/documents/:id/export", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const format = req.query.format || "markdown";

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${document.title}.json"`);
        res.json({
          title: document.title,
          content: document.content,
          outputType: document.outputType,
          agentType: document.agentType,
          version: document.version,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        });
      } else {
        res.setHeader("Content-Type", "text/markdown");
        res.setHeader("Content-Disposition", `attachment; filename="${document.title}.md"`);
        res.send(`# ${document.title}\n\n${document.content}`);
      }
    } catch (error) {
      console.error("Error exporting document:", error);
      res.status(500).json({ error: "Failed to export document" });
    }
  });

  // Validate document specification
  app.post("/api/documents/:id/validate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const constitution = await storage.getConstitution();

      const validationPrompt = `You are a specification quality reviewer. Analyze the following document and provide a detailed validation report.

Document Title: ${document.title}
Document Type: ${document.outputType}
Agent Type: ${document.agentType}

Document Content:
${document.content}

${constitution ? `Constitutional Standards:
${constitution}` : ""}

Provide a validation report in the following JSON format:
{
  "overallScore": <number 0-100>,
  "status": "pass" | "warning" | "fail",
  "categories": [
    {
      "name": "Category Name",
      "score": <number 0-100>,
      "status": "pass" | "warning" | "fail",
      "findings": ["finding 1", "finding 2"]
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "summary": "Overall summary of the validation"
}

Evaluate these categories:
1. Completeness - Does the document cover all required sections?
2. Clarity - Is the content clear and unambiguous?
3. Consistency - Are terms and formats used consistently?
4. Actionability - Can the content be acted upon?
5. Constitutional Compliance - Does it follow the defined standards (if any)?

Respond ONLY with valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: validationPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const validationResult = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(validationResult);
    } catch (error) {
      console.error("Error validating document:", error);
      res.status(500).json({ error: "Failed to validate document" });
    }
  });

  // File upload - PDF or TXT
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let textContent = "";
      const fileName = req.file.originalname;

      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        textContent = pdfData.text;
      } else if (req.file.mimetype === "text/plain") {
        textContent = req.file.buffer.toString("utf-8");
      }

      res.json({
        fileName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        textContent: textContent.trim()
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  // Decision framework recommendation
  app.post("/api/decision-framework/recommend", async (req: Request, res: Response) => {
    try {
      const { answers } = req.body;

      const prompt = `You are an SDDD (Spec-Driven Development) methodology expert. Based on the following project characteristics, recommend the best SDDD tools and methodologies.

Project Characteristics:
${Object.entries(answers).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Evaluate these SDDD methodologies:
1. AWS Kiro - AWS's spec-driven development tool
2. GitHub Spec Kit - GitHub's specification toolkit
3. OpenSpec - Open-source specification framework
4. BMAD Method - Business-focused methodology

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "tool": "Tool Name",
      "score": <0-100 match percentage>,
      "description": "Brief description",
      "strengths": ["strength 1", "strength 2"],
      "considerations": ["consideration 1", "consideration 2"],
      "bestFor": "Ideal use case"
    }
  ],
  "summary": "Overall recommendation summary",
  "projectProfile": "Description of the project profile based on answers"
}

Order recommendations by score (highest first). Include 3-4 recommendations.
Respond ONLY with valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  return httpServer;
}
