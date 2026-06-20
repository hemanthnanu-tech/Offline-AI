import React, { useState, useEffect } from 'react';
import { X, Search, Copy, Check, Plus, Trash2, BookOpen } from 'lucide-react';

interface PromptItem {
  id: string;
  title: string;
  category: 'coding' | 'writing' | 'general' | 'custom';
  description: string;
  promptText: string;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (text: string) => void;
}

const PREADDED_PROMPTS: PromptItem[] = [
  {
    id: 'pre-1',
    title: 'Senior Software Architect',
    category: 'coding',
    description: 'Expert coding assistant that writes highly optimized, production-ready code with explanations.',
    promptText: 'Act as a Senior Software Architect with 15+ years of experience. Your task is to provide production-ready, highly optimized, and meticulously clean code. \n\nInstructions:\n- Always consider edge cases, performance implications, and security vulnerabilities.\n- Explain your architectural decisions and why you chose a specific design pattern.\n- Include inline comments for complex logic.\n- Provide a brief summary of the complexity (Time & Space) if applicable.\n\nPlease solve the following problem or review the attached code:\n\n[Insert Problem/Code]'
  },
  {
    id: 'pre-2',
    title: 'Executive Summarizer Pro',
    category: 'writing',
    description: 'Transforms lengthy documents into clear, executive-level summaries with actionable insights.',
    promptText: 'You are an expert executive assistant. Analyze the following text and distill it into a high-level executive summary.\n\nRequirements:\n- Start with a 2-3 sentence overarching summary.\n- Use bold headings for different topics.\n- Provide bullet points for key takeaways and crucial data points.\n- Conclude with a list of actionable items or next steps.\n- Maintain a professional, objective tone.\n\nHere is the text:\n\n[Insert Text Here]'
  },
  {
    id: 'pre-3',
    title: 'Expert UI/UX Consultant',
    category: 'general',
    description: 'Provides in-depth critique and actionable advice for improving user interfaces and user experience.',
    promptText: 'Act as an Expert UI/UX Consultant. I need you to evaluate a design concept or a user flow.\n\nInstructions:\n- Analyze the design based on modern accessibility standards (WCAG), visual hierarchy, and cognitive load.\n- Provide detailed feedback structured with bold headings (e.g., Typography, Color Palette, User Flow).\n- Suggest specific, actionable improvements.\n- Mention best practices for responsive design and mobile-first approaches.\n\nHere is the concept to evaluate:\n\n[Describe UI/UX Concept]'
  },
  {
    id: 'pre-4',
    title: 'Master Storyteller & Worldbuilder',
    category: 'writing',
    description: 'Generates deeply immersive fictional narratives with rich worldbuilding and character arcs.',
    promptText: 'You are a Master Storyteller and Worldbuilder. Write a highly engaging, immersive fictional story based on the provided prompt.\n\nGuidelines:\n- Establish a vivid setting with rich sensory details (sight, sound, smell).\n- Develop compelling characters with distinct voices and internal motivations.\n- Ensure the narrative arc has clear rising action, climax, and resolution.\n- Use sophisticated vocabulary and varied sentence structures to maintain reader engagement.\n\nPrompt:\n\n[Insert Story Prompt]'
  },
  {
    id: 'pre-5',
    title: 'Deep-Dive Analytical Tutor',
    category: 'general',
    description: 'Breaks down complex scientific, technical, or historical concepts comprehensively.',
    promptText: 'Act as a world-class university professor. Explain the following complex concept in a highly structured, comprehensive manner.\n\nStructure your response as follows:\n1. **Core Concept**: A clear, 1-paragraph summary.\n2. **Detailed Breakdown**: Explain the mechanisms, theories, or historical context using analogies where appropriate.\n3. **Real-World Applications**: Give 2-3 concrete examples of how this is used or observed in the real world.\n4. **Common Misconceptions**: Clarify any widespread misunderstandings.\n\nConcept to explain:\n\n[Insert Concept]'
  }
];

