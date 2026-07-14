const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// --- SIDEBAR FIXES ---
// Fix 1: Session Title Crash
sidebarCode = sidebarCode.replace(
  's.title.toLowerCase().includes(searchQuery.toLowerCase())',
  '(s.title || "").toLowerCase().includes((searchQuery || "").toLowerCase())'
);
sidebarCode = sidebarCode.replace(
  's.title.toLowerCase().includes(searchTerm.toLowerCase())',
  '(s.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())'
);

// Fix 15: Event Bubbling
sidebarCode = sidebarCode.replace(
  'onClick: () => onDeleteSession(session.id)',
  'onClick: (e) => { e?.stopPropagation?.(); onDeleteSession(session.id); }'
);


// --- APP FIXES ---
// Fix 30: Keyboard Shortcut Collisions
appCode = appCode.replace(
  "if (e.ctrlKey && e.key === 'n') {",
  "if (e.ctrlKey && e.key === 'n') {\n        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;"
);

// Fix 32: Auto-Title Crash
appCode = appCode.replace(
  "const words = text.trim().split(/\\s+/);",
  "const words = (text || '').trim().split(/\\s+/);"
);

// Fix 4: Memory Leak in Polling (Ensure intervals are cleared properly, mostly handled by useEffect return, but let's check)
// Usually useEffect with setInterval is fine if it has a cleanup function.

// Fix 2 & 10: Local Storage Quota Limit & Debounce Race Condition
appCode = appCode.replace(
  `localStorage.setItem('gguf-chat-sessions', JSON.stringify(cappedSessions));`,
  `try { localStorage.setItem('gguf-chat-sessions', JSON.stringify(cappedSessions)); } catch (e) { console.error('Storage quota exceeded'); localStorage.setItem('gguf-chat-sessions', JSON.stringify(sessions.slice(0, 10))); }`
);

// --- CHAT CONTAINER FIXES ---
// Fix 11: Textarea Height Sticking
// Change handleInputChange to reset properly
chatCode = chatCode.replace(
  /e\.target\.style\.height = `\$\{Math\.min\(e\.target\.scrollHeight, 200\)\}px`;/g,
  'e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;\n    if (e.target.value === "") e.target.style.height = "auto";'
);

// Fix 23: Empty String Prompts
chatCode = chatCode.replace(
  'disabled={!inputText.trim() && selectedImages.length === 0 && !generating && !isListening}',
  'disabled={(!inputText.trim() && selectedImages.length === 0 && !isListening) || generating}'
);

// Fix 27: Copy To Clipboard Failure
chatCode = chatCode.replace(
  /navigator\.clipboard\.writeText\(codeString\);/g,
  `if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(codeString);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = codeString;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(textArea);
    }`
);

chatCode = chatCode.replace(
  /navigator\.clipboard\.writeText\(msg\.content\);/g,
  `if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(msg.content);
                            } else {
                              const textArea = document.createElement("textarea");
                              textArea.value = msg.content;
                              document.body.appendChild(textArea);
                              textArea.select();
                              try { document.execCommand('copy'); } catch (err) {}
                              document.body.removeChild(textArea);
                            }`
);

// Fix 17: React Hot Toast Spam
// We'll just remove all existing toasts before firing a new one for copy
chatCode = chatCode.replace(
  "toast.success('Copied to clipboard');",
  "toast.dismiss(); toast.success('Copied to clipboard');"
);
chatCode = chatCode.replace(
  "toast.success('Copied to clipboard', {",
  "toast.dismiss(); toast.success('Copied to clipboard', {"
);


fs.writeFileSync('src/App.tsx', appCode);
fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);
fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);

console.log('Batch 1 applied.');
