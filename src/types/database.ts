export type User = {
    id: string;
    tag_id: string;
    chatops_channel_id: string;
    user_name: string;
    role: number;
    email: string;
    avatar_url: string | null;
    last_post_id?: string | null;
    total_unpaid?: number;
    total_paid?: number;
};

export type BillStatus = 'unpaid' | 'paid' | 'pending';

export type Bill = {
    id: string;
    user_id: string;
    bill_date: string;
    title?: string;
    total_amount: number;
    is_paid: boolean;
    created_at: string;
};

export type BillItem = {
    id: string;
    bill_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    created_at: string;
};

export type DetailedBill = Bill & {
    bill_items: BillItem[];
    users: User | null;
};

// Type for the getBills view
export type ViewBill = {
    id: string;
    bill_date: string;
    tag_id: string;
    total_amount: number;
    is_paid: boolean;
    items: {
        id: string;
        bill_id: string;
        item_name: string;
        quantity: number;
        unit_price: number;
        discount_amount: number;
    }[];
};
