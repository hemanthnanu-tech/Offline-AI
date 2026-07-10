const fs = require('fs');
let content = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// 1. Add states: isDragging, isParsing
const statesToAdd = `  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
`;
content = content.replace('  const [showAttachDropdown, setShowAttachDropdown]', statesToAdd + '  const [showAttachDropdown, setShowAttachDropdown]');

// 2. Rewrite processFiles to toggle isParsing
const oldProcessFilesRegex = /const processFiles = async \(files: File\[\]\) => \{[\s\S]*?reader\.readAsText\(file\);\s+\}\s+\}\s+\};/m;
const newProcessFiles = `const processFiles = async (files: File[]) => {
    const isVisionCapable = !!activeVisionModel;
    setIsParsing(true);
    
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          if (!isVisionCapable) {
            toast.error("Vision model required to process images! Please load an mmproj model.");
            continue;
          }
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImages(prev => [...prev, event.target!.result]);
              }
              resolve();
            };
            reader.readAsDataURL(file);
          });
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '\\n\\n--- Content of ' + file.name + ' ---\\n';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => item.str).join(' ');
              fullText += pageText + '\\n';
            }
            fullText += '--- End of ' + file.name + ' ---\\n\\n';
            setInputText(prev => prev + fullText);
            toast.success(\`Attached PDF: \${file.name}\`);
          } catch (error) {
            toast.error(\`Failed to parse PDF: \${file.name}\`);
          }
        } else {
          // Assume text file
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setInputText(prev => prev + \`\\n\\n--- Content of \${file.name} ---\\n\${event.target.result}\\n--- End of \${file.name} ---\\n\\n\`);
                toast.success(\`Attached Document: \${file.name}\`);
              }
              resolve();
            };
            reader.readAsText(file);
          });
        }
      }
    } finally {
      setIsParsing(false);
    }
  };`;
content = content.replace(oldProcessFilesRegex, newProcessFiles);

// 3. Update the dropdown menus in the render block to add the subtexts and disable image if needed.
const dropdownRegex = /\{showAttachDropdown && \([\s\S]*?<\/div>\s*\)\}/;
const newDropdown = `{showAttachDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-premium overflow-hidden z-50 flex flex-col p-1.5">
                    <button
                      type="button"
                      disabled={!activeVisionModel}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = 'image/*';
                          fileInputRef.current.click();
                        }
                        setShowAttachDropdown(false);
                      }}
                      className={\`text-left px-3 py-2 text-sm text-[var(--text-main)] rounded-lg flex flex-col gap-0.5 transition-colors \${activeVisionModel ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'opacity-50 cursor-not-allowed'}\`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-4 h-4 text-blue-500" /> <span className="font-semibold">Image</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] ml-6">{activeVisionModel ? 'Supported: png, jpg, webp' : 'Requires mmproj vision model'}</span>
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
                      className="text-left px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer rounded-lg flex flex-col gap-0.5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-emerald-500" /> <span className="font-semibold">PDF Document</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] ml-6">Extracts text automatically</span>
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
                      className="text-left px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer rounded-lg flex flex-col gap-0.5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Code className="w-4 h-4 text-amber-500" /> <span className="font-semibold">Text / Code File</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] ml-6">Supported: .md, .txt, .js, .py, etc.</span>
                    </button>
                  </div>
                )}`;
content = content.replace(dropdownRegex, newDropdown);

// 4. Add drag event handlers to main div and the drag overlay
const mainDivRegex = /<div className="flex-1 flex flex-col h-full bg-\[var\(--bg-main\)\] relative overflow-hidden" id="chat-container">/;
const newMainDiv = `<div 
      className="flex-1 flex flex-col h-full bg-[var(--bg-main)] relative overflow-hidden" 
      id="chat-container"
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length > 0) processFiles(Array.from(e.dataTransfer.files)); }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-main)]/80 backdrop-blur-sm border-4 border-dashed border-[var(--accent)] rounded-xl m-4 pointer-events-none"
          >
            <div className="p-6 bg-[var(--bg-hover)] rounded-full mb-4 shadow-premium">
              <Download className="w-12 h-12 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">Drop files to attach</h2>
            <p className="text-[var(--text-muted)] mt-2 font-mono text-sm">Supports images, PDFs, Markdown, and text files</p>
          </motion.div>
        )}
      </AnimatePresence>`;
content = content.replace(mainDivRegex, newMainDiv);

// 5. Replace \`isParsing\` spinner inside the form (plus button area)
const formPlusRegex = /<Plus style=\{\{width:'20px', height:'20px'\}\} \/>/;
const newFormPlus = `{isParsing ? <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" /> : <Plus style={{width:'20px', height:'20px'}} />}`;
content = content.replace(formPlusRegex, newFormPlus);

fs.writeFileSync('src/components/ChatContainer.tsx', content);
console.log('Successfully updated ChatContainer.tsx');
