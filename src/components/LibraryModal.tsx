import React, { useState, useEffect } from 'react';
import { X, Search, Copy, Check, Plus, Trash2, BookOpen, Sparkles, Code, PenTool, LayoutGrid, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PromptItem {
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

export const PREADDED_PROMPTS: PromptItem[] = [
  // CODING
  {
    id: 'code-refactor', title: 'Code Refactor Expert', category: 'coding',
    description: 'Expertly rewrite code to be cleaner, faster, and more scalable.',
    promptText: 'You are a senior software architect. I will provide you with a snippet of code. Your task is to refactor it to improve readability, efficiency, and maintainability without altering its core functionality. Explain the reasoning behind your architectural changes briefly.'
  },
  {
    id: 'code-debugger', title: 'Relentless Debugger', category: 'coding',
    description: 'Find elusive bugs and memory leaks in complex codebases.',
    promptText: 'You are an expert debugger. I will provide you with buggy code and the resulting error trace or unexpected behavior. Analyze the code line-by-line, isolate the root cause, and provide a comprehensive fix along with an explanation of why the bug occurred.'
  },
  {
    id: 'code-explainer', title: 'Code Explainer', category: 'coding',
    description: 'Break down complex algorithms into simple, digestible concepts.',
    promptText: 'Explain the following code block to me as if I am a junior developer. Break down complex logic step-by-step, define any obscure syntax, and summarize the overall goal of the algorithm.'
  },
  {
    id: 'regex-master', title: 'Regex Master', category: 'coding',
    description: 'Generate complex Regular Expressions safely and accurately.',
    promptText: 'You are a Regular Expression master. I will describe a text pattern I need to match, extract, or replace. Provide the exact Regex pattern, along with a breakdown of what each part of the expression does, and provide test cases that match and fail.'
  },
  {
    id: 'sql-architect', title: 'SQL Architect', category: 'coding',
    description: 'Design and optimize complex database queries.',
    promptText: 'You are an expert database administrator. I will describe a database schema and a data retrieval goal. Write the most optimized, secure, and accurate SQL query to achieve this, using JOINs, indexes, or window functions where appropriate.'
  },
  {
    id: 'tdd-tester', title: 'TDD Test Writer', category: 'coding',
    description: 'Automatically generate comprehensive unit test suites.',
    promptText: 'Write a comprehensive suite of unit tests for the provided code. Cover the happy path, edge cases, null inputs, and expected errors. Use modern testing frameworks like Jest, PyTest, or JUnit based on the code language.'
  },
  {
    id: 'ts-typings', title: 'TypeScript Typings Pro', category: 'coding',
    description: 'Creates complex, strict TypeScript interfaces and generics.',
    promptText: 'Act as a TypeScript Expert. Create strict, highly-typed interfaces, types, and generic utility types for the described data structure. Ensure maximum type safety and avoid the use of "any".'
  },
  {
    id: 'bash-guru', title: 'Linux Bash Guru', category: 'coding',
    description: 'Writes robust, automated bash scripts.',
    promptText: 'Act as a Linux Bash Expert. Write a robust, POSIX-compliant bash script to achieve the requested task. Include error handling (set -e), logging, and comments explaining each step.'
  },

  // WRITING
  {
    id: 'master-copywriter', title: 'Master Copywriter', category: 'writing',
    description: 'Write persuasive, high-converting marketing copy.',
    promptText: 'You are a world-class copywriter. Write highly persuasive, engaging, and conversion-optimized copy based on the product or topic I provide. Focus on emotional triggers, clear calls-to-action, and concise phrasing.'
  },
  {
    id: 'seo-blog', title: 'SEO Blog Creator', category: 'writing',
    description: 'Draft comprehensive, SEO-optimized blog articles.',
    promptText: 'Write a comprehensive, engaging, and SEO-optimized blog post on the provided topic. Include an eye-catching title, an introductory hook, structured subheadings, and a strong conclusion. Use a conversational but authoritative tone.'
  },
  {
    id: 'strict-proofreader', title: 'Strict Proofreader', category: 'writing',
    description: 'Meticulously correct grammar, syntax, and flow.',
    promptText: 'Proofread the following text with intense scrutiny. Correct any grammatical errors, typos, awkward phrasing, and punctuation mistakes. Return the polished text, and briefly list the major corrections you made.'
  },
  {
    id: 'email-crafter', title: 'Professional Emailer', category: 'writing',
    description: 'Draft polite, professional, and clear emails.',
    promptText: 'Draft a professional, clear, and polite email based on my instructions. Ensure the tone is appropriate for a corporate setting, get straight to the point, and include a clear call to action or next step.'
  },
  {
    id: 'storyteller', title: 'Creative Storyteller', category: 'writing',
    description: 'Weave vivid and engaging creative narratives.',
    promptText: 'You are a master storyteller. Write a captivating, creative narrative based on the prompt provided. Focus on vivid world-building, strong character development, and "show, don\'t tell" descriptions.'
  },
  {
    id: 'tone-translator', title: 'Tone Translator', category: 'writing',
    description: 'Rewrites text into a completely different tone (formal, funny, etc).',
    promptText: 'Take the provided text and completely rewrite it in the requested tone. Maintain the original core message and facts, but change the vocabulary, pacing, and style to match the new tone perfectly.'
  },
  {
    id: 'cold-email', title: 'Cold Email Architect', category: 'writing',
    description: 'Crafts high-response-rate cold outreach emails.',
    promptText: 'Act as a B2B Sales Expert. Write a concise, personalized cold outreach email for the provided scenario. Ensure it has a catchy subject line, demonstrates immediate value, uses social proof, and ends with a low-friction question.'
  },
  {
    id: 'tech-docs', title: 'Technical Documentation', category: 'writing',
    description: 'Creates clear, concise READMEs and technical docs.',
    promptText: 'Act as an expert Technical Writer. Create clear, concise, and professional documentation for the provided code/system. Include an Overview, Installation steps, API Reference, and Examples.'
  },

  // GENERAL
  {
    id: 'data-analyst', title: 'Data Analyst', category: 'general',
    description: 'Extract insights and trends from raw data.',
    promptText: 'Act as a Senior Data Analyst. I will provide raw data or statistics. Analyze it to find meaningful trends, outliers, and actionable insights. Summarize your findings in a clear, executive-friendly format with bullet points.'
  },
  {
    id: 'swot-analysis', title: 'SWOT Strategist', category: 'general',
    description: 'Perform a comprehensive SWOT analysis on a topic.',
    promptText: 'Perform a detailed SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis on the business, product, or idea I provide. Be objective, thorough, and provide strategic recommendations based on the analysis.'
  },
  {
    id: 'pros-cons', title: 'Pros & Cons Evaluator', category: 'general',
    description: 'Objectively weigh the pros and cons of any decision.',
    promptText: 'Objectively evaluate the provided concept or decision. List out the most significant pros and cons, weighing the short-term and long-term impacts. Conclude with a balanced summary to help make a final decision.'
  },
  {
    id: 'tldr-summarizer', title: 'TL;DR Summarizer', category: 'general',
    description: 'Distill massive walls of text into key takeaways.',
    promptText: 'Read the following text and distill it into a concise, easily digestible summary. Highlight the core thesis, the top 3 key takeaways, and any actionable conclusions. Remove all fluff.'
  },
  {
    id: 'interview-prep', title: 'Tough Interviewer', category: 'general',
    description: 'Conduct a rigorous mock interview.',
    promptText: 'Act as a strict hiring manager interviewing me for a senior role. Ask me tough, behavioral and technical questions one at a time. Wait for my answer, critique it honestly, and then ask the next question.'
  },
  {
    id: 'language-tutor', title: 'Language Tutor', category: 'general',
    description: 'Help practice conversational foreign languages.',
    promptText: 'Act as a patient native-speaker language tutor. Converse with me in the language I request. Correct my grammar or vocabulary gently if I make mistakes, and keep the conversation engaging and natural.'
  },
  {
    id: 'step-planner', title: 'Step-by-Step Planner', category: 'general',
    description: 'Break down massive goals into actionable steps.',
    promptText: 'I will give you a massive, complex goal. Break it down into a highly actionable, chronological step-by-step plan. Ensure each step is realistic, measurable, and logically follows the previous one.'
  },
  {
    id: 'socratic-teacher', title: 'Socratic Teacher', category: 'general',
    description: 'Learn by being asked guiding questions.',
    promptText: 'Act as a Socratic tutor. Do not give me direct answers. Instead, ask me guiding questions to help me arrive at the answer myself. Encourage critical thinking and challenge my assumptions gently.'
  },
  {
    id: 'prompt-engineer', title: 'Prompt Optimizer', category: 'general',
    description: 'Upgrade your rough prompts into perfect LLM instructions.',
    promptText: 'Act as an expert Prompt Engineer. I will give you a rough, basic prompt. Rewrite it into a highly detailed, optimal prompt designed to get the best possible response from a Large Language Model. Use techniques like persona assignment, step-by-step constraints, and output formatting.'
  },
  {
    id: 'mental-models', title: 'Mental Model Thinker', category: 'general',
    description: 'Analyze problems using diverse mental models.',
    promptText: 'Analyze the provided problem using three distinct mental models (e.g., First Principles, Inversion, Occam\'s Razor). Explain how each model applies to the problem and the unique insights it yields.'
  }
];

export default function LibraryModal({ isOpen, onClose, onSelectPrompt }: LibraryModalProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Custom prompt inputs
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'coding' | 'writing' | 'general'>('general');
  const [newDesc, setNewDesc] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<PromptItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      const merged = PREADDED_PROMPTS.map(p => customList.find(c => c.id === p.id) || p);
      const pureCustom = customList.filter(c => !PREADDED_PROMPTS.some(p => p.id === c.id));
      setPrompts([...merged, ...pureCustom]);
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
      id: editingId || `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory as any,
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
    
    if (editingId) {
      if (customList.some(p => p.id === editingId)) {
        customList = customList.map(p => p.id === editingId ? newPrompt : p);
      } else {
        customList = [...customList, newPrompt];
      }
    } else {
      customList = [...customList, newPrompt];
    }
    
    localStorage.setItem('gguf-prompt-library', JSON.stringify(customList));

    const merged = PREADDED_PROMPTS.map(p => customList.find(c => c.id === p.id) || p);
    const pureCustom = customList.filter(c => !PREADDED_PROMPTS.some(p => p.id === c.id));
    setPrompts([...merged, ...pureCustom]);

    setNewTitle('');
    setNewDesc('');
    setNewPromptText('');
    setEditingId(null);
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
      
      const merged = PREADDED_PROMPTS.map(p => filtered.find(c => c.id === p.id) || p);
      const pureCustom = filtered.filter(c => !PREADDED_PROMPTS.some(p => p.id === c.id));
      setPrompts([...merged, ...pureCustom]);
    } catch (err) {}
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl h-[85vh] bg-[var(--bg-main)]/95 backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-hover)]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--text-main)] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-[var(--bg-main)]" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight text-[var(--text-main)]">Prompt Library</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">Discover and manage high-quality AI instructions</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--border-color)] bg-[var(--modal-sidebar-bg)] hidden sm:flex flex-col shrink-0">
            <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
              <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-3">Categories</h3>
              {['all', 'coding', 'writing', 'general', 'custom'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setShowAddForm(false); setViewingPrompt(null); setEditingId(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeCategory === cat && !showAddForm && !viewingPrompt
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {cat === 'all' && <LayoutGrid className="w-4 h-4" />}
                  {cat === 'coding' && <Code className="w-4 h-4" />}
                  {cat === 'writing' && <PenTool className="w-4 h-4" />}
                  {cat === 'general' && <Zap className="w-4 h-4" />}
                  {cat === 'custom' && <BookOpen className="w-4 h-4" />}
                  <span className="capitalize">{cat}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--modal-sidebar-bg)]">
              <button
                onClick={() => { 
                  if (showAddForm && !editingId) {
                    setShowAddForm(false);
                  } else {
                    setShowAddForm(true); 
                    setActiveCategory('custom');
                    setViewingPrompt(null);
                    setNewTitle(''); setNewDesc(''); setNewPromptText(''); setEditingId(null);
                  }
                }}
                className={`w-full flex items-center gap-2 justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                  showAddForm && !editingId
                    ? 'bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)]' 
                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:shadow-[var(--accent)]/20 hover:-translate-y-0.5'
                }`}
              >
                <Plus className="w-4 h-4" />
                {showAddForm && !editingId ? 'View Library' : 'Create Custom'}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
            {!showAddForm && !viewingPrompt && (
              <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-hover)]/10 flex items-center gap-3 shrink-0">
                <div className="relative flex items-center bg-[var(--bg-input)] rounded-xl px-4 py-2.5 border border-[var(--border-color)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all w-full max-w-lg shadow-sm">
                  <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <input
                    type="text"
                    placeholder="Search prompts by title, description, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] outline-none pl-3 text-[var(--text-main)] placeholder-[var(--text-muted)]"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {viewingPrompt ? (
                  <motion.div 
                    key="viewing"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col h-full bg-[var(--bg-hover)]/20 rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)] gap-4">
                      <button 
                        onClick={() => setViewingPrompt(null)}
                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-300 ease-out text-sm font-semibold cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Back to Library
                      </button>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={(e) => handleCopy(viewingPrompt.promptText, viewingPrompt.id, e)}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] text-[var(--text-main)] transition-all duration-300 ease-out text-sm font-semibold border border-[var(--border-color)] shadow-sm cursor-pointer"
                        >
                          {copiedId === viewingPrompt.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            setNewTitle(viewingPrompt.title);
                            setNewCategory(viewingPrompt.category as any);
                            setNewDesc(viewingPrompt.description);
                            setNewPromptText(viewingPrompt.promptText);
                            setEditingId(viewingPrompt.id);
                            setViewingPrompt(null);
                            setShowAddForm(true);
                          }}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] text-[var(--text-main)] transition-all duration-300 ease-out text-sm font-semibold border border-[var(--border-color)] shadow-sm cursor-pointer"
                        >
                          <PenTool className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('insert-prompt', { detail: viewingPrompt.promptText }));
                            onSelectPrompt(viewingPrompt.promptText);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all shadow-md shadow-[var(--accent)]/20 hover:-translate-y-0.5 text-sm font-bold cursor-pointer"
                        >
                          <Zap className="w-4 h-4" /> Use Prompt
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 overflow-y-auto">
                       <div className="flex items-center gap-3 mb-4">
                         <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                viewingPrompt.category === 'coding' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                                viewingPrompt.category === 'writing' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                viewingPrompt.category === 'custom' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                              }`}>
                           {viewingPrompt.category}
                         </span>
                       </div>
                       <h3 className="text-3xl font-bold text-[var(--text-main)] mb-3">{viewingPrompt.title}</h3>
                       <p className="text-[15px] text-[var(--text-muted)] mb-8 leading-relaxed max-w-3xl">{viewingPrompt.description}</p>
                       
                       <div className="bg-[var(--bg-main)] rounded-2xl p-6 border border-[var(--border-color)] shadow-inner">
                         <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Code className="w-4 h-4" /> Prompt Template
                         </h4>
                         <p className="text-[14.5px] font-sans text-[var(--text-main)] leading-loose whitespace-pre-wrap">
                           {viewingPrompt.promptText}
                         </p>
                       </div>
                    </div>
                  </motion.div>
                ) : showAddForm ? (
                  <motion.div 
                    key="add-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-3xl mx-auto bg-[var(--bg-hover)]/20 rounded-2xl p-6 md:p-8 border border-[var(--border-color)] shadow-xl"
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        {editingId ? <PenTool className="w-6 h-6 text-[var(--accent)]" /> : <Plus className="w-6 h-6 text-[var(--accent)]" />} 
                        {editingId ? 'Edit Custom Prompt' : 'Create Custom Prompt'}
                      </h3>
                      <p className="text-[13px] text-[var(--text-muted)] mt-1">Design your own reusable prompt template to store in the library.</p>
                    </div>
                    
                    <form onSubmit={handleAddPrompt} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-semibold text-[var(--text-main)]">Title</label>
                          <input 
                            type="text" required
                            value={newTitle} onChange={e => setNewTitle(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all shadow-sm text-[var(--text-main)]"
                            placeholder="e.g. Next.js Boilerplate"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-semibold text-[var(--text-main)]">Category</label>
                          <select 
                            value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all shadow-sm text-[var(--text-main)] cursor-pointer"
                          >
                            <option value="coding">Coding</option>
                            <option value="writing">Writing</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-[var(--text-main)]">Short Description</label>
                        <input 
                          type="text" required
                          value={newDesc} onChange={e => setNewDesc(e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all shadow-sm text-[var(--text-main)]"
                          placeholder="Briefly describe what this prompt does (max 1 sentence)"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-[var(--text-main)]">Prompt Instructions</label>
                        <textarea 
                          required rows={6}
                          value={newPromptText} onChange={e => setNewPromptText(e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all shadow-sm resize-none text-[var(--text-main)] leading-relaxed"
                          placeholder="Type out the exact prompt instructions you want the AI to follow..."
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
                        <button 
                          type="submit" 
                          className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Save Prompt
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {filteredPrompts.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-[15px] font-medium">No prompts found matching your search.</p>
                      </div>
                    ) : (
                      filteredPrompts.map((prompt) => (
                        <div 
                          key={prompt.id}
                          onClick={() => setViewingPrompt(prompt)}
                          className="group bg-[var(--bg-hover)]/20 border border-[var(--border-color)] rounded-2xl p-5 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 transition-all duration-300 cursor-pointer flex flex-col h-[280px] relative overflow-hidden"
                        >
                          {/* Top Bar */}
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-2.5">
                              <span className={`p-2 rounded-xl flex items-center justify-center shadow-sm ${
                                prompt.category === 'coding' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                                prompt.category === 'writing' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                prompt.category === 'custom' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              }`}>
                                {prompt.category === 'coding' ? <Code className="w-4 h-4" /> :
                                 prompt.category === 'writing' ? <PenTool className="w-4 h-4" /> :
                                 prompt.category === 'custom' ? <LayoutGrid className="w-4 h-4" /> :
                                 <Zap className="w-4 h-4" />}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{prompt.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                              <button
                                onClick={(e) => handleCopy(prompt.promptText, prompt.id, e)}
                                className="p-2 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--accent)]/10 text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border-color)] transition-all duration-300 ease-out shadow-sm"
                                title="Copy to clipboard"
                              >
                                {copiedId === prompt.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(e) => handleDeletePrompt(prompt.id, e)}
                                className="p-2 rounded-lg bg-[var(--bg-main)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 border border-[var(--border-color)] transition-all duration-300 ease-out shadow-sm"
                                title={prompt.id.startsWith('custom-') ? "Delete custom prompt" : "Revert to default"}
                              >
                                {prompt.id.startsWith('custom-') ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          <h4 className="font-bold text-[16px] mb-2 text-[var(--text-main)] group-hover:text-[var(--accent)] transition-all duration-300 ease-out relative z-10 line-clamp-1">{prompt.title}</h4>
                          <p className="text-[13px] text-[var(--text-muted)] mb-4 flex-1 relative z-10 leading-relaxed line-clamp-3">{prompt.description}</p>
                          
                          {/* Code Preview snippet */}
                          <div className="mt-auto bg-[var(--bg-main)] rounded-xl p-3.5 border border-[var(--border-color)] relative z-10 h-[80px] shadow-inner">
                            <p className="text-[11.5px] font-sans text-[var(--text-secondary)] line-clamp-3 leading-relaxed opacity-75">
                              {prompt.promptText}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
