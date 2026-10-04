'use client';

import { useCallback, useEffect, useState } from 'react';
import { Notification } from '@/types/domain';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, AlertTriangle, Calendar, Target, CheckCheck, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'budget_alert' | 'bill_due'>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifications(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription for instant notification updates across tabs
  useRealtimeSync(['notifications'], loadNotifications);

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

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'budget_alert') return n.type === 'budget_alert';
    if (filter === 'bill_due') return n.type === 'bill_due';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderIcon = (type: string) => {
    if (type === 'budget_alert') {
      return (
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'bill_due') {
      return (
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
        <Target className="w-5 h-5" />
      </div>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Notifications</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Budget threshold alerts, upcoming bill payment reminders, and goal milestones.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 font-semibold text-sm rounded-xl transition-all"
          >
            <CheckCheck className="w-4 h-4 text-amber-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'unread'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('budget_alert')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'budget_alert'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Budget Alerts
        </button>
        <button
          onClick={() => setFilter('bill_due')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'bill_due'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Bill Reminders
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="p-10 text-center text-zinc-400 text-sm">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="There are no pending notifications or system alerts right now."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-zinc-900/40 border-zinc-800/80 opacity-75'
                  : 'bg-zinc-900/90 border-zinc-700/80 shadow-lg'
              }`}
            >
              <div className="flex items-start space-x-4">
                {renderIcon(n.type)}
                <div>
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-zinc-300' : 'text-white font-semibold'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1.5">{formatDate(n.created_at)}</p>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all shrink-0"
                  title="Mark as read"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
