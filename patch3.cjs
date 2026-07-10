const fs = require('fs');

// 1. Update ChatContainer.tsx
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

const oldBox = `{/* Current Active Model Info Box */}
                {activeModel && (
                  <div className="mb-2 p-3 bg-[var(--bg-hover)]/50 rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Current Model</div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch('/api/unload', { method: 'POST' });
                            await fetch('/api/stop', { method: 'POST' });
                            setModelDropdownOpen(false);
                            toast.success('Model unloaded and RAM freed.');
                            if (onUnloadModel) onUnloadModel();
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to unload model.');
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Unload Model and Clean RAM"
                      >
                        <Square className="w-2 h-2 fill-current" /> KILL / CLEAN RAM
                      </button>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--text-main)] truncate" title={activeModel.name}>
                      {activeModel.name}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>{activeModel.architecture}</span>
                      <span>•</span>
                      <span>{activeModel.quantization}</span>
                      <span>•</span>
                      <span>{activeModel.fileSize}</span>
                    </div>
                  </div>
                )}`;

const newBox = `{/* Current Active Models Info Box (Modern Glass Effect) */}
                {(activeModel || activeVisionModel) && (
                  <div className="mb-3 p-3 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                        </span>
                        Active Engines
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch('/api/unload', { method: 'POST' });
                            await fetch('/api/stop', { method: 'POST' });
                            setModelDropdownOpen(false);
                            toast.success('System unloaded and RAM freed.');
                            if (onUnloadModel) onUnloadModel();
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to unload.');
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-md px-2 py-0.5 text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Unload Models and Clean RAM"
                      >
                        <Square className="w-2 h-2 fill-current" /> KILL
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeModel ? (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--border-color)]">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/20 text-blue-500 mt-0.5 shrink-0">
                            <MessageSquare className="w-3 h-3" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[12px] font-bold text-[var(--text-main)] truncate" title={activeModel.name}>
                              {activeModel.name}
                            </div>
                            <div className="flex gap-2 mt-0.5 text-[9px] text-[var(--text-muted)] font-mono">
                              <span>{activeModel.architecture}</span>
                              <span>•</span>
                              <span>{activeModel.quantization}</span>
                              <span>•</span>
                              <span>{activeModel.fileSize}</span>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeVisionModel ? (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--border-color)]">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-purple-500/20 text-purple-500 mt-0.5 shrink-0">
                            <ImageIcon className="w-3 h-3" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[12px] font-bold text-[var(--text-main)] truncate" title={activeVisionModel.name}>
                              {activeVisionModel.name}
                            </div>
                            <div className="flex gap-2 mt-0.5 text-[9px] text-[var(--text-muted)] font-mono">
                              <span>Vision Projector</span>
                              <span>•</span>
                              <span className="truncate">{activeVisionModel.fileName}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-[var(--border-color)] text-[var(--text-muted)]">
                           <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-500/10 shrink-0">
                             <ImageIcon className="w-3 h-3 opacity-50" />
                           </div>
                           <div className="text-[10px] font-medium italic">No vision model loaded</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}`;

// We need to make sure we replace it even if there are slight space differences, so let's use Regex.
const replaceRegex = /\{\/\* Current Active Model Info Box \*\/\}[\s\S]*?\{\/\* Available Models List \*\/\}|\{\/\* Current Active Model Info Box \*\/\}[\s\S]*?<\/div>[\s]*\)\}[\s]*<div className="px-3 py-2 text-\[10px\] font-bold text-\[var\(--text-muted\)\] uppercase tracking-wider border-b border-\[var\(--border-color\)\] mt-1">[\s]*Available Models/m;

if (replaceRegex.test(chatCode)) {
  // Found the box. We will inject the new one before the Available Models text.
  chatCode = chatCode.replace(replaceRegex, newBox + `\n\n                <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] mt-1">\n                  Available Models`);
  fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
  console.log('Patched ChatContainer.tsx');
} else {
  console.log('Could not find Active Model Info Box to replace. Trying a simpler string replace...');
  const idx = chatCode.indexOf('{/* Current Active Model Info Box */}');
  if (idx !== -1) {
     const endIdx = chatCode.indexOf('Available Models', idx);
     if (endIdx !== -1) {
        const toReplace = chatCode.substring(idx, endIdx - 93); // go back before the div
        chatCode = chatCode.replace(toReplace, newBox);
        fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
        console.log('Patched ChatContainer.tsx with simple replace');
     } else {
        console.log("Could not find Available Models either.");
     }
  }
}

// 2. Update App.tsx with fetch timeout wrapper
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// The bug where it gets stuck thinking is caused if the fetch hangs or if there is a parsing error inside the while loop that throws synchronously, 
// wait, if it throws synchronously it goes to catch and sets generating to false.
// What if it never returns from `reader.read()`? We should add a timeout mechanism that resets `generating = false` if no tokens are received after 120s.

const executeInferenceRegex = /const executeInference = async \(sessionId: string, updatedMessages: ChatMessage\[\], images\?: string\[\]\) => \{\s*setGenerating\(true\);/;
if (executeInferenceRegex.test(appCode)) {
  const timeoutInjection = `const executeInference = async (sessionId: string, updatedMessages: ChatMessage[], images?: string[]) => {
    setGenerating(true);
    let watchdogTimer = setTimeout(() => {
        setGenerating(false);
        console.warn("Watchdog: Inference timed out. Resetting generating state.");
    }, 180000); // 3-minute max global timeout safety catch
    `;
    
  appCode = appCode.replace(executeInferenceRegex, timeoutInjection);
  
  // also clear the timeout in the finally block
  const finallyRegex = /\} finally \{\s*setGenerating\(false\);/;
  if (finallyRegex.test(appCode)) {
      appCode = appCode.replace(finallyRegex, `} finally {\n      clearTimeout(watchdogTimer);\n      setGenerating(false);`);
  }
  
  // also add a timeout check for reader.read()
  const readRegex = /const \{ done, value \} = await reader\.read\(\);/;
  if (readRegex.test(appCode)) {
      const resetWatchdog = `
          clearTimeout(watchdogTimer);
          watchdogTimer = setTimeout(() => {
              setGenerating(false);
              console.warn("Watchdog: Stream hung. Resetting generating state.");
              if (abortControllerRef.current) abortControllerRef.current.abort();
          }, 60000); // 60-second chunk timeout
          
          const { done, value } = await reader.read();`;
      appCode = appCode.replace(readRegex, resetWatchdog);
  }
  
  fs.writeFileSync('src/App.tsx', appCode);
  console.log('Patched App.tsx with watchdog timers to fix thinking bug');
}

// 3. Update README.md
let readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('Offline AI Engine')) {
    readme = `# Offline AI
    
Offline AI is a beautifully designed, completely local AI client for running Large Language Models (LLMs) and Vision models efficiently on your hardware.

## Features
- **Local AI Execution**: Run gguf and mmproj models natively without internet.
- **Glassmorphism UI**: Stunning modern interface with dynamic accents.
- **Vision Support**: Drag and drop images to analyze them using local Vision adapters.
- **Model Uploads**: Directly upload your downloaded models via the Settings tab.
- **Zero Telemetry**: Completely private, secure, and offline.

## Setup
1. Run \`npm install\`
2. Place models in the \`models/\` folder or upload them via the Settings UI.
3. Use \`Start Offline AI.vbs\` to launch the engine seamlessly.
`;
    fs.writeFileSync('README.md', readme);
    console.log('Created beautiful README.md');
} else {
    console.log('README.md is already updated');
}
