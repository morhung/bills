import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

export function useUsers(enabled: boolean = true) {
    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            return await userService.getUsers();
        },
        enabled: enabled
    });

    return { users, isLoading, error };
}
