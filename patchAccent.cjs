const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAccents = /const accentColors: Record<string, \{ main: string; hover: string; fg: string \}> = \{[\s\S]*?brown: \{ main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' \}\s*\};/;
const newAccents = `const accentColors: Record<string, { main: string; hover: string; fg: string }> = {
      blue: theme === 'dark' 
        ? { main: '#0a84ff', hover: '#0062cc', fg: '#ffffff' } 
        : { main: '#007aff', hover: '#005bb5', fg: '#ffffff' },
      purple: theme === 'dark'
        ? { main: '#bf5af2', hover: '#963ec8', fg: '#ffffff' }
        : { main: '#af52de', hover: '#8a3bb3', fg: '#ffffff' },
      teal: theme === 'dark'
        ? { main: '#64d2ff', hover: '#258ea2', fg: '#000000' }
        : { main: '#30b0c7', hover: '#248696', fg: '#ffffff' },
      green: theme === 'dark'
        ? { main: '#32d74b', hover: '#28a745', fg: '#ffffff' }
        : { main: '#34c759', hover: '#299c47', fg: '#ffffff' },
      monochrome: theme === 'dark' 
        ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' }
        : { main: '#000000', hover: '#374151', fg: '#ffffff' },
      brown: theme === 'dark'
        ? { main: '#d2a679', hover: '#b8860b', fg: '#000000' }
        : { main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' }
    };`;

code = code.replace(oldAccents, newAccents);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx accent colors patched');
