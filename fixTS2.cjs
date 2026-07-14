const fs = require('fs');
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

if (!chatCode.includes('onClearCurrentChat?: () => void;')) {
  chatCode = chatCode.replace(
    'onUnloadModel?: () => void;',
    'onUnloadModel?: () => void;\n  onClearCurrentChat?: () => void;'
  );
  fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
}
console.log('Fixed interface.');
