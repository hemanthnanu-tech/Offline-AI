import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Settings, Sparkles, Send, Brain, Edit3, Image as ImageIcon, Check, Download, AlertCircle, Copy, Mic, Square, CheckSquare, Plus, RefreshCw, ChevronDown, ChevronUp, Loader2, Trash2, Cpu, HardDrive, Volume2, VolumeX, ThumbsUp, ThumbsDown, Database, Terminal, Code, HelpCircle, Eye, EyeOff, LayoutGrid, Globe, X, MicOff, PanelLeftOpen, PanelLeftClose, User, Edit2, Quote, Menu, BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { ChatMessage, InferenceSettings, GGUFModelInfo } from '../types';
import { PromptItem, PREADDED_PROMPTS } from './LibraryModal';

const CodeBlock = ({ inline, className, children, generating, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  if (!inline) {
    return (
      <div className="my-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)]/30 overflow-hidden shadow-sm font-mono w-full">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-hover)] text-[var(--text-muted)] border-b border-[var(--border-color)] text-[10px] font-mono select-none">
          <span className="uppercase text-[var(--text-main)] tracking-wider font-semibold">{lang === 'ts' ? 'TYPESCRIPT' : lang === 'js' ? 'JAVASCRIPT' : lang || 'TEXT'}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(codeString);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition cursor-pointer text-[var(--text-muted)]"
            title="Copy codeblock"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[var(--accent)] font-semibold font-sans">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
        <div 
          className="p-4 overflow-auto bg-[#1e1e1e] max-h-[420px] text-xs leading-relaxed text-[#d4d4d4] rounded-b-xl overscroll-none"
          style={{ overflowAnchor: 'none' }}
        >
          {generating ? (
            <pre className="m-0 bg-transparent p-0 font-mono text-[13px] whitespace-pre-wrap word-break-all">
              <code>{codeString}</code>
            </pre>
          ) : (
            <SyntaxHighlighter
              {...props}
              style={vscDarkPlus}
              language={lang}
              PreTag="div"
              customStyle={{ background: 'transparent', padding: 0, margin: 0, overflowAnchor: 'none' }}
            >
              {codeString}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    );
  }
  return (
    <code className={`${className} bg-[var(--bg-hover)] text-emerald-400 px-1.5 py-0.5 rounded text-[13px] font-mono`} {...props}>
      {children}
    </code>
  );
};

interface ChatContainerProps {
  messages: ChatMessage[];
  onSubmit: (text: string, images?: string[]) => void;
  onRegenerate: () => void;
  onEditMessage: (index: number, newText: string) => void;
  activeModel: GGUFModelInfo | null;
  activeVisionModel?: any;
  settings: InferenceSettings;
  generating: boolean;
  onOpenSettings: () => void;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onStopGeneration: () => void;
  availableModels: string[];
  onLoadModel: (fileName: string) => void;
  onDeleteMessage?: (id: string) => void;
  onUnloadModel?: () => void;
}

export default function ChatContainer({
  messages,
  onSubmit,
  onRegenerate,
  onEditMessage,
  activeModel,
  activeVisionModel,
  settings,
  generating,
  onOpenSettings,
  sidebarOpen,
  onOpenSidebar,
  onStopGeneration,
  availableModels,
  onLoadModel,
  onDeleteMessage,
  onUnloadModel
}: ChatContainerProps) {
  const [inputText, setInputText] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, 'good' | 'bad'>>({});
  
  // @ mention prompt list
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [dropdownPrompts, setDropdownPrompts] = useState<PromptItem[]>([]);
  const [promptSearch, setPromptSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fix 1: Auto-scroll to bottom tracking
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      const distFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setAtBottom(distFromBottom < 80);
    };
    viewport.addEventListener('scroll', onScroll);
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  // Fix 9: Rotating placeholder
  const PLACEHOLDERS = [
    'Ask anything...', 'Explain quantum entanglement...',
    'Write a Python script...', 'Summarize this text...',
    'What is machine learning?', 'Help me debug this code...'
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Focus input when generation completes
  useEffect(() => {
    if (!generating && inputRef.current && !isListening && !showPromptDropdown) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [generating, isListening, showPromptDropdown]);

  // @ mention detection
  useEffect(() => {
    const match = inputText.match(/(?:^|\s)@([^\s]*)$/);
    if (match && !generating) {
      setShowPromptDropdown(true);
      setPromptSearch(match[1] || '');
      setSelectedIndex(0);
      
      const saved = localStorage.getItem('gguf-prompt-library');
      let customList: PromptItem[] = [];
      if (saved) {
        try { customList = JSON.parse(saved); } catch (e) {}
      }
      const merged = PREADDED_PROMPTS.map(p => customList.find(c => c.id === p.id) || p);
      const pureCustom = customList.filter(c => !PREADDED_PROMPTS.some(p => p.id === c.id));
      setDropdownPrompts([...merged, ...pureCustom]);
    } else {
      setShowPromptDropdown(false);
    }
  }, [inputText, generating]);

  const filteredDropdownPrompts = dropdownPrompts.filter(p => 
    (p.title || '').toLowerCase().includes(promptSearch.toLowerCase()) || 
    (p.category || '').toLowerCase().includes(promptSearch.toLowerCase())
  );

  const insertPrompt = (prompt: PromptItem) => {
    const newText = inputText.replace(/(?:^|\s)@[^\s]*$/, (match) => {
      return match.startsWith(' ') ? ' ' + prompt.promptText : prompt.promptText;
    });
    setInputText(newText);
    setShowPromptDropdown(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
      }
    }, 50);
  };

  // Listen to library prompt selection event
  useEffect(() => {
    const handleInsertPrompt = (e: Event) => {
      const text = (e as CustomEvent).detail;
      setInputText(text);
    };
    
    window.addEventListener('insert-prompt', handleInsertPrompt);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('insert-prompt', handleInsertPrompt);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Auto-resize textarea when inputText changes programmatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleMouseUp = (e: MouseEvent) => {
    // Timeout to allow selection to register completely
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Ensure it's inside the messages scroller
        const scroller = document.getElementById('messages-scroller');
        if (scroller && scroller.contains(range.startContainer)) {
          setSelection({
            text: sel.toString().trim(),
            x: rect.left + (rect.width / 2),
            y: rect.top + window.scrollY
          });
          return;
        }
      }
      setSelection(null);
    }, 10);
  };

  useEffect(() => {
    // Initialize Web Speech API for Dictation
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string, msgId: string) => {
    if (speakingId) {
      window.speechSynthesis.cancel();
      if (speakingId === msgId) {
        setSpeakingId(null);
        return;
      }
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/[*#_`~]/g, '') // remove formatting symbols
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setSpeakingId(null);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!scrollViewportRef.current) return;
    if (atBottom || messages.length <= 1) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, generating, atBottom]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || generating) return;
    
    onSubmit(inputText.trim(), selectedImages);
    setInputText('');
    setSelectedImages([]);
    
    // Reset the textarea height to default
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [inputText, selectedImages, generating, onSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore if IME composition is active (e.g. typing Japanese/Chinese)
    if (e.nativeEvent.isComposing) return;

    if (showPromptDropdown && filteredDropdownPrompts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredDropdownPrompts.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertPrompt(filteredDropdownPrompts[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowPromptDropdown(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!generating && (inputText.trim() || selectedImages.length > 0)) {
        handleSubmit();
      }
    }
  }, [showPromptDropdown, filteredDropdownPrompts, selectedIndex, generating, inputText, selectedImages, handleSubmit, insertPrompt]);

  // Clear input when switching to a new empty chat
  useEffect(() => {
    if (messages.length === 0) {
      setInputText('');
      setSelectedImages([]);
      setEditingMsgIndex(null);
      setEditingText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  }, [messages.length]);

  const processFiles = async (files: File[]) => {
    const isVisionCapable = activeVisionModel || (activeModel && (activeModel.fileName.toLowerCase().includes('vision') || activeModel.fileName.toLowerCase().includes('llava')));
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        if (!isVisionCapable) {
          toast.error("Vision model required to process images! Please load an mmproj model.");
          continue;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImages(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = `\n\n--- Content of ${file.name} ---\n`;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          fullText += `--- End of ${file.name} ---\n\n`;
          setInputText(prev => prev + fullText);
          toast.success(`Attached PDF: ${file.name}`);
        } catch (error) {
          toast.error(`Failed to parse PDF: ${file.name}`);
        }
      } else {
        // Assume text file
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setInputText(prev => prev + `\n\n--- Content of ${file.name} ---\n${event.target.result}\n--- End of ${file.name} ---\n\n`);
            toast.success(`Attached Document: ${file.name}`);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      processFiles(Array.from(e.clipboardData.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Fix 7: Improved Export Chat with timestamps and toast
  const handleExport = () => {
    const md = messages.map(m => {
      const role = m.role === 'user' ? '**You**' : '**AI**';
      return `${role} *(${m.timestamp})*:\n\n${m.content}`;
    }).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported!');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (generating) return;
    onSubmit(prompt);
  };

  const startEdit = (index: number, currentText: string) => {
    setEditingMsgIndex(index);
    setEditingText(currentText);
  };

  const saveEdit = (index: number) => {
    if (editingText.trim() && editingText !== messages[index].content) {
      onEditMessage(index, editingText.trim());
    }
    setEditingMsgIndex(null);
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] relative overflow-hidden" id="chat-container">
      
      {/* Top Header - Replicated ChatGPT model dropdown and options */}
      <header className="h-14 flex items-center justify-between px-4 bg-[var(--bg-main)]/80 backdrop-blur-xl sticky top-0 z-20 select-none border-b border-transparent transition-all duration-300 ease-out">
        <div className="flex items-center relative">
          {/* Collapse Open Menu Icon */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2 mr-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition cursor-pointer"
              title="Open Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 hidden md:block" />
              <Menu className="w-5 h-5 md:hidden" />
            </button>
          )}

          {/* Model Switcher Dropdown Selector */}
          <div 
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition cursor-pointer select-none"
          >
            <span className="text-[18px] font-bold tracking-tight text-[var(--text-main)]" style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
              Offline AI
            </span>
            {activeModel && (
              <span className="flex items-center gap-1.5 bg-[var(--accent)]/10 text-[var(--accent)] border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                {activeModel.name}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
          </div>

          {/* Switcher Dropdown Menu */}
          {modelDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setModelDropdownOpen(false)} />
              <div className="absolute top-12 left-3 w-80 bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl shadow-xl z-40 p-2 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                
                {/* Current Active Model Info Box */}
                {activeModel && (
                  <div className="mb-2 p-3 bg-[var(--bg-hover)]/50 rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Current Model</div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch('/api/unload', { method: 'POST' });
                            await fetch('/api/stop', { method: 'POST' });
                            setModelDropdownOpen(false);
                            toast.success('Model unloaded and RAM freed.');
                            if (onUnloadModel) onUnloadModel();
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to unload model.');
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Unload Model and Clean RAM"
                      >
                        <Square className="w-2 h-2 fill-current" /> KILL / CLEAN RAM
                      </button>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--text-main)] truncate" title={activeModel.name}>
                      {activeModel.name}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>{activeModel.architecture}</span>
                      <span>•</span>
                      <span>{activeModel.quantization}</span>
                      <span>•</span>
                      <span>{activeModel.fileSize}</span>
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)] mt-1">
                  Available Models
                </div>
                <div className="py-1 max-h-[220px] overflow-y-auto">
                  {availableModels.length === 0 ? (
                    <div className="px-3 py-2 text-xs italic text-[var(--text-muted)]">
                      No models in models/ folder.
                    </div>
                  ) : (
                    availableModels.map((modelFile) => {
                      const isActive = activeModel?.fileName === modelFile;
                      return (
                        <button
                          key={modelFile}
                          type="button"
                          onClick={() => {
                            onLoadModel(modelFile);
                            setModelDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition text-left cursor-pointer ${
                            isActive 
                              ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold' 
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/60 hover:text-[var(--text-main)]'
                          }`}
                        >
                          <span className="truncate pr-2">{modelFile.replace(".gguf", "").replace(/[-_]/g, " ")}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-[var(--border-color)] pt-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setModelDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-[var(--accent)] hover:bg-[var(--bg-hover)]/40 rounded-lg transition cursor-pointer"
                  >
                    Manage Settings & Presets...
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Right header options - kept clean as requested */}
        <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer flex items-center gap-1.5"
              title="Export Chat as Markdown"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline-block">Export</span>
            </button>
          </div>
      </header>

      {/* Floating Selection Toolbar */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="floating-toolbar flex gap-1 items-center"
            style={{ top: selection.y, left: selection.x }}
          >
            <button 
              onClick={() => {
                navigator.clipboard.writeText(selection.text);
                setSelection(null);
              }}
              className="toolbar-btn text-xs font-semibold flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button 
              onClick={() => {
                setInputText(prev => prev + (prev ? ' ' : '') + `"${selection.text}" `);
                setSelection(null);
                inputRef.current?.focus();
              }}
              className="toolbar-btn text-xs font-semibold flex items-center gap-1.5"
            >
              <Quote className="w-3.5 h-3.5" /> Quote
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages viewport */}
      <div ref={scrollViewportRef} className="flex-1 overflow-y-auto scroll-smooth transition-all duration-300 ease-in-out relative" id="messages-scroller">
        <div className={`max-w-3xl mx-auto pt-6 pb-6 px-4 sm:px-6 ${messages.length === 0 ? 'min-h-full flex flex-col' : ''}`}>
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
              <div className="w-16 h-16 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center mb-6 border border-[var(--border-color)] shadow-sm mx-auto">
                <Brain className="w-8 h-8 text-[var(--accent)]" />
              </div>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
              className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-main)] to-[var(--text-muted)]" 
              style={{fontFamily:"'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"}}
            >
              How can I help you today?
            </motion.h2>

            {/* Fix 8: No model guidance */}
            {!activeModel && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm text-center max-w-sm">
                <p className="font-semibold mb-1">No AI model loaded</p>
                <p className="text-xs opacity-80">Place a .gguf file in the <code>models/</code> folder and restart the server.</p>
              </motion.div>
            )}
          </div>
        ) : (
          /* Chat Feed */
          <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isEditing = editingMsgIndex === index;

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    id={`chat-msg-${msg.id}`}
                    title={msg.timestamp}
                  >
                  {isUser ? (
                    /* User Bubble - ChatGPT style: light grey/blue pill */
                    <div className="flex flex-col items-end space-y-1.5 max-w-[80%] relative group">
                      <div style={{backgroundColor:'var(--user-bubble-bg)', color:'var(--user-bubble-text)', borderRadius:'18px', padding:'10px 16px', fontSize:'15px', lineHeight:'1.5', display:'inline-block', wordBreak:'break-word', maxWidth:'100%'}}>
                        {isEditing ? (
                          <div className="space-y-2 min-w-[200px]">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={3}
                              className="w-full p-2 text-sm bg-transparent border border-[var(--border-color)] rounded-lg text-[var(--text-main)] outline-none focus:border-[var(--text-muted)]"
                            />
                            <div className="flex justify-end gap-2 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => setEditingMsgIndex(null)}
                                className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(index)}
                                className="px-3 py-1 bg-[var(--text-main)] text-[var(--bg-main)] rounded hover:opacity-80 transition cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {msg.content}
                            {msg.images && msg.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.images.map((img, i) => (
                                  <img key={i} src={img} alt="Uploaded" className="max-w-[150px] max-h-[150px] rounded-lg border border-[var(--border-color)] object-cover" />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      
                      {/* Toolbar below User Message */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 mt-1 mr-1 text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(msg.content)}
                            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition cursor-pointer"
                            title="Copy text"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(index, msg.content)}
                            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteMessage && (
                            <button
                              type="button"
                              onClick={() => onDeleteMessage(msg.id)}
                              className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant Message Row */
                    <div className="assistant-msg-layout w-full relative group">
                      {/* Avatar Circle with Spinning Load Animation */}
                      <div className={`assistant-avatar transition-all duration-300 ${
                        generating && index === messages.length - 1 
                          ? 'animate-pulse border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm shadow-indigo-500/10' 
                          : ''
                      }`}>
                        <Cpu className={`w-3.5 h-3.5 ${
                          generating && index === messages.length - 1 
                            ? 'text-[var(--accent)] animate-spin [animation-duration:3s]' 
                            : 'text-[var(--text-secondary)]'
                        }`} />
                      </div>
                      
                      {/* Message Contents */}
                      <div className="flex-1 space-y-3 pr-4 min-w-0">
                        <div className={`space-y-2 text-[15px] leading-relaxed text-[var(--text-main)] select-text font-normal`}>
                          {/* Main Content */}
                          {(!msg.content && generating && index === messages.length - 1) ? (
                            <div className="flex flex-col gap-2 py-2">
                              <div className="flex gap-1 items-center bg-[var(--bg-hover)] px-3 py-2 rounded-full border border-[var(--border-color)] w-max">
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
                              </div>
                              {msg.loadingProgress !== undefined && msg.loadingProgress > 0 && msg.loadingProgress < 100 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-48 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                    <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${msg.loadingProgress}%` }}></div>
                                  </div>
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{msg.loadingProgress}% Loading...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              skipHtml={false}
                              components={{
                                code({node, inline, className, children, ...props}: any) {
                                  return <CodeBlock node={node} inline={inline} className={className} generating={generating} {...props}>{children}</CodeBlock>;
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li>{children}</li>,
                                h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
                                h4: ({children}) => <h4 className="text-sm font-bold mt-3 mb-1">{children}</h4>,
                                a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">{children}</a>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-[var(--border-color)] pl-4 italic text-[var(--text-muted)] my-2">{children}</blockquote>,
                                table: ({children}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-[var(--border-color)]">{children}</table></div>,
                                th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-hover)]/50">{children}</th>,
                                td: ({children}) => <td className="px-3 py-2 whitespace-nowrap text-sm border-t border-[var(--border-color)]">{children}</td>,
                              }}
                            >
                              {msg.content || ''}
                            </ReactMarkdown>
                          )}
                        </div>
 
                        {/* Toolbar below Assistant Messages */}
                        <div className="flex items-center gap-1 pt-1 mt-1 text-[var(--text-muted)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedText(msg.content);
                              setTimeout(() => setCopiedText(null), 2000);
                            }}
                            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md hover:text-[var(--text-main)] transition cursor-pointer"
                            title="Copy"
                          >
                            {copiedText === msg.content ? <Check className="w-4 h-4 text-[var(--accent)]" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => speakText(msg.content, msg.id)}
                            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md hover:text-[var(--text-main)] transition cursor-pointer"
                            title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                          >
                            {speakingId === msg.id ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedbacks(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'good' ? undefined : 'good' } as any))}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              feedbacks[msg.id] === 'good' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedbacks(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'bad' ? undefined : 'bad' } as any))}
                            className={`p-1.5 rounded-md transition cursor-pointer ${
                              feedbacks[msg.id] === 'bad' ? 'text-red-500 bg-red-500/10' : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          {onDeleteMessage && (
                            <button
                              type="button"
                              onClick={() => onDeleteMessage(msg.id)}
                              className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md hover:text-[var(--text-main)] transition cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {index === messages.length - 1 && !generating && (
                            <button
                              type="button"
                              onClick={onRegenerate}
                              className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md hover:text-[var(--text-main)] transition cursor-pointer"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {msg.tokensPerSecond != null && msg.tokensPerSecond > 0 && (
                            <div className="relative group/info ml-2 cursor-pointer">
                              <span className="text-[11px] font-semibold tracking-wide bg-[var(--bg-hover)] px-2 py-0.5 rounded-md hover:bg-[var(--border-color)] transition">{msg.tokensPerSecond.toFixed(1)} t/s</span>
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/info:block w-52 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg z-20 text-[11px] font-mono whitespace-nowrap">
                                <p className="mb-1 text-[var(--text-main)] font-semibold border-b border-[var(--border-color)] pb-1">Generation Stats</p>
                                <p className="mt-1 text-[var(--text-muted)]">Speed: <span className="text-[var(--accent)] font-semibold">{msg.tokensPerSecond.toFixed(1)} t/s</span></p>
                                {msg.generationStats && (
                                  <>
                                    <p className="text-[var(--text-muted)]">Total Time: <span className="text-[var(--text-main)]">{(msg.generationStats.totalTimeMs / 1000).toFixed(2)}s</span></p>
                                    <p className="text-[var(--text-muted)]">Prompt Tokens: <span className="text-[var(--text-main)]">{msg.generationStats.promptTokens}</span></p>
                                    <p className="text-[var(--text-muted)]">Completion: <span className="text-[var(--text-main)]">{msg.generationStats.completionTokens}</span></p>
                                  </>
                                )}
                                <p className="mt-2 pt-1 opacity-60 text-[9px] border-t border-[var(--border-color)]">
                                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} — {msg.timestamp}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
            {/* Invisible div to scroll to bottom, given enough height to clear absolute input */}
            <div ref={bottomRef} className="h-[200px]" />
          </div>
        )}
      </div>
      </div>

      {/* Persistent bottom input bar - FLOATING GLASS ISLAND */}
      <div className="pb-6 sm:pb-8 w-full pointer-events-none" style={{paddingTop:'40px', paddingLeft:'16px', paddingRight:'16px', paddingBottom:'max(32px, env(safe-area-inset-bottom))', zIndex:50, position:'absolute', bottom:0, left:0, right:0, background: 'linear-gradient(to top, var(--bg-main) 60%, transparent)'}}>
        
        {/* Scroll to bottom FAB */}
        {!atBottom && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+10px)] z-50 pointer-events-auto">
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-9 h-9 rounded-full bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
              title="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5 text-[var(--accent)]" />
            </button>
          </div>
        )}
          <input type="file" multiple accept="image/*,.pdf,.md,.txt,.csv,.json,.log,.ts,.js,.tsx,.jsx,.html,.css" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <div style={{maxWidth:'680px', margin:'0 auto'}}>
            {/* Image previews */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-2 no-scrollbar overflow-x-auto">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative group/img shrink-0">
                    <img src={img} alt="preview" style={{width:'36px', height:'36px', objectFit:'cover', borderRadius:'8px', border:'1px solid var(--border-color)'}} />
                    <button type="button" onClick={() => removeImage(i)} style={{position:'absolute', top:'-5px', right:'-5px', background:'#ef4444', color:'white', border:'none', borderRadius:'50%', width:'16px', height:'16px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:0}} className="group-hover/img:opacity-100 transition">
                      <X style={{width:'10px', height:'10px'}} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* @ Mention Prompt Dropdown */}
            {showPromptDropdown && filteredDropdownPrompts.length > 0 && (
              <div className="absolute bottom-full mb-3 left-4 right-4 pointer-events-auto max-w-2xl bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-premium overflow-hidden z-50">
                <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-hover)]/30 text-xs font-bold text-[var(--text-muted)] tracking-wider px-4 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Prompt Library (Press Tab/Enter to use)
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredDropdownPrompts.map((prompt, i) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => insertPrompt(prompt)}
                      className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-all duration-300 ease-out cursor-pointer ${i === selectedIndex ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]/50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13.5px] text-[var(--text-main)]">{prompt.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                          prompt.category === 'coding' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                          prompt.category === 'writing' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                          prompt.category === 'custom' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                          'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        }`}>{prompt.category}</span>
                      </div>
                      <span className="text-[12px] text-[var(--text-muted)] line-clamp-1">{prompt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The exact pill input */}
            <form
              onSubmit={handleSubmit}
              className="pointer-events-auto"
              style={{
                display:'flex', alignItems:'center',
                background:'var(--bg-input)',
                border:'1px solid var(--input-border)',
                borderRadius:'24px',
                padding:'10px 10px 10px 16px',
                boxShadow:'0 8px 30px rgba(0,0,0,0.12)',
                transition:'box-shadow 0.2s, border-color 0.2s',
                width:'100%',
              }}
            >
              {/* + attach — Fix 2: vision model guard */}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                style={{background:'none', border:'none', cursor:'pointer', padding:'4px', marginRight:'8px', color:'var(--text-main)', display:'flex', alignItems:'center', flexShrink:0}}
                title="Attach File or Image"
              >
                <Plus style={{width:'20px', height:'20px'}} />
              </button>

              {/* Text input */}
              <textarea
                ref={inputRef as any}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                placeholder={generating ? 'AI is thinking...' : PLACEHOLDERS[placeholderIdx]}
                disabled={generating}
                className="no-scrollbar"
                style={{flex:1, background:'transparent', border:'none', outline:'none', fontSize:'16px', color:'var(--text-main)', fontFamily:"'Inter', 'Segoe UI', sans-serif", padding:'2px 8px 2px 0', resize: 'none', overflowY: 'auto', maxHeight: '200px'}}
                onKeyDown={handleKeyDown}
              />
              {/* Fix 3: Character & Token counter */}
              {inputText.length > 0 && (
                <div className="flex flex-col text-[10px] text-[var(--text-muted)] px-2 shrink-0 text-right leading-tight">
                  <span className="font-medium text-[var(--accent)]">{inputText.length} chars</span>
                  <span className="opacity-70">~{Math.ceil(inputText.length / 4)} tokens</span>
                </div>
              )}

              {/* Mic */}
              <button
                type="button"
                onClick={toggleListening}
                style={{background:'none', border:'none', cursor:'pointer', padding:'6px', color: isListening ? '#ef4444' : 'var(--text-secondary)', display:'flex', alignItems:'center', flexShrink:0, marginRight:'6px'}}
                title={isListening ? 'Stop' : 'Voice'}
              >
                <Mic style={{width:'22px', height:'22px'}} className={isListening ? 'animate-pulse' : ''} />
              </button>

              {/* Blue circle send button */}
              <button
                type={generating ? 'button' : 'submit'}
                onClick={generating ? onStopGeneration : undefined}
                disabled={!inputText.trim() && selectedImages.length === 0 && !generating && !isListening}
                style={{
                  width:'40px', height:'40px', borderRadius:'50%',
                  background: generating ? '#ef4444' : (!inputText.trim() && selectedImages.length === 0 && !isListening) ? 'var(--border-color)' : 'var(--accent)',
                  border:'none', 
                  cursor: (!inputText.trim() && selectedImages.length === 0 && !generating && !isListening) ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'background 0.2s, opacity 0.2s',
                  opacity: (!inputText.trim() && selectedImages.length === 0 && !generating && !isListening) ? 0.5 : 1,
                }}
                title={generating ? 'Stop' : 'Send'}
              >
                {generating
                  ? <Square style={{width:'16px', height:'16px', fill:'var(--accent-fg)', color:'var(--accent-fg)'}} />
                  : <Send style={{width:'16px', height:'16px', color:'var(--accent-fg)'}} />}
              </button>
            </form>

            {/* Disclaimer */}
            <p style={{textAlign:'center', marginTop:'8px', fontSize:'12px', color:'var(--text-muted)'}}>
              Offline AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
    </div>
  );
}

