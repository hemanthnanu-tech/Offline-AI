import React from 'react';
import { X, FileText, Paperclip, ChevronRight, AlertTriangle } from 'lucide-react';

interface FileProcessingModalProps {
  files: { name: string, content: string, type: string, size: number }[];
  onConfirm: (decisions: { name: string, extract: boolean }[]) => void;
  onCancel: () => void;
}

export const FileProcessingModal: React.FC<FileProcessingModalProps> = ({ files, onConfirm, onCancel }) => {
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});

  // Default to extracting text files if < 500KB, otherwise attach as pill
  React.useEffect(() => {
    const initialDecisions: Record<string, boolean> = {};
    files.forEach(f => {
      initialDecisions[f.name] = f.size < 500 * 1024;
    });
    setDecisions(initialDecisions);
  }, [files]);

  const handleToggle = (name: string, extract: boolean) => {
    setDecisions(prev => ({ ...prev, [name]: extract }));
  };

  const handleConfirm = () => {
    onConfirm(files.map(f => ({ name: f.name, extract: decisions[f.name] })));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--modal-bg)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-hover)]/30">
          <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
            Process Uploaded Files
          </h2>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-muted)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Choose how you want to handle these files. You can extract their text directly into your message, or attach them as file context pills.
          </p>

          <div className="space-y-3">
            {files.map(f => {
              const isLarge = f.size > 500 * 1024;
              const extract = decisions[f.name] ?? false;

              return (
                <div key={f.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent)]/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-main)] truncate">{f.name}</span>
                      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">{formatSize(f.size)}</span>
                    </div>
                    {isLarge && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-500 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Large file: extracting may cause lag.
                      </div>
                    )}
                  </div>

                  <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg shrink-0">
                    <button
                      onClick={() => handleToggle(f.name, true)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${extract ? 'bg-[var(--bg-main)] shadow-sm text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Extract Text
                    </button>
                    <button
                      onClick={() => handleToggle(f.name, false)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${!extract ? 'bg-[var(--bg-main)] shadow-sm text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Attach Pill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-hover)]/30 flex justify-end gap-3">
          <button onClick={onCancel} className="cursor-pointer px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)] rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className="cursor-pointer px-6 py-2 bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
            Confirm <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
