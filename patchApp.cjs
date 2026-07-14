const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 12. Auto Title Generation
const oldTitleLogic = `    // Auto rename blank drafts
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0) {
      updatedTitle = text.length > 22 ? \`\${text.substring(0, 22)}...\` : text;
    }`;

const newTitleLogic = `    // Auto rename blank drafts
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0 || currentSession.title === "New Chat") {
      const words = text.trim().split(/\\s+/);
      const titleWords = words.slice(0, 4).join(" ");
      updatedTitle = words.length > 4 ? \`\${titleWords}...\` : titleWords;
    }`;

code = code.replace(oldTitleLogic, newTitleLogic);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx auto-title logic patched');
