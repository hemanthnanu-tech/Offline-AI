import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import os from "os";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // Initialize Llama offline engine
  let model: any = null;
  let context: any = null;
  let detectedModelInfo: any = null;
  
  async function loadGgufModel(specificFileName?: string, useGPU: boolean = true) {
    // Clean up previous instances
    if (context) {
      try {
        await context.dispose();
      } catch (e) {}
      context = null;
    }
    model = null;

    console.log("Scanning models directory... ");
    try {
      const modelsDir = path.join(process.cwd(), "models");
      // Ensure directory exists
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      
      const ggufFile = specificFileName || files.find(file => file.endsWith(".gguf"));
      
      if (ggufFile && files.includes(ggufFile)) {
        const modelPath = path.join(modelsDir, ggufFile);
        const stat = await fs.stat(modelPath);
        const sizeGB = (stat.size / (1024 * 1024 * 1024)).toFixed(2);
        
        console.log(`Found GGUF model: ${ggufFile} (${sizeGB} GB). Loading into memory...`);
        const llama = await getLlama();
        
        const loadParams: any = { modelPath };
        if (!useGPU) {
          loadParams.gpuLayers = 0;
          console.log('CPU Mode explicitly requested. GPU layers set to 0.');
        } else {
          console.log('GPU Mode enabled (default).');
        }

        model = await llama.loadModel(loadParams);
        context = await model.createContext();
        
        // Extract properties dynamically
        detectedModelInfo = {
          name: ggufFile.replace(".gguf", "").replace(/[-_]/g, " "),
          fileName: ggufFile,
          architecture: model._typeDescription || "LLAMA",
          contextLength: model._trainContextSize || 131072,
          fileSize: `${sizeGB} GB`,
          quantization: ggufFile.toUpperCase().includes("Q4") ? "Q4_K_M" : "Dynamic"
        };
        console.log("✅ GGUF Model loaded successfully.");
        return true;
      } else {
        console.log("⚠️ No GGUF model found in models/ directory. Place a GGUF file there to run inference.");
        detectedModelInfo = null;
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to load GGUF model:", error);
      detectedModelInfo = null;
      return false;
    }
  }

  // Load model on boot
  await loadGgufModel();

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      engine: "node-llama-cpp",
      modelLoaded: !!model,
      modelInfo: detectedModelInfo
    });
  });

  app.get("/api/models", async (req, res) => {
    try {
      const modelsDir = path.join(process.cwd(), "models");
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      const ggufFiles = files.filter(file => file.endsWith(".gguf"));
      res.json({ models: ggufFiles });
    } catch (e) {
      res.status(500).json({ error: "Failed to read models directory" });
    }
  });

  app.post("/api/load-model", async (req, res) => {
    const { fileName } = req.body;
    console.log(`Loading GGUF model on user request: ${fileName}`);
    const success = await loadGgufModel(fileName);
    res.json({
      success,
      modelLoaded: !!model,
      modelInfo: detectedModelInfo
    });
  });

  app.post("/api/reload", async (req, res) => {
    console.log("Reloading GGUF model by user request...");
    const { useGPU } = req.body || {};
    const success = await loadGgufModel(undefined, useGPU !== false);
    res.json({
      success,
      modelLoaded: !!model,
      modelInfo: detectedModelInfo
    });
  });

  app.get("/api/system-stats", (req, res) => {
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const cpus = os.cpus();
    // simple CPU load estimation from os.loadavg (1m) on unix, or fake it on windows
    const cpuLoad = os.loadavg()[0] || 0; 
    
    // Convert to GB strings
    const totalGB = (totalRam / (1024 ** 3)).toFixed(1);
    const freeGB = (freeRam / (1024 ** 3)).toFixed(1);
    
    // Create percentage string for CPU
    const cpuPerc = Math.min(100, Math.round(cpuLoad * 100 / cpus.length)) + "%";

    res.json({
      cpu: cpuPerc,
      freeRam: `${freeGB}GB`,
      totalRam: `${totalGB}GB`
    });
  });

  app.post("/api/unload", async (req, res) => {
    console.log("Unloading model to free RAM...");
    if (context) {
      try { await context.dispose(); } catch(e) {}
      context = null;
    }
    model = null;
    detectedModelInfo = null;
    if (global.gc) global.gc();
    res.json({ success: true });
  });

  app.post("/api/chat", async (req, res) => {
    if (!model || !context) {
      res.status(503).json({ error: "Model not loaded yet." });
      return;
    }

    const { messages, systemPrompt, temperature } = req.body;
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let sequence: any = null;
    try {
      sequence = context.getSequence();
      
      const session = new LlamaChatSession({
        contextSequence: sequence,
        systemPrompt: systemPrompt || "You are a private offline AI assistant."
      });

      // Load conversation history to the session
      const history: any[] = [];
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        if (msg.role === "user") {
          history.push({
            type: "user",
            text: msg.content
          });
        } else if (msg.role === "assistant") {
          history.push({
            type: "model",
            response: [msg.content]
          });
        }
      }
      
      session.setChatHistory(history);
      
      const lastUserMessage = messages[messages.length - 1].content;
      
      await session.prompt(lastUserMessage, {
        temperature: temperature || 0.7,
        onTextChunk: (chunk: string) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      });
      
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat generation error:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate text" })}\n\n`);
      res.end();
    } finally {
      if (sequence) {
        try {
          sequence.dispose();
        } catch (e) {
          console.error("Sequence disposal failed", e);
        }
      }
    }
  });

  // Serve Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and actively running on port ${PORT}`);
  });
}

startServer();
