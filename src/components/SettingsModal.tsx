import React, { useState, useEffect } from 'react';
import { Sparkles, Settings, Sliders, Database, Cpu, X, Check, Shield, Trash2, Download, RefreshCw, HelpCircle, Info, Mic, User, Terminal, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InferenceSettings, GGUFModelInfo } from '../types';
import { CustomSelect } from './CustomSelect';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InferenceSettings;
  onSave: (newSettings: InferenceSettings) => void;
  activeModel: GGUFModelInfo | null;
  activeVisionModel?: any;
  availableModels: any[];
  onLoadModel: (fileName: string) => void;
  onRefreshModels?: () => void;
  onResetEverything?: () => void;
  onUnloadModel?: () => void;
  onClearAllChats?: () => void;
}

type SettingsTab = 'general' | 'personalization' | 'voice' | 'model' | 'parameters' | 'data' | 'about';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  activeModel,
  activeVisionModel,
  availableModels,
  onLoadModel,
  onRefreshModels,
  onResetEverything,
  onUnloadModel,
  onClearAllChats
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState<InferenceSettings>({ ...settings });
  
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
      const res = await fetch(`/api/upload-model?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file
      });
      
      const data = await res.json();
      if (data.success) {
        setAlertMsg(`Successfully uploaded ${file.name}. Please refresh directory.`);
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

  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  
  // Tab General visual states
  const [appearance, setAppearance] = useState<'system' | 'light' | 'dark'>(settings.appearance || 'system');
  const [contrast, setContrast] = useState<'system' | 'high' | 'standard'>('standard');
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [language, setLanguage] = useState<string>('auto');
  const [enableDictation, setEnableDictation] = useState<boolean>(true);
  const [separateVoice, setSeparateVoice] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<string>('');
  const [useGPU, setUseGPU] = useState<boolean>(true);

  // Instant preview for Appearance (Theme)
  useEffect(() => {
    if (!isOpen) return;
    
    let previewTheme: 'dark' | 'light' = 'dark';
    if (appearance === 'system') {
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      previewTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      previewTheme = appearance as 'dark' | 'light';
    }
    
    if (previewTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.getElementById('app-root')?.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.getElementById('app-root')?.classList.remove('dark');
    }
  }, [appearance, isOpen]);

  // Instant preview for Accent Color
  useEffect(() => {
    if (!isOpen) return;
    const accentColors: Record<string, { main: string; hover: string; fg: string }> = {
      blue: { main: '#007aff', hover: '#0062cc', fg: '#ffffff' },
      purple: { main: '#af52de', hover: '#963ec8', fg: '#ffffff' },
      teal: { main: '#30b0c7', hover: '#258ea2', fg: '#ffffff' },
      green: { main: '#34c759', hover: '#28a745', fg: '#ffffff' },
      monochrome: document.documentElement.classList.contains('dark') ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' } : { main: '#000000', hover: '#374151', fg: '#ffffff' },
      brown: { main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' }
    };
    const activeAccent = accentColors[accentColor] || accentColors.blue;
    document.documentElement.style.setProperty('--accent', activeAccent.main);
    document.documentElement.style.setProperty('--accent-hover', activeAccent.hover);
    document.documentElement.style.setProperty('--accent-fg', activeAccent.fg);
  }, [accentColor, isOpen]);

  useEffect(() => {
    setLocalSettings({ ...settings });
    if (isOpen) {
      setAppearance(settings.appearance || 'dark');
      setContrast(settings.contrast || 'standard');
      setAccentColor(settings.accentColor || 'blue');
      setLanguage(settings.language || 'auto');
      setEnableDictation(settings.enableDictation !== false);
      setSeparateVoice(!!settings.separateVoice);
      setUserDetails(settings.userDetails || '');
      setUseGPU(settings.useGPU !== false);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...localSettings,
      appearance,
      contrast: contrast as any,
      accentColor: accentColor as any,
      language,
      enableDictation,
      separateVoice,
      userDetails,
      useGPU
    });
    onClose();
  };

  const handleReloadModel = async () => {
    setReloadingModel(true);
    try {
      const res = await fetch('/api/reload', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useGPU })
      });
      const data = await res.json();
      if (data.success && data.modelInfo) {
        setAlertMsg(`Success! Loaded GGUF model: ${data.modelInfo.name}`);
        window.location.reload();
      } else {
        setAlertMsg('No GGUF file discovered in models/ folder. Ensure you place a GGUF file there first.');
      }
    } catch (e) {
      console.error(e);
      setAlertMsg('Error contacting the backend reload api.');
    } finally {
      setReloadingModel(false);
    }
  };

  const handleExportHistory = () => {
    const saved = localStorage.getItem('gguf-chat-sessions');
    if (!saved) {
      setAlertMsg('No history found to export.');
      return;
    }
    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    a.download = `offline-ai-export-${yyyy}-${mm}-${dd}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setConfirmDialog({
      message: 'Are you sure you want to permanently clear all local chat history? This cannot be undone.',
      onConfirm: () => {
        if (onClearAllChats) {
          onClearAllChats();
        } else {
          localStorage.removeItem('gguf-chat-sessions');
          window.location.reload();
        }
      },
    });
  };

  return (
    <>
      {/* Inline Alert Dialog */}
      {alertMsg && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="text-[14px] text-[var(--text-main)] leading-relaxed">{alertMsg}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                className="px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] rounded-lg transition cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="text-[14px] text-[var(--text-main)] leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xl" 
          id="settings-modal-overlay"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            className="relative w-full max-w-3xl h-[560px] bg-[var(--modal-bg)]/85 backdrop-blur-3xl rounded-2xl border border-[var(--border-color)] shadow-premium flex overflow-hidden text-[var(--text-main)] font-sans"
            id="settings-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Settings Sidebar */}
            <div className="w-56 bg-[var(--modal-sidebar-bg)]/60 border-r border-[var(--border-color)] p-4 flex flex-col justify-between shrink-0 select-none">
              <div className="space-y-4">
                {/* Top Close Button */}
                <button 
                  type="button" 
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Menu options list */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'general' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>General</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('personalization')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'personalization' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Personalization</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('voice')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'voice' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('model')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'model' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Model Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('parameters')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'parameters' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Parameters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('data')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'data' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Data controls</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer ${
                      activeTab === 'about' ? 'bg-[var(--bg-hover)] font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span>About</span>
                  </button>
                </div>
              </div>

              {/* Version footer */}
              <div className="text-[10px] text-[var(--text-muted)] font-mono pl-3">
                MyOFFLINE AI v2.0 (Stable)
              </div>
            </div>

            {/* Right Settings Content Column */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-transparent">
              <div className="p-6.5 overflow-y-auto flex-1 space-y-6">
                
                {/* GENERAL TAB CONTENT */}
                {activeTab === 'general' && (
                  <div className="space-y-5">
                    <h3 className="text-[20px] font-semibold text-[var(--text-main)]">General</h3>
                    
                    <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                      {/* Theme Mode Option */}
                      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <Sliders className="w-4 h-4" />
                          </div>
                          <span className="text-[14px] font-medium text-[var(--text-main)]">Appearance</span>
                        </div>
                        <CustomSelect
                          value={appearance}
                          onChange={(val) => setAppearance(val as any)}
                          options={[
                            { value: 'system', label: 'System' },
                            { value: 'light', label: 'Light' },
                            { value: 'dark', label: 'Dark' }
                          ]}
                        />
                      </div>

                      {/* Contrast Mode Option */}
                      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-[14px] font-medium text-[var(--text-main)]">Contrast</span>
                        </div>
                        <CustomSelect
                          value={contrast}
                          onChange={(val) => setContrast(val as any)}
                          options={[
                            { value: 'system', label: 'System' },
                            { value: 'high', label: 'High' },
                            { value: 'standard', label: 'Standard' }
                          ]}
                        />
                      </div>

                      {/* Accent Color Selection Option */}
                      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <div className="w-3 h-3 rounded-full bg-[var(--accent)]" />
                          </div>
                          <span className="text-[14px] font-medium text-[var(--text-main)]">Accent color</span>
                        </div>
                        <div className="flex gap-2">
                          {[
                            { id: 'blue', color: '#007aff' },
                            { id: 'purple', color: '#af52de' },
                            { id: 'teal', color: '#30b0c7' },
                            { id: 'green', color: '#34c759' },
                            { id: 'monochrome', color: 'conic-gradient(from 180deg at 50% 50%, #ffffff 0deg, #ffffff 180deg, #000000 180deg, #000000 360deg)' },
                            { id: 'brown', color: '#8b4513' }
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setAccentColor(c.id)}
                              style={{ background: c.color }}
                              className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all shadow-sm ${
                                accentColor === c.id 
                                  ? 'ring-2 ring-offset-2 ring-offset-[var(--modal-bg)] ring-[var(--text-main)] scale-110 opacity-100' 
                                  : 'opacity-70 hover:opacity-100 hover:scale-110'
                              }`}
                            >
                              {accentColor === c.id && <Check className={`w-4 h-4 stroke-[3px] ${c.id === "monochrome" ? "text-gray-400 drop-shadow-sm" : "text-white"}`} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language selection Option */}
                      <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <Info className="w-4 h-4" />
                          </div>
                          <span className="text-[14px] font-medium text-[var(--text-main)]">Language</span>
                        </div>
                        <CustomSelect
                          value={language}
                          onChange={(val) => setLanguage(val)}
                          options={[
                            { value: 'auto', label: 'Auto-detect (English)' },
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                            { value: 'fr', label: 'Français' },
                            { value: 'de', label: 'Deutsch' },
                            { value: 'ja', label: '日本語' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PERSONALIZATION TAB CONTENT */}
                {activeTab === 'personalization' && (
                  <div className="space-y-5">
                    <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Personalization</h3>
                    
                    <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-6">
                      <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[var(--text-main)] flex items-center gap-2">
                          <User className="w-4 h-4 text-[var(--accent)]" /> Preferred Name
                        </label>
                        <input
                          type="text"
                          value={localSettings.userName || ''}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, userName: e.target.value }))}
                          placeholder="e.g. Hemanth Kumar K"
                          className="w-full p-3 text-[13px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--text-main)] transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[var(--text-main)] flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-[var(--accent)]" /> Assistant Name
                        </label>
                        <input
                          type="text"
                          value={localSettings.assistantName || 'Assistant'}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, assistantName: e.target.value }))}
                          placeholder="e.g. Jarvis"
                          className="w-full p-3 text-[13px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--text-main)] transition-all shadow-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-[14px] font-medium text-[var(--text-main)] block">Auto Scroll Chat</span>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Automatically scroll down as new tokens are generated.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={localSettings.autoScroll !== false} 
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, autoScroll: e.target.checked }))} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[var(--text-main)] flex items-center gap-2">
                          <Info className="w-4 h-4 text-[var(--accent)]" /> Date of Birth
                        </label>
                        <input
                          type="text"
                          value={localSettings.userDob || ''}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, userDob: e.target.value }))}
                          placeholder="e.g. 15 Jan 2000"
                          className="w-full p-3 text-[13px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--text-main)] transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[14px] font-medium text-[var(--text-main)] flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[var(--accent)]" /> Custom Instructions / Details
                        </label>
                        <textarea
                          value={localSettings.userDetails || ''}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, userDetails: e.target.value }))}
                          rows={4}
                          placeholder="e.g. I am a software engineer studying React. Keep responses technical and concise."
                          className="w-full p-3 text-[13px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl outline-none resize-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--text-main)] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* VOICE TAB CONTENT */}
                {activeTab === 'voice' && (
                  <div className="space-y-5">
                    <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Voice Settings</h3>
                    
                    <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                      {/* Dictation Toggle */}
                      <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Enable Dictation</span>
                            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                              Use speech-to-text in the local chat composer.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={enableDictation} 
                            onChange={() => setEnableDictation(!enableDictation)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
                        </label>
                      </div>

                      {/* Separate Voice toggle */}
                      <div className="flex items-center justify-between p-5 hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                            <Sliders className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Separate Voice Mode</span>
                            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                              Keep speech model synthesis in a separate full screen with no visual transcriptions.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={separateVoice} 
                            onChange={() => setSeparateVoice(!separateVoice)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODEL SETTINGS TAB */}
                {activeTab === 'model' && (
                  <div className="space-y-5">
                    <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Model Settings</h3>
                    
                    <div className="space-y-4">
                      {/* Active Model Info */}
                      <div className="bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl p-4 space-y-2 mb-4">
                        <h4 className="text-[14px] font-semibold text-[var(--text-main)] flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Active Base Model
                        </h4>
                        {activeModel ? (
                          <div className="text-[13px] text-[var(--text-muted)]">
                            <p><span className="font-medium text-[var(--text-main)]">Name:</span> {activeModel.name}</p>
                            <p><span className="font-medium text-[var(--text-main)]">File:</span> {activeModel.fileName}</p>
                            <p><span className="font-medium text-[var(--text-main)]">Parameters:</span> {activeModel.parameters}</p>
                          </div>
                        ) : (
                          <p className="text-[13px] text-[var(--text-muted)]">No model currently loaded.</p>
                        )}
                        
                        {activeVisionModel && (
                          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                            <h4 className="text-[14px] font-semibold text-[var(--text-main)] flex items-center gap-2 mb-2">
                              <Check className="w-4 h-4 text-[var(--accent)]" />
                              Vision Subsystem (mmproj)
                            </h4>
                            <div className="text-[13px] text-[var(--text-muted)]">
                              <p><span className="font-medium text-[var(--text-main)]">Projector:</span> {activeVisionModel.name}</p>
                              <p><span className="font-medium text-[var(--text-main)]">File:</span> {activeVisionModel.fileName}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      
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

                          <div className="border border-[var(--border-color)] rounded-lg overflow-hidden divide-y divide-[var(--border-color)]">
                            {availableModels.map((modelObj, i) => {
                              const model = typeof modelObj === 'string' ? modelObj : modelObj.name;
                              const sizeBytes = typeof modelObj === 'string' ? null : modelObj.sizeBytes;
                              const sizeLabel = sizeBytes ? (sizeBytes / (1024*1024*1024)).toFixed(2) + ' GB' : '';
                              return (
                              <div key={model + i} className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] transition">
                                <span className="text-[13px] text-[var(--text-main)] truncate mr-4 flex justify-between w-full"><span>{model}</span> {sizeLabel && <span className="opacity-50 text-[11px] whitespace-nowrap ml-2">{sizeLabel}</span>}</span>
                                <button
                                  onClick={() => onLoadModel(model)}
                                  disabled={activeModel?.fileName === model}
                                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition shrink-0 ${
                                    activeModel?.fileName === model
                                      ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                                      : 'bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 cursor-pointer'
                                  }`}
                                >
                                  {activeModel?.fileName === model ? 'Loaded' : 'Load Model'}
                                </button>
                                </div>
                              )})}
                          </div>
                        ) : (
                          <div className="text-center p-6 border border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center gap-3">
                            <p className="text-[13px] text-[var(--text-muted)]">No GGUF models found in the <code className="bg-[var(--bg-hover)] px-1 rounded">models/</code> folder.</p>
                            {onRefreshModels && (
                              <button
                                type="button"
                                onClick={onRefreshModels}
                                className="px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]/80 text-[12px] font-semibold text-[var(--text-main)] rounded-lg transition border border-[var(--border-color)] cursor-pointer"
                              >
                                Refresh Directory
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hardware Backend Toggle */}
                      <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm mt-6">
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                               <Cpu className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Hardware Backend</span>
                              <p className="text-[12px] text-[var(--text-muted)] w-[220px]">
                                <strong>GPU (Fast):</strong> Requires dedicated graphics card.<br/>
                                <strong>CPU (Fallback):</strong> Slower, works on any device.
                              </p>
                            </div>
                          </div>
                          <CustomSelect
                            value={useGPU ? "gpu" : "cpu"}
                            onChange={(val) => setUseGPU(val === "gpu")}
                            options={[
                              { value: 'gpu', label: 'GPU / WebGPU (Auto)' },
                              { value: 'cpu', label: 'CPU Only (Slow/Safe)' }
                            ]}
                          />
                        </div>

                        {/* Float Precision layout option */}
                        <div className="flex items-center justify-between p-5 hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                               <Database className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Precision Type</span>
                              <p className="text-[12px] text-[var(--text-muted)]">Offload compilation precision</p>
                            </div>
                          </div>
                          <CustomSelect
                            value={localSettings.floatPrecision}
                            onChange={(val) => setLocalSettings(prev => ({ ...prev, floatPrecision: val as any }))}
                            options={[
                              { value: 'float16', label: 'FP16 (Float16 Acceleration)' },
                              { value: 'float32', label: 'FP32 (Standard Float32)' }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARAMETERS TAB */}
                {activeTab === 'parameters' && (
                  <div className="space-y-5">
                    <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Hyperparameters</h3>
                    
                    <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                      {/* Temperature slider */}
                      <div className="p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out space-y-2">
                        <div className="flex justify-between text-[14px] font-medium text-[var(--text-main)]">
                          <span>Temperature</span>
                          <span className="text-[var(--accent)]">{localSettings.temperature}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.5"
                          step="0.05"
                          value={localSettings.temperature}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-[var(--border-color)] rounded-full cursor-pointer appearance-none accent-[var(--accent)]"
                        />
                        <p className="text-[12px] text-[var(--text-muted)] pt-1">Higher values make output more random, lower values make it more focused.</p>
                      </div>

                      {/* Top-P slider */}
                      <div className="p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out space-y-2">
                        <div className="flex justify-between text-[14px] font-medium text-[var(--text-main)]">
                          <span>Top-P Sampling</span>
                          <span className="text-[var(--accent)]">{localSettings.topP}</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.0"
                          step="0.05"
                          value={localSettings.topP}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-[var(--border-color)] rounded-full cursor-pointer appearance-none accent-[var(--accent)]"
                        />
                        <p className="text-[12px] text-[var(--text-muted)] pt-1">Limits vocabulary to the most probable tokens. 1.0 means no limit.</p>
                      </div>

                      {/* Top-K slider */}
                      <div className="p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out space-y-2">
                        <div className="flex justify-between text-[14px] font-medium text-[var(--text-main)]">
                          <span>Top-K Sampling</span>
                          <span className="text-[var(--accent)]">{localSettings.topK}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={localSettings.topK}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-[var(--border-color)] rounded-full cursor-pointer appearance-none accent-[var(--accent)]"
                        />
                        <p className="text-[12px] text-[var(--text-muted)] pt-1">Restricts token selection to the top K most probable words.</p>
                      </div>

                      {/* Max Tokens Slider */}
                      <div className="p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out space-y-2">
                        <div className="flex justify-between text-[14px] font-medium text-[var(--text-main)]">
                          <span>Max Generation Tokens</span>
                          <span className="text-[var(--accent)]">{localSettings.maxTokens}</span>
                        </div>
                        <input
                          type="range"
                          min="256"
                          max="8192"
                          step="128"
                          value={localSettings.maxTokens}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-[var(--border-color)] rounded-full cursor-pointer appearance-none accent-[var(--accent)]"
                        />
                        <p className="text-[12px] text-[var(--text-muted)] pt-1">Maximum number of tokens the model can generate in a single response.</p>
                      </div>

                      {/* Context Size Slider */}
                      <div className="p-5 hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out space-y-2">
                        <div className="flex justify-between text-[14px] font-medium text-[var(--text-main)]">
                          <span>Context Size (Requires Reload)</span>
                          <span className="text-[var(--accent)]">{localSettings.contextSize}</span>
                        </div>
                        <input
                          type="range"
                          min="1024"
                          max="32768"
                          step="1024"
                          value={localSettings.contextSize}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, contextSize: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-[var(--border-color)] rounded-full cursor-pointer appearance-none accent-[var(--accent)]"
                        />
                        <p className="text-[12px] text-[var(--text-muted)] pt-1">Controls how much memory the model can use for past context.</p>
                        {activeModel && (
                          <button
                            type="button"
                            onClick={() => onLoadModel(activeModel.fileName)}
                            className="mt-3 w-full py-2.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[13px] font-semibold text-[var(--accent)] rounded-xl transition border border-[var(--accent)]/20 cursor-pointer"
                          >
                            Apply Context Size & Reload Model
                          </button>
                        )}
                      </div>
                    </div>

                    {/* System Prompt TextArea */}
                    <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-main)]">
                        <Terminal className="w-4 h-4 text-[var(--accent)]" /> Core System Instructions
                      </div>
                      <textarea
                        value={localSettings.systemPrompt}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        rows={3}
                        placeholder="Input model persona instructions here..."
                        className="w-full p-3 text-[13px] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl outline-none resize-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-[var(--text-main)] transition-all shadow-sm"
                      />
                      <p className="text-[12px] text-[var(--text-muted)]">Defines the underlying persona, rules, and constraints for the AI across all chats.</p>
                    </div>
                  </div>
                )}

                {/* DATA CONTROLS TAB */}
                {activeTab === 'data' && (
                  <div className="space-y-5">
                     <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Data Controls</h3>
                    
                    <div className="space-y-4">
                      {/* Local privacy notice card */}
                      <div className="flex gap-4 p-5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Shield className="w-24 h-24 text-[var(--accent)]" />
                        </div>
                        <Shield className="w-6 h-6 text-[var(--accent)] shrink-0" />
                        <div className="space-y-1.5 text-left relative z-10">
                          <span className="font-semibold text-[14px] text-[var(--text-main)]">Sandboxed Local Storage</span>
                          <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)] max-w-[90%]">
                            All chat threads and cached GGUF outputs are persisted only inside your browser's sandboxed localStorage. No cloud backups or remote servers are contacted.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                        {/* Export Chat History */}
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                               <Download className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Export Chat Data</span>
                              <p className="text-[12px] text-[var(--text-muted)]">Backup all local threads to JSON file</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleExportHistory}
                            className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-main)] border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2 rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-sm transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                          </button>
                        </div>

                        {/* Delete All Chat History */}
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                               <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[14.5px] font-medium text-[var(--text-main)] block">Clear Chat History</span>
                              <p className="text-[12px] text-[var(--text-muted)]">Permanently delete all saved chat threads</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 text-[13px] font-semibold text-red-600 border border-red-200 bg-red-50/50 dark:bg-red-950/20 px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear Data</span>
                          </button>
                        </div>

                        {/* Reset Everything */}
                        <div className="flex items-center justify-between p-5 hover:bg-[var(--bg-hover)] transition-all duration-300 ease-out">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600 shrink-0">
                               <RefreshCw className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[14.5px] font-medium text-red-600 block">Factory Reset</span>
                              <p className="text-[12px] text-[var(--text-muted)]">Permanently delete all data, models, and history</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                message: 'Are you absolutely sure you want to reset everything? This will permanently delete all chat history, settings, and personal data.',
                                onConfirm: () => onResetEverything?.()
                              });
                            }}
                            className="flex items-center gap-2 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md px-4 py-2 rounded-xl transition cursor-pointer hover:shadow-lg"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reset All</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div className="border-b border-[var(--border-color)] pb-4">
                      <h3 className="text-[18px] font-bold text-[var(--text-main)] mb-1">About Offline AI</h3>
                      <p className="text-[13px] text-[var(--text-muted)]">
                        A fully private, high-performance sandbox for local LLMs.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-[12px] font-semibold text-[var(--text-main)]">
                          Developed and Designed by <span className="text-[var(--accent)]">Hemanth Kumar K</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      {/* Architecture Card */}
                      <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-start gap-4 p-5 border-b border-[var(--border-color)]">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                            <Info className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 mt-0.5">
                            <span className="font-medium text-[14.5px] text-[var(--text-main)]">Architecture & Credits</span>
                            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                              Developed by <strong>Hemanth Kumar K</strong>. Built to provide a highly secure, ultimate offline AI experience.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-5">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 mt-0.5">
                            <span className="font-medium text-[14.5px] text-[var(--text-main)]">100% Secure & Private</span>
                            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                              Zero telemetry. No cloud connections. No API tracking. Your data is never uploaded online and stays strictly on your local device.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hardware Controls */}
                      <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-main)]">
                          <Cpu className="w-5 h-5 text-[var(--accent)]" />
                          Hardware Controls
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={async () => {
                              toast.loading("Freeing RAM...", { id: 'unload' });
                              try {
                                await fetch("/api/unload", { method: "POST" });
                                await fetch("/api/stop", { method: "POST" });
                                if (onUnloadModel) onUnloadModel();
                                toast.success("RAM cleared and model unloaded.", { id: 'unload' });
                              } catch (e) {
                                toast.error("Failed to unload model.", { id: 'unload' });
                              }
                            }}
                            className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[13px] font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)] hover:shadow-sm transition cursor-pointer"
                          >
                            <HardDrive className="w-4 h-4 text-[var(--text-muted)]" />
                            Free RAM (Unload)
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              toast.loading("Killing model process...", { id: 'kill' });
                              try {
                                await fetch("/api/kill-model", { method: "POST" });
                                await fetch("/api/stop", { method: "POST" });
                                if (onUnloadModel) onUnloadModel();
                                toast.success("Model process killed.", { id: 'kill' });
                              } catch (e) {
                                toast.error("Failed to kill model.", { id: 'kill' });
                              }
                            }}
                            className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[13px] font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)] hover:shadow-sm transition cursor-pointer"
                          >
                            <Terminal className="w-4 h-4 text-[var(--text-muted)]" />
                            Stop Model
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              message: 'This will immediately shut down the server and close the application. Are you sure?',
                              onConfirm: async () => {
                                toast.error("Exiting application...");
                                await fetch("/api/exit-app", { method: "POST" });
                              }
                            });
                          }}
                          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Exit Application
                        </button>
                      </div>

                      {/* Engine Details */}
                      <div className="bg-[var(--bg-hover)]/30 border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden text-[13.5px]">
                        <div className="flex justify-between p-4 border-b border-[var(--border-color)]">
                          <span className="text-[var(--text-muted)]">Engine</span>
                          <span className="font-mono font-medium text-[var(--text-main)]">Llama.cpp</span>
                        </div>
                        <div className="flex justify-between p-4 border-b border-[var(--border-color)] bg-[var(--accent)]/5">
                          <span className="text-[var(--text-muted)]">State</span>
                          <span className="text-[var(--accent)] font-semibold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> 100% Offline</span>
                        </div>
                        <div className="flex justify-between p-4 border-b border-[var(--border-color)]">
                          <span className="text-[var(--text-muted)]">Model Support</span>
                          <span className="font-mono font-medium text-[var(--text-main)]">GGUF</span>
                        </div>
                        <div className="flex justify-between p-4">
                          <span className="text-[var(--text-muted)]">License</span>
                          <span className="font-medium text-[var(--text-main)]">MIT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--modal-sidebar-bg)] border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    // Revert preview theme on cancel
                    let originalTheme = 'dark';
                    if (settings.appearance === 'system') {
                      originalTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    } else {
                      originalTheme = settings.appearance || 'dark';
                    }
                    if (originalTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                      document.getElementById('app-root')?.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.getElementById('app-root')?.classList.remove('dark');
                    }
                    
                    // Revert preview accent
                    const accentColors: Record<string, { main: string; hover: string; fg: string }> = {
                      blue: { main: '#007aff', hover: '#0062cc', fg: '#ffffff' },
                      purple: { main: '#af52de', hover: '#963ec8', fg: '#ffffff' },
                      teal: { main: '#30b0c7', hover: '#258ea2', fg: '#ffffff' },
                      green: { main: '#34c759', hover: '#28a745', fg: '#ffffff' },
                      monochrome: document.documentElement.classList.contains('dark') ? { main: '#ffffff', hover: '#e5e7eb', fg: '#000000' } : { main: '#000000', hover: '#374151', fg: '#ffffff' },
                      brown: { main: '#8b4513', hover: '#5c2e0b', fg: '#ffffff' }
                    };
                    const originalAccent = accentColors[settings.accentColor || 'blue'] || accentColors.blue;
                    document.documentElement.style.setProperty('--accent', originalAccent.main);
                    document.documentElement.style.setProperty('--accent-hover', originalAccent.hover);
                    document.documentElement.style.setProperty('--accent-fg', originalAccent.fg);
                    
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{ backgroundColor: 'var(--accent)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  className="flex items-center gap-1.5 px-4 py-2 text-[var(--accent-fg)] rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

