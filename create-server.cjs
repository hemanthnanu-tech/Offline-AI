const fs = require("fs"); fs.writeFileSync("server.ts", `import express from "express";
import path from "path";
import fs from "fs/promises";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import { spawn, ChildProcess } from "child_process";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use("/api", express.json({ limit: "500mb" }));
  app.use("/api", express.urlencoded({ limit: "500mb", extended: true }));

  let llamaProcess: ChildProcess | null = null;
  let isModelLoaded = false;
  let llamaLogs: string[] = [];
  
  async function stopLlamaServer() {
    if (llamaProcess) {
      console.log("Stopping existing llama-server process...");
      try { process.kill(-llamaProcess.pid); } catch(e) {}
      llamaProcess.kill();
      llamaProcess = null;
    }
    isModelLoaded = false;
    llamaLogs = [];
    if (process.platform === "win32") {
      try { require("child_process").execSync("taskkill /F /IM llama-server.exe >nul 2>&1"); } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  process.on("SIGINT", async () => { await stopLlamaServer(); process.exit(0); });
  process.on("SIGTERM", async () => { await stopLlamaServer(); process.exit(0); });

  async function loadGgufModel(specificFileName?: string) {
    await stopLlamaServer();
    try {
      const modelsDir = path.join(process.cwd(), "models");
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      
      let ggufFile = specificFileName || files.find(file => file.endsWith(".gguf") && !file.toLowerCase().includes("mmproj"));
      const visionDir = path.join(modelsDir, "vision");
      let visionFiles: string[] = [];
      try { visionFiles = await fs.readdir(visionDir); } catch (e) {}
      let mmprojFile = visionFiles.find(file => file.endsWith(".gguf") && file.toLowerCase().includes("mmproj"));
      
      if (ggufFile && files.includes(ggufFile)) {
        const exeName = process.platform === "win32" ? "llama-bin/llama-server.exe" : "llama-server";
        const args = ["-m", path.join(modelsDir, ggufFile), "--host", "127.0.0.1", "--port", "8080", "-c", "8192"];
        if (mmprojFile) {
          args.push("--mmproj", path.join(modelsDir, "vision", mmprojFile));
        }
        
        llamaProcess = spawn(exeName, args, { cwd: modelsDir, detached: false });

        llamaProcess.stdout?.on("data", (data) => {
          const out = data.toString();
          process.stdout.write(out);
          llamaLogs.push(...out.trim().split("\\n"));
          if (llamaLogs.length > 50) llamaLogs = llamaLogs.slice(-50);
          if (out.toLowerCase().includes("listening") || out.includes("8080")) isModelLoaded = true;
        });
        
        llamaProcess.stderr?.on("data", (data) => {
          const out = data.toString();
          process.stderr.write(out);
          llamaLogs.push(...out.trim().split("\\n"));
          if (llamaLogs.length > 50) llamaLogs = llamaLogs.slice(-50);
          if (out.toLowerCase().includes("listening") || out.includes("8080")) isModelLoaded = true;
        });

        llamaProcess.on("exit", (code) => {
          llamaLogs.push(\`[SYSTEM] llama-server crashed or exited with code \${code}\`);
          llamaProcess = null;
          isModelLoaded = false;
        });
        return true;
      }
    } catch (e) {
      console.error(e);
      llamaLogs.push(\`[SYSTEM] Error spawning server: \${e}\`);
    }
    return false;
  }

  await loadGgufModel();

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/models", async (req, res) => {
    try {
      const modelsDir = path.join(process.cwd(), "models");
      const files = await fs.readdir(modelsDir);
      const models = files.filter(f => f.endsWith(".gguf") && !f.toLowerCase().includes("mmproj"));
      res.json({ models });
    } catch (e) { res.json({ models: [] }); }
  });
  
  app.post("/api/load-model", async (req, res) => {
    const success = await loadGgufModel(req.body.fileName);
    res.json({ success, modelLoaded: isModelLoaded });
  });

  app.get(["/", "/index.html"], async (req, res, next) => {
    if (!isModelLoaded) {
      const logsHtml = llamaLogs.slice(-15).map(l => \`<div>\${l.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>\`).join("");
      res.send(\`
        <html>
          <head>
            <title>Loading Offline AI...</title>
            <meta http-equiv="refresh" content="2">
            <style>
              body { background: #111; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .logs { margin-top: 30px; background: #000; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #0f0; max-width: 80%; width: 600px; height: 200px; overflow-y: auto; text-align: left; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Starting Offline AI Engine...</h2>
            <p style="color: #888; text-align: center;">Loading model into memory.<br>If this takes more than 5 minutes, check the logs below for errors.</p>
            <div class="logs" id="logs-container">
              \${logsHtml || "<div>Waiting for engine to start...</div>"}
            </div>
            <script>
              const lc = document.getElementById("logs-container");
              lc.scrollTop = lc.scrollHeight;
            </script>
          </body>
        </html>
      \`);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8080/");
      let html = await response.text();
      const injection = \`<script>
        window.addEventListener("load", () => {
          setTimeout(() => {
            document.title = "Offline AI";
            const container = document.createElement("div");
            container.style.position = "fixed";
            container.style.top = "10px";
            container.style.right = "10px";
            container.style.zIndex = "2147483647";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.innerHTML = \\\`<select id="custom-model-select" style="padding: 6px; border-radius: 4px; background: #1f2937; color: white; border: 1px solid #374151; font-size: 12px; margin-right: 8px;"><option value="">Loading models...</option></select><button id="custom-model-btn" style="padding: 6px 12px; border-radius: 4px; background: #4f46e5; color: white; border: none; font-size: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">Switch Model</button>\\\`;
            document.body.appendChild(container);
            
            fetch("/api/models").then(r => r.json()).then(data => {
              const select = document.getElementById("custom-model-select");
              select.innerHTML = "";
              data.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m;
                opt.innerText = m.replace(".gguf", "").replace(/[-_]/g, " ");
                select.appendChild(opt);
              });
            });
            
            document.getElementById("custom-model-btn").addEventListener("click", () => {
              const select = document.getElementById("custom-model-select");
              const val = select.value;
              if (!val) return;
              const btn = document.getElementById("custom-model-btn");
              btn.innerText = "Loading... (Wait 30s)";
              btn.style.background = "#9ca3af";
              fetch("/api/load-model", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: val })
              }).then(r => r.json()).then(res => {
                if (res.success) {
                   setTimeout(() => window.location.reload(), 2000);
                } else {
                   alert("Failed to load model.");
                   btn.innerText = "Switch Model";
                   btn.style.background = "#4f46e5";
                }
              }).catch(() => {
                 setTimeout(() => window.location.reload(), 5000);
              });
            });
          }, 1000);
        });
      </script>\`;
      
      if (html.includes("</body>")) html = html.replace("</body>", injection + "</body>");
      else html += injection;
      
      res.send(html);
    } catch (e) {
      res.status(500).send("Waiting for UI...");
    }
  });

  app.use("/", createProxyMiddleware({ target: "http://127.0.0.1:8080", changeOrigin: true }));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server is booted and actively running on port \${PORT}\`);
  });
}

startServer();`);
