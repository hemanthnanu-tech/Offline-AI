import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import os from "os";
import { spawn, ChildProcess } from "child_process";
import compression from "compression";

// Load environment variables
dotenv.config();

// Structured logging helper
const logger = {
  info: (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, err || ''),
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // CORS for localhost origins
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // Compression - bypass for SSE routes
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression'] || req.path === '/api/chat') {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Body parsers with payload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Child process for llama-server
  let llamaProcess: ChildProcess | null = null;
  let detectedModelInfo: any = null;
  let hasVisionSupport = false;
  let isModelLoaded = false;
  let isChatProcessing = false; // Concurrency lock
  
  async function stopLlamaServer() {
    if (llamaProcess) {
      logger.info("Stopping existing llama-server process...");
      if (os.platform() === "win32" && llamaProcess.pid) {
        spawn("taskkill", ["/pid", llamaProcess.pid.toString(), "/f", "/t"]);
      } else {
        llamaProcess.kill("SIGKILL");
      }
      llamaProcess = null;
      isModelLoaded = false;
      // Wait a moment for the port to be freed
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Graceful shutdown handlers
  process.on('SIGINT', async () => {
    logger.warn('SIGINT received. Shutting down gracefully...');
    await stopLlamaServer();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received. Shutting down gracefully...');
    await stopLlamaServer();
    process.exit(0);
  });

  async function loadGgufModel(specificFileName?: string) {
    await stopLlamaServer();

    logger.info("Scanning models directory...");
    try {
      const modelsDir = path.join(process.cwd(), "models");
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      
      const ggufFile = specificFileName || files.find(file => file.endsWith(".gguf") && !file.toLowerCase().includes("mmproj"));
      const mmprojFile = files.find(file => file.endsWith(".gguf") && file.toLowerCase().includes("mmproj"));
      
      if (ggufFile && files.includes(ggufFile)) {
        const modelPath = path.join(modelsDir, ggufFile);
        const stat = await fs.stat(modelPath);
        const sizeGB = (stat.size / (1024 * 1024 * 1024)).toFixed(2);
        
        logger.info(`Found GGUF model: ${ggufFile} (${sizeGB} GB). Spawning llama-server...`);
        
        // Determine executable name based on platform
        const exeName = process.platform === "win32" ? "llama-bin/llama-server.exe" : "llama-server";
        
        const args = [
          "-m", modelPath,
          "--port", "8080",
          "--host", "127.0.0.1",
          "-c", "8192", // Context window
          "--no-warmup" // Prevent heap corruption during empty warmup
        ];

        if (mmprojFile) {
          console.log(`Found mmproj file for image analysis: ${mmprojFile}`);
          args.push("--mmproj", path.join(modelsDir, mmprojFile));
          hasVisionSupport = true;
        } else {
          hasVisionSupport = false;
        }

        // Start the background process
        llamaProcess = spawn(exeName, args, {
          detached: false,
          stdio: 'pipe'
        });

        llamaProcess.stdout?.on('data', (data) => {
          const out = data.toString();
          process.stdout.write(out);
          if (out.toLowerCase().includes('listening') || out.includes('8080')) {
            isModelLoaded = true;
            console.log("✅ llama-server is ready on port 8080");
          }
        });
        
        llamaProcess.stderr?.on('data', (data) => {
          const out = data.toString();
          process.stderr.write(out);
          if (out.toLowerCase().includes('listening') || out.includes('8080')) {
            isModelLoaded = true;
            console.log("✅ llama-server is ready on port 8080");
          }
        });

        llamaProcess.on('exit', (code) => {
          console.log(`llama-server exited with code ${code}`);
          llamaProcess = null;
          isModelLoaded = false;
        });

        // Wait up to 10 seconds for the server to report it's ready via stdout/stderr string match
        let attempts = 0;
        while (!isModelLoaded && attempts < 20) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
        }

        // Fallback: poll http://127.0.0.1:8080/health every 500ms up to 60 attempts
        if (!isModelLoaded) {
          console.log("⚠️ String match did not fire — falling back to HTTP health polling...");
          let pollAttempts = 0;
          while (!isModelLoaded && pollAttempts < 60) {
            await new Promise(r => setTimeout(r, 500));
            try {
              const healthRes = await fetch('http://127.0.0.1:8080/health');
              if (healthRes.ok) {
                isModelLoaded = true;
                console.log("✅ llama-server confirmed ready via HTTP health poll");
              }
            } catch {
              // not ready yet — keep polling
            }
            pollAttempts++;
          }
        }

        if (!isModelLoaded) {
          console.log("⚠️ llama-server took too long to start. It may still be loading.");
        }

        // Proper quantization detection via regex
        const quantMatch = ggufFile.match(/[Qq](\d+)[_]?([A-Za-z0-9]*)/);
        const quantization = quantMatch
          ? `Q${quantMatch[1]}${quantMatch[2] ? '_' + quantMatch[2].toUpperCase() : ''}`
          : 'F16';

        detectedModelInfo = {
          name: ggufFile.replace(".gguf", "").replace(/[-_]/g, " "),
          fileName: ggufFile,
          architecture: "llama-server",
          contextLength: 8192,
          fileSize: `${sizeGB} GB`,
          quantization
        };
        return true;
      } else {
        console.log("⚠️ No GGUF model found in models/ directory. Place a GGUF file there to run inference.");
        detectedModelInfo = null;
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to start llama-server:", error);
      detectedModelInfo = null;
      return false;
    }
  }

  // Load model on boot
  await loadGgufModel();

  // API endpoints

  // Merged /api/health endpoint (was duplicated — now single authoritative definition)
  app.get("/api/health", (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      engine: 'llama-server',
      modelLoaded: isModelLoaded,
      hasVisionSupport,
      modelInfo: detectedModelInfo,
      systemMemory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
      }
    });
  });

  // Proxy /api/slots to llama-server
  app.get("/api/slots", async (req, res) => {
    try {
      const slotsRes = await fetch('http://127.0.0.1:8080/slots');
      const data = await slotsRes.json();
      res.json(data);
    } catch {
      res.json({ value: [] });
    }
  });

  // Removed test stream

  // Abort current chat processing
  app.post('/api/stop', (req, res) => {
    isChatProcessing = false;
    res.json({ success: true });
  });

  app.get("/api/models", async (req, res) => {
    try {
      const modelsDir = path.join(process.cwd(), "models");
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      const ggufFiles = files.filter(file => file.endsWith(".gguf"));
      
      const modelDetails = [];
      for (const file of ggufFiles) {
        const stat = await fs.stat(path.join(modelsDir, file));
        modelDetails.push({ name: file, sizeBytes: stat.size });
      }
      
      res.json({ models: ggufFiles, modelDetails });
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
      modelLoaded: isModelLoaded,
      modelInfo: detectedModelInfo
    });
  });

  app.post("/api/reload", async (req, res) => {
    console.log("Reloading GGUF model by user request...");
    const success = await loadGgufModel();
    res.json({
      success,
      modelLoaded: isModelLoaded,
      modelInfo: detectedModelInfo
    });
  });

  app.get("/api/system-stats", (req, res) => {
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const cpus = os.cpus();
    const cpuLoad = os.loadavg()[0] || 0; 
    
    const totalGB = (totalRam / (1024 ** 3)).toFixed(1);
    const freeGB = (freeRam / (1024 ** 3)).toFixed(1);
    const cpuPerc = Math.min(100, Math.round(cpuLoad * 100 / cpus.length)) + "%";

    res.json({
      cpu: cpuPerc,
      freeRam: `${freeGB}GB`,
      totalRam: `${totalGB}GB`
    });
  });

  // --- Chat Completion Proxy ---
  app.post("/api/chat", async (req, res) => {
    if (!llamaProcess) {
      res.status(502).json({ error: "Model server is offline. Please load a model first." });
      return;
    }

    if (isChatProcessing) {
      res.status(429).json({ error: "Server is busy processing another request." });
      return;
    }

    // Wait up to 60 seconds for the model to finish loading if it's currently starting up
    let loadAttempts = 0;
    while (!isModelLoaded && loadAttempts < 60) {
      await new Promise(r => setTimeout(r, 1000));
      loadAttempts++;
    }

    if (!isModelLoaded) {
      res.status(503).json({ error: "Model is still loading. Please try again in a few seconds." });
      return;
    }

    isChatProcessing = true;
    const { messages, temperature, topP, topK, maxTokens, thinkMode } = req.body;
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx/proxy buffering
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.warn("Chat request timed out after 120s.");
      abortController.abort();
    }, 120000); // 2 minute absolute timeout

    req.on("aborted", () => {
      logger.info("Client aborted connection. Aborting generation...");
      abortController.abort();
      isChatProcessing = false;
    });

    try {
      // Map format to OpenAI
      const openAiMessages: any[] = [];
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === "system") {
          openAiMessages.push({ role: "system", content: msg.content });
        } else if (msg.role === "user") {
          if (msg.images && msg.images.length > 0) {
            openAiMessages.push({
              role: "user",
              content: [
                { type: "text", text: msg.content },
                ...msg.images.map((img: string) => ({ type: "image_url", image_url: { url: img } }))
              ]
            });
          } else {
            openAiMessages.push({ role: "user", content: msg.content });
          }
        } else if (msg.role === "assistant") {
          openAiMessages.push({ role: "assistant", content: msg.content || "" });
        }
      }

      const response = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          model: "local-model",
          messages: openAiMessages,
          stream: true,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 0.9,
          top_k: topK ?? 40,
          max_tokens: maxTokens ?? 2048,
          stream_options: { include_usage: true }
        })
      });

      // If response not ok, fetch body and return
      if (!response.ok) {
        clearTimeout(timeoutId);
        const text = await response.text();
        logger.error(`Llama server error: ${response.status}`, text);
        res.write(`data: ${JSON.stringify({ error: `Llama.cpp Error: ${response.statusText}` })}\n\n`);
        res.end();
        isChatProcessing = false;
        return;
      }

      if (!response.body) {
        clearTimeout(timeoutId);
        res.end();
        isChatProcessing = false;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let chunkCount = 0;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          // logger.info(`Received chunk ${chunkCount}: ${chunk.substring(0, 30)}...`);
          res.write(chunk);
          // Explicitly flush the compression buffer so chunks stream instantly
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      }
      logger.info(`Stream finished. Total chunks: ${chunkCount}`);
      clearTimeout(timeoutId);
      res.end();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        // User stopped generation — end stream cleanly without error message
        if (!res.writableEnded) res.end();
      } else {
        logger.error("Error proxying chat to llama-server", err);
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: err.message || "Failed to communicate with local model." })}\n\n`);
          res.end();
        }
      }
    } finally {
      isChatProcessing = false;
    }
  });

  app.post("/api/unload", async (req, res) => {
    logger.info("Unloading model...");
    if (llamaProcess) {
      if (os.platform() === "win32") {
        spawn("taskkill", ["/pid", llamaProcess.pid.toString(), "/f", "/t"]);
      } else {
        llamaProcess.kill("SIGKILL");
      }
      llamaProcess = null;
    }
    isModelLoaded = false;
    res.json({ success: true });
  });

  app.post("/api/kill-model", async (req, res) => {
    logger.warn("KILLING MODEL via hardware controls...");
    if (llamaProcess) {
      if (os.platform() === "win32") {
        spawn("taskkill", ["/pid", llamaProcess.pid.toString(), "/f", "/t"]);
      } else {
        llamaProcess.kill("SIGKILL");
      }
      llamaProcess = null;
    }
    isModelLoaded = false;
    res.json({ success: true, message: "Model terminated." });
  });

  app.post("/api/exit-app", async (req, res) => {
    logger.error("EXIT APP requested via hardware controls. Shutting down...");
    if (llamaProcess) {
      if (os.platform() === "win32") {
        spawn("taskkill", ["/pid", llamaProcess.pid.toString(), "/f", "/t"]);
      } else {
        llamaProcess.kill("SIGKILL");
      }
    }
    res.json({ success: true, message: "App exiting." });
    setTimeout(() => {
      process.exit(0);
    }, 1000);
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

  const HOST = process.env.HOST || '127.0.0.1';
  
  // Upload Model API
  app.post('/api/upload-model', (req, res) => {
    const fileName = req.query.name;
    if (!fileName) {
      return res.status(400).json({ error: 'Missing name query parameter' });
    }
    const modelsDir = require('path').join(process.cwd(), 'models');
    const filePath = require('path').join(modelsDir, fileName);
    
    // Ensure directory exists
    const fsSync = require('fs');
    fsSync.mkdirSync(modelsDir, { recursive: true });
    
    const writeStream = fsSync.createWriteStream(filePath);
    req.pipe(writeStream);
    
    req.on('end', () => res.json({ success: true }));
    req.on('error', (err) => {
      console.error('Upload error', err);
      res.status(500).json({ error: err.message });
    });
  });
  
  app.listen(PORT, HOST, () => {
  console.clear();
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[36m%s\x1b[0m', '      ███████╗ ██████╗ ██████╗ ██████╗ ███████╗       ');
  console.log('\x1b[36m%s\x1b[0m', '      ██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝       ');
  console.log('\x1b[36m%s\x1b[0m', '      █████╗  ██║   ██║██████╔╝██████╔╝█████╗         ');
  console.log('\x1b[36m%s\x1b[0m', '      ██╔══╝  ██║   ██║██╔══██╗██╔══██╗██╔══╝         ');
  console.log('\x1b[36m%s\x1b[0m', '      ██║     ╚██████╔╝██║  ██║██║  ██║███████╗       ');
  console.log('\x1b[36m%s\x1b[0m', '      ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝       ');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[35m%s\x1b[0m', '           O F F L I N E   A I   S Y S T E M           ');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[33m%s\x1b[0m', '              Created by: Hemanth Kumar K              ');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('');

    console.log(`Server is booted and actively running on http://${HOST}:${PORT}`);
  });
}

startServer();
