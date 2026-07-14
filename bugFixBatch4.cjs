const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 9: Zombie Processes
if (!appCode.includes("navigator.sendBeacon('/api/unload')")) {
  appCode = appCode.replace(
    "window.addEventListener('beforeunload', handleBeforeUnload);",
    "window.addEventListener('beforeunload', handleBeforeUnload);\n    const handleUnload = () => { navigator.sendBeacon('/api/unload'); navigator.sendBeacon('/api/stop'); };\n    window.addEventListener('unload', handleUnload);"
  );
  appCode = appCode.replace(
    "window.removeEventListener('beforeunload', handleBeforeUnload);",
    "window.removeEventListener('beforeunload', handleBeforeUnload);\n      window.removeEventListener('unload', handleUnload);"
  );
}

// Fix 5: AbortController Leak
// When stream finishes successfully, clear the abort controller.
appCode = appCode.replace(
  "setIsModelLoading(false);\n      }",
  "setIsModelLoading(false);\n        abortControllerRef.current = null;\n      }"
);

// Fix 33: Missing Catch Blocks
// executeInference has a try/catch, autoTuneWebGPU has try/catch.
// What about checkServerStatus in App.tsx?
appCode = appCode.replace(
  "fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});",
  "fetch('/api/heartbeat', { method: 'POST' }).catch(err => console.debug('Heartbeat failed', err));"
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Batch 4 applied.');
