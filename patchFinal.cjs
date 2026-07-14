const fs = require('fs');

// Patch index.css for Markdown Table Styling (14)
let css = fs.readFileSync('src/index.css', 'utf8');
const tableCss = `
/* Markdown Table Styling */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
th, td {
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  text-align: left;
}
th {
  background-color: var(--bg-hover);
  font-weight: 600;
  color: var(--text-main);
}
tr:nth-child(even) {
  background-color: var(--bg-bubble);
}
tr:hover {
  background-color: var(--bg-hover);
}
`;
if (!css.includes('/* Markdown Table Styling */')) {
  css += '\\n' + tableCss;
  fs.writeFileSync('src/index.css', css);
}

// Patch App.tsx for Keyboard Shortcuts (4) & Unload Protection (25)
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('Unload Protection')) {
  const hooks = `  // Keyboard Shortcuts & Unload Protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewSession();
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setLibraryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generating) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [generating]);`;

  appCode = appCode.replace(
    '  useEffect(() => {',
    hooks + '\\n\\n  useEffect(() => {'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}
console.log('Final patch complete');