export default function LibraryModal({ isOpen, onClose, onSelectPrompt }: LibraryModalProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  
  // Custom prompt inputs
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'coding' | 'writing' | 'general'>('general');
  const [newDesc, setNewDesc] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('gguf-prompt-library');
      let customList: PromptItem[] = [];
      if (saved) {
        try {
          customList = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse custom prompts", e);
        }
      }
      const combined = [...PREADDED_PROMPTS, ...customList];
      setPrompts(combined);
      if (combined.length > 0) {
        setSelectedPromptId(combined[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) return;

    const newPrompt: PromptItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: 'custom',
      description: newDesc.trim() || 'Custom user prompt',
      promptText: newPromptText.trim()
    };

    const saved = localStorage.getItem('gguf-prompt-library');
    let customList: PromptItem[] = [];
    if (saved) {
      try {
        customList = JSON.parse(saved);
      } catch (err) {}
    }
    const updatedCustomList = [...customList, newPrompt];
    localStorage.setItem('gguf-prompt-library', JSON.stringify(updatedCustomList));

    const updatedCombined = [...PREADDED_PROMPTS, ...updatedCustomList];
    setPrompts(updatedCombined);
    setSelectedPromptId(newPrompt.id);

    // Reset inputs
    setNewTitle('');
    setNewDesc('');
    setNewPromptText('');
    setShowAddForm(false);
  };

  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom prompt?")) return;

    const saved = localStorage.getItem('gguf-prompt-library');
    if (!saved) return;

    try {
      const customList: PromptItem[] = JSON.parse(saved);
      const filtered = customList.filter(p => p.id !== id);
      localStorage.setItem('gguf-prompt-library', JSON.stringify(filtered));

      const updatedCombined = [...PREADDED_PROMPTS, ...filtered];
      setPrompts(updatedCombined);
      if (selectedPromptId === id && updatedCombined.length > 0) {
        setSelectedPromptId(updatedCombined[0].id);
      }
    } catch (err) {}
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl h-[580px] bg-[var(--modal-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex overflow-hidden text-[var(--text-main)] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side Prompts List Panel */}
        <div className="w-80 bg-[var(--modal-sidebar-bg)] border-r border-[var(--border-color)] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
            {/* Header Title Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-sm">Prompt Library</span>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Local Search input */}
            <div className="relative flex items-center bg-[var(--bg-hover)]/40 hover:bg-[var(--bg-hover)] rounded-lg px-2.5 py-1.5 border border-transparent focus-within:border-[var(--text-muted)] transition duration-155">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-[12.5px] outline-none pl-2 text-[var(--text-main)] placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Filter buttons tab row */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-medium border-b border-[var(--border-color)] scrollbar-none select-none">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeCategory === 'all' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('coding')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeCategory === 'coding' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50'}`}
              >
                Coding
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('writing')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeCategory === 'writing' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50'}`}
              >
                Writing
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('custom')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${activeCategory === 'custom' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/50'}`}
              >
                Custom
              </button>
            </div>

            {/* Prompts list column */}
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
              {filteredPrompts.length === 0 ? (
                <div className="text-[11px] text-[var(--text-muted)] italic text-center pt-8">
                  No prompts match filters.
                </div>
              ) : (
                filteredPrompts.map(p => {
                  const isSel = p.id === selectedPromptId;
                  const isCustom = p.category === 'custom';
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPromptId(p.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-left transition ${
                        isSel ? 'bg-[var(--bg-hover)] border-l-2 border-indigo-500' : 'hover:bg-[var(--bg-hover)]/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-[12.5px] block truncate ${isSel ? 'font-semibold' : ''}`}>
                          {p.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] truncate block">
                          {p.description}
                        </span>
                      </div>
                      
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePrompt(p.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition duration-150"
                          title="Delete Custom Prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add custom prompt bottom action button */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]/80 text-[12px] font-semibold rounded-lg transition border border-[var(--border-color)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Prompt</span>
          </button>
        </div>

        {/* Right Side Detail/Add Panel */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[var(--modal-bg)]">
          {showAddForm ? (
            /* CREATE CUSTOM PROMPT FORM */
            <form onSubmit={handleAddPrompt} className="p-6 overflow-y-auto flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-color)]">
                  <h3 className="text-base font-semibold">New Custom Prompt</h3>
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    Back to detail
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] font-medium">Prompt Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Optimizer Helper"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--text-muted)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] font-medium">Short Description</label>
                  <input
                    type="text"
                    placeholder="Brief summary of the prompt usage"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--text-muted)]"
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="text-xs text-[var(--text-secondary)] font-medium">Prompt Instructions</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe how the AI should behave or copy your instructions template..."
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="w-full p-2.5 text-xs bg-transparent border border-[var(--border-color)] rounded-xl outline-none resize-none focus:border-[var(--text-muted)] flex-1 min-h-[160px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          ) : (
            /* PROMPT DETAILS PREVIEW */
            <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-between h-full">
              {selectedPrompt ? (
                <div className="space-y-4 text-left flex-1 flex flex-col">
                  <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
                    <div>
                      <h3 className="text-lg font-bold">{selectedPrompt.title}</h3>
                      <span className="text-[10px] bg-zinc-500/10 text-[var(--text-muted)] px-2 py-0.5 rounded-full font-semibold uppercase font-mono tracking-wider">
                        {selectedPrompt.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(selectedPrompt.promptText, selectedPrompt.id, e)}
                      className="flex items-center gap-1 text-xs border border-[var(--border-color)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition cursor-pointer font-medium text-[var(--text-secondary)]"
                    >
                      {copiedId === selectedPrompt.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                    <strong>Description:</strong> {selectedPrompt.description}
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Prompt Text</label>
                    <div className="flex-1 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)]/20 text-xs font-mono select-text overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedPrompt.promptText}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)] italic">
                  Select a prompt to view details.
                </div>
              )}

              {selectedPrompt && (
                <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[var(--border-color)] select-none">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(selectedPrompt.promptText);
                      onClose();
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm hover:shadow"
                  >
                    Use in Chat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
