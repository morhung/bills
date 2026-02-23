import { supabase } from '../lib/supabase';
import type { DetailedBill } from '../types/database';

export const billService = {
    /**
     * Fetch all bills with their items and user information
     */
    async getBills(): Promise<DetailedBill[]> {
        const { data, error } = await supabase
            .from('bills')
            .select(`
                *,
                bill_items (*),
                users:user_id (*)
            `)
            .order('bill_date', { ascending: false });

        if (error) {
            console.error('Error fetching bills:', error);
            throw error;
        }

        return (data as any[]) || [];
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
