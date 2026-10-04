'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl backdrop-blur-xl text-center flex flex-col items-center justify-center shadow-xl ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-extrabold text-white tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center space-x-3">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {actionLabel}
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
