const fs = require('fs');
let code = fs.readFileSync('src/components/ChatContainer.tsx', 'utf8');

// 1. Update onSubmit prop type
code = code.replace(
  /onSubmit: \(text: string, images\?: string\[\]\) => void;/g,
  'onSubmit: (text: string, images?: string[], files?: {name: string, content: string}[]) => void;'
);

// 2. Add selectedFiles state
if (!code.includes('const [selectedFiles, setSelectedFiles]')) {
  code = code.replace(
    /const \[selectedImages, setSelectedImages\] = useState<string\[\]>\(\[\]\);/g,
    'const [selectedImages, setSelectedImages] = useState<string[]>([]);\n  const [selectedFiles, setSelectedFiles] = useState<{name: string, content: string}[]>([]);'
  );
}

// 3. Update handleSubmit
code = code.replace(
  /const handleSubmit = useCallback\(\(e\?: React\.FormEvent\) => \{[\s\S]*?\}, \[inputText, selectedImages, generating, onSubmit\]\);/g,
  `const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0 && selectedFiles.length === 0) || generating) return;
    
    onSubmit(inputText.trim(), selectedImages, selectedFiles);
    setInputText('');
    setSelectedImages([]);
    setSelectedFiles([]);
    
    // Reset the textarea height to default
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [inputText, selectedImages, selectedFiles, generating, onSubmit]);`
);

// 4. Update processFiles
code = code.replace(
  /const processFiles = async \(files: File\[\]\) => \{[\s\S]*?\}\s*finally\s*\{\s*setIsParsing\(false\);\s*\}\s*\};\s*const handleImageUpload/g,
  `const processFiles = async (files: File[]) => {
    const isVisionCapable = !!activeVisionModel;
    setIsParsing(true);
    
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          if (!isVisionCapable) {
            toast.error("Vision model required to process images! Please load an mmproj model.");
            continue;
          }
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImages(prev => [...prev, event.target!.result as string]);
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
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\\n';
            }
            fullText += '--- End of ' + file.name + ' ---\\n\\n';
            
            const extract = window.confirm(\`Do you want to extract the content of "\${file.name}" into the chat box?\\n\\nClick OK to extract it as text.\\nClick Cancel to attach it as a file pill instead.\`);
            if (extract) {
              setInputText(prev => prev + fullText);
            } else {
              setSelectedFiles(prev => [...prev, { name: file.name, content: fullText }]);
            }
            toast.success(\`Processed PDF: \${file.name}\`);
          } catch (error) {
            toast.error(\`Failed to parse PDF: \${file.name}\`);
          }
        } else {
          // Assume text file
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const fullText = '\\n\\n--- Content of ' + file.name + ' ---\\n' + event.target.result + '\\n--- End of ' + file.name + ' ---\\n\\n';
                const extract = window.confirm(\`Do you want to extract the content of "\${file.name}" into the chat box?\\n\\nClick OK to extract it as text.\\nClick Cancel to attach it as a file pill instead.\`);
                if (extract) {
                  setInputText(prev => prev + fullText);
                } else {
                  setSelectedFiles(prev => [...prev, { name: file.name, content: fullText }]);
                }
                toast.success(\`Processed Document: \${file.name}\`);
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
  };

  const handleImageUpload`
);

// 5. Render file pills in the input area
code = code.replace(
  /\{selectedImages\.length > 0 && \([\s\S]*?\}\s*<\/div>\s*\)\}/g,
  `{(selectedImages.length > 0 || (typeof selectedFiles !== 'undefined' && selectedFiles.length > 0)) && (
                  <div className="flex flex-wrap gap-2 p-3 bg-[var(--bg-main)]/30 backdrop-blur-sm border-b border-[var(--border-color)]/30">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] w-16 h-16 shadow-sm">
                        <img src={img} alt="upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {typeof selectedFiles !== 'undefined' && selectedFiles.map((f, i) => (
                      <div key={'f'+i} className="relative group rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-2 flex items-center gap-2 shadow-sm">
                        <Code className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-xs text-[var(--text-main)] truncate max-w-[120px]">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-0.5 rounded-full hover:bg-[var(--border-color)] text-[var(--text-muted)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}`
);

// 6. Clear selectedFiles when switching empty chat
code = code.replace(
  /setSelectedImages\(\[\]\);/g,
  'setSelectedImages([]);\n      if (typeof setSelectedFiles === "function") setSelectedFiles([]);'
);

// 7. Add copy animation to CodeBlock
code = code.replace(
  /<button\s*type="button"\s*onClick=\{([^}]+)\}\s*className="flex items-center gap-1\.5 hover:text-\[var\(--text-main\)\] transition cursor-pointer text-\[var\(--text-muted\)\]"\s*title="Copy codeblock"\s*>/g,
  `<button type="button" onClick={$1} className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition cursor-pointer text-[var(--text-muted)] relative" title="Copy codeblock">
            <AnimatePresence>{copied && <motion.span initial={{opacity:0,y:10}} animate={{opacity:1,y:-20}} exit={{opacity:0}} className="absolute -top-4 right-0 text-emerald-500 font-bold tracking-wider text-[10px] pointer-events-none">Copied!</motion.span>}</AnimatePresence>`
);

// 8. Add copy animation to message copy button
code = code.replace(
  /\{copiedText === msg\.content \? <Check className="w-4 h-4 text-\[var\(--accent\)\]" \/> : <Copy className="w-4 h-4" \/>\}/g,
  `{copiedText === msg.content ? (
                              <div className="relative">
                                <Check className="w-4 h-4 text-[var(--accent)]" />
                                <motion.span initial={{opacity:0,y:10}} animate={{opacity:1,y:-20}} className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-500 font-bold tracking-wider text-[10px] pointer-events-none">Copied!</motion.span>
                              </div>
                            ) : <Copy className="w-4 h-4" />}`
);

fs.writeFileSync('src/components/ChatContainer.tsx', code);
console.log('ChatContainer updated');
