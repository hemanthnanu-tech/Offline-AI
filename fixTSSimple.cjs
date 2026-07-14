const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// Fix 1: Add toast import to App.tsx
if (!appCode.includes("import toast from 'react-hot-toast';")) {
  appCode = appCode.replace(
    "import LibraryModal from './components/LibraryModal';",
    "import LibraryModal from './components/LibraryModal';\nimport toast from 'react-hot-toast';"
  );
}

// Fix 2: Add onClearCurrentChat to ChatContainerProps
if (!chatCode.includes('onClearCurrentChat?: () => void;')) {
  chatCode = chatCode.replace(
    'onUnloadModel: () => void;',
    'onUnloadModel: () => void;\n  onClearCurrentChat?: () => void;'
  );
}

fs.writeFileSync('src/App.tsx', appCode);
fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
console.log('Fixed TypeScript errors');
