import React, { useState } from 'react';
import { 
  SquarePen, Search, Code, MessageSquare, Settings, Trash2, Edit2, PanelLeftClose, BookOpen, MoreHorizontal, X
} from 'lucide-react';
import { ChatSession, GGUFModelInfo, InferenceSettings } from '../types';
import { ContextMenu } from './ContextMenu';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onCloseSidebar: () => void;
  onOpenLibrary: () => void;
  onClearAll?: () => void;
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
  onOpenSettings,
  onCloseSidebar,
  onOpenLibrary,
  onClearAll,
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
    (s.title || "").toLowerCase().includes((searchQuery || "").toLowerCase())
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
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-[13.5px] outline-none pl-2 pr-6 text-[var(--text-main)] placeholder-[var(--text-muted)]"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-all duration-300 ease-out"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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

          <div className="space-y-0.5 pr-0.5">
            {sessions.length === 0 ? (
                <div className="space-y-2 mt-2 px-2">
                  <div className="h-8 bg-[var(--bg-hover)]/50 rounded-md animate-pulse"></div>
                  <div className="h-8 bg-[var(--bg-hover)]/50 rounded-md animate-pulse"></div>
                  <div className="h-8 bg-[var(--bg-hover)]/30 rounded-md animate-pulse"></div>
                  <div className="h-8 bg-[var(--bg-hover)]/20 rounded-md animate-pulse"></div>
                  <div className="h-8 bg-[var(--bg-hover)]/10 rounded-md animate-pulse"></div>
                </div>
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
                      className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer select-none border border-transparent active:scale-[0.99] transition-transform ${
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
                              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(session.id, e as any); }}
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
                          <div 
                            className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ContextMenu
                              items={[
                                {
                                  id: 'rename',
                                  label: 'Rename',
                                  icon: Edit2,
                                  onClick: () => startRename(session.id, session.title, { stopPropagation: () => {} } as any)
                                },
                                {
                                  id: 'delete',
                                  label: 'Delete',
                                  icon: Trash2,
                                  danger: true,
                                  onClick: (e) => { e?.stopPropagation?.(); onDeleteSession(session.id); }
                                }
                              ]}
                            >
                              <div className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-300 ease-out">
                                <MoreHorizontal className="w-4 h-4" />
                              </div>
                            </ContextMenu>
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
            {typeof settings?.userName === 'string' && settings.userName.trim().length > 0 ? settings.userName.trim().charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left leading-tight min-w-0">
            <div className="text-[var(--text-main)] font-semibold text-[13px] truncate">
              {settings?.userName || 'Offline User'}
            </div>
            <div className="text-[9px] text-[var(--accent)] font-bold tracking-widest uppercase mt-0.5 opacity-80">
              v1.0.0 Stable
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
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}

