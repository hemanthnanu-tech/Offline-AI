import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, Sparkles, Send, Brain, Edit3, Image as ImageIcon, Check, Download, AlertCircle, Copy, Mic, Square, CheckSquare, Plus, RefreshCw, ChevronDown, ChevronUp, Loader2, Trash2, ShieldAlert, Cpu, HardDrive, Volume2, VolumeX, ThumbsUp, ThumbsDown, Database, Terminal, Code, HelpCircle, Eye, EyeOff, LayoutGrid, Globe, X, MicOff, PanelLeftOpen, PanelLeftClose, User, Edit2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage, InferenceSettings, GGUFModelInfo } from '../types';

interface ChatContainerProps {
  messages: ChatMessage[];
  onSubmit: (text: string, images?: string[]) => void;
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
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [editingMsgIndex, setEditingMsgIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, 'good' | 'bad'>>({});
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when generation completes
  useEffect(() => {
    if (!generating && inputRef.current && !isListening) {
      // Small timeout ensures focus happens after re-render completes
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [generating, isListening]);

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
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (isNearBottom || messages.length <= 1) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, generating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || generating) return;
    
    // Instead of passing images to onSubmit, we will dispatch an event or modify onSubmit.
    // Wait, onSubmit only takes string right now. Let's pass it via window.dispatchEvent or we must change onSubmit signature.
    // Let's modify the onSubmit prop signature in ChatContainer to accept images. 
    onSubmit(inputText.trim(), selectedImages);
    setInputText('');
    setSelectedImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
      <header className="h-14 flex items-center justify-between px-4 bg-[var(--bg-main)]/80 backdrop-blur-xl sticky top-0 z-20 select-none border-b border-transparent transition-colors">
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
            {activeModel && (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Current Model</div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch('/api/unload', { method: 'POST' });
                            alert('Memory cleaned and model unloaded.');
                            window.location.reload();
                          } catch (err) {
                            console.error(err);
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
      <div ref={scrollViewportRef} className="flex-1 overflow-y-auto scroll-smooth transition-all duration-300 ease-in-out" id="messages-scroller">
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
          /* Exact ChatGPT replica - home screen */
          <div className="flex flex-col items-center justify-center" style={{minHeight:'65vh'}} id="empty-landing">
            <h2 style={{fontSize:'28px', fontWeight:600, color:'var(--text-main)', marginBottom:'32px', textAlign:'center', letterSpacing:'-0.5px', fontFamily:"'Inter', 'Segoe UI', sans-serif"}}>
              What's on your mind today?
            </h2>

            <div className="w-full px-4" style={{maxWidth:'680px'}}>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

              {/* The exact pill input from the reference image */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display:'flex', alignItems:'center',
                  background:'var(--bg-input)',
                  border:'1px solid var(--input-border)',
                  borderRadius:'999px',
                  padding:'10px 10px 10px 16px',
                  boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
                  transition:'box-shadow 0.2s, border-color 0.2s',
                  width:'100%',
                }}
              >
                {/* + attach button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{background:'none', border:'none', cursor:'pointer', padding:'4px', marginRight:'8px', color:'var(--text-main)', display:'flex', alignItems:'center', flexShrink:0}}
                  title="Attach"
                >
                  <Plus style={{width:'20px', height:'20px'}} />
                </button>

                {/* Image previews */}
                {selectedImages.length > 0 && (
                  <div className="flex gap-1.5 mr-2 overflow-x-auto no-scrollbar">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative group/img shrink-0">
                        <img src={img} alt="preview" style={{width:'28px', height:'28px', objectFit:'cover', borderRadius:'8px', border:'1px solid var(--border-color)'}} />
                        <button type="button" onClick={() => removeImage(i)} style={{position:'absolute', top:'-4px', right:'-4px', background:'#ef4444', color:'white', borderRadius:'50%', border:'none', padding:'1px', cursor:'pointer', display:'flex', opacity:0}} className="group-hover/img:opacity-100 transition">
                          <X style={{width:'10px', height:'10px'}} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask anything"
                  disabled={generating}
                  style={{flex:1, background:'transparent', border:'none', outline:'none', fontSize:'16px', color:'var(--text-main)', fontFamily:"'Inter', 'Segoe UI', sans-serif", padding:'2px 8px 2px 0'}}
                />

                {/* Mic button - always visible */}
                <button
                  type="button"
                  onClick={toggleListening}
                  style={{background:'none', border:'none', cursor:'pointer', padding:'6px', color: isListening ? '#ef4444' : 'var(--text-secondary)', display:'flex', alignItems:'center', flexShrink:0, marginRight:'6px'}}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <Mic style={{width:'22px', height:'22px'}} className={isListening ? 'animate-pulse' : ''} />
                </button>

                {/* Blue circle send button — exact match to reference */}
                <button
                  type={generating ? 'button' : 'submit'}
                  onClick={generating ? onStopGeneration : undefined}
                  disabled={(!inputText.trim() && selectedImages.length === 0) && !generating && !isListening}
                  style={{
                    width:'40px', height:'40px', borderRadius:'50%',
                    background: generating ? '#ef4444' : '#007aff',
                    border:'none', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0, transition:'background 0.2s',
                    opacity: (!inputText.trim() && selectedImages.length === 0 && !generating && !isListening) ? 0.45 : 1,
                  }}
                  title={generating ? 'Stop' : 'Send'}
                >
                  {generating
                    ? <Square style={{width:'16px', height:'16px', fill:'white', color:'white'}} />
                    : <Send style={{width:'16px', height:'16px', color:'white'}} />}
                </button>
              </form>

              {/* Disclaimer */}
              <p style={{textAlign:'center', marginTop:'12px', fontSize:'13px', color:'var(--text-muted)', fontFamily:"'Inter', 'Segoe UI', sans-serif"}}>
                Offline AI can make mistakes. Check important info.
              </p>


              {/* Suggestion pills */}
              <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginTop:'20px'}}>
                <button type="button" onClick={() => handleSuggestedPrompt('Create an image of a futuristic city')} className="suggestion-pill"><ImageIcon style={{width:'14px', height:'14px'}} /> Create an image</button>
                <button type="button" onClick={() => handleSuggestedPrompt('Write a Python script to sort a list of dictionaries by key')} className="suggestion-pill"><Edit3 style={{width:'14px', height:'14px'}} /> Write or edit</button>
                <button type="button" onClick={() => handleSuggestedPrompt('Explain how the internet works simply')} className="suggestion-pill"><Globe style={{width:'14px', height:'14px'}} /> Look something up</button>
              </div>
            </div>
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
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-2 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-bold font-mono tracking-wider text-indigo-400 uppercase select-none shadow-sm">
                            <Code className="w-3 h-3" />
                            Codex Optimized
                          </div>
                        )}
                        <div className={`space-y-2 ${msg.isCodex ? 'font-mono text-[13.5px]' : ''} text-[15px] leading-relaxed text-[var(--text-main)] select-text font-normal`}>
                          {/* Main Content */}
                          {(!msg.content && generating && index === messages.length - 1) ? (
                            <div className="flex items-center gap-1.5 py-2">
                              <div className="flex gap-1 items-center bg-[var(--bg-hover)] px-3 py-2 rounded-full border border-[var(--border-color)]">
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
                              </div>
                            </div>
                          ) : msg.content && (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({node, inline, className, children, ...props}: any) {
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
                                            onClick={() => handleCopyCode(codeString)}
                                            className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition cursor-pointer text-[var(--text-muted)]"
                                            title="Copy codeblock"
                                          >
                                            {copiedText === codeString ? (
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
                                        <div className="p-4 overflow-x-auto bg-[#1e1e1e] max-h-[420px] text-xs leading-relaxed text-[#d4d4d4] rounded-b-xl">
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
                                              customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
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
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li>{children}</li>,
                                h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
                                h4: ({children}) => <h4 className="text-sm font-bold mt-3 mb-1">{children}</h4>,
                                a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{children}</a>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-[var(--border-color)] pl-4 italic text-[var(--text-muted)] my-2">{children}</blockquote>,
                                table: ({children}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-[var(--border-color)]">{children}</table></div>,
                                th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-hover)]/50">{children}</th>,
                                td: ({children}) => <td className="px-3 py-2 whitespace-nowrap text-sm border-t border-[var(--border-color)]">{children}</td>,
                              }}
                            >
                              {msg.content}
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
                            {copiedText === msg.content ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
                </motion.div>
              );
            })}
            </AnimatePresence>
            {/* Invisible div to scroll to bottom */}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Persistent bottom input bar - exact ChatGPT replica when in chat */}
      {messages.length > 0 && (
        <div style={{padding:'20px 16px 16px', background:'transparent', zIndex:10, position:'relative'}}>
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
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

            {/* The exact pill input */}
            <form
              onSubmit={handleSubmit}
              style={{
                display:'flex', alignItems:'center',
                background:'var(--bg-input)',
                border:'1px solid var(--input-border)',
                borderRadius:'999px',
                padding:'10px 10px 10px 16px',
                boxShadow:'0 8px 30px rgba(0,0,0,0.12)',
                transition:'box-shadow 0.2s, border-color 0.2s',
                width:'100%',
              }}
            >
              {/* + attach */}
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{background:'none', border:'none', cursor:'pointer', padding:'4px', marginRight:'8px', color:'var(--text-main)', display:'flex', alignItems:'center', flexShrink:0}} title="Attach Image">
                <Plus style={{width:'20px', height:'20px'}} />
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything"
                disabled={generating}
                style={{flex:1, background:'transparent', border:'none', outline:'none', fontSize:'16px', color:'var(--text-main)', fontFamily:"'Inter', 'Segoe UI', sans-serif", padding:'2px 8px 2px 0'}}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !generating) { e.preventDefault(); handleSubmit(e as any); } }}
              />

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
                disabled={(!inputText.trim() && selectedImages.length === 0) && !generating && !isListening}
                style={{
                  width:'40px', height:'40px', borderRadius:'50%',
                  background: generating ? '#ef4444' : '#007aff',
                  border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, transition:'background 0.2s',
                  opacity: (!inputText.trim() && selectedImages.length === 0 && !generating && !isListening) ? 0.45 : 1,
                }}
                title={generating ? 'Stop' : 'Send'}
              >
                {generating
                  ? <Square style={{width:'16px', height:'16px', fill:'white', color:'white'}} />
                  : <Send style={{width:'16px', height:'16px', color:'white'}} />}
              </button>
            </form>

            {/* Disclaimer */}
            <p style={{textAlign:'center', marginTop:'8px', fontSize:'12px', color:'var(--text-muted)'}}>
              Offline AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
