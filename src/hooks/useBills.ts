import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { billService } from '../services/billService';
import type { BillFilters } from '../services/billService';

export function useBills(filters?: BillFilters, enabled: boolean = true) {
    const queryClient = useQueryClient();

    const { data: bills, isLoading, error } = useQuery({
        queryKey: ['bills', filters],
        queryFn: async () => {
            try {
                return await billService.getBills(filters);
            } catch (err) {
                console.error('Failed to fetch bills:', err);
                throw err;
            }
        },
        enabled: enabled
    });

    useEffect(() => {
        const isEnvMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');
        if (isEnvMissing) return;

        const subscription = supabase
            .channel('bills_and_items_realtime')
            .on(
                'postgres_changes',
                { event: '*', table: 'bills', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['bills'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', table: 'bill_items', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['bills'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [queryClient]);

    return { bills, isLoading, error };
}
