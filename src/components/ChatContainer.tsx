import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, Mic, Image, Edit3, Globe, ChevronDown, 
  HelpCircle, Copy, Check, RefreshCw, Cpu, User, Edit2, AlertCircle, Volume2, VolumeX, MicOff,
  PanelLeftOpen, PanelLeftClose, ThumbsUp, ThumbsDown, Trash2, Square, Brain, Code
} from 'lucide-react';
import { ChatMessage, InferenceSettings, GGUFModelInfo } from '../types';

interface ChatContainerProps {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  onRegenerate: () => void;
  onEditMessage: (index: number, newText: string) => void;
  activeModel: GGUFModelInfo | null;
  settings: InferenceSettings;
  generating: boolean;
  onOpenSettings: () => void;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onStopGeneration: () => void;
  availableModels: string[];
  onLoadModel: (fileName: string) => void;
}

export default function ChatContainer({
  messages,
  onSubmit,
  onRegenerate,
  onEditMessage,
  activeModel,
  settings,
  generating,
  onOpenSettings,
  sidebarOpen,
  onOpenSidebar,
  onStopGeneration,
  availableModels,
  onLoadModel
}: ChatContainerProps) {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  // Custom states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, 'good' | 'bad'>>({});
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Listen to library prompt selection event
  useEffect(() => {
    const handleInsertPrompt = (e: Event) => {
      const text = (e as CustomEvent).detail;
      setInputText(text);
    };
    window.addEventListener('insert-prompt', handleInsertPrompt);
    return () => window.removeEventListener('insert-prompt', handleInsertPrompt);
  }, []);

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || generating) return;
    onSubmit(inputText.trim());
    setInputText('');
  };

  const handleCopyCode = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
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

  // High precision syntax tokenizer for code highlighting
  const tokenizeAndHighlight = (code: string, lang: string) => {
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const tokens: string[] = [];
    
    // Save strings and comments to tokens array and replace with placeholders
    html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`[\s\S]*?`|\/\/.*|\/\*[\s\S]*?\*\/)/g, (match) => {
      tokens.push(match);
      return `__TOKEN_${tokens.length - 1}__`;
    });

    // Numbers: warm amber
    html = html.replace(/\b(\d+n?)\b/g, '<span class="text-amber-500">$1</span>');

    // Keywords: deep pink/purple
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'class', 'import', 'export', 
      'from', 'extends', 'constructor', 'private', 'public', 'readonly', 'interface', 
      'type', 'default', 'async', 'await', 'try', 'catch', 'if', 'else', 'for', 'while', 'fn', 'new', 'this'
    ];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    html = html.replace(keywordRegex, '<span class="text-purple-500 font-semibold">$1</span>');

    // Internal frameworks/type classes: bright titanium
    const builtins = [
      'string', 'number', 'boolean', 'bigint', 'any', 'void', 'Map', 'Set', 'Promise',
      'Float32Array', 'GPUAdapter', 'GPUDevice', 'GPUBuffer', 'GPUPipeline', 'ArrayBuffer',
      'Array', 'Object', 'console'
    ];
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    html = html.replace(builtinRegex, '<span class="text-indigo-400 font-medium">$1</span>');

    // Restore tokens
    html = html.replace(/__TOKEN_(\d+)__/g, (_, index) => {
      const match = tokens[parseInt(index, 10)];
      if (match.startsWith('//') || match.startsWith('/*')) {
        return `<span class="text-zinc-500 italic">${match}</span>`;
      }
      return `<span class="text-emerald-500">${match}</span>`;
    });

    return <code className="font-mono text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Splits message text blocks and GGUF markdown segments
  const parseMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const detectedLang = ['javascript', 'typescript', 'ts', 'js', 'html', 'css', 'python', 'rust', 'go', 'c++', 'json', 'bash', 'sh'].includes(firstLine.toLowerCase()) 
          ? firstLine 
          : 'code';
        
        const codeContent = detectedLang !== 'code' ? lines.slice(1).join('\n') : lines.join('\n');
        const blockId = `${msgId}-code-${index}`;

        return (
          <div key={index} className="my-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-hover)]/30 overflow-hidden shadow-sm font-mono w-full" id={blockId}>
            {/* Elegant dark toolbar inside codeblocks */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-hover)] text-[var(--text-muted)] border-b border-[var(--border-color)] text-[10px] font-mono select-none">
              <span className="uppercase text-[var(--text-main)] tracking-wider font-semibold">
                {detectedLang === 'ts' ? 'TYPESCRIPT' : detectedLang === 'js' ? 'JAVASCRIPT' : detectedLang}
              </span>
              
              <button
                type="button"
                onClick={() => handleCopyCode(codeContent, blockId)}
                className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition cursor-pointer text-[var(--text-muted)]"
                title="Copy codeblock"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold font-sans">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-sans">Copy</span>
                  </>
                )}
              </button>
            </div>
            {/* Code Body rendering block */}
            <div className="p-4 overflow-x-auto bg-transparent max-h-[420px]">
              <pre className="text-[var(--text-main)] select-text">
                {tokenizeAndHighlight(codeContent, detectedLang)}
              </pre>
            </div>
          </div>
        );
      } else {
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2 text-[15px] leading-relaxed text-[var(--text-main)] select-text font-normal">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm font-bold tracking-tight text-[var(--text-main)] pt-3 mb-1">
                    {line.slice(4).replace(/\*\*(.*?)\*\*/g, '$1')}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-bold text-[var(--text-main)] pt-4 mb-1">
                    {line.slice(3).replace(/\*\*(.*?)\*\*/g, '$1')}
                  </h3>
                );
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <ul key={lIdx} className="list-disc pl-5 my-1 space-y-1">
                    <li className="text-[var(--text-main)] font-normal">
                      {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
                    </li>
                  </ul>
                );
              }
              if (line.startsWith('1. ') || /^\d+\.\s/.test(line)) {
                return (
                  <ol key={lIdx} className="list-decimal pl-5 my-1 space-y-1">
                    <li className="text-[var(--text-main)] font-normal">
                      {line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                    </li>
                  </ol>
                );
              }
              
              // Apply basic inline bold replacements
              let formattedLine = line;
              const matches = line.match(/\*\*(.*?)\*\*/g);
              if (matches) {
                matches.forEach(m => {
                  const cleaned = m.slice(2, -2);
                  formattedLine = formattedLine.replace(m, `<strong class="font-bold text-[var(--text-main)]">${cleaned}</strong>`);
                });
              }

              return (
                <p 
                  key={lIdx} 
                  className="min-h-[1rem] text-[var(--text-main)]"
                  dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
              );
            })}
          </div>
        );
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] relative overflow-hidden" id="chat-container">
      
      {/* Top Header - Replicated ChatGPT model dropdown and options */}
      <header className="h-14 flex items-center justify-between px-4 bg-[var(--bg-main)] sticky top-0 z-20 select-none border-b border-transparent">
        <div className="flex items-center relative">
          {/* Collapse Open Menu Icon */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2 mr-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition cursor-pointer"
              title="Open Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
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
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Current Model</div>
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
                          {isActive && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
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
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-indigo-500 hover:bg-[var(--bg-hover)]/40 rounded-lg transition cursor-pointer"
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
          {/* Cleaned right side */}
        </div>
      </header>

      {/* Chat messages viewport */}
      <div className="flex-1 overflow-y-auto scroll-smooth transition-all duration-300 ease-in-out" id="messages-scroller">
        {settings.codexEnabled && (
          <div className="sticky top-0 z-20 flex justify-center mt-2 pointer-events-none">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse-slow backdrop-blur-md">
              <Code className="w-3.5 h-3.5" />
              Codex Engine Active
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto pt-6 pb-24 px-4 sm:px-6">
        {messages.length === 0 ? (
          /* Landing Screen matching mockup */
          <div className="max-w-xl mx-auto pt-28 space-y-10" id="empty-landing">
            {/* Center Heading */}
            <h2 className="landing-heading text-center text-[var(--text-main)]">
              Where should we begin?
            </h2>

            {/* Centered prompt uploader / input pill layout */}
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                <form onSubmit={handleSubmit} className="w-full bg-[var(--bg-input)] border border-[var(--input-border)] rounded-full shadow-sm flex items-center px-2 py-1.5 transition hover:shadow focus-within:shadow">
                  <button
                    type="button"
                    onClick={() => alert("File attachments coming soon!")}
                    className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer shrink-0 ml-1"
                    title="Attach File"
                  >
                    <Plus className="w-6 h-6" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask anything"
                    disabled={generating}
                    className="flex-1 bg-transparent border-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-[16px] outline-none px-2 font-sans font-normal"
                  />

                  <div className="flex items-center gap-1 shrink-0 mr-1">
                    {settings.enableDictation !== false && !inputText.trim() && !generating && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-1.5 rounded-full transition cursor-pointer ${isListening ? 'text-red-500 animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}
                        title={isListening ? "Stop listening" : "Voice input"}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      type={generating ? "button" : "submit"}
                      onClick={generating ? onStopGeneration : undefined}
                      disabled={!inputText.trim() && !generating && !isListening}
                      className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        generating 
                          ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                          : inputText.trim() || isListening
                            ? 'bg-[#007aff] text-white shadow-sm hover:bg-[#0062cc]'
                            : 'bg-[#e0e0e0] text-[#a0a0a0] dark:bg-[#333] dark:text-[#666]'
                      }`}
                      title={generating ? "Stop generating" : "Send"}
                    >
                      {generating ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Send className="w-4 h-4 transform -rotate-45 ml-0.5 mt-0.5" />
                      )}
                    </button>
                  </div>
                </form>
                <div className="text-[12px] text-[var(--text-muted)] mt-3 mb-1">
                  Offline AI can make mistakes. Check important info.
                </div>
              </div>

              {/* Suggestions row under input */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSuggestedPrompt("Write a custom WebGPU compute shader script to run element-wise addition of float32 arrays")}
                  className="suggestion-pill"
                >
                  <Brain className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>Brainstorm shader script</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestedPrompt("Write Fibonacci Memoized script in TypeScript")}
                  className="suggestion-pill"
                >
                  <Edit3 className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>Write or edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestedPrompt("Explain the architecture details of Llama 3.2 GGUF models running offline")}
                  className="suggestion-pill"
                >
                  <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>Look something up</span>
                </button>
              </div>
          </div>
        ) : (
          /* Chat Feed */
          <div className="max-w-2xl mx-auto space-y-6 py-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isEditing = editingMsgIndex === index;

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  id={`chat-msg-${msg.id}`}
                >
                  {isUser ? (
                    /* User Bubble */
                    <div className="flex flex-col items-end space-y-1.5 max-w-[80%] relative group">
                      <div className="user-msg-bubble">
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
                          msg.content
                        )}
                      </div>
                      
                      
                      {/* Toolbar below User Message */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 mt-1 mr-1 text-[var(--text-muted)] opacity-60 hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(msg.content, msg.id)}
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
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant Message Row */
                    <div className="assistant-msg-layout w-full relative group">
                      {/* Avatar Circle with Spinning Load Animation */}
                      <div className={`assistant-avatar transition-all duration-300 ${
                        generating && index === messages.length - 1 
                          ? 'animate-pulse border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/10' 
                          : ''
                      }`}>
                        <Cpu className={`w-3.5 h-3.5 ${
                          generating && index === messages.length - 1 
                            ? 'text-indigo-500 animate-spin [animation-duration:3s]' 
                            : 'text-[var(--text-secondary)]'
                        }`} />
                      </div>
                      
                      {/* Message Contents */}
                      <div className="flex-1 space-y-3 pr-4 min-w-0">
                        {msg.isCodex && (
                          <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider bg-indigo-500/10 text-indigo-500 uppercase select-none">
                            Codex Optimized Response
                          </div>
                        )}
                        <div className={`space-y-2 ${msg.isCodex ? 'font-mono text-[13.5px]' : ''}`}>
                          {msg.content ? parseMessageContent(msg.content, msg.id) : (
                            <div className="typing-bubble py-2">
                              <span className="typing-dot animate-pulse" />
                              <span className="typing-dot animate-pulse" />
                              <span className="typing-dot animate-pulse" />
                            </div>
                          )}
                        </div>
 
                        {/* Toolbar below Assistant Messages */}
                        <div className="flex items-center gap-1 pt-1 mt-1 text-[var(--text-muted)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedId(msg.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md hover:text-[var(--text-main)] transition cursor-pointer"
                            title="Copy"
                          >
                            {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
                              feedbacks[msg.id] === 'good' ? 'text-emerald-500 bg-emerald-500/10' : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
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
                          
                          {msg.tokensPerSecond && (
                            <div className="relative group/info ml-2 cursor-pointer">
                              <span className="text-[11px] font-semibold tracking-wide bg-[var(--bg-hover)] px-2 py-0.5 rounded-md hover:bg-[var(--border-color)] transition">More info</span>
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/info:block w-48 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-2 shadow-lg z-20 text-[11px] font-mono whitespace-nowrap">
                                <p>Rate: <span className="text-[var(--accent-color)] font-semibold">{msg.tokensPerSecond.toFixed(1)} t/s</span></p>
                                <p>Time: {msg.timestamp}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Persistent floating prompt tray at the bottom (only when chat is active) */}
      {messages.length > 0 && (
        <div className="p-4 bg-[var(--bg-main)] z-10 border-t border-transparent relative">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            <form onSubmit={handleSubmit} className="w-full bg-[var(--bg-input)] border border-[var(--input-border)] rounded-full shadow-sm flex items-center px-2 py-1.5 transition hover:shadow focus-within:shadow">
              <button
                type="button"
                onClick={() => alert("File attachments coming soon!")}
                className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer shrink-0 ml-1"
                title="Attach File"
              >
                <Plus className="w-6 h-6" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything"
                disabled={generating}
                className="flex-1 bg-transparent border-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-[16px] outline-none px-2 font-sans font-normal"
              />

              <div className="flex items-center gap-1 shrink-0 mr-1">
                {settings.enableDictation !== false && !inputText.trim() && !generating && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1.5 rounded-full transition cursor-pointer ${isListening ? 'text-red-500 animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                <button
                  type={generating ? "button" : "submit"}
                  onClick={generating ? onStopGeneration : undefined}
                  disabled={!inputText.trim() && !generating && !isListening}
                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    generating 
                      ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                      : inputText.trim() || isListening
                        ? 'bg-[#007aff] text-white shadow-sm hover:bg-[#0062cc]'
                        : 'bg-[#e0e0e0] text-[#a0a0a0] dark:bg-[#333] dark:text-[#666]'
                  }`}
                  title={generating ? "Stop generating" : "Send"}
                >
                  {generating ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <Send className="w-4 h-4 transform -rotate-45 ml-0.5 mt-0.5" />
                  )}
                </button>
              </div>
            </form>
            <div className="text-[12px] text-[var(--text-muted)] mt-2">
              Offline AI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
