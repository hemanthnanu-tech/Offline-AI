const fs = require('fs');

// Patch index.css
let css = fs.readFileSync('src/index.css', 'utf8');

// 5. Refined Scrollbars
const scrollbarCSS = `
/* Custom ultra-thin modern scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
`;
if (!css.includes('::-webkit-scrollbar')) {
  css += '\n' + scrollbarCSS;
}

// 7. Fluid Typography
if (!css.includes('font-size: clamp')) {
  css = css.replace('body {', 'html { font-size: clamp(14px, 1.2vw, 16px); }\nbody {');
}

fs.writeFileSync('src/index.css', css);
console.log('Patched index.css for scrollbars and typography');

// Patch index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<meta name="description"')) {
  html = html.replace('<title>Vite + React + TS</title>', '<title>Offline AI - Premium Local Chat</title>\n    <meta name="description" content="100% Private, fully local AI chat environment." />\n    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>" />');
  fs.writeFileSync('index.html', html);
  console.log('Patched index.html for favicon and meta');
}
