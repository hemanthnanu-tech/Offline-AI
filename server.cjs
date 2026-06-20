var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_node_llama_cpp = require("node-llama-cpp");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let model = null;
  let context = null;
  let detectedModelInfo = null;
  async function loadGgufModel(specificFileName) {
    if (context) {
      try {
        await context.dispose();
      } catch (e) {
      }
      context = null;
    }
    model = null;
    console.log("Scanning models directory... ");
    try {
      const modelsDir = import_path.default.join(process.cwd(), "models");
      await import_promises.default.mkdir(modelsDir, { recursive: true });
      const files = await import_promises.default.readdir(modelsDir);
      const ggufFile = specificFileName || files.find((file) => file.endsWith(".gguf"));
      if (ggufFile && files.includes(ggufFile)) {
        const modelPath = import_path.default.join(modelsDir, ggufFile);
        const stat = await import_promises.default.stat(modelPath);
        const sizeGB = (stat.size / (1024 * 1024 * 1024)).toFixed(2);
        console.log(`Found GGUF model: ${ggufFile} (${sizeGB} GB). Loading into memory...`);
        const llama = await (0, import_node_llama_cpp.getLlama)();
        model = await llama.loadModel({
          modelPath
        });
        context = await model.createContext();
        detectedModelInfo = {
          name: ggufFile.replace(".gguf", "").replace(/[-_]/g, " "),
          fileName: ggufFile,
          architecture: model._typeDescription || "LLAMA",
          contextLength: model._trainContextSize || 131072,
          fileSize: `${sizeGB} GB`,
          quantization: ggufFile.toUpperCase().includes("Q4") ? "Q4_K_M" : "Dynamic"
        };
        console.log("\u2705 GGUF Model loaded successfully.");
        return true;
      } else {
        console.log("\u26A0\uFE0F No GGUF model found in models/ directory. Place a GGUF file there to run inference.");
        detectedModelInfo = null;
        return false;
      }
    } catch (error) {
      console.error("\u274C Failed to load GGUF model:", error);
      detectedModelInfo = null;
      return false;
    }
  }
  await loadGgufModel();
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      engine: "node-llama-cpp",
      modelLoaded: !!model,
      modelInfo: detectedModelInfo
    });
  });
  app.get("/api/models", async (req, res) => {
    try {
      const modelsDir = import_path.default.join(process.cwd(), "models");
      await import_promises.default.mkdir(modelsDir, { recursive: true });
      const files = await import_promises.default.readdir(modelsDir);
      const ggufFiles = files.filter((file) => file.endsWith(".gguf"));
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
    const success = await loadGgufModel();
    res.json({
      success,
      modelLoaded: !!model,
      modelInfo: detectedModelInfo
    });
  });
  app.post("/api/chat", async (req, res) => {
    if (!model || !context) {
      res.status(503).json({ error: "Model not loaded yet." });
      return;
    }
    const { messages, systemPrompt, temperature } = req.body;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    let sequence = null;
    try {
      sequence = context.getSequence();
      const session = new import_node_llama_cpp.LlamaChatSession({
        contextSequence: sequence,
        systemPrompt: systemPrompt || "You are a private offline AI assistant."
      });
      const history = [];
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
        onTextChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}

`);
        }
      });
      res.write(`data: [DONE]

`);
      res.end();
    } catch (error) {
      console.error("Chat generation error:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate text" })}

`);
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and actively running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
