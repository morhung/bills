import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types/database';

export function useUsers() {
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('user_name', { ascending: true });

            if (error) throw error;
            return data as User[];
        }
    });

    useEffect(() => {
        const subscription = supabase
            .channel('users_realtime')
            .on(
                'postgres_changes',
                { event: '*', table: 'users', schema: 'public' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [queryClient]);

    return { users, isLoading, error };
}
