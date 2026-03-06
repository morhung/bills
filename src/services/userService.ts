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
    },

    /**
     * Fetch a single user by tag_id.
     * Efficient query to check if a user route is valid without loading all users.
     */
    async getUserByTagId(tagId: string): Promise<User | null> {
        if (!tagId) return null;

        const cleanTagId = tagId.toLowerCase().replace('-runsystem.net', '');
        const fullTagId = `${cleanTagId}-runsystem.net`;

        // Only request columns needed by MainView to minimize payload size
        const { data, error } = await supabase
            .from('users')
            .select('id, tag_id, user_name')
            .eq('tag_id', fullTagId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // PGRST116 means zero rows returned from .single()
                return null;
            }
            console.error('Error fetching user by tag ID:', error);
            throw error;
        }

        return data as User;
    }
};
