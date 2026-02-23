import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Settings, Shield, Trash2, Edit3, Plus, Loader2 } from 'lucide-react';
import type { DetailedBill, BillItem, User } from '../types/database';
import React from 'react'; // Added React import for React.Fragment
import { AddBillPopup } from './AddBillPopup';
import { AddUserPopup } from './AddUserPopup';
import { supabase } from '../lib/supabase';
import { useUsers } from '../hooks/useUsers';
import { useQueryClient } from '@tanstack/react-query';
import { billService } from '../services/billService';
import { removeAccents } from '../utils/stringUtils';

interface AdminPageProps {
    bills: DetailedBill[];
}

export function AdminPage({ bills }: AdminPageProps) {
    const queryClient = useQueryClient();
    const { users, isLoading: isUsersLoading } = useUsers();
    const [activeTab, setActiveTab] = useState<'users' | 'bills'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
    const [isAddBillOpen, setIsAddBillOpen] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingBill, setEditingBill] = useState<DetailedBill | null>(null);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const normalizedSearch = removeAccents(searchQuery).trim();
        if (!normalizedSearch) return users;

        return users.filter((u: User) =>
            removeAccents(u.user_name || '').includes(normalizedSearch) ||
            removeAccents(u.chatops_id || '').includes(normalizedSearch) ||
            removeAccents(u.tag_id || '').includes(normalizedSearch) ||
            removeAccents(u.email || '').includes(normalizedSearch)
        );
    }, [searchQuery, users]);

    const filteredBills = useMemo(() => {
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
                        chatops_id: userData.chatops_id,
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
                        chatops_id: userData.chatops_id,
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

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-800 text-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                        <Settings size={16} strokeWidth={3} />
                        Cài đặt hệ thống
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
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className="relative w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-800 group-focus-within:text-secondary transition-colors">
                                <Search size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Tìm kiếm người dùng..." : "Tìm kiếm mã hóa đơn, tên món, người đặt..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-800/60"
                            />
                        </div>

                        {activeTab === 'users' && (
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
                        )}
                        {activeTab === 'bills' && (
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
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                            {activeTab === 'users' ? `${filteredUsers.length} Người dùng` : `${filteredBills.length} Hóa đơn`}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="wait">
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
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">Chatops ID</th>
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
                                                            <span className="text-[11px] font-black text-slate-800 font-mono tracking-tight uppercase tabular-nums bg-slate-100 px-2 py-1 rounded-lg">@{u.chatops_id}</span>
                                                        </div>
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
