import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import SettingsModal from './components/SettingsModal';
import LibraryModal from './components/LibraryModal';
import { ChatSession, ChatMessage, InferenceSettings, GGUFModelInfo } from './types';
import { Terminal, Database, HelpCircle, LayoutGrid, Eye, EyeOff, Loader2, Globe, DownloadCloud, ChevronDown, ChevronUp, Square, Cpu, HardDrive } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeModel, setActiveModel] = useState<GGUFModelInfo | null>(null);
  

  // Settings
  const [settings, setSettings] = useState<InferenceSettings>(() => {
    const saved = localStorage.getItem('gguf-inference-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          userName: parsed.userName || '',
          userDob: parsed.userDob || '',
          userDetails: parsed.userDetails || ''
        };
      } catch (e) {}
    }
    return {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1024,
      repeatPenalty: 1.1,
      systemPrompt: "You are an intelligent, helpful, and highly accurate AI assistant running locally. Your primary directive is to provide clear, direct, and factual answers. Format your responses elegantly using bold headings (##), bullet points (-), and concise sub-points where appropriate for high readability.",
      engine: 'server-assisted',
      codexEnabled: false,
      allocVramMb: 4096,
      floatPrecision: 'float16',
      appearance: 'system',
      contrast: 'standard',
      accentColor: 'blue',
      language: 'en',
      enableDictation: false,
      separateVoice: false,
      userName: '',
      userDob: '',
      userDetails: ''
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGithubPages = window.location.hostname === 'hemanthnanu-tech.github.io';
  const [showDemoPopup, setShowDemoPopup] = useState(isGithubPages);

  // Hardware Monitoring State
  const [hardwareStats, setHardwareStats] = useState<{ cpu: string, freeRam: string, totalRam: string } | null>(null);

  // Poll hardware stats if running locally
  useEffect(() => {
    if (isGithubPages) return;
    
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/system-stats');
        if (res.ok) {
          const data = await res.json();
          setHardwareStats(data);
        }
      } catch (e) {
        // silently fail
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [isGithubPages]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('gguf-inference-settings', JSON.stringify(settings));
  }, [settings]);

  // Sync theme class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync appearance setting to theme
  useEffect(() => {
    let activeTheme: 'dark' | 'light' = 'dark';
    if (settings.appearance === 'system') {
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      activeTheme = settings.appearance || 'dark';
    }
    setTheme(activeTheme);
  }, [settings.appearance]);

  // Listen to system theme updates
  useEffect(() => {
    if (settings.appearance !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.appearance]);

  // Sync accent color and contrast overrides
  useEffect(() => {
    const accentColors: Record<string, { main: string; hover: string }> = {
      blue: { main: '#007aff', hover: '#0062cc' },
      purple: { main: '#af52de', hover: '#963ec8' },
      teal: { main: '#30b0c7', hover: '#258ea2' },
      green: { main: '#34c759', hover: '#28a745' }
    };
    const activeAccent = accentColors[settings.accentColor] || accentColors.blue;
    document.documentElement.style.setProperty('--accent-color', activeAccent.main);
    document.documentElement.style.setProperty('--accent-color-hover', activeAccent.hover);

    if (settings.contrast === 'high') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings.accentColor, settings.contrast]);

  // Load initial settings, session history, and initial chat mock
  useEffect(() => {
    // Sessions load
    const savedSessions = localStorage.getItem('gguf-chat-sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        initializeDefaultSession();
      }
    } else {
      initializeDefaultSession();
    }

    // Check loaded model from backend
    const checkModel = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        
        let loadedModelName = "";
        if (data.status === 'healthy' && data.modelLoaded && data.modelInfo) {
          setActiveModel(data.modelInfo);
          loadedModelName = data.modelInfo.fileName;
        }

        // Fetch available models and auto-load if none active
        const modelsRes = await fetch('/api/models');
        const modelsData = await modelsRes.json();
        if (modelsData.models) {
          setAvailableModels(modelsData.models);
          
          if (!loadedModelName && modelsData.models.length > 0) {
            console.log("Auto-detecting and loading model silently:", modelsData.models[0]);
            handleLoadModel(modelsData.models[0], true);
          }
        }
      } catch (e) {
        console.error('Failed to get backend model status:', e);
      }
    };
    checkModel();


    // Dynamic hardware auto-tuning (only on first boot if settings don't exist yet)
    const autoTuneWebGPU = async () => {
      if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        setSettings(prev => ({
          ...prev,
          allocVramMb: 1024,
          floatPrecision: 'float32',
        }));
        return;
      }

      try {
        const gpu = (navigator as any).gpu;
        const adapter = await gpu.requestAdapter();
        if (!adapter) return;

        const float16Supported = adapter.features?.has('shader-f16') || false;
        let recommendedVram = 2048;

        const limits = adapter.limits || {};
        if (limits.maxBufferSize) {
          const limitsGB = limits.maxBufferSize / (1024 * 1024 * 1024);
          if (limitsGB >= 3.0) {
            recommendedVram = 4096;
          } else if (limitsGB < 1.1) {
            recommendedVram = 1024;
          }
        }

        setSettings(prev => ({
          ...prev,
          allocVramMb: recommendedVram,
          floatPrecision: float16Supported ? 'float16' : 'float32',
        }));
      } catch (err) {
        console.warn("Auto-tuning of browser limits bypassed:", err);
      }
    };

    const isFirstTime = !localStorage.getItem('gguf-inference-settings');
    if (isFirstTime) {
      autoTuneWebGPU();
    }
  }, []);

  // Sync sessions history to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('gguf-chat-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Sync separate voice read-out when generation stops
  useEffect(() => {
    if (!generating && sessions.length > 0 && settings.separateVoice) {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession && activeSession.messages.length > 0) {
        const lastMsg = activeSession.messages[activeSession.messages.length - 1];
        if (lastMsg.role === 'assistant') {
          window.speechSynthesis.cancel();
          const cleanText = lastMsg.content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/[*#_`~]/g, '')
            .trim();
          if (cleanText) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    }
  }, [generating, settings.separateVoice]);

  const initializeDefaultSession = () => {
    const defaultSession: ChatSession = {
      id: 'default-session-id',
      title: 'First Local Thread',
      messages: [],
      createdAt: new Date().toISOString(),
      modelName: activeModel?.name || 'Local GGUF Engine'
    };
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gguf-layout-theme', nextTheme);
    setSettings(prev => ({ ...prev, appearance: nextTheme }));
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Draft Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      modelName: activeModel?.name || 'Local GGUF Engine'
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    } else if (updated.length === 0) {
      // Re-create one empty if all are deleted
      const fresh: ChatSession = {
        id: 'fresh-default-id',
        title: 'New Session Context',
        messages: [],
        createdAt: new Date().toISOString(),
        modelName: activeModel?.name || 'Local GGUF Engine'
      };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };


  const handleToggleCodex = () => {
    setSettings(prev => ({ ...prev, codexEnabled: !prev.codexEnabled }));
  };

  const executeInference = async (promptText: string, updatedMessages: ChatMessage[], images?: string[]) => {
    setGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const responseId = `msg-res-${Date.now()}`;
    const dummyResponseMsg: ChatMessage = {
      id: responseId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      tokensPerSecond: 0,
      isCodex: settings.codexEnabled,
    };

    // Add blank assistant message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...updatedMessages, dummyResponseMsg] };
      }
      return s;
    }));

    let finalSystemPrompt = settings.systemPrompt;
    
    // Codex-specific instructions
    if (settings.codexEnabled) {
      finalSystemPrompt += `\n\n[SYSTEM DIRECTIVE: CODEX ENGINE ENABLED]\nYou are an expert Software Engineer and Architect. ONLY respond with exactly what is asked. DO NOT output extra conversational fluff. ALWAYS wrap your code implementations inside proper markdown code blocks. DO NOT output raw unformatted code first. If the user's request is vague or not specific, you MUST ask clarifying questions before writing any code.`;
    } else {
      finalSystemPrompt += `\n\n[SYSTEM DIRECTIVE: NORMAL MODE]\nYou are a helpful and conversational AI assistant. ONLY respond with exactly what is asked. Do not do anything extra. If the user's request is not specific, ask clarifying questions before answering.`;
    }

    if (settings.userName || settings.userDetails) {
      finalSystemPrompt += `\n\nContext about the user:\n`;
      if (settings.userName) finalSystemPrompt += `- Name: ${settings.userName}\n`;
      if (settings.userDob) finalSystemPrompt += `- Date of Birth: ${settings.userDob}\n`;
      if (settings.userDetails) finalSystemPrompt += `- Additional Details: ${settings.userDetails}\n`;
      finalSystemPrompt += `Address the user naturally. Use the above context to personalize your responses when relevant.`;
    }

    const lastUserMsg = updatedMessages[updatedMessages.length - 1];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          temperature: settings.temperature
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Backend error' }));
        throw new Error(errData.error || `Backend returned status ${res.status}`);
      }
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        
        let streamingBuffer = "";
        let isThinkingPhase = false;
        let thoughtContent = "";
        let finalContent = "";
        
        const startTime = Date.now();
        let tokenCount = 0;

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "data: [DONE]") break;
            if (trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.substring(6));
                if (data.error) {
                  // Show error to user
                  finalContent = `**Error**: ${data.error}`;
                }
                if (data.chunk) {
                  tokenCount++;
                  const timeElapsed = (Date.now() - startTime) / 1000;
                  const tps = timeElapsed > 0 ? tokenCount / timeElapsed : 0;
                  
                  streamingBuffer += data.chunk;
                  finalContent += data.chunk;
                  
                  // Empty streaming buffer since we appended it directly to finalContent
                  streamingBuffer = "";

                  setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                      const msgs = [...s.messages];
                      const targetIdx = msgs.findIndex(m => m.id === responseId);
                      if (targetIdx !== -1) {
                        // Strip think tags aggressively to remove all internal thought outputs
                        const displayContent = finalContent.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '');

                        msgs[targetIdx] = { 
                          ...msgs[targetIdx], 
                          content: displayContent, 
                          tokensPerSecond: parseFloat(tps.toFixed(2)) 
                        };
                      }
                      return { ...s, messages: msgs };
                    }
                    return s;
                  }));
                }
              } catch (e) {
                // Ignore parse errors on split chunks
              }
            }
          }
        }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Inference aborted by user.");
        return;
      }
      console.error("Inference Error:", err);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const msgs = [...s.messages];
          const targetIdx = msgs.findIndex(m => m.id === responseId);
          if (targetIdx !== -1) {
            msgs[targetIdx] = { ...msgs[targetIdx], content: `**Error**: ${err.message || "Failed to generate offline response."}` };
          }
          return { ...s, messages: msgs };
        }
        return s;
      }));
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = (text: string, images?: string[]) => {
    if (generating) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      images: images && images.length > 0 ? images : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const updatedMessages = [...currentSession.messages, userMsg];

    // Auto rename blank drafts
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0 && currentSession.title.startsWith('Draft Chat')) {
      updatedTitle = text.length > 22 ? `${text.substring(0, 22)}...` : text;
    }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { 
          ...s, 
          title: updatedTitle,
          messages: updatedMessages 
        };
      }
      return s;
    }));

    executeInference(text, updatedMessages, images);
  };

  const handleRegenerate = () => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0 || generating) return;

    // Remove last assistant reply if present, find the last user prompt
    const msgs = [...currentSession.messages];
    const lastMsg = msgs[msgs.length - 1];
    
    let lastUserPromptIdx = -1;
    if (lastMsg.role === 'assistant') {
      msgs.pop(); // discard old output
    }

    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserPromptIdx = i;
        break;
      }
    }

    if (lastUserPromptIdx === -1) return;

    const promptText = msgs[lastUserPromptIdx].content;
    const cleanStack = msgs.slice(0, lastUserPromptIdx + 1);

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: cleanStack };
      }
      return s;
    }));

    executeInference(promptText, cleanStack);
  };

  const handleEditMessage = (index: number, newText: string) => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession || index >= currentSession.messages.length || generating) return;

    // Discard any message trailing this edited message
    const trimmedStack = currentSession.messages.slice(0, index);
    const editedUserMsg: ChatMessage = {
      ...currentSession.messages[index],
      content: newText
    };

    const nextStack = [...trimmedStack, editedUserMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: nextStack };
      }
      return s;
    }));

    executeInference(newText, nextStack);
  };

  const handleLoadModel = async (fileName: string, silent: boolean = false) => {
    if (!silent) {
      const confirmLoad = window.confirm(`Are you sure you want to load the model: ${fileName}? This will unload the current model and may take a few moments.`);
      if (!confirmLoad) return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGenerating(false);
    
    if (!silent) {
      setIsModelLoading(true);
    }
    
    try {
      const res = await fetch('/api/load-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      const data = await res.json();
      if (data.success && data.modelInfo) {
        setActiveModel(data.modelInfo);
        if (!silent) {
          // Success handled silently or via a subtle toast if preferred.
        }
      } else {
        if (!silent) {
          alert("Failed to load model file. Verify it is inside the models/ folder.");
        }
      }
    } catch (e) {
      console.error(e);
      if (!silent) {
        alert("Error communicating with backend model loader.");
      }
    } finally {
      if (!silent) {
        setIsModelLoading(false);
      }
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerating(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeSessionMessages = activeSession ? activeSession.messages : [];

  return (
    <div className={`h-screen w-screen flex transition-all relative overflow-hidden ${theme === 'dark' ? 'dark' : ''}`} id="app-root">
      
      {/* Fullscreen Loading Overlay for Model Switching */}
      {isModelLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
             <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
             <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Loading Model...</h3>
             <p className="text-sm text-[var(--text-muted)]">Please wait while the AI model is being loaded into memory. This may take up to a minute depending on hardware.</p>
          </div>
        </div>
      )}

      {/* Dynamic theme colors layout */}
      <div className="flex w-full h-full overflow-hidden select-text relative z-10">
        {/* Left Side menu */}
        {sidebarOpen && (
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            codexEnabled={settings.codexEnabled}
            onToggleCodex={handleToggleCodex}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onCloseSidebar={() => setSidebarOpen(false)}
            onOpenLibrary={() => setLibraryOpen(true)}
            settings={settings}
          />
        )}

        {/* Center Chat Viewport & GGUF inspector right column */}
        <div className="flex-1 flex h-full overflow-hidden min-w-0">
          
          <div className="flex-1 flex flex-col h-full min-w-0 relative">
            <ChatContainer
              messages={activeSessionMessages}
              onSubmit={handleSendMessage}
              onRegenerate={handleRegenerate}
              onEditMessage={handleEditMessage}
              activeModel={activeModel}
              settings={settings}
              generating={generating}
              onOpenSettings={() => setIsSettingsOpen(true)}
              sidebarOpen={sidebarOpen}
              onOpenSidebar={() => setSidebarOpen(true)}
              onStopGeneration={handleStopGeneration}
              availableModels={availableModels}
              onLoadModel={handleLoadModel}
            />

            {/* Hardware Monitor Floating Widget */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-sm px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono text-[var(--text-main)]">
                <div className="flex items-center gap-1.5" title="CPU Load">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{hardwareStats?.cpu || '0%'}</span>
                </div>
                <div className="w-[1px] h-3 bg-[var(--border-color)]" />
                <div className="flex items-center gap-1.5" title="Free RAM">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{hardwareStats?.freeRam ? `${hardwareStats.freeRam} Free` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Preferences Dialog card modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        activeModel={activeModel}
        availableModels={availableModels}
        onLoadModel={handleLoadModel}
      />

      {/* Prompt Library Modal overlay */}
      <LibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelectPrompt={(text) => {
          window.dispatchEvent(new CustomEvent('insert-prompt', { detail: text }));
        }}
      />



      {/* Demo UI Preview Modal */}
      {showDemoPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-6 text-center border-b border-[var(--border-color)]">
              <div className="w-14 h-14 rounded-full bg-[var(--bg-main)] shadow-md flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                <Globe className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)]" style={{ fontFamily: "'Inter', sans-serif" }}>Live Web Demo</h2>
              <p className="text-[var(--text-muted)] text-[13px] mt-2">
                Running in your browser. No installation required.
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-[var(--bg-hover)]/60 p-4 rounded-xl text-sm leading-relaxed text-[var(--text-secondary)] border border-[var(--border-color)]">
                This is a front-end UI showcase. Because running massive AI models in the browser can freeze laptops, we've disabled browser-based downloads.
                <br/><br/>
                If you want to chat right now, go to <strong>Settings {'>'} Model Settings</strong> and enter a free <strong>Google Gemini API Key</strong>. 
                <br/><br/>
                Otherwise, you can just click around to explore the UI design!
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowDemoPopup(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  Enter API Key in Settings
                </button>
                <button
                  onClick={() => setShowDemoPopup(false)}
                  className="w-full py-2.5 bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-medium rounded-xl transition cursor-pointer"
                >
                  Just View UI (No Chat)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
