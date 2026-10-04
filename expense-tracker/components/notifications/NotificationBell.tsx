'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Notification } from '@/types/domain';
import { Bell, AlertTriangle, Calendar, Target, CheckCheck, ExternalLink } from 'lucide-react';

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds as fallback
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Realtime update for unread bell badge
  useRealtimeSync(['notifications'], fetchNotifications);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentList = notifications.slice(0, 5);

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderIcon = (type: string) => {
    if (type === 'budget_alert') {
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (type === 'bill_due') {
      return <Calendar className="w-4 h-4 text-amber-300 shrink-0" />;
    }
    return <Target className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/60 transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] h-4 text-[10px] font-extrabold text-slate-950 bg-amber-400 rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {recentList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No notifications right now.
              </div>
            ) : (
              recentList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                    n.read ? 'bg-zinc-900/40 opacity-70 hover:bg-zinc-900/80' : 'bg-zinc-950/80 hover:bg-zinc-900'
                  }`}
                >
                  <div className="pt-0.5">{renderIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.read ? 'text-zinc-300' : 'text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {getRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
