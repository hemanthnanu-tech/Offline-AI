const fs = require('fs');
let code = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

code = code.replace(
  /\{msg\.images && msg\.images\.length > 0 && \([\s\S]*?\}\s*<\/div>\s*\)\}/g,
  `{msg.images && msg.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.images.map((img, i) => (
                                  <img key={i} src={img} alt="Uploaded" className="max-w-[150px] max-h-[150px] rounded-lg border border-[var(--border-color)] object-cover" />
                                ))}
                              </div>
                            )}
                            {msg.files && msg.files.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.files.map((f, i) => (
                                  <div key={'file'+i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--border-color)]/50 shadow-sm backdrop-blur-sm">
                                    <Code className="w-4 h-4 text-[var(--accent)]" />
                                    <span className="text-xs text-[var(--text-main)] max-w-[200px] truncate">{f.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}`
);

fs.writeFileSync('src/components/ChatContainer.tsx', code);
console.log('ChatContainer updated with file rendering');
