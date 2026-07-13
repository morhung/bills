import { supabase } from '../lib/supabase';
import type { PaymentHistory } from '../types/database';

export const paymentHistoryService = {
    /**
     * Create or update the active unpaid payment history entry for a user
     */
    async upsertPaymentHistory(userId: string, amount: number, items: any[]): Promise<string> {
        // Find if there is an active unpaid record
        const { data: existing, error } = await supabase
            .from('payment_history')
            .select('id')
            .eq('user_id', userId)
            .eq('is_paid', false)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error finding unpaid payment history:', error);
            throw error;
        }

        const now = new Date().toISOString();

        if (existing) {
            // Overwrite the existing unpaid record
            const { data, error: updateError } = await supabase
                .from('payment_history')
                .update({
                    total_amount: amount,
                    items: items,
                    sent_at: now
                })
                .eq('id', existing.id)
                .select('id')
                .single();

            if (updateError) {
                console.error('Error updating payment history:', updateError);
                throw updateError;
            }
            return data.id;
        } else {
            // Create a new unpaid record
            const { data, error: insertError } = await supabase
                .from('payment_history')
                .insert({
                    user_id: userId,
                    total_amount: amount,
                    is_paid: false,
                    items: items,
                    sent_at: now
                })
                .select('id')
                .single();

            if (insertError) {
                console.error('Error inserting payment history:', insertError);
                throw insertError;
            }
            return data.id;
        }
    },

    /**
     * Get all payment histories, optionally filtered by user ID
     */
    async getPaymentHistories(userId?: string): Promise<PaymentHistory[]> {
        let query = supabase
            .from('getPaymentHistory')
            .select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('sent_at', { ascending: false });

        if (error) {
            console.error('Error fetching payment histories:', error);
            throw error;
        }

        return data as PaymentHistory[];
    },

    /**
     * Get details of a single payment history entry, joined with user details
     */
    async getPaymentHistoryById(id: string): Promise<(PaymentHistory & { user?: any }) | null> {
        const { data, error } = await supabase
            .from('getPaymentHistory')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching payment history by id:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            user_id: data.user_id,
            total_amount: data.total_amount,
            is_paid: data.is_paid,
            sent_at: data.sent_at,
            paid_at: data.paid_at,
            payment_method: data.payment_method,
            items: data.items,
            user: {
                user_name: data.user_name,
                tag_id: data.tag_id
            }
        };
    },

    /**
     * Mark a specific payment history entry as paid
     */
    async markAsPaid(id: string, paymentMethod: 'momo' | 'vib'): Promise<void> {
        const { error } = await supabase
            .from('payment_history')
            .update({
                is_paid: true,
                payment_method: paymentMethod,
                paid_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error marking payment history as paid:', error);
            throw error;
        }
    },

    /**
     * Mark the latest unpaid payment history of a user as paid.
     * If no unpaid history exists, optionally creates a paid history entry on the fly.
     */
    async markLatestAsPaid(userId: string, paymentMethod: 'momo' | 'vib', totalAmount?: number, items?: any[]): Promise<void> {
        const { data: latestUnpaid, error } = await supabase
            .from('payment_history')
            .select('id')
            .eq('user_id', userId)
            .eq('is_paid', false)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error finding latest unpaid payment history:', error);
            throw error;
        }

        if (latestUnpaid) {
            await this.markAsPaid(latestUnpaid.id, paymentMethod);
        } else if (totalAmount !== undefined && items !== undefined) {
            const now = new Date().toISOString();
            const { error: insertError } = await supabase
                .from('payment_history')
                .insert({
                    user_id: userId,
                    total_amount: totalAmount,
                    is_paid: true,
                    payment_method: paymentMethod,
                    paid_at: now,
                    sent_at: now,
                    items: items
                });

            if (insertError) {
                console.error('Error creating paid payment history:', insertError);
                throw insertError;
            }
        }
    },

    /**
     * Delete a payment history record
     */
    async deletePaymentHistory(id: string): Promise<void> {
        const { error } = await supabase
            .from('payment_history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting payment history:', error);
            throw error;
        }
    }
};
