const fs = require('fs');

// 1. Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const appAccentRegex = /const accentColors: Record<string, \{ main: string; hover: string; fg: string \}> = \{[\s\S]*?brown: \{ main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' \}\s*\};\s*const activeAccent = accentColors\[settings\.accentColor\] \|\| accentColors\.blue;/;

const newAppAccent = `const accentColors: Record<string, { main: string; hover: string; fg: string }> = {
      blue: { main: '#007aff', hover: '#0062cc', fg: '#ffffff' },
      purple: { main: '#af52de', hover: '#963ec8', fg: '#ffffff' },
      teal: { main: '#30b0c7', hover: '#258ea2', fg: '#ffffff' },
      green: { main: '#34c759', hover: '#28a745', fg: '#ffffff' },
      monochrome: theme === 'dark' 
        ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' }
        : { main: '#000000', hover: '#374151', fg: '#ffffff' },
      brown: { main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' }
    };
    const activeAccent = accentColors[settings.accentColor] || accentColors.blue;`;
appContent = appContent.replace(appAccentRegex, newAppAccent);

const appDepRegex = /\}, \[settings\.accentColor, settings\.contrast\]\);/;
appContent = appContent.replace(appDepRegex, `}, [settings.accentColor, settings.contrast, theme]);`);

fs.writeFileSync('src/App.tsx', appContent);

// 2. Update SettingsModal.tsx
let settingsContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const colorCirclesRegex = /\{\s*id:\s*'black',\s*color:\s*'#000000'\s*\},[\s\S]*?\{\s*id:\s*'white',\s*color:\s*'#ffffff'\s*\}/;
const newColorCircles = `{ id: 'monochrome', color: 'conic-gradient(from 180deg at 50% 50%, #ffffff 0deg, #ffffff 180deg, #000000 180deg, #000000 360deg)' }`;
settingsContent = settingsContent.replace(colorCirclesRegex, newColorCircles);

settingsContent = settingsContent.replace(/style=\{\{ backgroundColor: c\.color \}\}/g, `style={{ background: c.color }}`);

const previewAccentRegex = /black: \{ main: '#000000', hover: '#333333', fg: '#ffffff' \},\s*white: \{ main: '#ffffff', hover: '#f3f4f6', fg: '#000000' \}/g;
const newPreviewAccent = `monochrome: document.documentElement.classList.contains('dark') ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' } : { main: '#000000', hover: '#374151', fg: '#ffffff' }`;
settingsContent = settingsContent.replace(previewAccentRegex, newPreviewAccent);

fs.writeFileSync('src/components/SettingsModal.tsx', settingsContent);

// 3. Update ChatContainer.tsx
let chatContent = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

const imageOptionRegex = /<ImageIcon className="w-4 h-4 text-blue-500" \/> <span className="font-semibold">Image<\/span>[\s\S]*?<\/div>\s*<span className="text-\[10px\] text-\[var\(--text-muted\)\] ml-6">\{activeVisionModel \? 'Supported: png, jpg, webp' : 'Requires mmproj vision model'\}<\/span>/;
const newImageOption = `<ImageIcon className="w-4 h-4 text-blue-500" /> <span className="font-semibold">Image</span>
                        {!activeVisionModel && (
                          <div className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-red-500/10 text-red-500" title="Load an mmproj model in the top right menu to enable image uploads">
                            <AlertCircle className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] ml-6">{activeVisionModel ? 'Supported: png, jpg, webp' : 'Requires mmproj vision model (Load via top right menu)'}</span>`;
chatContent = chatContent.replace(imageOptionRegex, newImageOption);

fs.writeFileSync('src/components/ChatContainer.tsx', chatContent);
console.log('Successfully updated App.tsx, SettingsModal.tsx, and ChatContainer.tsx');
