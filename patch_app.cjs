const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update handleSendMessage signature and logic
code = code.replace(
  /const handleSendMessage = async \(text: string, images\?: string\[\]\) => \{[\s\S]*?if \(!activeModel && !isVisionCapable\) \{/g,
  `const handleSendMessage = async (text: string, images?: string[], files?: {name: string, content: string}[]) => {
    const isVisionCapable = !!activeVisionModel;
    if (!activeModel && !isVisionCapable) {`
);

// We need to inject the logic to combine text and files right after "const isVisionCapable = !!activeVisionModel;"
// Wait, a safer replace: find the exact line and replace it.
code = code.replace(
  /const isVisionCapable = !!activeVisionModel;\s*if \(!activeModel && !isVisionCapable\) \{/,
  `const isVisionCapable = !!activeVisionModel;
    
    let combinedText = text;
    if (files && files.length > 0) {
      const fileContext = files.map(f => f.content).join('\\n\\n');
      combinedText = combinedText ? \`\${combinedText}\\n\\n\${fileContext}\` : fileContext;
    }
    
    if (!activeModel && !isVisionCapable) {`
);

// We also need to make sure the user's message object gets created with the files, so we need to update the `userMessage` creation.
code = code.replace(
  /const userMessage: Message = \{[\s\S]*?role: 'user',[\s\S]*?content: text,[\s\S]*?(images: images \|\| \[\],)?[\s\S]*?timestamp: new Date\(\)\.toLocaleTimeString\(\[\]\, \{ hour: '2-digit', minute: '2-digit' \}\)[\s\S]*?\};/g,
  `const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: images || [],
      files: files || [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };`
);

// And we must change the `messagesForLlama` variable to use `combinedText` instead of `text`.
// Wait, `messagesForLlama` uses the `historyMessages` (which includes `userMessage`)
// Let's see how `messagesForLlama` is constructed.
// It maps `historyMessages`. So we need to ensure the mapped version includes `files`!
code = code.replace(
  /const historyMessages = \[\.\.\.activeSessionMessages, userMessage\]\.map\(msg => \(\{[\s\S]*?role: msg\.role,[\s\S]*?content: msg\.content[\s\S]*?\}\)\);/g,
  `const historyMessages = [...activeSessionMessages, userMessage].map(msg => {
      let content = msg.content;
      if (msg.files && msg.files.length > 0) {
        content = content ? content + '\\n\\n' + msg.files.map(f => f.content).join('\\n\\n') : msg.files.map(f => f.content).join('\\n\\n');
      }
      return {
        role: msg.role,
        content: content
      };
    });`
);

// For vision models it might use `messagesForLlama`. Let's also patch Llama request logic if needed, but the map above covers `historyMessages`.
// Wait, vision model uses: `prompt: text,`
// Let's replace `prompt: text` with `prompt: combinedText`
code = code.replace(
  /prompt: text,/g,
  `prompt: combinedText,`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
