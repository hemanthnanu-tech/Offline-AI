const fs = require('fs');
let content = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// 1. Add ImageIcon to lucide-react imports if not there
if (!content.includes('ImageIcon')) {
  content = content.replace("from 'lucide-react';", ", ImageIcon } from 'lucide-react';");
}

// 2. Add states for showAttachDropdown
const stateToAdd = '  const [showAttachDropdown, setShowAttachDropdown] = useState(false);\n  const attachDropdownRef = useRef<HTMLDivElement>(null);\n';
content = content.replace('  const [selectedImages, setSelectedImages] = useState<string[]>([]);\n  const fileInputRef = useRef<HTMLInputElement>(null);', '  const [selectedImages, setSelectedImages] = useState<string[]>([]);\n  const fileInputRef = useRef<HTMLInputElement>(null);\n' + stateToAdd);

// 3. Add click outside listener
const listenerToAdd = '\n    const handleAttachClickOutside = (e: MouseEvent) => {\n      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target as Node)) {\n        setShowAttachDropdown(false);\n      }\n    };\n\n    document.addEventListener(\'mousedown\', handleAttachClickOutside);\n';
const listenerToRemove = '\n      document.removeEventListener(\'mousedown\', handleAttachClickOutside);\n';

content = content.replace("document.addEventListener('mousedown', handleClickOutside);", "document.addEventListener('mousedown', handleClickOutside);" + listenerToAdd);
content = content.replace("document.removeEventListener('mousedown', handleClickOutside);", "document.removeEventListener('mousedown', handleClickOutside);" + listenerToRemove);

// 4. Update processFiles
content = content.replace("const isVisionCapable = activeVisionModel || (activeModel && (activeModel.fileName.toLowerCase().includes('vision') || activeModel.fileName.toLowerCase().includes('llava')));", "const isVisionCapable = !!activeVisionModel;");

// 5. Update the button
const newButton = `
              {/* + attach */}
              <div className="relative" ref={attachDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                  style={{background:'none', border:'none', cursor:'pointer', padding:'4px', marginRight:'8px', color:'var(--text-main)', display:'flex', alignItems:'center', flexShrink:0}}
                  title="Attach File or Image"
                >
                  <Plus style={{width:'20px', height:'20px'}} />
                </button>
                
                {showAttachDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-premium overflow-hidden z-50 flex flex-col p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = 'image/*';
                          fileInputRef.current.click();
                        }
                        setShowAttachDropdown(false);
                      }}
                      className="text-left px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-500" /> Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = '.pdf,application/pdf';
                          fileInputRef.current.click();
                        }
                        setShowAttachDropdown(false);
                      }}
                      className="text-left px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-500" /> PDF Document
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = '.md,.txt,.csv,.json,.log,.ts,.js,.tsx,.jsx,.html,.css';
                          fileInputRef.current.click();
                        }
                        setShowAttachDropdown(false);
                      }}
                      className="text-left px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Code className="w-4 h-4 text-amber-500" /> Text / Code
                    </button>
                  </div>
                )}
              </div>
`;

const oldButtonRegex = /\{\/\* \+ attach — Fix 2: vision model guard \*\/\}[\s\S]*?<\/button>/;
content = content.replace(oldButtonRegex, newButton);

fs.writeFileSync('src/components/ChatContainer.tsx', content);
console.log('Successfully updated ChatContainer.tsx');
