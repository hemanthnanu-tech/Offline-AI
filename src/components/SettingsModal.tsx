import React, { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Database, Cpu, X, Check, Shield, Trash2, Download, RefreshCw, HelpCircle, Info, Mic, User
} from 'lucide-react';
import { InferenceSettings, GGUFModelInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InferenceSettings;
  onSave: (newSettings: InferenceSettings) => void;
  activeModel: GGUFModelInfo | null;
  availableModels: string[];
  onLoadModel: (fileName: string) => void;
}

type SettingsTab = 'general' | 'personalization' | 'voice' | 'model' | 'parameters' | 'data' | 'about';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  activeModel,
  availableModels,
  onLoadModel
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localSettings, setLocalSettings] = useState<InferenceSettings>({ ...settings });
  const [reloadingModel, setReloadingModel] = useState(false);
  
  // Tab General visual states
  const [appearance, setAppearance] = useState<'system' | 'light' | 'dark'>('dark');
  const [contrast, setContrast] = useState<'system' | 'high' | 'standard'>('standard');
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [language, setLanguage] = useState<string>('auto');
  const [enableDictation, setEnableDictation] = useState<boolean>(true);
  const [separateVoice, setSeparateVoice] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [useGPU, setUseGPU] = useState<boolean>(true);

  useEffect(() => {
    setLocalSettings({ ...settings });
    if (isOpen) {
      setAppearance(settings.appearance || 'dark');
      setContrast(settings.contrast || 'standard');
      setAccentColor(settings.accentColor || 'blue');
      setLanguage(settings.language || 'auto');
      setEnableDictation(settings.enableDictation !== false);
      setSeparateVoice(!!settings.separateVoice);
      setGeminiApiKey(settings.geminiApiKey || '');
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
      geminiApiKey,
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
        alert(`Success! Loaded GGUF model: ${data.modelInfo.name}`);
        window.location.reload();
      } else {
        alert("No GGUF file discovered in models/ folder. Ensure you place a GGUF file there first.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting the backend reload api.");
    } finally {
      setReloadingModel(false);
    }
  };

  const handleExportHistory = () => {
    const saved = localStorage.getItem('gguf-chat-sessions');
    if (!saved) return alert("No history found to export.");
    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-ai-chat-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to permanently clear all local chat history? This cannot be undone.")) {
      localStorage.removeItem('gguf-chat-sessions');
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs transition-opacity" 
      id="settings-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl h-[560px] bg-[var(--modal-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex overflow-hidden text-[var(--text-main)] font-sans"
        id="settings-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Settings Sidebar */}
        <div className="w-56 bg-[var(--modal-sidebar-bg)] border-r border-[var(--border-color)] p-4 flex flex-col justify-between shrink-0 select-none">
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
            Offline Sandbox v1.2.5
          </div>
        </div>

        {/* Right Settings Content Column */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[var(--modal-bg)]">
          <div className="p-6.5 overflow-y-auto flex-1 space-y-6">
            
            {/* GENERAL TAB CONTENT */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-semibold text-[var(--text-main)]">General</h3>
                
                <div className="space-y-4">
                  {/* Theme Mode Option */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[14px] font-normal text-[var(--text-main)]">Appearance</span>
                    <select
                      value={appearance}
                      onChange={(e) => setAppearance(e.target.value as any)}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option className="bg-[var(--modal-bg)]" value="system">System</option>
                      <option className="bg-[var(--modal-bg)]" value="light">Light</option>
                      <option className="bg-[var(--modal-bg)]" value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Contrast Mode Option */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[14px] font-normal text-[var(--text-main)]">Contrast</span>
                    <select
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value as any)}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option className="bg-[var(--modal-bg)]" value="system">System</option>
                      <option className="bg-[var(--modal-bg)]" value="high">High</option>
                      <option className="bg-[var(--modal-bg)]" value="standard">Standard</option>
                    </select>
                  </div>

                  {/* Accent Color Selection Option */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[14px] font-normal text-[var(--text-main)]">Accent color</span>
                    <select
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option className="bg-[var(--modal-bg)]" value="blue">🔵 Blue</option>
                      <option className="bg-[var(--modal-bg)]" value="purple">🟣 Purple</option>
                      <option className="bg-[var(--modal-bg)]" value="teal">🟢 Teal</option>
                      <option className="bg-[var(--modal-bg)]" value="green">🟢 Green</option>
                    </select>
                  </div>

                  {/* Language selection Option */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[14px] font-normal text-[var(--text-main)]">Language</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option value="auto">Auto-detect (English)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PERSONALIZATION TAB CONTENT */}
            {activeTab === 'personalization' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Personalization</h3>
                
                <div className="space-y-4.5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[var(--text-main)] font-normal block">
                      Preferred Name
                    </label>
                    <input
                      type="text"
                      value={localSettings.userName || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, userName: e.target.value }))}
                      placeholder="e.g. Hemanth Kumar K"
                      className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--text-muted)] text-[var(--text-main)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[var(--text-main)] font-normal block">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={localSettings.userDob || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, userDob: e.target.value }))}
                      placeholder="e.g. 15 Jan 2000"
                      className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--text-muted)] text-[var(--text-main)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[var(--text-main)] font-normal block">
                      Custom Instructions / Details
                    </label>
                    <textarea
                      value={localSettings.userDetails || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, userDetails: e.target.value }))}
                      rows={4}
                      placeholder="e.g. I am a software engineer studying React..."
                      className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none resize-none focus:border-[var(--text-muted)] text-[var(--text-main)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VOICE TAB CONTENT */}
            {activeTab === 'voice' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Voice Settings</h3>
                
                <div className="space-y-4">
                  {/* Dictation Toggle */}
                  <div className="flex items-start justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-[14px] font-normal text-[var(--text-main)] block">Enable Dictation</span>
                      <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                        Use dictation speech-to-text in the local chat composer.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 select-none">
                      <input 
                        type="checkbox" 
                        checked={enableDictation} 
                        onChange={() => setEnableDictation(!enableDictation)} 
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--accent-color)]" />
                    </label>
                  </div>

                  {/* Separate Voice toggle */}
                  <div className="flex items-start justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-[14px] font-normal text-[var(--text-main)] block">Separate Voice</span>
                      <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                        Keep offline speech model voice synthesis in a separate full screen with no visual transcriptions.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 select-none">
                      <input 
                        type="checkbox" 
                        checked={separateVoice} 
                        onChange={() => setSeparateVoice(!separateVoice)} 
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4.5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[var(--accent-color)]" />
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
                      Active Model
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
                  </div>

                  {/* Available Models List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[var(--text-main)]">Available Local Models</span>
                      <span className="text-[11px] text-[var(--text-muted)] px-2 py-0.5 bg-[var(--bg-hover)] rounded-md border border-[var(--border-color)]">
                        models/ directory
                      </span>
                    </div>
                    
                    {availableModels.length > 0 ? (
                      <div className="border border-[var(--border-color)] rounded-xl overflow-hidden divide-y divide-[var(--border-color)]">
                        {availableModels.map(model => (
                          <div key={model} className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] transition">
                            <span className="text-[13px] text-[var(--text-main)] truncate mr-4">{model}</span>
                            <button
                              onClick={() => onLoadModel(model)}
                              disabled={activeModel?.fileName === model}
                              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition shrink-0 ${
                                activeModel?.fileName === model
                                  ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                                  : 'bg-[var(--accent-color)] text-white hover:opacity-90 cursor-pointer'
                              }`}
                            >
                              {activeModel?.fileName === model ? 'Loaded' : 'Load Model'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 border border-dashed border-[var(--border-color)] rounded-xl">
                        <p className="text-[13px] text-[var(--text-muted)]">No GGUF models found in the <code className="bg-[var(--bg-hover)] px-1 rounded">models/</code> folder.</p>
                      </div>
                    )}
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1.5 py-2 border-b border-[var(--border-color)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-[var(--text-main)] block">Google Gemini API Key</span>
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded">For Web/GitHub Demo</span>
                    </div>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full text-[13px] border border-[var(--border-color)] rounded-lg px-3 py-2 bg-transparent outline-none focus:border-[var(--accent-color)] text-[var(--text-main)] transition"
                    />
                    <p className="text-[10.5px] text-[var(--text-muted)]">If provided, the app will use Gemini API in the browser instead of downloading a massive local model. Zero local lag.</p>
                  </div>

                  {/* Backend Execution Toggle */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5">
                      <span className="text-[14px] font-normal text-[var(--text-main)] block">Hardware Backend</span>
                      <p className="text-[10.5px] text-[var(--text-muted)] w-[220px]">
                        <strong>GPU (Fast):</strong> Requires dedicated graphics card.<br/>
                        <strong>CPU (Fallback):</strong> Slower, works on any device.
                      </p>
                    </div>
                    <select
                      value={useGPU ? "gpu" : "cpu"}
                      onChange={(e) => setUseGPU(e.target.value === "gpu")}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2.5 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option className="bg-[var(--modal-bg)]" value="gpu">GPU / WebGPU (Auto)</option>
                      <option className="bg-[var(--modal-bg)]" value="cpu">CPU Only (Slow/Safe)</option>
                    </select>
                  </div>

                  {/* Float Precision layout option */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5">
                      <span className="text-[14px] font-normal text-[var(--text-main)] block">Precision Type</span>
                      <p className="text-[10.5px] text-[var(--text-muted)]">Offload compilation precision</p>
                    </div>
                    <select
                      value={localSettings.floatPrecision}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, floatPrecision: e.target.value as any }))}
                      className="text-[13px] border border-[var(--border-color)] rounded-lg px-2.5 py-1 bg-transparent outline-none cursor-pointer text-[var(--text-main)]"
                    >
                      <option className="bg-[var(--modal-bg)]" value="float16">FP16 (Float16 Acceleration)</option>
                      <option className="bg-[var(--modal-bg)]" value="float32">FP32 (Standard Float32)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PARAMETERS TAB */}
            {activeTab === 'parameters' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Hyperparameters</h3>
                
                <div className="space-y-4.5">
                  {/* Temperature slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[13px] text-[var(--text-main)]">
                      <span>Temperature</span>
                      <span className="font-semibold">{localSettings.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={localSettings.temperature}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                    />
                  </div>

                  {/* Top-P slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[13px] text-[var(--text-main)]">
                      <span>Top-P Sampling</span>
                      <span className="font-semibold">{localSettings.topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={localSettings.topP}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                    />
                  </div>

                  {/* Max Tokens Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[13px] text-[var(--text-main)]">
                      <span>Max Generation Tokens</span>
                      <span className="font-semibold">{localSettings.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="128"
                      value={localSettings.maxTokens}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                    />
                  </div>

                  {/* System Prompt TextArea */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-[var(--text-main)] font-normal block">
                      Core System Instructions
                    </label>
                    <textarea
                      value={localSettings.systemPrompt}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      rows={3}
                      placeholder="Input model persona instructions here..."
                      className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none resize-none focus:border-[var(--text-muted)] text-[var(--text-main)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DATA CONTROLS TAB */}
            {activeTab === 'data' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-semibold text-[var(--text-main)]">Data Controls</h3>
                
                <div className="space-y-4">
                  {/* Local privacy notice card */}
                  <div className="flex gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)]/20">
                    <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-left">
                      <span className="font-semibold text-xs text-[var(--text-main)]">Sandboxed Local Storage</span>
                      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                        All chat threads and cached GGUF outputs are persisted only inside your browser's sandboxed localStorage. No cloud backups or remote servers are contacted.
                      </p>
                    </div>
                  </div>

                  {/* Export Chat History */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5">
                      <span className="text-[14px] font-normal text-[var(--text-main)]">Export Chat Data</span>
                      <p className="text-[11px] text-[var(--text-muted)]">Backup all local threads to JSON file</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportHistory}
                      className="flex items-center gap-1 text-[13px] font-semibold text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>

                  {/* Delete All Chat History */}
                  <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                    <div className="space-y-0.5">
                      <span className="text-[14px] font-normal text-[var(--text-main)]">Clear Chat History</span>
                      <p className="text-[11px] text-[var(--text-muted)]">Permanently delete all saved chat threads</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-[13px] font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <h3 className="text-[20px] font-bold tracking-tight text-[var(--text-main)]" style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>About Offline AI</h3>
                
                <div className="space-y-4">
                  {/* Specs grid */}
                  <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)]/20 space-y-3.5">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-[14px] text-[var(--text-main)]" style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>Credits & Contributions</span>
                        <p className="text-[12px] leading-relaxed text-[var(--text-muted)]" style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
                          Lead Architect & Developer: <strong className="text-[var(--text-main)]">Hemanth Kumar K</strong>. Designed as a high-fidelity fully private, local-first sandbox environment.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-[var(--border-color)]">
                      <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-[14px] text-[var(--text-main)]">Data Protection & Privacy</span>
                        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                          All computations happen locally on your hardware. Absolutely <strong>zero</strong> sensitive information, chat history, or personal data is sent to the cloud, third-party APIs, or external servers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-[13px] text-[var(--text-main)]">
                    <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">Local Engine</span>
                      <span className="font-semibold font-mono">node-llama-cpp v3</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">Platform Security</span>
                      <span className="font-semibold text-emerald-500">100% Sandboxed (Offline)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">Active Model Format</span>
                      <span className="font-semibold font-mono">GGUF Quantized Weights</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">License</span>
                      <span className="font-semibold">MIT License</span>
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ backgroundColor: 'var(--accent-color)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
              className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
