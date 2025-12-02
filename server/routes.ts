import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generatePluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  apiVersion: z.string(),
  mainClass: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  hasCommands: z.boolean().default(true),
  hasEvents: z.boolean().default(true),
  hasConfig: z.boolean().default(true),
  aiPrompt: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/generate-plugin", async (req, res) => {
    try {
      const data = generatePluginSchema.parse(req.body);
      
      // Build the system prompt for Spigot plugin generation
      const systemPrompt = `You are an expert Minecraft Spigot plugin developer. Generate clean, production-ready Java code for Spigot plugins.

Rules:
1. Always use proper Spigot/Bukkit API patterns
2. Include proper imports
3. Follow Java naming conventions
4. Add helpful comments
5. Handle edge cases (null checks, player-only commands, etc.)
6. Use modern Spigot APIs for the specified version
7. Return ONLY the Java code, no markdown or explanation`;

      const userPrompt = `Generate a Spigot plugin with these specifications:

Plugin Name: ${data.name}
Version: ${data.version}
Spigot API Version: ${data.apiVersion}
Main Class: ${data.mainClass}
${data.description ? `Description: ${data.description}` : ''}
${data.author ? `Author: ${data.author}` : ''}

Features:
- Commands: ${data.hasCommands ? 'Enabled' : 'Disabled'}
- Event Listeners: ${data.hasEvents ? 'Enabled' : 'Disabled'}
- Config: ${data.hasConfig ? 'Enabled' : 'Disabled'}

${data.aiPrompt ? `Special Requirements:\n${data.aiPrompt}` : 'Create a basic plugin with standard setup.'}

Generate the complete Main.java class code. If commands are enabled, implement the onCommand method with the logic for the special requirements. If events are enabled, implement any necessary @EventHandler methods.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: 4096,
      });

      const generatedCode = response.choices[0].message.content || "// Error: No code generated";
      
      res.json({ code: generatedCode });
    } catch (error) {
      console.error("Plugin generation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      
      res.status(500).json({ 
        error: "Failed to generate plugin", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  return httpServer;
}
