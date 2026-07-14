import React from 'react';
import { Bot, Sparkles, Zap, Lock } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-purple-500 rounded-full blur-2xl opacity-20 dark:opacity-40 animate-pulse" />
        <div className="relative bg-[var(--bg-main)] border border-[var(--border-color)] w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl shadow-[var(--accent)]/10 transform rotate-3 hover:rotate-6 transition-transform duration-300">
          <Bot className="w-12 h-12 text-[var(--accent)]" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-3 text-[var(--text-main)] tracking-tight">
        Welcome to Offline AI
      </h2>
      <p className="text-[var(--text-muted)] max-w-md mb-8 text-lg">
        Your 100% private, locally hosted AI chat experience. No data leaves your machine.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full text-left">
        <div className="bg-[var(--bg-bubble)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <Lock className="w-5 h-5 text-emerald-500 mb-2" />
          <h3 className="font-semibold text-[var(--text-main)] mb-1">Fully Secure</h3>
          <p className="text-xs text-[var(--text-muted)]">Everything runs locally. Zero telemetry, zero cloud.</p>
        </div>
        <div className="bg-[var(--bg-bubble)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <Zap className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="font-semibold text-[var(--text-main)] mb-1">Lightning Fast</h3>
          <p className="text-xs text-[var(--text-muted)]">Powered by Llama.cpp with bare-metal performance.</p>
        </div>
      </div>
    </div>
  );
};
