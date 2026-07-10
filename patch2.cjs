const fs = require('fs');

// 1. Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes('/api/upload-model')) {
  const uploadEndpoint = `
  // Upload Model API
  app.post('/api/upload-model', (req, res) => {
    const fileName = req.query.name;
    if (!fileName) {
      return res.status(400).json({ error: 'Missing name query parameter' });
    }
    const modelsDir = require('path').join(process.cwd(), 'models');
    const filePath = require('path').join(modelsDir, fileName);
    
    // Ensure directory exists
    const fsSync = require('fs');
    fsSync.mkdirSync(modelsDir, { recursive: true });
    
    const writeStream = fsSync.createWriteStream(filePath);
    req.pipe(writeStream);
    
    req.on('end', () => res.json({ success: true }));
    req.on('error', (err) => {
      console.error('Upload error', err);
      res.status(500).json({ error: err.message });
    });
  });
  
  `;
  serverCode = serverCode.replace('app.listen(PORT, HOST, () => {', uploadEndpoint + 'app.listen(PORT, HOST, () => {');
  fs.writeFileSync('server.ts', serverCode);
  console.log('Patched server.ts with /api/upload-model endpoint');
}

// 2. Update SettingsModal.tsx
let settingsCode = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const uploadStateInjection = `
  const [reloadingModel, setReloadingModel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{name: string, progress: number} | null>(null);
  
  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = ''; // Reset input
    
    if (!file.name.endsWith('.gguf')) {
      setAlertMsg('Only .gguf files are supported.');
      return;
    }
    
    setUploadProgress({ name: file.name, progress: 0 });
    
    try {
      const res = await fetch(\`/api/upload-model?name=\${encodeURIComponent(file.name)}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file
      });
      
      const data = await res.json();
      if (data.success) {
        setAlertMsg(\`Successfully uploaded \${file.name}. Please refresh directory.\`);
        if (onRefreshModels) onRefreshModels();
      } else {
        setAlertMsg('Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setAlertMsg('Error uploading model.');
    } finally {
      setUploadProgress(null);
    }
  };
`;
settingsCode = settingsCode.replace('const [reloadingModel, setReloadingModel] = useState(false);', uploadStateInjection);

const uiInjection = `
                      {/* Available Models List */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[14px] font-medium text-[var(--text-main)] block">Manage Models</span>
                            <span className="text-[11px] text-[var(--text-muted)]">Upload new models or select an active one</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <label className="px-3 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]/80 text-[12px] font-semibold text-[var(--text-main)] rounded-lg transition border border-[var(--border-color)] cursor-pointer flex items-center gap-1.5">
                              <Download className="w-3.5 h-3.5" />
                              Add LLM (.gguf)
                              <input type="file" accept=".gguf" className="hidden" onChange={handleUploadModel} />
                            </label>
                            <label className="px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 text-[12px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5">
                              <Download className="w-3.5 h-3.5" />
                              Add Vision (mmproj)
                              <input type="file" accept=".gguf" className="hidden" onChange={handleUploadModel} />
                            </label>
                          </div>
                        </div>

                        {uploadProgress && (
                          <div className="bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-color)] animate-pulse">
                            <p className="text-[12px] text-[var(--text-main)] font-semibold flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                              Uploading {uploadProgress.name}... (Please wait, large files take a moment)
                            </p>
                          </div>
                        )}
                        
                        {availableModels.length > 0 ? (
`;

const uiRegex = /\{\/\*\s*Available Models List\s*\*\/\}\s*<div className="space-y-3">\s*<div className="flex items-center justify-between">[\s\S]*?\{availableModels\.length > 0 \? \(/m;
settingsCode = settingsCode.replace(uiRegex, uiInjection);

fs.writeFileSync('src/components/SettingsModal.tsx', settingsCode);
console.log('Patched SettingsModal.tsx');
