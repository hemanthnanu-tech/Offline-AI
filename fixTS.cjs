const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// Fix 1 & 2: Move useEffects inside App() function
const badHooksRegex = /\/\/ Keyboard Shortcuts & Unload Protection[\s\S]*?\}, \[generating\]\);\n\n/;
const matchedHooks = appCode.match(badHooksRegex);

if (matchedHooks) {
  appCode = appCode.replace(badHooksRegex, ''); // Remove from top
  // Insert inside App()
  appCode = appCode.replace(
    'export default function App() {\n',
    'export default function App() {\n' + matchedHooks[0]
  );
}

// Fix 3: Import toast
if (!appCode.includes("import toast from 'react-hot-toast';")) {
  appCode = appCode.replace(
    "import { SettingsModal } from './components/SettingsModal';",
    "import { SettingsModal } from './components/SettingsModal';\nimport toast from 'react-hot-toast';"
  );
}

fs.writeFileSync('src/App.tsx', appCode);

// Fix 4: Add prop to ChatContainer interface
if (!chatCode.includes('onClearCurrentChat?: () => void;')) {
  chatCode = chatCode.replace(
    'onUnloadModel: () => void;',
    'onUnloadModel: () => void;\n  onClearCurrentChat?: () => void;'
  );
  fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
}

console.log('Fixed TS errors.');
