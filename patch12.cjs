const fs = require('fs');

// --- Patch server.ts ---
let serverCode = fs.readFileSync('server.ts', 'utf8');

const targetServerVar = `  let isChatProcessing = false; // Concurrency lock`;
const replacementServerVar = `  let isChatProcessing = false; // Concurrency lock
  
  // Heartbeat tracking for automatic shutdown when tab is closed
  let lastHeartbeatTime: number | null = null;
  setInterval(() => {
    if (lastHeartbeatTime && Date.now() - lastHeartbeatTime > 15000) {
      logger.info("No heartbeat received for 15 seconds. Client tab likely closed. Initiating automatic shutdown...");
      cleanup();
      setTimeout(() => process.exit(0), 1000);
    }
  }, 5000);`;
serverCode = serverCode.replace(targetServerVar, replacementServerVar);

const targetServerAPI = `  // API endpoints`;
const replacementServerAPI = `  // API endpoints

  app.post("/api/heartbeat", (req, res) => {
    lastHeartbeatTime = Date.now();
    res.json({ status: "alive" });
  });`;
serverCode = serverCode.replace(targetServerAPI, replacementServerAPI);

fs.writeFileSync('server.ts', serverCode);
console.log('Patched server.ts');

// --- Patch App.tsx ---
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `  const [activeVisionModel, setActiveVisionModel] = useState<GGUFModelInfo | null>(null);`;
const replacementApp = `  const [activeVisionModel, setActiveVisionModel] = useState<GGUFModelInfo | null>(null);
  
  // Heartbeat system to keep the background server alive
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat(); // initial ping
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, []);`;
appCode = appCode.replace(targetApp, replacementApp);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Patched App.tsx');
