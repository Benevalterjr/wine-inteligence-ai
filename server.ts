import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    timeout: 60000,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Wine Import Analyst",
    }
  });

  const DEFAULT_MODEL = "minimax/minimax-m2.5";
  const GEMINI_MODEL = "gemini-3-flash-preview";

  // API Routes
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_PAID_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "GEMINI_PAID_API_KEY não configurada nos Secrets." });
      }

      const geminiAi = new GoogleGenAI({ apiKey });
      const { prompt, systemInstruction } = req.body;
      
      const response = await geminiAi.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      res.json({ content: response.text });
    } catch (error: any) {
      // Não logar erros de cota (429) ou indisponibilidade temporária (503) como erro fatal
      const isTransientError = 
        error.message?.includes("429") || 
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("503") ||
        error.message?.includes("UNAVAILABLE");

      if (!isTransientError) {
        console.error("Gemini Analysis Error:", error);
      }
      res.status(error.status || 500).json({ 
        error: error.message,
        isTransientError 
      });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_PAID_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "GEMINI_PAID_API_KEY não configurada nos Secrets." });
      }

      const geminiAi = new GoogleGenAI({ apiKey });
      const { prompt, systemInstruction, chatHistory } = req.body;
      
      const response = await geminiAi.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      res.json({ content: response.text });
    } catch (error: any) {
      const isTransientError = 
        error.message?.includes("429") || 
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("503") ||
        error.message?.includes("UNAVAILABLE");

      if (!isTransientError) {
        console.error("Gemini Chat Error:", error);
      }
      res.status(error.status || 500).json({ 
        error: error.message,
        isTransientError
      });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ]
      });

      res.json({ content: completion.choices[0].message.content });
    } catch (error: any) {
      console.error("OpenRouter Analysis Error:", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, systemInstruction, chatHistory } = req.body;
      
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          ...chatHistory,
          { role: "user", content: prompt }
        ]
      });

      res.json({ content: completion.choices[0].message.content });
    } catch (error: any) {
      console.error("OpenRouter Chat Error:", error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
