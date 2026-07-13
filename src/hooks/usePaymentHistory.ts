import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { paymentHistoryService } from '../services/paymentHistoryService';

export function usePaymentHistory(userId?: string, enabled: boolean = true) {
    const queryClient = useQueryClient();

    const { data: histories, isLoading, error } = useQuery({
        queryKey: ['paymentHistories', userId],
        queryFn: async () => {
            try {
                return await paymentHistoryService.getPaymentHistories(userId);
            } catch (err) {
                console.error('Failed to fetch payment histories:', err);
                throw err;
            }
        },
        enabled: enabled
    });

    useEffect(() => {
        // Disable subscription if environment variables are not loaded (e.g. testing)
        const isEnvMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');
        if (isEnvMissing) return;

        const channelName = `payment_history_realtime_${userId || 'all'}_${Math.random().toString(36).substring(7)}`;
        const historySubscription = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', table: 'payment_history', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['paymentHistories'] });
                    queryClient.invalidateQueries({ queryKey: ['users'] }); // Invalidate users to update debt stats
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(historySubscription);
        };
    }, [queryClient, userId]);

    return { histories, isLoading, error };
}
