import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Shield, Trash2, Edit3, Plus, Loader2, Bell, CreditCard, ChevronLeft, ChevronRight, Calendar, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
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

export function AdminPage({ userEmail }: { userEmail?: string }) {
    const queryClient = useQueryClient();
    const { users, isLoading: isUsersLoading } = useUsers();

    // Admin Filtering State
    const [adminUserFilter, setAdminUserFilter] = useState<string>('hungnd-runsystem.net');
    const [adminStatusFilter, setAdminStatusFilter] = useState<'unpaid' | 'paid'>('unpaid');
    const [adminMonthFilter, setAdminMonthFilter] = useState(new Date().getMonth());
    const [adminYearFilter, setAdminYearFilter] = useState(new Date().getFullYear());

    // UI States for enhanced filters
    const [userSearchInput, setUserSearchInput] = useState('hungnd-runsystem.net');
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
        month: adminStatusFilter === 'unpaid' ? undefined : adminMonthFilter, // Month/year only apply to 'paid' bills
        year: adminStatusFilter === 'unpaid' ? undefined : adminYearFilter
    });

    const [activeTab, setActiveTab] = useState<'users' | 'bills'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
    const [isAddBillOpen, setIsAddBillOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingBill, setEditingBill] = useState<DetailedBill | null>(null);
    const [isNotifyingAll, setIsNotifyingAll] = useState(false);

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
        const normalizedSearch = removeAccents(searchQuery).trim();
        if (!normalizedSearch) return users;

        return users.filter((u: User) =>
            removeAccents(u.user_name || '').includes(normalizedSearch) ||
            removeAccents(u.chatops_channel_id || '').includes(normalizedSearch) ||
            removeAccents(u.tag_id || '').includes(normalizedSearch) ||
            removeAccents(u.email || '').includes(normalizedSearch)
        );
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
                        role: userData.role
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
                        role: userData.role
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

        const qrMoMo = generateVietQRString(user.total_unpaid);
        const qrVib = generateVietQRVIBString(user.total_unpaid);

        const message = `:emo_flower: Hi @${user.tag_id},

 :pepesaber: Dư nợ tiền nước tuần này của bạn là: ${user.total_unpaid.toLocaleString('vi-VN')} VND :money_mouth_face: :money_mouth_face: :money_mouth_face: 

 :point_right: Chi tiết xem [tại đây](https://drill-bill.vercel.app/${user.tag_id.replace('-runsystem.net', '')}) 

 :momo: Scan QR code bên dưới để chuyển cho HùngND. 

 ![image](${qrMoMo}) ![image](${qrVib})`;

        try {
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
        if (!confirm(`Bạn có chắc muốn đánh dấu TẤT CẢ hóa đơn của "${user.user_name}" (Tổng: ${user.total_unpaid?.toLocaleString('vi-VN')}đ) là ĐÃ THANH TOÁN?`)) return;

        try {
            const { error } = await supabase
                .from('bills')
                .update({ is_paid: true })
                .eq('user_id', user.id)
                .eq('is_paid', false);

            if (error) throw error;

            // Nếu có last_post_id (thread nhắc nợ), gửi tin nhắn cảm ơn và xóa id đó
            if (user.last_post_id) {
                const thankYouMessage = `✅ Cảm ơn @${user.tag_id} đã thanh toán số tiền **${user.total_unpaid?.toLocaleString('vi-VN')}đ**. Đã ghi nhận thành công! ❤️`;
                const targetChannel = user.chatops_channel_id || "3it5zuqw3bnk3bwkspuyhsotce";
                await chatopsService.replyMessage(thankYouMessage, targetChannel, user.last_post_id);

                // Xóa last_post_id để lần nợ sau sẽ tạo thread mới
                await supabase
                    .from('users')
                    .update({ last_post_id: null })
                    .eq('id', user.id);
            }

            alert('Thanh toán thành công!');
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            console.error('Error paying user bills:', error);
            alert('Lỗi: ' + error.message);
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
        <div className="h-full flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight uppercase italic leading-none">
                        Admin Dashboard
                    </h2>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] mt-2 opacity-60">Hệ thống quản lý chuyên sâu</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tài khoản</span>
                        <span className="text-xs font-black text-slate-800 tracking-tight">{userEmail || 'Admin'}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-rose-100 hover:border-rose-200 transition-all group"
                    >
                        <LogOut size={16} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Admin Content Card */}
            <div className="flex-1 glass rounded-[2.5rem] px-8 py-0 border-white/40 shadow-2xl shadow-black/5 overflow-hidden flex flex-col">
                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 mb-2 p-1.5 bg-black/5 backdrop-blur-md rounded-2xl w-fit border border-white/10">
                    <button
                        onClick={() => {
                            setActiveTab('users');
                            setSearchQuery('');
                        }}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-secondary shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
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
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bills' ? 'bg-white text-secondary shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={14} strokeWidth={3} />
                            Quản lý Hóa đơn
                        </div>
                    </button>
                </div>

                {/* Sub-Header with Search & Actions */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 flex items-center gap-3">
                        <div className="relative flex-1 max-w-md group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-800 group-focus-within:text-secondary transition-colors">
                                <Search size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Tìm kiếm người dùng..." : "Tìm kiếm hóa đơn..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-800/60"
                            />
                        </div>

                        {activeTab === 'bills' && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">


                                {/* User Autocomplete Filter */}
                                <div className="relative" ref={userSearchRef}>
                                    <div
                                        onClick={() => setIsUserSuggestionsOpen(!isUserSuggestionsOpen)}
                                        className="flex items-center gap-3 bg-white/60 pl-4 pr-10 py-2 rounded-xl border border-white/80 group focus-within:border-secondary/40 focus-within:bg-white transition-all cursor-pointer relative"
                                    >
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-secondary transition-colors">
                                            <UserIcon size={14} />
                                        </div>
                                        <span className={`font-black text-xs transition-colors ${adminUserFilter === 'all' ? 'text-slate-400' : 'text-slate-900'}`}>
                                            {adminUserFilter === 'all'
                                                ? 'Tất cả người dùng'
                                                : (users?.find(u => u.tag_id === adminUserFilter)?.user_name || `@${adminUserFilter.replace('-runsystem.net', '')}`)}
                                        </span>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300">
                                            <ChevronDown size={14} className={isUserSuggestionsOpen ? 'rotate-180' : ''} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isUserSuggestionsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110]"
                                            >
                                                <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                                                    <Search size={12} className="text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={userSearchInput}
                                                        onChange={(e) => setUserSearchInput(e.target.value)}
                                                        placeholder="Tìm người dùng..."
                                                        className="bg-transparent border-none font-bold text-[11px] text-slate-700 focus:ring-0 outline-none w-full p-0 placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                                    {userSuggestions.map(u => (
                                                        <button
                                                            key={u.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAdminUserFilter(u.tag_id);
                                                                setUserSearchInput('');
                                                                setIsUserSuggestionsOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-3 ${adminUserFilter === u.tag_id ? 'bg-secondary text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden ${adminUserFilter === u.tag_id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <UserIcon size={12} />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="leading-tight">{u.tag_id === 'all' ? 'Tất cả người dùng' : u.user_name || `@${u.tag_id.replace('-runsystem.net', '')}`}</span>
                                                                {u.tag_id !== 'all' && u.user_name && (
                                                                    <span className={`text-[9px] opacity-70 leading-tight ${adminUserFilter === u.tag_id ? 'text-white' : 'text-slate-500'}`}>
                                                                        @{u.tag_id.replace('-runsystem.net', '')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Status Toggle */}
                                <div className="flex bg-slate-100/50 rounded-[1.25rem] p-1 border border-white/80 shadow-inner backdrop-blur-md">
                                    <button
                                        onClick={() => setAdminStatusFilter('unpaid')}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminStatusFilter === 'unpaid' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Chưa thu
                                    </button>
                                    <button
                                        onClick={() => setAdminStatusFilter('paid')}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminStatusFilter === 'paid' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Đã thu
                                    </button>
                                </div>

                                {/* Premium Date Picker Popup */}
                                <div className="relative" ref={datePopupRef}>
                                    <button
                                        onClick={() => {
                                            if (adminStatusFilter === 'paid') {
                                                setIsDatePopupOpen(!isDatePopupOpen);
                                            }
                                        }}
                                        disabled={adminStatusFilter === 'unpaid'}
                                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${adminStatusFilter === 'unpaid'
                                            ? 'bg-slate-100/50 text-slate-400 border-transparent opacity-40 grayscale cursor-not-allowed'
                                            : isDatePopupOpen
                                                ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                                                : 'bg-white/60 text-slate-900 border-white/80 hover:bg-white hover:border-secondary/30'
                                            }`}
                                    >
                                        <Calendar size={14} className={adminStatusFilter === 'unpaid' ? 'text-slate-300' : isDatePopupOpen ? 'text-rose-400' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                            {adminStatusFilter === 'unpaid'
                                                ? `${months[new Date().getMonth()].replace('Tháng ', 'T')}, ${new Date().getFullYear()}`
                                                : `${months[adminMonthFilter].replace('Tháng ', 'T')}, ${adminYearFilter}`}
                                        </span>
                                        <span className={`material-icons text-lg transition-transform ${isDatePopupOpen ? 'rotate-180 opacity-50' : 'opacity-20'}`}>expand_more</span>
                                    </button>

                                    <AnimatePresence>
                                        {isDatePopupOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[1.75rem] p-4 shadow-2xl border border-slate-100 z-[110]"
                                            >
                                                <div className="flex flex-col gap-5">
                                                    {/* Year Selection */}
                                                    <div className="flex items-center justify-between bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                                        <button
                                                            onClick={() => setAdminYearFilter(adminYearFilter - 1)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-rose-500 transition-all text-slate-500"
                                                        >
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Năm</span>
                                                            <span className="text-base font-black text-slate-800">{adminYearFilter}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setAdminYearFilter(adminYearFilter + 1)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-rose-500 transition-all text-slate-500"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Month Grid */}
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {months.map((m, idx) => (
                                                            <button
                                                                key={m}
                                                                onClick={() => {
                                                                    setAdminMonthFilter(idx);
                                                                    setIsDatePopupOpen(false);
                                                                }}
                                                                className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${adminMonthFilter === idx
                                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {m.replace('Tháng ', 'T')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === 'users' ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleNotifyAll}
                                    disabled={isNotifyingAll}
                                    className="flex items-center gap-2 px-5 py-3 bg-white text-slate-800 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:border-slate-300 transition-all disabled:opacity-50"
                                >
                                    {isNotifyingAll ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                                    Nhắc tất cả
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingUser(null);
                                        setIsAddUserOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Thêm người dùng
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingBill(null);
                                    setIsAddBillOpen(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Thêm hóa đơn
                            </button>
                        )}
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest bg-white/40 px-3 py-3 rounded-2xl border border-white/60">
                            {activeTab === 'users' ? `${filteredUsers.length} Users` : `${filteredBills.length} Bills`}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {activeTab === 'users' ? (
                            isUsersLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-secondary/60" size={48} strokeWidth={3} />
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
                                            <tr className="border-b border-white/30">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Tên người dùng</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Tag ID</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-800 uppercase tracking-widest">Đã trả</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-800 uppercase tracking-widest">Chưa trả</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center">Vai trò</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-800 uppercase tracking-widest">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {filteredUsers.map((u: User) => (
                                                <tr key={u.id} className="group hover:bg-white/40 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden transition-transform group-hover:scale-105 duration-500">
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt={u.user_name || ''} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="material-icons text-slate-800 text-2xl">person</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900 text-sm tracking-tight">{u.user_name || 'No Name'}</span>
                                                                <span className="text-[9px] font-black text-slate-800 font-mono italic">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-slate-800 font-mono tracking-tight tabular-nums bg-slate-100 px-2 py-1 rounded-lg">{u.tag_id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="text-[13px] font-black text-emerald-600 font-display">{(u.total_paid || 0).toLocaleString('vi-VN')}đ</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className={`text-[13px] font-black font-display ${(u.total_unpaid || 0) > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {(u.total_unpaid || 0).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${u.role === 1 ? 'bg-secondary' : 'bg-slate-800'}`}></div>
                                                            <span className={`font-black text-[9px] uppercase tracking-widest ${u.role === 1 ? 'text-secondary font-black' : 'text-slate-800 font-bold'}`}>
                                                                {u.role === 1 ? 'ADMIN' : u.role === 2 ? 'SYSTEM' : 'MEMBER'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3 transition-all duration-500">
                                                            {(u.total_unpaid || 0) > 0 && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleNotifyUser(u)}
                                                                        className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-amber-500 hover:bg-white hover:shadow-lg transition-all"
                                                                        title="Thông báo nhắc nợ"
                                                                    >
                                                                        <Bell size={16} strokeWidth={2.5} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePayUserBills(u)}
                                                                        className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-white hover:shadow-lg transition-all"
                                                                        title="Thanh toán tất cả"
                                                                    >
                                                                        <CreditCard size={16} strokeWidth={2.5} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => viewUserBills(u.tag_id)}
                                                                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-primary hover:bg-white hover:shadow-lg transition-all"
                                                                title="Xem hóa đơn"
                                                            >
                                                                <FileText size={16} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(u);
                                                                    setIsAddUserOpen(true);
                                                                }}
                                                                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-secondary hover:bg-white hover:shadow-lg transition-all"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit3 size={16} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-accent hover:bg-white hover:shadow-lg transition-all"
                                                                title="Xóa người dùng"
                                                            >
                                                                <Trash2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )
                        ) : (
                            isBillsLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-secondary/60" size={48} strokeWidth={3} />
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
                                            <tr className="border-b border-white/30">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Hóa đơn</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Người đặt</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-800 uppercase tracking-widest">Tổng tiền</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest text-center">Trạng thái</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-800 uppercase tracking-widest">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {filteredBills.map((b: DetailedBill) => (
                                                <React.Fragment key={b.id}>
                                                    <tr
                                                        onClick={() => setExpandedBillId(expandedBillId === b.id ? null : b.id)}
                                                        className={`group hover:bg-white/40 transition-colors cursor-pointer ${expandedBillId === b.id ? 'bg-white/50' : ''}`}
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-11 h-11 rounded-2xl glass flex items-center justify-center text-slate-800 group-hover:text-secondary transition-colors">
                                                                    <span className="material-icons text-xl">{expandedBillId === b.id ? 'expand_less' : 'receipt'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-900 text-sm italic uppercase leading-none mb-1">{new Date(b.bill_date).toLocaleDateString('vi-VN')}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">{b.bill_items.length} món</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                                        <span className="text-[9px] font-bold text-slate-800 font-mono">ID: {b.id.slice(0, 8)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
                                                                    {b.users?.avatar_url ? (
                                                                        <img src={b.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="material-icons text-slate-800 text-lg">person</span>
                                                                    )}
                                                                </div>
                                                                <span className="font-black text-slate-900 text-[11px] tracking-tight uppercase italic">{b.users?.user_name || 'Hệ thống'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className={`flex items-baseline justify-end gap-1 ${b.total_amount < 0 ? 'text-orange-500' : !b.is_paid ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                <span className="font-black text-base font-display tracking-tight drop-shadow-sm">{b.total_amount.toLocaleString('vi-VN')}</span>
                                                                <span className="text-[10px] font-black italic">đ</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            <div className="flex justify-center">
                                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${b.is_paid
                                                                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
                                                                    : 'bg-rose-50/50 border-rose-100 text-rose-500'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${b.is_paid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{b.is_paid ? 'Đã thu' : 'Chưa thu'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-3 transition-all duration-500">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingBill(b);
                                                                        setIsAddBillOpen(true);
                                                                    }}
                                                                    className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-800 hover:text-secondary hover:bg-white hover:shadow-lg transition-all"
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit3 size={16} strokeWidth={2.5} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteBill(b);
                                                                    }}
                                                                    className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-800 hover:text-accent hover:bg-white hover:shadow-lg transition-all"
                                                                    title="Xóa hóa đơn"
                                                                >
                                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <AnimatePresence>
                                                        {expandedBillId === b.id && (
                                                            <tr key={`expand-${b.id}`}>
                                                                <td colSpan={5} className="px-8 pb-6 bg-slate-50/30">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                        className="overflow-hidden bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-inner px-6 py-0 mt-2"
                                                                    >
                                                                        <div className="space-y-3">
                                                                            {b.bill_items.map((item: BillItem, idx: number) => (
                                                                                <div key={idx} className="flex items-center justify-between px-3 py-0 rounded-2xl hover:bg-white/80 transition-colors border border-transparent hover:border-slate-100">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-8 h-8 rounded-xl bg-secondary/5 flex items-center justify-center text-secondary">
                                                                                            <span className="material-icons text-sm">local_cafe</span>
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs font-black text-slate-800 tracking-tight">{item.item_name}</span>
                                                                                            <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Số lượng: {item.quantity}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-baseline gap-1">
                                                                                        <span className="text-xs font-black text-slate-900 font-display">{item.item_name ? (item.unit_price * item.quantity - item.discount_amount).toLocaleString('vi-VN') : 0}</span>
                                                                                        <span className="text-[9px] font-black italic text-slate-800">đ</span>
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
                            )
                        )}
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
        </div>
    );
}
