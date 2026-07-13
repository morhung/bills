import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { userService } from '../services/userService';

export function useUsers(enabled: boolean = true) {
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            return await userService.getUsers();
        },
        enabled: enabled
    });

    useEffect(() => {
        const channelName = `users_realtime_${Math.random().toString(36).substring(7)}`;
        const subscription = supabase
            .channel(channelName)
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
