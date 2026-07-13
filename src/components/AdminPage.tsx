import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Shield, Trash2, Edit3, Plus, Bell, CreditCard, ChevronLeft, ChevronRight, Calendar, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import type { DetailedBill, BillItem, User } from '../types/database';
import React from 'react'; // Added React import for React.Fragment
import { AddBillPopup } from './AddBillPopup';
import { AddUserPopup } from './AddUserPopup';
import { supabase } from '../lib/supabase';
import { useUsers } from '../hooks/useUsers';
import { useBills } from '../hooks/useBills';
import { useQueryClient } from '@tanstack/react-query';
import { billService } from '../services/billService';
import { chatopsService } from '../services/chatopsService';
import { removeAccents } from '../utils/stringUtils';
import { generateVietQRString, generateVietQRVIBString } from '../services/vietQRService';
import { paymentHistoryService } from '../services/paymentHistoryService';
import { usePaymentHistory } from '../hooks/usePaymentHistory';

export function AdminPage({ userEmail }: { userEmail?: string }) {
    const queryClient = useQueryClient();
    const { users, isLoading: isUsersLoading } = useUsers();

    // Admin Filtering State
    const [adminUserFilter, setAdminUserFilter] = useState<string>('all');
    const [adminStatusFilter, setAdminStatusFilter] = useState<'unpaid' | 'paid'>('unpaid');
    const [adminMonthFilter, setAdminMonthFilter] = useState(new Date().getMonth());
    const [adminYearFilter, setAdminYearFilter] = useState(new Date().getFullYear());

    // UI States for enhanced filters
    const [userSearchInput, setUserSearchInput] = useState('');
    const [isUserSuggestionsOpen, setIsUserSuggestionsOpen] = useState(false);
    const [isDatePopupOpen, setIsDatePopupOpen] = useState(false);

    // Refs for outside click handling
    const userSearchRef = useRef<HTMLDivElement>(null);
    const datePopupRef = useRef<HTMLDivElement>(null);

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const { bills, isLoading: isBillsLoading } = useBills({
        tagId: adminUserFilter === 'all' ? undefined : adminUserFilter,
        status: adminStatusFilter,
        month: adminStatusFilter === 'unpaid' || adminMonthFilter === -1 ? undefined : adminMonthFilter, // Month/year only apply to 'paid' bills
        year: adminStatusFilter === 'unpaid' || adminMonthFilter === -1 ? undefined : adminYearFilter
    });

    const [activeTab, setActiveTab] = useState<'users' | 'bills' | 'payment_history'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
    const [isAddBillOpen, setIsAddBillOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingBill, setEditingBill] = useState<DetailedBill | null>(null);
    const [isNotifyingAll, setIsNotifyingAll] = useState(false);
    const [paymentMethodUser, setPaymentMethodUser] = useState<User | null>(null);

    const { histories: allPaymentHistories, isLoading: isPaymentHistoriesLoading } = usePaymentHistory(
        undefined,
        activeTab === 'payment_history'
    );

    const viewUserBills = (tagId: string) => {
        setAdminUserFilter(tagId);
        setUserSearchInput(tagId);
        setAdminStatusFilter('unpaid');
        setActiveTab('bills');
        setSearchQuery('');
    };


    // Outside click handlers
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isUserSuggestionsOpen && userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
                setIsUserSuggestionsOpen(false);
            }
            if (isDatePopupOpen && datePopupRef.current && !datePopupRef.current.contains(event.target as Node)) {
                setIsDatePopupOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserSuggestionsOpen, isDatePopupOpen]);

    const userSuggestions = useMemo(() => {
        if (!users) return [];
        const input = userSearchInput.toLowerCase().replace('@', '').trim();

        const filtered = users.filter(u =>
            u.tag_id.toLowerCase().includes(input) ||
            (u.user_name && u.user_name.toLowerCase().includes(input))
        );

        // Add "Tất cả" as first option if input matches "tat ca" or "all"
        if ("tat ca".includes(input) || "all".includes(input)) {
            return [{ id: 'all', tag_id: 'all', user_name: 'Tất cả' } as any, ...filtered];
        }

        return filtered;
    }, [userSearchInput, users]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];

        let result = [...users];
        const normalizedSearch = removeAccents(searchQuery).trim().toLowerCase();

        if (normalizedSearch) {
            result = result.filter((u: User) =>
                removeAccents(u.user_name || '').toLowerCase().includes(normalizedSearch) ||
                removeAccents(u.chatops_channel_id || '').toLowerCase().includes(normalizedSearch) ||
                removeAccents(u.tag_id || '').toLowerCase().includes(normalizedSearch) ||
                removeAccents(u.email || '').toLowerCase().includes(normalizedSearch)
            );
        }

        // Sort: 1. Positive debt (>0) desc. 2. Negative debt (<0) desc (most overpaid first). 3. Zero debt alphabetically.
        return result.sort((a, b) => {
            const debtA = a.total_unpaid || 0;
            const debtB = b.total_unpaid || 0;

            const isPosA = debtA > 0;
            const isPosB = debtB > 0;
            const isNegA = debtA < 0;
            const isNegB = debtB < 0;

            // Group 1: Positive Debt
            if (isPosA && !isPosB) return -1;
            if (!isPosA && isPosB) return 1;
            if (isPosA && isPosB) {
                return debtB - debtA;
            }

            // Group 2: Negative Debt
            if (isNegA && !isNegB) return -1; // Negative comes before zero (if B is 0)
            if (!isNegA && isNegB) return 1;  // Negative comes before zero (if A is 0)
            if (isNegA && isNegB) {
                return debtA - debtB; // show most negative first
            }

            // Group 3: Zero Debt
            return (a.user_name || '').localeCompare(b.user_name || '', 'vi');
        });
    }, [searchQuery, users]);

    const filteredBills = useMemo(() => {
        if (!bills) return [];
        const normalizedSearch = removeAccents(searchQuery).trim();
        if (!normalizedSearch) return bills;

        return bills.filter((b: DetailedBill) => {
            const dateStr = new Date(b.bill_date).toLocaleDateString('vi-VN');
            const statusStr = b.is_paid ? 'da thu thanh toan' : 'chua thu thanh toan';

            return (
                removeAccents(dateStr).includes(normalizedSearch) ||
                removeAccents(b.bill_date).includes(normalizedSearch) ||
                removeAccents(b.id).includes(normalizedSearch) ||
                b.total_amount.toString().includes(normalizedSearch) ||
                statusStr.includes(normalizedSearch) ||
                b.bill_items.some((item: BillItem) => removeAccents(item.item_name).includes(normalizedSearch)) ||
                removeAccents(b.users?.user_name || '').includes(normalizedSearch)
            );
        });
    }, [searchQuery, bills]);

    const filteredTotalAmount = useMemo(() => {
        return filteredBills.reduce((acc, b) => acc + (b.total_amount || 0), 0);
    }, [filteredBills]);

    const filteredPaymentHistories = useMemo(() => {
        if (!allPaymentHistories) return [];

        let result = [...allPaymentHistories];
        const normalizedSearch = removeAccents(searchQuery).trim().toLowerCase();

        if (normalizedSearch) {
            result = result.filter((h: any) => {
                const u = users?.find(user => user.id === h.user_id);
                const nameStr = u ? u.user_name : '';
                const dateStr = new Date(h.sent_at).toLocaleDateString('vi-VN');
                const methodStr = h.payment_method || '';
                const statusStr = h.is_paid ? 'da thanh toan paid' : 'chua thanh toan unpaid';
                return (
                    removeAccents(nameStr).toLowerCase().includes(normalizedSearch) ||
                    dateStr.includes(normalizedSearch) ||
                    h.total_amount.toString().includes(normalizedSearch) ||
                    statusStr.includes(normalizedSearch) ||
                    methodStr.toLowerCase().includes(normalizedSearch)
                );
            });
        }

        // Sort: 1. 'unpaid' status comes first. 2. Sorted by sent_at desc (newest first).
        return result.sort((a, b) => {
            const isUnpaidA = !a.is_paid;
            const isUnpaidB = !b.is_paid;

            if (isUnpaidA && !isUnpaidB) return -1;
            if (!isUnpaidA && isUnpaidB) return 1;

            // If same status, sort by sent_at desc (newest first)
            const dateA = new Date(a.sent_at).getTime();
            const dateB = new Date(b.sent_at).getTime();
            return dateB - dateA;
        });
    }, [searchQuery, allPaymentHistories, users]);

    const handleSaveBill = async (billData: any) => {
        try {
            await billService.saveBill(billData);
            alert(billData.id ? 'Cập nhật hóa đơn thành công!' : 'Thêm hóa đơn thành công!');
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            setIsAddBillOpen(false);
            setEditingBill(null);
        } catch (error: any) {
            console.error('Error saving bill:', error);
            alert('Lỗi: ' + error.message);
            throw error; // Re-throw to allow component to handle loading state
        }
    };

    const handleDeleteBill = async (bill: DetailedBill) => {
        if (!confirm(`Bạn có chắc muốn xóa hóa đơn ngày ${new Date(bill.bill_date).toLocaleDateString('vi-VN')}?`)) return;

        try {
            await billService.deleteBill(bill.id);
            alert('Xóa hóa đơn thành công!');
            queryClient.invalidateQueries({ queryKey: ['bills'] });
        } catch (error: any) {
            console.error('Error deleting bill:', error);
            alert('Lỗi: ' + error.message);
        }
    };

    const handleSaveUser = async (userData: any) => {
        try {
            if (userData.id) {
                // Update
                const { error: userError } = await supabase
                    .from('users')
                    .update({
                        tag_id: userData.tag_id,
                        chatops_channel_id: userData.chatops_channel_id,
                        user_name: userData.user_name,
                        email: userData.email,
                        role: userData.role,
                        gender: userData.gender
                    })
                    .eq('id', userData.id);

                if (userError) throw userError;
                alert('Cập nhật người dùng thành công!');
            } else {
                // Insert
                const { error: userError } = await supabase
                    .from('users')
                    .insert([{
                        id: crypto.randomUUID(),
                        tag_id: userData.tag_id,
                        chatops_channel_id: userData.chatops_channel_id,
                        user_name: userData.user_name,
                        email: userData.email,
                        role: userData.role,
                        gender: userData.gender
                    }]);

                if (userError) throw userError;
                alert('Thêm người dùng thành công!');
            }

            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsAddUserOpen(false); // Ensure popup closes
            setEditingUser(null);
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert('Lỗi: ' + error.message);
            throw error;
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.user_name}"?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

            if (error) throw error;
            alert('Xóa người dùng thành công!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('Lỗi: ' + error.message);
        }
    };

    const handleNotifyUser = async (user: User, silent: boolean = false) => {
        if (!user.total_unpaid || user.total_unpaid <= 0) return false;

        try {
            // 1. Fetch unpaid bills of this user
            const { data: unpaidBills, error: fetchBillsError } = await supabase
                .from('bills')
                .select('id, bill_date, total_amount')
                .eq('user_id', user.id)
                .eq('is_paid', false);

            if (fetchBillsError) throw fetchBillsError;

            // 2. Fetch all bill items of these unpaid bills
            let itemsSnapshot: any[] = [];
            if (unpaidBills && unpaidBills.length > 0) {
                const billIds = unpaidBills.map(b => b.id);
                const { data: billItems, error: fetchItemsError } = await supabase
                    .from('bill_items')
                    .select('id, bill_id, item_name, quantity, unit_price, discount_amount')
                    .in('bill_id', billIds);

                if (fetchItemsError) throw fetchItemsError;

                const billIdToDate = unpaidBills.reduce((acc: Record<string, string>, b) => {
                    acc[b.id] = b.bill_date;
                    return acc;
                }, {});

                itemsSnapshot = (billItems || []).map(item => ({
                    id: item.id,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount_amount,
                    bill_date: billIdToDate[item.bill_id]
                }));
            }

            // 3. Upsert the payment history record
            const paymentHistoryId = await paymentHistoryService.upsertPaymentHistory(
                user.id,
                user.total_unpaid,
                itemsSnapshot
            );

            const qrMoMo = generateVietQRString(user.total_unpaid);
            const qrVib = generateVietQRVIBString(user.total_unpaid);

            const prefix = user.gender === 2 ? 'anh ' : user.gender === 3 ? 'chị ' : '';
            const message = `:emo_flower: Hi ${prefix}@${user.tag_id},

 :pepesaber: Dư nợ tuần này là: ${user.total_unpaid.toLocaleString('vi-VN')} VND :money_mouth_face: :money_mouth_face: :money_mouth_face: 

 :point_right: Chi tiết biên lai thanh toán xem [tại đây](https://drink-bill.vercel.app/payment-history/${paymentHistoryId}) 

 :momo: Scan QR code bên dưới để chuyển cho HùngND. 

 ![image](${qrMoMo}) ![image](${qrVib})`;

            const targetChannel = user.chatops_channel_id || "3it5zuqw3bnk3bwkspuyhsotce";
            const postId = await chatopsService.postMessage(message, targetChannel);
            if (postId) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ last_post_id: postId })
                    .eq('id', user.id);

                if (updateError) console.error('Error saving last_post_id:', updateError);

                if (!silent) {
                    alert('Đã gửi thông báo nhắc nợ thành công!');
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                    queryClient.invalidateQueries({ queryKey: ['paymentHistories'] });
                }
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error notifying user:', error);
            if (!silent) alert('Lỗi: ' + error.message);
            return false;
        }
    };

    const handleNotifyAll = async () => {
        const usersWithDebt = users?.filter(u => u.total_unpaid && u.total_unpaid > 0) || [];

        if (usersWithDebt.length === 0) {
            alert('Không có người dùng nào đang nợ tiền.');
            return;
        }

        if (!confirm(`Bạn có chắc muốn gửi thông báo nhắc nợ cho ${usersWithDebt.length} người dùng?`)) return;

        setIsNotifyingAll(true);
        let successCount = 0;

        try {
            for (const user of usersWithDebt) {
                const success = await handleNotifyUser(user, true);
                if (success) successCount++;
            }

            alert(`Đã gửi thông báo cho ${successCount}/${usersWithDebt.length} người dùng.`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            console.error('Error notifying all users:', error);
            alert('Có lỗi xảy ra trong quá trình gửi thông báo hàng loạt.');
        } finally {
            setIsNotifyingAll(false);
        }
    };


    const handlePayUserBills = async (user: User) => {
        setPaymentMethodUser(user);
    };

    const handleConfirmPayment = async (user: User, method: 'momo' | 'vib') => {
        try {
            // 1. Fetch unpaid bills of this user
            const { data: unpaidBills } = await supabase
                .from('bills')
                .select('id, bill_date, total_amount')
                .eq('user_id', user.id)
                .eq('is_paid', false);

            let itemsSnapshot: any[] = [];
            let totalAmount = user.total_unpaid || 0;
            if (unpaidBills && unpaidBills.length > 0) {
                const billIds = unpaidBills.map(b => b.id);
                const { data: billItems } = await supabase
                    .from('bill_items')
                    .select('id, bill_id, item_name, quantity, unit_price, discount_amount')
                    .in('bill_id', billIds);

                const billIdToDate = unpaidBills.reduce((acc: Record<string, string>, b) => {
                    acc[b.id] = b.bill_date;
                    return acc;
                }, {});

                itemsSnapshot = (billItems || []).map(item => ({
                    id: item.id,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount_amount,
                    bill_date: billIdToDate[item.bill_id]
                }));
                totalAmount = unpaidBills.reduce((acc, b) => acc + Number(b.total_amount), 0);
            }

            // 2. Mark the bills as paid in the bills table
            const { error: billUpdateError } = await supabase
                .from('bills')
                .update({ is_paid: true })
                .eq('user_id', user.id)
                .eq('is_paid', false);

            if (billUpdateError) throw billUpdateError;

            // 3. Update the payment history status
            await paymentHistoryService.markLatestAsPaid(user.id, method, totalAmount, itemsSnapshot);

            // 4. Send thank you message to ChatOps
            if (user.last_post_id) {
                const prefix = user.gender === 2 ? 'anh ' : user.gender === 3 ? 'chị ' : '';
                const methodText = method === 'momo' ? 'ví MoMo' : 'ngân hàng VIB';
                const thankYouMessage = `✅ Cảm ơn ${prefix}@${user.tag_id} đã thanh toán số tiền **${totalAmount.toLocaleString('vi-VN')}đ** qua ${methodText}. ❤️`;
                const targetChannel = user.chatops_channel_id || "3it5zuqw3bnk3bwkspuyhsotce";
                await chatopsService.replyMessage(thankYouMessage, targetChannel, user.last_post_id);

                // Clear last_post_id to start a new thread next time
                await supabase
                    .from('users')
                    .update({ last_post_id: null })
                    .eq('id', user.id);
            }

            alert('Thanh toán thành công!');
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['paymentHistories'] });
        } catch (error: any) {
            console.error('Error confirming payment:', error);
            alert('Lỗi: ' + error.message);
        } finally {
            setPaymentMethodUser(null);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
            alert('Lỗi khi đăng xuất: ' + error.message);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/20">
                            <Shield size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase italic leading-none">
                            Admin Dashboard
                        </h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 ml-13 opacity-60">Hệ thống quản lý chuyên sâu • {new Date().toLocaleDateString('vi-VN')}</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-white">
                            <UserIcon size={16} className="text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Admin</span>
                            <span className="text-xs font-black text-slate-800 tracking-tight">{userEmail?.split('@')[0] || 'Administrator'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 transition-all group group"
                    >
                        <LogOut size={16} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Admin Content Section */}
            <div className="flex-1 glass rounded-[3rem] p-4 border-white/40 shadow-2xl shadow-black/5 overflow-hidden flex flex-col relative">
                {/* Tabs Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-900/10 backdrop-blur-md rounded-[1.75rem] w-fit border border-white/20">
                        <button
                            onClick={() => {
                                setActiveTab('users');
                                setSearchQuery('');
                            }}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-rose-500 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Shield size={14} strokeWidth={3} />
                                Quản lý Người dùng
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('bills');
                                setSearchQuery('');
                            }}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bills' ? 'bg-white text-rose-500 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText size={14} strokeWidth={3} />
                                Quản lý Hóa đơn
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('payment_history');
                                setSearchQuery('');
                            }}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payment_history' ? 'bg-white text-rose-500 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText size={14} strokeWidth={3} className="rotate-180" />
                                Lịch sử thanh toán
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    {/* Primary Row: Search & Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
                                <Search size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder={
                                    activeTab === 'users'
                                        ? "Tìm kiếm người dùng..."
                                        : activeTab === 'bills'
                                            ? "Tìm kiếm hóa đơn theo tên, món ăn..."
                                            : "Tìm kiếm lịch sử theo tên, ngày..."
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3.5 bg-white/40 border border-white/60 rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/20 transition-all font-bold text-sm text-slate-800 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab === 'users' ? (
                                <>
                                    <button
                                        onClick={handleNotifyAll}
                                        disabled={isNotifyingAll}
                                        className="flex items-center gap-2 px-5 py-3.5 bg-white text-slate-800 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md hover:border-slate-300 transition-all disabled:opacity-50"
                                    >
                                        {isNotifyingAll ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                                <span>Đang nhắc...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Bell size={16} className="text-amber-500" />
                                                Nhắc tất cả
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingUser(null);
                                            setIsAddUserOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                        Người dùng mới
                                    </button>
                                </>
                            ) : activeTab === 'bills' ? (
                                <button
                                    onClick={() => {
                                        setEditingBill(null);
                                        setIsAddBillOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Tạo hóa đơn
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Secondary Row: Advanced Filters & Totals (Only for Bills) */}
                    {activeTab === 'bills' && (
                        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-inner">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* User Filter */}
                                <div className="relative" ref={userSearchRef}>
                                    <button
                                        onClick={() => setIsUserSuggestionsOpen(!isUserSuggestionsOpen)}
                                        className={`flex items-center gap-2.5 pl-3.5 pr-8 py-2 rounded-xl border transition-all relative ${adminUserFilter === 'all'
                                            ? 'bg-white/60 border-white/80 text-slate-500 hover:bg-white'
                                            : 'bg-rose-50 border-rose-100 text-rose-600 shadow-sm'
                                            }`}
                                    >
                                        <UserIcon size={14} strokeWidth={2.5} />
                                        <span className="font-black text-[11px] uppercase tracking-wider truncate max-w-[120px]">
                                            {adminUserFilter === 'all'
                                                ? 'Người dùng'
                                                : (users?.find(u => u.tag_id === adminUserFilter)?.user_name || adminUserFilter.split('-')[0])}
                                        </span>
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40">
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${isUserSuggestionsOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isUserSuggestionsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 w-64 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-[110]"
                                            >
                                                <div className="p-2 border-b border-slate-50/50 flex items-center gap-2 bg-slate-50/50">
                                                    <Search size={12} className="text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={userSearchInput}
                                                        onChange={(e) => setUserSearchInput(e.target.value)}
                                                        placeholder="Tìm nhanh..."
                                                        className="bg-transparent border-none font-bold text-[10px] text-slate-700 focus:ring-0 outline-none w-full p-0"
                                                    />
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
                                                    {userSuggestions.map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAdminUserFilter(u.tag_id);
                                                                setUserSearchInput('');
                                                                setIsUserSuggestionsOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-2.5 ${adminUserFilter === u.tag_id ? 'bg-rose-500 text-white' : 'hover:bg-rose-50 text-slate-600'}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${adminUserFilter === u.tag_id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={12} />}
                                                            </div>
                                                            <span className="truncate">{u.tag_id === 'all' ? 'Tất cả' : u.user_name || u.tag_id.split('-')[0]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex bg-slate-200/40 rounded-xl p-1 border border-white/60 shadow-inner">
                                    <button
                                        onClick={() => setAdminStatusFilter('unpaid')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${adminStatusFilter === 'unpaid' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Chưa thu
                                    </button>
                                    <button
                                        onClick={() => setAdminStatusFilter('paid')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${adminStatusFilter === 'paid' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Đã thu
                                    </button>
                                </div>

                                {/* Date Picker */}
                                <div className="relative" ref={datePopupRef}>
                                    <button
                                        onClick={() => { if (adminStatusFilter === 'paid') setIsDatePopupOpen(!isDatePopupOpen); }}
                                        disabled={adminStatusFilter === 'unpaid'}
                                        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${adminStatusFilter === 'unpaid'
                                            ? 'bg-slate-100/50 text-slate-300 border-transparent opacity-40 cursor-not-allowed'
                                            : isDatePopupOpen
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                : 'bg-white/60 text-slate-600 border-white/80 hover:bg-white'
                                            }`}
                                    >
                                        <Calendar size={14} strokeWidth={2.5} />
                                        <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                                            {adminStatusFilter === 'unpaid' ? 'Tháng này' : adminMonthFilter === -1 ? 'Tất cả' : `${months[adminMonthFilter].replace('Tháng ', 'T')}, ${adminYearFilter}`}
                                        </span>
                                        <ChevronDown size={14} className={`opacity-40 transition-transform ${isDatePopupOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isDatePopupOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute left-0 top-full mt-2 w-72 bg-white rounded-[1.75rem] p-4 shadow-2xl border border-slate-100 z-[110]"
                                            >
                                                <div className="flex flex-col gap-4">
                                                    <button
                                                        onClick={() => { setAdminMonthFilter(-1); setIsDatePopupOpen(false); }}
                                                        className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${adminMonthFilter === -1 ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                                                    >
                                                        <Calendar size={14} />
                                                        Tất cả
                                                    </button>

                                                    <div className="h-px bg-slate-100 mx-2" />

                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-center justify-between bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                                            <button onClick={() => setAdminYearFilter(adminYearFilter - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-rose-500 transition-all text-slate-500"><ChevronLeft size={18} /></button>
                                                            <span className="text-base font-black text-slate-800">{adminYearFilter}</span>
                                                            <button onClick={() => setAdminYearFilter(adminYearFilter + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-rose-500 transition-all text-slate-500"><ChevronRight size={18} /></button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {months.map((m, idx) => (
                                                                <button key={m} onClick={() => { setAdminMonthFilter(idx); setIsDatePopupOpen(false); }}
                                                                    className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${adminMonthFilter === idx ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                                                                    {m.replace('Tháng ', 'T')}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Summary Totals */}
                            <div className="flex items-center gap-6 pr-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">Hóa đơn</span>
                                    <span className="text-sm font-black text-slate-800 leading-none">{filteredBills.length}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1 text-right">Tổng thanh toán</span>
                                    <div className="flex items-baseline gap-1 leading-none">
                                        <span className="text-xl font-black text-slate-900 font-display tracking-tight">{filteredTotalAmount.toLocaleString('vi-VN')}</span>
                                        <span className="text-[10px] font-black italic text-slate-400">đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {activeTab === 'users' ? (
                            isUsersLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <motion.p
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-slate-400 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Đang tải danh sách...
                                    </motion.p>
                                </div>
                            ) : (
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/60">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người dùng</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Đã trả</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chưa trả</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Vai trò</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50">
                                            {filteredUsers.map((u: User) => (
                                                <tr key={u.id} className="group hover:bg-white/60 transition-all duration-300">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center ring-1 ring-slate-100 shadow-sm overflow-hidden group-hover:scale-105 group-hover:shadow-md transition-all duration-500">
                                                                    {u.avatar_url ? (
                                                                        <img src={u.avatar_url} alt={u.user_name || ''} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <UserIcon size={20} className="text-slate-400" />
                                                                    )}
                                                                </div>
                                                                {u.role === 1 && (
                                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                                                        <Shield size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-black text-slate-900 text-sm tracking-tight">{u.user_name || 'Anonymous'}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight lowercase">@{u.tag_id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-emerald-600 font-display">{(u.total_paid || 0).toLocaleString('vi-VN')}đ</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-black font-display ${(u.total_unpaid || 0) > 0 ? 'text-rose-500' : (u.total_unpaid || 0) < 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                                {(u.total_unpaid || 0).toLocaleString('vi-VN')}đ
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${u.role === 1
                                                                ? 'bg-rose-50 border-rose-100 text-rose-500'
                                                                : u.role === 2
                                                                    ? 'bg-blue-50 border-blue-100 text-blue-500'
                                                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                                                }`}>
                                                                {u.role === 1 ? 'Admin' : u.role === 2 ? 'System' : 'Member'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 transition-all duration-300">
                                                            {(u.total_unpaid || 0) > 0 && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleNotifyUser(u)}
                                                                        className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-100 hover:shadow-md transition-all active:scale-95"
                                                                        title="Nhắc nợ"
                                                                    >
                                                                        <Bell size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePayUserBills(u)}
                                                                        className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 hover:shadow-md transition-all active:scale-95"
                                                                        title="Thanh toán"
                                                                    >
                                                                        <CreditCard size={14} strokeWidth={2.5} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => viewUserBills(u.tag_id)}
                                                                className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-md transition-all active:scale-95"
                                                                title="Hóa đơn"
                                                            >
                                                                <FileText size={14} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(u);
                                                                    setIsAddUserOpen(true);
                                                                }}
                                                                className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-md transition-all active:scale-95"
                                                                title="Sửa"
                                                            >
                                                                <Edit3 size={14} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all active:scale-95"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 size={14} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )
                        ) : activeTab === 'bills' ? (
                            isBillsLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <motion.p
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-slate-400 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Đang tải hóa đơn...
                                    </motion.p>
                                </div>
                            ) : (
                                <motion.div
                                    key="bills"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/60">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hóa đơn</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người đặt</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng tiền</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50">
                                            {filteredBills.map((b: DetailedBill) => (
                                                <React.Fragment key={b.id}>
                                                    <tr
                                                        onClick={() => setExpandedBillId(expandedBillId === b.id ? null : b.id)}
                                                        className={`group hover:bg-white/60 transition-all duration-300 cursor-pointer ${expandedBillId === b.id ? 'bg-white/80' : ''}`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedBillId === b.id ? 'bg-rose-500 text-white shadow-lg rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                                    <ChevronDown size={18} strokeWidth={3} />
                                                                </div>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-black text-slate-900 text-sm tracking-tight">{new Date(b.bill_date).toLocaleDateString('vi-VN')}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/50">{b.bill_items.length} món</span>
                                                                        <span className="text-[9px] font-bold text-slate-400 font-mono">ID: {b.id.slice(0, 8)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                                    {b.users?.avatar_url ? (
                                                                        <img src={b.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <UserIcon size={14} className="text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <span className="font-black text-slate-800 text-xs tracking-tight uppercase italic">{b.users?.user_name || 'Hệ thống'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className={`flex items-baseline justify-end gap-1 ${b.total_amount < 0 ? 'text-amber-500' : !b.is_paid ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                <span className="font-black text-base font-display tracking-tight leading-none">{b.total_amount.toLocaleString('vi-VN')}</span>
                                                                <span className="text-[10px] font-black italic">đ</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${b.is_paid
                                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                                    : 'bg-rose-50 border-rose-100 text-rose-500'
                                                                    }`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${b.is_paid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{b.is_paid ? 'Đã thu' : 'Chưa thu'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingBill(b);
                                                                        setIsAddBillOpen(true);
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-md transition-all active:scale-95"
                                                                    title="Sửa"
                                                                >
                                                                    <Edit3 size={14} strokeWidth={2.5} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteBill(b);
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all active:scale-95"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <AnimatePresence>
                                                        {expandedBillId === b.id && (
                                                            <tr key={`expand-${b.id}`}>
                                                                <td colSpan={5} className="px-6 pb-6 bg-transparent">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                        className="overflow-hidden bg-slate-900/5 backdrop-blur-md rounded-3xl border border-white/40 shadow-inner p-4 mt-2"
                                                                    >
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {b.bill_items.map((item: BillItem, idx: number) => (
                                                                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-white/60 hover:border-rose-100 transition-all group/item">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover/item:bg-rose-500 group-hover/item:text-white transition-colors">
                                                                                            <span className="material-icons text-sm">local_cafe</span>
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[11px] font-black text-slate-800 tracking-tight">{item.item_name}</span>
                                                                                            <span className="text-[9px] font-bold text-slate-400 tracking-widest">Qty: {item.quantity} × {item.unit_price.toLocaleString('vi-VN')}đ</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end">
                                                                                        <div className="flex items-baseline gap-1">
                                                                                            <span className="text-xs font-black text-slate-900 font-display">{(item.unit_price * item.quantity - (item.discount_amount || 0)).toLocaleString('vi-VN')}</span>
                                                                                            <span className="text-[9px] font-black italic text-slate-400">đ</span>
                                                                                        </div>
                                                                                        {item.discount_amount > 0 && (
                                                                                            <span className="text-[8px] font-black text-rose-400 tracking-tighter italic">-{item.discount_amount.toLocaleString('vi-VN')}đ disc</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )) : (
                            isPaymentHistoriesLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <motion.p
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-slate-400 font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Đang tải lịch sử...
                                    </motion.p>
                                </div>
                            ) : (
                                <motion.div
                                    key="payment_history"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/60">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Biên lai</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người nhận</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng tiền</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phương thức</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50">
                                            {filteredPaymentHistories.map((h: any) => {
                                                const u = users?.find(user => user.id === h.user_id);
                                                const formattedDate = new Date(h.sent_at).toLocaleDateString('vi-VN');
                                                const isPaid = !!h.is_paid;
                                                return (
                                                    <tr key={h.id} className="hover:bg-white/60 transition-all duration-300">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-black text-slate-900 text-sm tracking-tight">Biên lai ngày {formattedDate}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 font-mono">ID: {h.id.slice(0, 8).toUpperCase()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                                    {u?.avatar_url ? (
                                                                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <UserIcon size={14} className="text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <span className="font-black text-slate-800 text-xs tracking-tight uppercase italic">{u?.user_name || 'Khách'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className={`flex items-baseline justify-end gap-1 font-black font-display text-base ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                <span>{h.total_amount.toLocaleString('vi-VN')}</span>
                                                                <span className="text-[10px] italic font-black">đ</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${isPaid
                                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                                    : 'bg-amber-50 border-amber-100 text-amber-600'
                                                                    }`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{isPaid ? 'Đã thu' : 'Chưa thu'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                {h.payment_method ? (
                                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${h.payment_method === 'momo'
                                                                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                        }`}>
                                                                        {h.payment_method}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <a
                                                                    href={`/payment-history/${h.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-md transition-all active:scale-95"
                                                                    title="Xem Biên Lai"
                                                                >
                                                                    <FileText size={14} strokeWidth={2.5} />
                                                                </a>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Bạn có chắc muốn xóa lịch sử thanh toán này?')) {
                                                                            try {
                                                                                await paymentHistoryService.deletePaymentHistory(h.id);
                                                                                alert('Xóa thành công!');
                                                                                queryClient.invalidateQueries({ queryKey: ['paymentHistories'] });
                                                                                queryClient.invalidateQueries({ queryKey: ['users'] });
                                                                            } catch (err: any) {
                                                                                alert('Lỗi: ' + err.message);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all active:scale-95"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </motion.div>
                            ))
                        }
                    </AnimatePresence>
                </div>
            </div>

            <AddBillPopup
                isOpen={isAddBillOpen}
                onClose={() => {
                    setIsAddBillOpen(false);
                    setEditingBill(null);
                }}
                onSave={handleSaveBill}
                users={users || []}
                initialData={editingBill}
            />

            <AddUserPopup
                isOpen={isAddUserOpen}
                onClose={() => {
                    setIsAddUserOpen(false);
                    setEditingUser(null);
                }}
                onSave={handleSaveUser}
                initialData={editingUser}
            />

            {/* Payment Method Selection Modal */}
            <AnimatePresence>
                {paymentMethodUser && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 max-w-sm w-full flex flex-col gap-6"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                                    <CreditCard size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận Thanh toán</h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                    Bạn đang xác nhận thanh toán tất cả hóa đơn cho <strong>{paymentMethodUser.user_name}</strong>.
                                    Số tiền: <strong className="text-emerald-600">{paymentMethodUser.total_unpaid?.toLocaleString('vi-VN')}đ</strong>.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleConfirmPayment(paymentMethodUser, 'momo')}
                                    className="flex items-center justify-center gap-3 w-full py-3.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-100 rounded-2xl font-bold text-sm transition-all active:scale-95"
                                >
                                    <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-black uppercase">Momo</span>
                                    Xác nhận qua MoMo
                                </button>
                                <button
                                    onClick={() => handleConfirmPayment(paymentMethodUser, 'vib')}
                                    className="flex items-center justify-center gap-3 w-full py-3.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-100 rounded-2xl font-bold text-sm transition-all active:scale-95"
                                >
                                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase">VIB</span>
                                    Xác nhận qua VIB Bank
                                </button>
                            </div>

                            <button
                                onClick={() => setPaymentMethodUser(null)}
                                className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Hủy bỏ
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
