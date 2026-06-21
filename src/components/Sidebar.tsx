import React, { useState } from 'react';
import { 
  SquarePen, Search, Code, MessageSquare, Settings, Trash2, Edit2, PanelLeftClose, BookOpen
} from 'lucide-react';
import { ChatSession, GGUFModelInfo, InferenceSettings } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  codexEnabled: boolean;
  onToggleCodex: () => void;
  onOpenSettings: () => void;
  onCloseSidebar: () => void;
  onOpenLibrary: () => void;
  settings: InferenceSettings;
}

const PLACEHOLDER_RECENTS = [
  "Interview Question Simulation",
  "Social Media Overview",
  "Self-Introduction Guide",
  "S7 Edge vs C9 Pro",
  "Exam Question Check",
  "Next steps in career",
  "Master's in Communication Guide"
];

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  codexEnabled,
  onToggleCodex,
  onOpenSettings,
  onCloseSidebar,
  onOpenLibrary,
  settings
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renamedTitle, setRenamedTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setRenamedTitle(currentTitle);
  };

  const saveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renamedTitle.trim()) {
      onRenameSession(id, renamedTitle.trim());
    }
    setEditingSessionId(null);
  };

  // Filter threads and placeholders based on search input
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaceholders = PLACEHOLDER_RECENTS.filter(title => 
    title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="w-64 h-full flex flex-col chatgpt-sidebar text-[var(--text-main)] font-sans border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/80 backdrop-blur-xl"
      id="chat-sidebar"
    >
      {/* Top Header Controls */}
      <div className="p-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onCloseSidebar}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all cursor-pointer active:scale-95 hover:scale-105"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onNewSession}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all cursor-pointer active:scale-95 hover:scale-105"
          title="New Chat"
        >
          <SquarePen className="w-5 h-5" />
        </button>
      </div>

      {/* Main Sidebar Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-4 space-y-4">
        <div className="space-y-1">
          {/* New Chat Item */}
          <button
            type="button"
            onClick={onNewSession}
            className={`w-full sidebar-item active:scale-[0.98] transition-transform ${sessions.length === 0 || !activeSessionId ? 'active' : ''}`}
          >
            <SquarePen className="w-[18px] h-[18px] text-[var(--text-main)]" />
            <span>New chat</span>
          </button>

          {/* Working Search chats Item */}
          <div className="sidebar-item relative flex items-center bg-[var(--bg-hover)]/40 hover:bg-[var(--bg-hover)] rounded-lg px-3 py-2 border border-transparent focus-within:border-[var(--text-muted)] transition duration-150">
            <Search className="w-[18px] h-[18px] text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-[13.5px] outline-none pl-2 text-[var(--text-main)] placeholder-[var(--text-muted)]"
            />
          </div>

          {/* Codex Switch Toggle */}
          <button
            type="button"
            onClick={onToggleCodex}
            className={`w-full sidebar-item ${codexEnabled ? 'bg-[var(--bg-hover)]' : ''}`}
          >
            <Code className="w-[18px] h-[18px] text-[var(--text-main)]" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Codex Engine</span>
              {codexEnabled && <span className="text-[10px] bg-indigo-500/15 text-indigo-500 px-1.5 py-0.5 rounded font-mono font-semibold">ON</span>}
            </div>
          </button>

          {/* Library button */}
          <button
            type="button"
            onClick={onOpenLibrary}
            className="w-full sidebar-item"
          >
            <BookOpen className="w-[18px] h-[18px] text-[var(--text-main)]" />
            <span>Prompt Library</span>
          </button>
        </div>

        {/* Recents list */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] block px-3.5 uppercase tracking-wide">
            Recents
          </span>

          <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-0.5">
            {sessions.length === 0 ? (
              filteredPlaceholders.length === 0 ? (
                <div className="text-[10.5px] text-[var(--text-muted)] p-3 italic text-center">
                  No chats match search.
                </div>
              ) : (
                filteredPlaceholders.map((title, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={onNewSession}
                    className="w-full sidebar-item justify-start py-2.5 hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-normal truncate"
                  >
                    <span className="truncate">{title}</span>
                  </button>
                ))
              )
            ) : (
              filteredSessions.length === 0 ? (
                <div className="text-[10.5px] text-[var(--text-muted)] p-3 italic text-center">
                  No chats match search.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isEditing = session.id === editingSessionId;

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer select-none border border-transparent active:scale-[0.98] ${
                        isActive 
                          ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-medium shadow-sm' 
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-hover)]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-0.5">
                        <MessageSquare className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        
                        {isEditing ? (
                          <form onSubmit={(e) => saveRename(session.id, e)} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renamedTitle}
                              onChange={(e) => setRenamedTitle(e.target.value)}
                              onBlur={(e) => saveRename(session.id, e)}
                              className="w-full py-0.5 px-2 bg-transparent text-[var(--text-main)] rounded border border-[var(--border-color)] outline-none text-xs"
                              autoFocus
                            />
                          </form>
                        ) : (
                          <span className="truncate pr-1 text-[13.5px]">
                            {session.title}
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition duration-150">
                          <button
                            type="button"
                            onClick={(e) => startRename(session.id, session.title, e)}
                            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            title="Rename thread"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-red-500"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* Profile Bar matching the mockup (Orange Avatar + Marketplace Icon) */}
      <div 
        onClick={onOpenSettings}
        className="p-3.5 border-t border-[var(--border-color)] bg-transparent flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-all duration-150 select-none active:bg-[var(--bg-hover)]"
      >
        <div className="flex items-center gap-3 min-w-0 hover:scale-[1.02] transition-transform">
          {/* Orange Avatar */}
          <div className="w-7 h-7 rounded-full bg-[#f48c06] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left leading-tight min-w-0">
            <div className="text-[var(--text-main)] font-semibold text-[13px] truncate">
              {settings.userName || 'Offline User'}
            </div>
          </div>
        </div>
        
        {/* Marketplace store icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
          title="Preferences & Models"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
