const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update handleSendMessage signature
code = code.replace(
  /const handleSendMessage = useCallback\(\(text: string, images\?: string\[\]\) => \{/g,
  `const handleSendMessage = useCallback((text: string, images?: string[], files?: {name: string, content: string}[]) => {`
);

// 2. Update userMsg definition
code = code.replace(
  /const userMsg: ChatMessage = \{[\s\S]*?timestamp: new Date\(\)\.toLocaleTimeString\(\),[\s\S]*?\};/g,
  `const userMsg: ChatMessage = {
      id: \`msg-user-\${Date.now()}\`,
      role: 'user',
      content: text + (files && files.length > 0 ? (text ? '\\n\\n' : '') + files.map(f => \`--- Content of \${f.name} ---\\n\${f.content}\\n--- End of \${f.name} ---\`).join('\\n\\n') : ''),
      images: images && images.length > 0 ? images : undefined,
      files: files && files.length > 0 ? files : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched successfully.');
