import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import os from "os";
import { spawn, ChildProcess } from "child_process";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

  // Child process for llama-server
  let llamaProcess: ChildProcess | null = null;
  let detectedModelInfo: any = null;
  let hasVisionSupport = false;
  let isModelLoaded = false;
  
  async function stopLlamaServer() {
    if (llamaProcess) {
      console.log("Stopping existing llama-server process...");
      llamaProcess.kill();
      llamaProcess = null;
      isModelLoaded = false;
      // Wait a moment for the port to be freed
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Graceful shutdown handlers
  process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down...');
    await stopLlamaServer();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down...');
    await stopLlamaServer();
    process.exit(0);
  });

  async function loadGgufModel(specificFileName?: string) {
    await stopLlamaServer();

    console.log("Scanning models directory... ");
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
        
        console.log(`Found GGUF model: ${ggufFile} (${sizeGB} GB). Spawning llama-server...`);
        
        // Determine executable name based on platform
        const exeName = process.platform === "win32" ? "llama-bin/llama-server.exe" : "llama-server";
        
        const args = [
          "-m", modelPath,
          "--port", "8080",
          "--host", "127.0.0.1",
          "-c", "8192" // Context window
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

        // Wait up to 10 seconds for the server to report it's ready
        let attempts = 0;
        while (!isModelLoaded && attempts < 20) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
        }

        if (!isModelLoaded) {
           console.log("⚠️ llama-server took too long to start. It may still be loading.");
        }
        
        detectedModelInfo = {
          name: ggufFile.replace(".gguf", "").replace(/[-_]/g, " "),
          fileName: ggufFile,
          architecture: "llama-server",
          contextLength: 8192,
          fileSize: `${sizeGB} GB`,
          quantization: ggufFile.toUpperCase().includes("Q4") ? "Q4_K_M" : "Dynamic"
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
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      engine: "llama-server",
      modelLoaded: isModelLoaded,
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

  app.post("/api/unload", async (req, res) => {
    console.log("Unloading model to free RAM...");
    await stopLlamaServer();
    detectedModelInfo = null;
    res.json({ success: true });
  });

  app.post("/api/chat", async (req, res) => {
    if (!llamaProcess) {
      res.status(503).json({ error: "Model server is not running." });
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

    const { messages, temperature, thinkMode } = req.body;
    
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Removed hard block for hasVisionSupport to allow single-file multimodal models like Gemma 3
      // Map format to OpenAI
      const openAiMessages: any[] = [];
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === "user") {
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
          // Only send the final content (not the thought process) back to the model for history
          openAiMessages.push({ role: "assistant", content: msg.content || "" });
        }
      }

      const proxyRes = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "local-model",
          messages: openAiMessages,
          stream: true,
          temperature: temperature || 0.7,
        })
      });

      if (!proxyRes.ok) {
        let errorText = await proxyRes.text();
        try {
          const parsed = JSON.parse(errorText);
          errorText = parsed.error?.message || errorText;
        } catch(e) {}
        
        res.write(`data: ${JSON.stringify({ chunk: `\n\n⚠️ **Model Error:** ${errorText}\n\n*(Note: If you tried to send an image to a text-only model, it will reject it.)*` })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }

      const reader = proxyRes.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let buffer = "";
      let thinkStartTime: number | null = null;
      let thinkTokenCount = 0;
      let inThinkBlock = false;
      let thinkTimedOut = false;
      const THINK_TIMEOUT_MS = 15000; // 15 seconds max thinking

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          let newlineIdx;
          while ((newlineIdx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            
            if (line === "data: [DONE]") {
              break;
            }
            
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                const contentChunk = data.choices?.[0]?.delta?.content || "";
                if (contentChunk) {
                  // Track thinking phase timing
                  if (contentChunk.includes("<think>")) {
                    inThinkBlock = true;
                    thinkStartTime = Date.now();
                  }
                  
                  if (inThinkBlock && thinkStartTime) {
                    thinkTokenCount++;
                    const elapsed = Date.now() - thinkStartTime;
                    if (elapsed > THINK_TIMEOUT_MS && !thinkTimedOut) {
                      thinkTimedOut = true;
                      // Inject closing tag and move on
                      res.write(`data: ${JSON.stringify({ chunk: "\n\n[Thought process truncated after 15s]\n</think>\n" })}\n\n`);
                      inThinkBlock = false;
                      continue;
                    }
                  }
                  
                  if (contentChunk.includes("</think>")) {
                    inThinkBlock = false;
                  }
                  
                  if (!thinkTimedOut || !inThinkBlock) {
                    res.write(`data: ${JSON.stringify({ chunk: contentChunk })}\n\n`);
                  }
                }
              } catch (e) {
                // Ignore incomplete JSON
              }
            }
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Chat generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to connect to llama-server" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
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
