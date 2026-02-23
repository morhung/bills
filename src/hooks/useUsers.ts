import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { userService } from '../services/userService';

export function useUsers() {
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            return await userService.getUsers();
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
