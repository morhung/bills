import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { billService } from '../services/billService';
import type { DetailedBill } from '../types/database';

export function useBills() {
    const queryClient = useQueryClient();

    const { data: bills, isLoading, error } = useQuery({
        queryKey: ['bills'],
        queryFn: async () => {
            try {
                return await billService.getBills();
            } catch (err) {
                console.error('Failed to fetch bills:', err);
                throw err;
            }
        }
    });

    useEffect(() => {
        const isEnvMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');
        if (isEnvMissing) return;

        const billsSubscription = supabase
            .channel('bills_realtime')
            .on(
                'postgres_changes',
                { event: '*', table: 'bills', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['bills'] });
                }
            )
            .subscribe();

        const itemsSubscription = supabase
            .channel('items_realtime')
            .on(
                'postgres_changes',
                { event: '*', table: 'bill_items', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['bills'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(billsSubscription);
            supabase.removeChannel(itemsSubscription);
        };
    }, [queryClient]);

    return { bills, isLoading, error };
}
