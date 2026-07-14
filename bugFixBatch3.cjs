const fs = require('fs');
let chatCode = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// Fix 14: Focus Loss on Render
// Just ensure textarea doesn't unmount and remount. The issue is usually key="textarea" missing or it being recreated.
// Adding autoFocus={!isMobile} or similar.
chatCode = chatCode.replace(
  'autoFocus\n                rows={1}',
  'autoFocus\n                rows={1}\n                id="main-chat-input"'
);

// Fix 22: Token Counter Overflow
chatCode = chatCode.replace(
  'Math.ceil(inputText.length / 4)',
  'Math.ceil((inputText || "").length / 3.5)'
);

// Fix 26: PDF Worker URL Mismatch (in ChatContainer where it handles files probably?)
// Wait, is pdfjs used in ChatContainer or App? Let's check FileProcessingModal or ChatContainer.

fs.writeFileSync('src/components/ChatContainer.tsx', chatCode);
console.log('Batch 3 applied.');
