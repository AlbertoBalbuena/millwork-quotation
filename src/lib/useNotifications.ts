import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useCurrentMember } from './useCurrentMember';
import type { AppNotification } from '../types';

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { member } = useCurrentMember();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);

  const memberId = member?.id;

  const refresh = useCallback(async () => {
    if (!memberId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', memberId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
    lastFetchRef.current = Date.now();
  }, [memberId]);

  // Initial load
  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    refresh();
  }, [memberId, refresh]);

  // Layer 1: Same-client instant feedback via custom DOM event
  useEffect(() => {
    const handler = () => { refresh(); };
    window.addEventListener('notifications-updated', handler);
    return () => window.removeEventListener('notifications-updated', handler);
  }, [refresh]);

  // Layer 2: Realtime subscription for cross-client notifications
  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${memberId}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Notification realtime subscription error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  // Layer 3: Poll every 8s as final fallback
  useEffect(() => {
    if (!memberId) return;
    const interval = setInterval(() => {
      if (Date.now() - lastFetchRef.current > 6000) {
        refresh();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [memberId, refresh]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (memberId) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', memberId)
        .eq('is_read', false);
    }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh };
}
