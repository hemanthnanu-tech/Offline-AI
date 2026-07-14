const fs = require('fs');

let code = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// 1. Import EmptyState
if (!code.includes('import { EmptyState }')) {
  code = code.replace(
    "import { PromptItem, PREADDED_PROMPTS } from './LibraryModal';",
    "import { PromptItem, PREADDED_PROMPTS } from './LibraryModal';\nimport { EmptyState } from './EmptyState';"
  );
}

// 2. Replace empty state UI
const oldEmptyStateRegex = /\{\/\* Empty State \*\/\}\s*<div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">\s*<motion\.div[\s\S]*?\{\/\* Chat Feed \*\/\}/;
const newEmptyState = `{/* Empty State */}
          <EmptyState />
        ) : (
          {/* Chat Feed */}`;
if (oldEmptyStateRegex.test(code)) {
  code = code.replace(oldEmptyStateRegex, newEmptyState);
}

// 3. Add Message Hover States (6) and Code Block Copy Feedback (15)
// Let's modify the message action buttons wrapper to use 'group'
// Find the message container: `className={\`flex gap-4 w-full ...
code = code.replace(
  /className=\{`flex gap-4 w-full \$\{msg\.role === 'user'/g,
  'className={`group flex gap-4 w-full ${msg.role === \'user\''
);

// Find action buttons wrapper
code = code.replace(
  /className="flex items-center gap-1 mt-1\.5 pt-1 border-t border-\[var\(--border-color\)\]\/(.*?) opacity-80"/g,
  'className="flex items-center gap-1 mt-1.5 pt-1 border-t border-[var(--border-color)]/$1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"'
);

// Add Clear Chat prop if not exists
if (!code.includes('onClearCurrentChat?: () => void;')) {
  code = code.replace(
    'onDeleteMessage: (id: string) => void;',
    'onDeleteMessage: (id: string) => void;\n  onClearCurrentChat?: () => void;'
  );
  
  code = code.replace(
    'onDeleteMessage,\n  onUnloadModel',
    'onDeleteMessage,\n  onClearCurrentChat,\n  onUnloadModel'
  );
}

// 4. Add Clear Chat button next to Export button
if (!code.includes('title="Clear Current Chat"')) {
  const exportBtn = `<button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer flex items-center gap-1.5"
              title="Export Chat as Markdown"
            >`;
            
  const clearBtn = `<button
              onClick={onClearCurrentChat}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer flex items-center gap-1.5"
              title="Clear Current Chat"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline-block">Clear</span>
            </button>
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer flex items-center gap-1.5"
              title="Export Chat as Markdown"
            >`;
  code = code.replace(exportBtn, clearBtn);
}

// 5. Code Block copy flash
if (!code.includes('bg-emerald-500/20')) {
  // modify CodeBlock's wrapper bg dynamically
  code = code.replace(
    'className="bg-[var(--bg-input)] rounded-lg overflow-hidden border border-[var(--border-color)] my-4"',
    'className={`bg-[var(--bg-input)] rounded-lg overflow-hidden border border-[var(--border-color)] my-4 transition-colors duration-300 ${copied ? "bg-emerald-500/10 border-emerald-500/30" : ""}`}'
  );
}

fs.writeFileSync('src/components/ChatContainer.tsx', code);
console.log('ChatContainer patched successfully.');
