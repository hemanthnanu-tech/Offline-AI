const fs = require('fs');

let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// 1. Add Search Input (Chat Search/Filter)
if (!code.includes('searchTerm')) {
  // Add state
  code = code.replace(
    'const [renameId, setRenameId] = useState<string | null>(null);',
    'const [renameId, setRenameId] = useState<string | null>(null);\n  const [searchTerm, setSearchTerm] = useState("");'
  );

  // Filter sessions
  code = code.replace(
    'const todaySessions = sessions.filter',
    `const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const todaySessions = filteredSessions.filter`
  );
  code = code.replace(
    'const olderSessions = sessions.filter',
    'const olderSessions = filteredSessions.filter'
  );

  // Add search input UI before the session lists
  const searchUI = `
      <div className="px-3 mb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-hover)] text-[var(--text-main)] text-xs px-3 py-1.5 rounded-lg border border-transparent focus:border-[var(--accent)] outline-none"
          />
        </div>
      </div>
  `;
  code = code.replace(
    '{/* Today\'s Sessions */}',
    searchUI + '\n      {/* Today\'s Sessions */}'
  );
}

// 2. Add v1.0.0 Stable Badge
if (!code.includes('v1.0.0 Stable')) {
  // Replace the profile bar area to add the badge below it or next to it
  const profileBarRegex = /<div className="text-left leading-tight min-w-0">\s*<div className="text-\[var\(--text-main\)\] font-semibold text-\[13px\] truncate">\s*\{settings\?.userName \|\| 'Offline User'\}\s*<\/div>\s*<\/div>/;
  const newProfileBar = `<div className="text-left leading-tight min-w-0">
            <div className="text-[var(--text-main)] font-semibold text-[13px] truncate">
              {settings?.userName || 'Offline User'}
            </div>
            <div className="text-[9px] text-[var(--accent)] font-bold tracking-widest uppercase mt-0.5 opacity-80">
              v1.0.0 Stable
            </div>
          </div>`;
  code = code.replace(profileBarRegex, newProfileBar);
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Sidebar patched successfully.');
