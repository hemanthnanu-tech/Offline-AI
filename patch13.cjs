const fs = require('fs');

// --- Fix server.ts ---
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace('cleanup();', 'stopLlamaServer().then(() => process.exit(0)).catch(() => process.exit(1));');
serverCode = serverCode.replace('setTimeout(() => process.exit(0), 1000);', '');
fs.writeFileSync('server.ts', serverCode);
console.log('Fixed server.ts');

// --- Fix SettingsModal.tsx ---
let settingsCode = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
const targetImport = `import { Settings, Sparkles, MessageSquare, Send, Brain, Edit3, Image as ImageIcon, Check, Download, AlertCircle, Copy, Mic, Square, CheckSquare, Plus, RefreshCw, ChevronDown, ChevronUp, Loader2, Trash2, Cpu, HardDrive, Volume2, VolumeX, ThumbsUp, ThumbsDown, Database, Terminal, Code, HelpCircle, Eye, EyeOff, LayoutGrid, Globe, X, MicOff, PanelLeftOpen, PanelLeftClose, User, Edit2, Quote, Menu, BookOpen } from 'lucide-react';`;
// Check if Sparkles is already there. Wait, the error said: error TS2304: Cannot find name 'Sparkles'.
// Let's just find the lucide-react import and add Sparkles if it's missing.
const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+'lucide-react';/;
settingsCode = settingsCode.replace(lucideImportRegex, (match, imports) => {
  if (!imports.includes('Sparkles')) {
    return `import { Sparkles, ${imports.trim()} } from 'lucide-react';`;
  }
  return match;
});
fs.writeFileSync('src/components/SettingsModal.tsx', settingsCode);
console.log('Fixed SettingsModal.tsx');
