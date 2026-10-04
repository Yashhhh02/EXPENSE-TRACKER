'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileType, ChevronDown } from 'lucide-react';

interface ExportButtonProps {
  reportType: 'monthly' | 'weekly' | 'yearly';
  period: string;
}

export function ExportButton({ reportType, period }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    setOpen(false);
    const url = `/api/export/${format}?reportType=${reportType}&period=${encodeURIComponent(period)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all"
      >
        <Download className="w-4 h-4" />
        <span>Export Report</span>
        <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-xl">
          <div className="px-3 py-1.5 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Choose Download Format
          </div>

          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-amber-400 transition-all text-left"
          >
            <FileType className="w-4 h-4 text-amber-400" />
            <span>CSV Data Sheet (.csv)</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-amber-400 transition-all text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Excel Workbook (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-amber-400 transition-all text-left"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>PDF Executive Summary (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
