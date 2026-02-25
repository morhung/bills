import { supabase } from '../lib/supabase';
import type { DetailedBill, ViewBill } from '../types/database';

export interface BillFilters {
    tagId?: string;
    status?: 'paid' | 'unpaid';
    month?: number;
    year?: number;
}

export const billService = {
    /**
     * Fetch all bills using the getBills view with optimized filtering and sorting
     */
    async getBills(filters?: BillFilters): Promise<DetailedBill[]> {
        let query = supabase
            .from('getBills')
            .select('*');

        // apply filters
        if (filters?.tagId) {
            query = query.eq('tag_id', filters.tagId);
        }

        if (filters?.status) {
            query = query.eq('is_paid', filters.status === 'paid');

            // Apply month/year filter only for paid status to optimize performance
            // Unpaid bills are usually fewer and shown all at once
            if (filters.status === 'paid' && filters.month !== undefined && filters.year !== undefined) {
                const startDate = new Date(filters.year, filters.month, 1).toISOString();
                const endDate = new Date(filters.year, filters.month + 1, 0).toISOString();
                query = query.gte('bill_date', startDate).lte('bill_date', endDate);
            }
        }

        // Sorting as requested: bill_date, tag_id, is_paid
        const { data, error } = await query
            .order('bill_date', { ascending: false })
            .order('tag_id', { ascending: true })
            .order('is_paid', { ascending: false });

        if (error) {
            console.error('Error fetching bills from view:', error);
            throw error;
        }

        // Map ViewBill back to DetailedBill structure for UI compatibility
        return (data as ViewBill[]).map(viewBill => ({
            id: viewBill.id,
            bill_date: viewBill.bill_date,
            total_amount: viewBill.total_amount,
            is_paid: viewBill.is_paid,
            user_id: viewBill.user_id, // Now uses actual UUID from view
            created_at: '', // Not in view
            bill_items: viewBill.items || [], // Map items to bill_items
            users: {
                id: viewBill.user_id,
                tag_id: viewBill.tag_id,
                user_name: viewBill.user_name, // Now uses actual name from view
                chatops_channel_id: '',
                role: 0,
                email: '',
                avatar_url: null
            }
        })) as DetailedBill[];
    },

    /**
     * Delete a bill and its associated items
     */
    async deleteBill(billId: string) {
        // Since we have foreign key constraints, we might need to delete items first 
        // if ON DELETE CASCADE is not set. Assuming it's set or handling it here.
        const { error: itemsError } = await supabase
            .from('bill_items')
            .delete()
            .eq('bill_id', billId);

        if (itemsError) throw itemsError;

        const { error: billError } = await supabase
            .from('bills')
            .delete()
            .eq('id', billId);

        if (billError) throw billError;
    },

    /**
     * Save a bill (Insert or Update)
     */
    async saveBill(billData: any) {
        const isUpdate = !!billData.id;
        const billId = billData.id || crypto.randomUUID();

        // 1. Save Bill
        const { error: billError } = await supabase
            .from('bills')
            .upsert({
                id: billId,
                bill_date: billData.bill_date,
                user_id: billData.user_id,
                total_amount: billData.total_amount,
                is_paid: billData.is_paid
            });

        if (billError) throw billError;

        // 2. Handle Items
        if (isUpdate) {
            // Delete existing items for update
            const { error: deleteError } = await supabase
                .from('bill_items')
                .delete()
                .eq('bill_id', billId);
            if (deleteError) throw deleteError;
        }

        const itemsToInsert = billData.items.map((item: any) => ({
            id: crypto.randomUUID(),
            bill_id: billId,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount
        }));

        const { error: itemsError } = await supabase
            .from('bill_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        return billId;
    }
};
