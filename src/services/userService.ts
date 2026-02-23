import { supabase } from '../lib/supabase';
import type { User } from '../types/database';

export const userService = {
    /**
     * Fetch all users directly from the 'users' table.
     * total_unpaid and total_paid are expected to be available in the table.
     */
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('user_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data as User[];
    }
};
