const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
const extraCss = `
/* Fix 16: Tooltip Z-Index */
.tooltip-content, [role="tooltip"], [data-tooltip] {
  z-index: 200 !important;
}

/* Fix 18: Mobile Viewport Overflow */
html, body, #root {
  height: 100%;
  height: 100dvh;
  overflow: hidden;
}

/* Fix 19: Accent Color Fallbacks */
::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}
::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #333;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
`;

if (!css.includes('/* Fix 16: Tooltip Z-Index */')) {
  css += '\\n' + extraCss;
  fs.writeFileSync('src/index.css', css);
}

console.log('CSS bugs patched.');
