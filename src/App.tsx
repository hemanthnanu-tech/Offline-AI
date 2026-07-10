import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import SettingsModal from './components/SettingsModal';
import LibraryModal from './components/LibraryModal';
import { ChatSession, ChatMessage, InferenceSettings, GGUFModelInfo } from './types';
import {  Terminal, Database, HelpCircle, LayoutGrid, Eye, EyeOff, Loader2, Globe, DownloadCloud, ChevronDown, ChevronUp, Square, Cpu, HardDrive, AlertCircle , X } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeModel, setActiveModel] = useState<GGUFModelInfo | null>(null);
  const [activeVisionModel, setActiveVisionModel] = useState<GGUFModelInfo | null>(null);
  
  // Heartbeat system to keep the background server alive
  useEffect(() => {
    const sendHeartbeat = () => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat(); // initial ping
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, []);
  

  // Settings
  const [settings, setSettings] = useState<InferenceSettings>(() => {
    const saved = localStorage.getItem('gguf-inference-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migration: Update default system prompt to include anti-hallucination guardrails
        const oldDefaultPrompt = "You are an intelligent, helpful, and highly accurate AI assistant running locally. Your primary directive is to provide clear, direct, and factual answers. Format your responses elegantly using bold headings (##), bullet points (-), and concise sub-points where appropriate for high readability.";
        if (parsed.systemPrompt === oldDefaultPrompt) {
            parsed.systemPrompt = "You are an intelligent, helpful, and highly accurate AI assistant running locally. Your primary directive is to provide clear, direct, and factual answers. IF YOU DO NOT KNOW THE ANSWER, OR LACK SPECIFIC DATA, YOU MUST EXPLICITLY STATE \"I do not have that information\" RATHER THAN GUESSING. Never hallucinate facts, specifications, or data. Format your responses elegantly using bold headings (##), bullet points (-), and concise sub-points where appropriate for high readability.";
        }
        if (parsed.temperature === 0.7) {
            parsed.temperature = 0.3;
        }

        return {
          ...parsed,
          userName: parsed.userName || '',
          userDob: parsed.userDob || '',
          userDetails: parsed.userDetails || '',
          assistantName: parsed.assistantName || 'Assistant',
          autoScroll: parsed.autoScroll !== false,
          topK: parsed.topK || 40,
          contextSize: parsed.contextSize || 4096
        };
      } catch (e) {}
    }
    return {
      temperature: 0.3,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      contextSize: 4096,
      repeatPenalty: 1.1,
      systemPrompt: "You are an intelligent, helpful, and highly accurate AI assistant running locally. Your primary directive is to provide clear, direct, and factual answers. IF YOU DO NOT KNOW THE ANSWER, OR LACK SPECIFIC DATA, YOU MUST EXPLICITLY STATE \"I do not have that information\" RATHER THAN GUESSING. Never hallucinate facts, specifications, or data. Format your responses elegantly using bold headings (##), bullet points (-), and concise sub-points where appropriate for high readability.",
      engine: 'server-assisted',
      allocVramMb: 4096,
      floatPrecision: 'float16',
      appearance: 'system',
      contrast: 'standard',
      accentColor: 'blue',
      language: 'en',
      enableDictation: false,
      separateVoice: false,
      useGPU: false,
      userName: '',
      assistantName: 'Assistant',
      userDob: '',
      userDetails: '',
      autoScroll: true
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [hideNoModelBanner, setHideNoModelBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
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

  const refreshModelsList = async () => {
    try {
      const modelsRes = await fetch('/api/models');
      const modelsData = await modelsRes.json();
      if (modelsData.modelDetails) {
        setAvailableModels(modelsData.modelDetails);
      }
    } catch (e) {
      console.error("Failed to refresh models:", e);
    }
  };

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
    const accentColors: Record<string, { main: string; hover: string; fg: string }> = {
      blue: { main: '#007aff', hover: '#0062cc', fg: '#ffffff' },
      purple: { main: '#af52de', hover: '#963ec8', fg: '#ffffff' },
      teal: { main: '#30b0c7', hover: '#258ea2', fg: '#ffffff' },
      green: { main: '#34c759', hover: '#28a745', fg: '#ffffff' },
      monochrome: theme === 'dark' 
        ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' }
        : { main: '#000000', hover: '#374151', fg: '#ffffff' },
      brown: { main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' }
    };
    const activeAccent = accentColors[settings.accentColor] || accentColors.blue;
    document.documentElement.style.setProperty('--accent', activeAccent.main);
    document.documentElement.style.setProperty('--accent-hover', activeAccent.hover);
    document.documentElement.style.setProperty('--accent-fg', activeAccent.fg);

    if (settings.contrast === 'high') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    }, [settings.accentColor, settings.contrast, theme]);

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
        if ((data.modelLoaded === true || data.status === 'healthy') && data.modelLoaded && data.modelInfo) {
          setActiveModel(data.modelInfo);
          setActiveVisionModel(data.hasVisionSupport ? { name: 'Vision Enabled', fileName: 'mmproj-enabled' } as any : null);
          loadedModelName = data.modelInfo.fileName;
        }

        // Fetch available models and auto-load if none active
        const modelsRes = await fetch('/api/models');
        const modelsData = await modelsRes.json();
          if (modelsData.models) {
            setAvailableModels(modelsData.models);
            
            if (!loadedModelName && modelsData.models.length > 0) {
              let bestModel = modelsData.models[0];
              if (modelsData.modelDetails && modelsData.modelDetails.length > 0) {
                 const sortedModels = [...modelsData.modelDetails].sort((a: any, b: any) => a.sizeBytes - b.sizeBytes);
                 const smallModels = sortedModels.filter((m: any) => m.sizeBytes < 5 * 1024 * 1024 * 1024);
                 if (smallModels.length > 0) {
                   bestModel = smallModels[smallModels.length - 1].name;
                 } else {
                   bestModel = sortedModels[0].name;
                 }
              }
              console.log("Auto-detecting and loading best model silently:", bestModel);
              handleLoadModel(bestModel, true);
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

  const createNewSession = useCallback(() => {
    const defaultModel = availableModels.length > 0 ? availableModels[0] : 'Meta-Llama-3-8B-Instruct-Q4_K_M.gguf';
    
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      modelName: activeModel ? activeModel.fileName || activeModel.name : defaultModel
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [availableModels, activeModel]);

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

  const handleDeleteMessage = (msgId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: s.messages.filter(m => m.id !== msgId) };
      }
      return s;
    }));
  };


  const executeInference = async (sessionId: string, updatedMessages: ChatMessage[], images?: string[]) => {
    setGenerating(true);
    let watchdogTimer = setTimeout(() => {
        setGenerating(false);
        console.warn("Watchdog: Inference timed out. Resetting generating state.");
    }, 180000); // 3-minute max global timeout safety catch
    

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const responseId = `msg-res-${Date.now()}`;
    const dummyResponseMsg: ChatMessage = {
      id: responseId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      tokensPerSecond: 0,
    };

    // Add blank assistant message
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...updatedMessages, dummyResponseMsg] };
      }
      return s;
    }));

    let finalSystemPrompt = settings.systemPrompt;
    
    finalSystemPrompt += `\n\n[SYSTEM DIRECTIVE: NORMAL MODE]\nYou are a helpful and conversational AI assistant. ONLY respond with exactly what is asked. Do not do anything extra. If the user's request is not specific, ask clarifying questions before answering.`;

    if (settings.userName || settings.userDetails) {
      finalSystemPrompt += `\n\nContext about the user:\n`;
      if (settings.userName) finalSystemPrompt += `- Name: ${settings.userName}\n`;
      if (settings.userDob) finalSystemPrompt += `- Date of Birth: ${settings.userDob}\n`;
      if (settings.userDetails) finalSystemPrompt += `- Additional Details: ${settings.userDetails}\n`;
      finalSystemPrompt += `Address the user naturally. Use the above context to personalize your responses when relevant.`;
    }

    const messagesWithSystem: ChatMessage[] = [
      { id: 'sys-0', role: 'system', content: finalSystemPrompt, timestamp: '' },
      ...updatedMessages
    ];

    const lastUserMsg = updatedMessages[updatedMessages.length - 1];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesWithSystem,
          temperature: settings.temperature,
          topP: settings.topP,
          topK: settings.topK,
          maxTokens: settings.maxTokens
        }),
        signal: controller.signal
      });

      // Slot polling removed - endpoint not required

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Backend error' }));
        throw new Error(errData.error || `Backend returned status ${res.status}`);
      }
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        

        let finalContent = "";
        
        const startTime = Date.now();
        let tokenCount = 0;
        let streamBuffer = ""; // Accumulate incomplete chunks here
        let wasReasoning = false;

        while (reader) {
          
          clearTimeout(watchdogTimer);
          watchdogTimer = setTimeout(() => {
              setGenerating(false);
              console.warn("Watchdog: Stream hung. Resetting generating state.");
              if (abortControllerRef.current) abortControllerRef.current.abort();
          }, 60000); // 60-second chunk timeout
          
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunkStr = decoder.decode(value, { stream: true });
          streamBuffer += chunkStr;
          
          const lines = streamBuffer.split("\n");
          // Keep the last element in the buffer because it might be an incomplete line
          streamBuffer = lines.pop() || "";
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (trimmedLine === "data: [DONE]") break;
            if (trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.substring(6));
                if (data.error) {
                  // Show error to user
                  finalContent = `**Error**: ${data.error}`;
                }
                
                // Support both OpenAI format (native llama.cpp) and legacy format (from old server.ts)
                let chunkContent = "";
                const delta = data.choices?.[0]?.delta;
                
                if (delta !== undefined) {
                  if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
                    wasReasoning = true;
                    if (!finalContent.includes('<think>')) {
                      chunkContent += '<think>\n' + delta.reasoning_content;
                    } else {
                      chunkContent += delta.reasoning_content;
                    }
                  }
                  if (delta.content !== undefined && delta.content !== null) {
                    if (wasReasoning) {
                      chunkContent += '\n</think>\n' + delta.content;
                      wasReasoning = false;
                    } else {
                      chunkContent += delta.content;
                    }
                  }
                } else if (data.chunk !== undefined && data.chunk !== null) {
                  chunkContent = data.chunk;
                }
                  
                if (chunkContent !== "") {
                  tokenCount++;
                  const timeElapsed = Math.max(0.01, (Date.now() - startTime) / 1000);
                  const tps = tokenCount / timeElapsed;
                  
                  finalContent += chunkContent;
                  
                  setSessions(prev => prev.map(s => {
                    if (s.id === sessionId) {
                      const msgs = [...s.messages];
                      const targetIdx = msgs.findIndex(m => m.id === responseId);
                      if (targetIdx !== -1) {
                          // Render thoughts natively in text to ensure streaming works perfectly
                          let displayContent = finalContent
                            .replace(/<think>/g, '---\n**🧠 Thought Process:**\n\n')
                            .replace(/<\/think>/g, '\n\n---\n\n');

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
                
                if (data.usage || data.timings) {
                  setSessions(prev => prev.map(s => {
                    if (s.id === sessionId) {
                      const msgs = [...s.messages];
                      const targetIdx = msgs.findIndex(m => m.id === responseId);
                      if (targetIdx !== -1) {
                        const promptTokens = data.usage?.prompt_tokens || 0;
                        const completionTokens = data.usage?.completion_tokens || tokenCount;
                        const finalTotalTimeMs = Math.max(1, Date.now() - startTime);
                        const totalTimeMs = (data.timings?.prompt_ms || 0) + (data.timings?.predicted_ms || 0) || finalTotalTimeMs;
                        const tps = data.timings?.predicted_per_second || (completionTokens / (finalTotalTimeMs / 1000));
                        msgs[targetIdx] = {
                          ...msgs[targetIdx],
                          generationStats: {
                            promptTokens,
                            completionTokens,
                            totalTokens: promptTokens + completionTokens,
                            tokensPerSecond: parseFloat(tps.toFixed(2)),
                            totalTimeMs
                          }
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
        // User stopped generation — remove the empty placeholder message
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const msgs = s.messages.filter(m => m.id !== responseId || m.content.trim() !== '');
            return { ...s, messages: msgs };
          }
          return s;
        }));
        return;
      }
      console.error("Inference Error:", err);
      const isConnectionError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('fetch');
      const errorMessage = isConnectionError ? 
        "⚠️ **Connection Lost**: The local AI engine is unreachable. Please wait a moment for the model to finish loading or restart the server." 
        : `⚠️ **Generation Error**: ${err.message || "Failed to synthesize offline response."}`;

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const msgs = [...s.messages];
          const targetIdx = msgs.findIndex(m => m.id === responseId);
          if (targetIdx !== -1) {
            msgs[targetIdx] = { ...msgs[targetIdx], content: errorMessage };
          }
          return { ...s, messages: msgs };
        }
        return s;
      }));
    } finally {
      clearTimeout(watchdogTimer);
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = useCallback((text: string, images?: string[]) => {
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
    if (currentSession.messages.length === 0) {
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

    executeInference(activeSessionId, updatedMessages, images);
  }, [generating, sessions, activeSessionId, executeInference]);

  const handleRegenerate = useCallback(() => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0 || generating) return;

    // Remove last assistant reply if present, find the last user prompt
    const msgs = [...currentSession.messages];
    const lastMsg = msgs[msgs.length - 1];
    
    let lastUserPromptIdx = -1;
    if (lastMsg.role === 'assistant') {
      msgs.pop(); // remove assistant message
      lastUserPromptIdx = msgs.length - 1;
    } else {
      lastUserPromptIdx = msgs.length - 1;
    }

    if (lastUserPromptIdx >= 0) {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: msgs };
        }
        return s;
      }));
      executeInference(activeSessionId, msgs);
    }
  }, [sessions, activeSessionId, generating, executeInference]);

  const clearAllChats = useCallback(() => {
    if (confirm("Are you sure you want to delete ALL chat sessions? This action cannot be undone.")) {
      setSessions([]);
      setActiveSessionId('');
    }
  }, []);

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

    executeInference(activeSessionId, nextStack);
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
        setActiveVisionModel(data.hasVisionSupport ? { name: 'Vision Enabled', fileName: 'mmproj-enabled' } as any : null);
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
    }
    setGenerating(false);
    // Also inform backend to clear its processing lock
    fetch('/api/stop', { method: 'POST' }).catch(() => {});
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeSessionMessages = activeSession ? activeSession.messages : [];

  return (
    <div className="h-[100dvh] w-screen flex transition-all relative overflow-hidden" id="app-root">
      
      {/* Fullscreen Loading Overlay for Model Switching */}
      {(!activeModel && !isModelLoading && !hideNoModelBanner) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-[0_8px_32px_rgba(239,68,68,0.15)] px-6 py-3 flex items-center gap-3 w-max max-w-[90vw] text-center relative pr-10">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
            <p className="text-[13px] font-medium text-[var(--text-main)] leading-snug">
              <span className="text-red-500 font-bold mr-1">UI Design View Only.</span> 
              No model is loaded. Add a <code className="text-xs bg-[var(--bg-hover)] px-1 rounded text-red-400">.gguf</code> model to the models folder to use the app.
            </p>
            <button 
              onClick={() => setHideNoModelBanner(true)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-red-500/20 text-red-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isModelLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
             <div className="w-12 h-12 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin mb-4" />
             <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Loading Model...</h3>
             <p className="text-sm text-[var(--text-muted)]">Please wait while the AI model is being loaded into memory. This may take up to a minute depending on hardware.</p>
          </div>
        </div>
      )}

      {/* Dynamic theme colors layout */}
      <div className="flex w-full h-full overflow-hidden relative z-10">
        {/* Left Side menu */}
        {sidebarOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)} 
            />
            <div className="absolute md:relative z-50 h-full">
              <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                  setActiveSessionId(id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                onNewSession={() => {
                  createNewSession();
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                onDeleteSession={handleDeleteSession}
                onClearAll={clearAllChats}
                onRenameSession={handleRenameSession}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onCloseSidebar={() => setSidebarOpen(false)}
                onOpenLibrary={() => setLibraryOpen(true)}
                settings={settings}
              />
            </div>
          </>
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
              activeVisionModel={activeVisionModel}
              settings={settings}
              generating={generating}
              onOpenSettings={() => setIsSettingsOpen(true)}
              sidebarOpen={sidebarOpen}
              onOpenSidebar={() => setSidebarOpen(true)}
              onStopGeneration={handleStopGeneration}
              availableModels={availableModels}
              onLoadModel={handleLoadModel}
              onDeleteMessage={handleDeleteMessage}
              onUnloadModel={() => {
                setActiveModel(null);
                setActiveVisionModel(null);
              }}
            />
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
        activeVisionModel={activeVisionModel}
        availableModels={availableModels}
        onLoadModel={handleLoadModel}
        onRefreshModels={refreshModelsList}
        onUnloadModel={() => {
          setActiveModel(null);
          setActiveVisionModel(null);
        }}
        onResetEverything={() => {
          localStorage.clear();
          window.location.reload();
        }}
        onClearAllChats={clearAllChats}
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
            <div className="bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent p-6 text-center border-b border-[var(--border-color)]">
              <div className="w-14 h-14 rounded-full bg-[var(--bg-main)] shadow-md flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                <Globe className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)]" style={{ fontFamily: "'Inter', sans-serif" }}>Live Web Demo</h2>
              <p className="text-[var(--text-muted)] text-[13px] mt-2">
                Running in your browser. No installation required.
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-[var(--bg-hover)]/60 p-4 rounded-xl text-sm leading-relaxed text-[var(--text-secondary)] border border-[var(--border-color)]">
                This is a front-end UI showcase. Because running massive AI models in the browser can freeze laptops, we've disabled browser-based downloads in the live demo.
                <br/><br/>
                To run this AI locally with full privacy, please download the project from GitHub and run it on your machine with a GGUF model!
                <br/><br/>
                Otherwise, you can just click around to explore the UI design!
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    window.open('https://github.com/hemanthnanu-tech/Offline-AI', '_blank');
                  }}
                  className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-semibold rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  View Project on GitHub
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

