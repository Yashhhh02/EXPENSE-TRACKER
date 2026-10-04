'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export function useRealtimeSync(tables: string[], onDataChange: () => void) {
  const callbackRef = useRef(onDataChange);

  // Keep latest callback reference to avoid stale closures
  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  // Create a stable key from tables array to prevent unnecessary subscription teardowns
  const tablesKey = Array.from(new Set(tables || [])).sort().join(',');

  useEffect(() => {
    if (!isSupabaseConfigured() || !tablesKey) {
      return;
    }

    let isMounted = true;
    let supabase: ReturnType<typeof createClient>;
    let activeChannel: any = null;

    try {
      supabase = createClient();
    } catch (err) {
      console.warn('[RealtimeSync] Failed to initialize Supabase client:', err);
      return;
    }

    const tableList = tablesKey.split(',').filter(Boolean);

    async function initSubscription() {
      // 1. Get authenticated user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user || (await supabase.auth.getUser()).data.user;

      if (!isMounted) return;

      // CRITICAL STEP: Set Realtime Auth Token so WebSocket connects with authenticated JWT
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
        console.log('[RealtimeSync] Realtime WebSocket Auth Token explicitly set');
      } else {
        console.warn('[RealtimeSync] No active access_token found for Realtime auth');
      }

      const channelName = `realtime-sync-${tablesKey}-${Math.random().toString(36).substring(2, 7)}`;
      const channel = supabase.channel(channelName);
      activeChannel = channel;

      tableList.forEach((table) => {
        // Build user RLS filter string
        const filterString = user
          ? table === 'profiles'
            ? `id=eq.${user.id}`
            : `user_id=eq.${user.id}`
          : undefined;

        // Log Step 1 & Step 2 requirements
        const channelConfig = {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: table,
          filter: filterString,
        };

        console.log(`[RealtimeSync] Subscribing to table "${table}" | User UUID: ${user?.id || 'none'}`);
        console.log(`[RealtimeSync] Realtime filter:`, filterString);
        console.log(`[RealtimeSync] Full Channel Config:`, JSON.stringify(channelConfig));

        channel.on(
          'postgres_changes' as any,
          channelConfig,
          (payload: any) => {
            console.log(`⚡ [RealtimeSync] Event received on "${table}":`, payload?.eventType || 'CHANGE', payload);
            if (callbackRef.current) {
              callbackRef.current();
            }
          }
        );
      });

      channel.subscribe((status: string, err: any) => {
        console.log(`[RealtimeSync] Subscription status for "${channelName}":`, status, err || '');
      });
    }

    initSubscription();

    return () => {
      isMounted = false;
      if (activeChannel && supabase) {
        console.log(`[RealtimeSync] Cleaning up channel for tables: ${tablesKey}`);
        supabase.removeChannel(activeChannel);
      }
    };
  }, [tablesKey]);
}
