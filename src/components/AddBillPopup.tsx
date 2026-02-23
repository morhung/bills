import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, Calendar, User as UserIcon, CreditCard, Search, ChevronDown, Check } from 'lucide-react';
import type { User, DetailedBill } from '../types/database';
import { removeAccents } from '../utils/stringUtils';

interface AddBillPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bill: any) => void;
    users: User[];
    initialData?: DetailedBill | null;
}

export function AddBillPopup({ isOpen, onClose, onSave, users, initialData }: AddBillPopupProps) {
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
    const [userId, setUserId] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [items, setItems] = useState([{ item_name: '', quantity: 1, unit_price: 0, discount_amount: 0 }]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            setBillDate(new Date(initialData.bill_date).toISOString().split('T')[0]);
            setUserId(initialData.user_id);
            setIsPaid(initialData.is_paid);
            if (initialData.bill_items && initialData.bill_items.length > 0) {
                setItems(initialData.bill_items.map(item => ({
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_amount: item.discount_amount
                })));
            } else {
                setItems([{ item_name: '', quantity: 1, unit_price: 0, discount_amount: 0 }]);
            }
        } else {
            setBillDate(new Date().toISOString().split('T')[0]);
            setUserId('');
            setIsPaid(false);
            setItems([{ item_name: '', quantity: 1, unit_price: 0, discount_amount: 0 }]);
        }
    }, [initialData, isOpen]);

    const selectedUser = useMemo(() => users.find(u => u.id === userId), [userId, users]);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = removeAccents(userSearchQuery).trim();
        if (!normalizedQuery) return users;
        return users.filter(u =>
            removeAccents(u.user_name || '').includes(normalizedQuery) ||
            removeAccents(u.chatops_channel_id || '').includes(normalizedQuery) ||
            removeAccents(u.tag_id || '').includes(normalizedQuery)
        );
    }, [userSearchQuery, users]);

    const totalAmount = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.unit_price * item.quantity - item.discount_amount), 0);
    }, [items]);

    const handleAddItem = () => {
        setItems([...items, { item_name: '', quantity: 1, unit_price: 0, discount_amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData?.id,
            bill_date: new Date(billDate).toISOString(),
            user_id: userId,
            is_paid: isPaid,
            total_amount: totalAmount,
            items: items.filter(item => item.item_name.trim() !== '')
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                        onClose();
                        setIsUserDropdownOpen(false);
                    }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl glass rounded-[2.5rem] shadow-2xl border-white/40 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/20 flex items-center justify-between bg-white/40">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                {initialData ? 'Chỉnh sửa hóa đơn' : 'Thêm hóa đơn mới'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">
                                {initialData ? 'Cập nhật thông tin chi tiết hóa đơn' : 'Nhập thông tin chi tiết hóa đơn'}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ngày hóa đơn</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <input
                                        required
                                        type="date"
                                        value={billDate}
                                        onChange={(e) => setBillDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Người đặt</label>
                                <div className="relative">
                                    <div
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className={`w-full pl-12 pr-10 py-3 bg-white/40 border ${isUserDropdownOpen ? 'border-secondary/40 ring-2 ring-secondary/10' : 'border-white/60'} rounded-2xl transition-all cursor-pointer flex items-center justify-between group`}
                                    >
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-secondary transition-colors">
                                            {selectedUser?.avatar_url ? (
                                                <img src={selectedUser.avatar_url} className="w-5 h-5 rounded-lg object-cover" alt="" />
                                            ) : (
                                                <UserIcon size={18} />
                                            )}
                                        </div>
                                        <span className={`font-display text-sm font-bold ${selectedUser ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {selectedUser ? selectedUser.user_name : 'Chọn người dùng'}
                                        </span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    <AnimatePresence>
                                        {isUserDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute z-[110] left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-72"
                                            >
                                                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                                    <Search size={14} className="text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Tìm người dùng..."
                                                        value={userSearchQuery}
                                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-400 p-0"
                                                    />
                                                </div>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                                    {filteredUsers.length > 0 ? (
                                                        filteredUsers.map(u => (
                                                            <div
                                                                key={u.id}
                                                                onClick={() => {
                                                                    setUserId(u.id);
                                                                    setIsUserDropdownOpen(false);
                                                                    setUserSearchQuery('');
                                                                }}
                                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${userId === u.id ? 'bg-secondary/10' : 'hover:bg-slate-50'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                                                        {u.avatar_url ? (
                                                                            <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            <UserIcon size={14} className="text-slate-300" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-xs font-black tracking-tight ${userId === u.id ? 'text-secondary' : 'text-slate-700'}`}>{u.user_name}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{u.chatops_channel_id}</span>
                                                                    </div>
                                                                </div>
                                                                {userId === u.id && <Check size={14} className="text-secondary" />}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Không tìm thấy kết quả</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh sách món</label>
                                <button type="button" onClick={handleAddItem} className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity">
                                    <Plus size={14} strokeWidth={3} />
                                    Thêm món
                                </button>
                            </div>

                            {/* Item List Headers */}
                            <div className="px-4 py-2 border-b border-white/20 flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <div className="flex-1">Tên món</div>
                                <div className="w-16 text-center">SL</div>
                                <div className="w-24 text-right">Đơn giá</div>
                                <div className="w-24 text-right">Giảm giá</div>
                                <div className="w-8"></div>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-white/30 rounded-3xl border border-white/40 flex items-center gap-4 group"
                                    >
                                        <div className="flex-1">
                                            <input
                                                required
                                                type="text"
                                                placeholder="Tên món..."
                                                value={item.item_name}
                                                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 font-display text-sm font-bold text-slate-800 placeholder:text-slate-400 p-0"
                                            />
                                        </div>
                                        <div className="w-16">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                                className="w-full bg-slate-100/50 border-none rounded-lg text-center font-mono text-[11px] font-bold p-1"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="Đơn giá"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', parseInt(e.target.value))}
                                                className="w-full bg-slate-100/50 border-none rounded-lg text-right font-mono text-[11px] font-bold p-1"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="Giảm giá"
                                                value={item.discount_amount}
                                                onChange={(e) => handleItemChange(index, 'discount_amount', parseInt(e.target.value))}
                                                className="w-full bg-rose-50/50 text-rose-500 border-none rounded-lg text-right font-mono text-[11px] font-bold p-1"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-white/20 bg-white/40 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Tổng cộng</span>
                            <div className="flex items-baseline gap-1 text-secondary">
                                <span className="text-2xl font-black font-display tracking-tight">{totalAmount.toLocaleString('vi-VN')}</span>
                                <span className="text-sm font-black italic">đ</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsPaid(!isPaid)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${isPaid
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                            >
                                <CreditCard size={14} />
                                {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                            >
                                <Save size={16} strokeWidth={3} />
                                {initialData ? 'Cập nhật' : 'Lưu hóa đơn'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
