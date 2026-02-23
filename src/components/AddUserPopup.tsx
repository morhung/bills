import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, Mail, Shield, Hash, Smartphone, Loader2, Check } from 'lucide-react';
import type { User } from '../types/database';
import { chatopsService, type ChatOpsUser } from '../services/chatopsService';

interface AddUserPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: any) => Promise<void>;
    initialData?: User | null;
}

export function AddUserPopup({ isOpen, onClose, onSave, initialData }: AddUserPopupProps) {
    const [tagId, setTagId] = useState('');
    const [chatopsId, setChatopsId] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(0); // 0: Member, 1: Admin, etc.
    const [isSaving, setIsSaving] = useState(false);

    // ChatOps search state
    const [suggestions, setSuggestions] = useState<ChatOpsUser[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (initialData && isOpen) {
            setTagId(initialData.tag_id || '');
            setChatopsId(initialData.chatops_id || '');
            setUserName(initialData.user_name || '');
            setEmail(initialData.email || '');
            setRole(initialData.role || 0);
        } else if (!isOpen) {
            // Reset when closed
            setTagId('');
            setChatopsId('');
            setUserName('');
            setEmail('');
            setRole(0);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [initialData, isOpen]);

    // Debounced search for ChatOps users
    useEffect(() => {
        if (!userName || userName.length < 2 || !showSuggestions) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoadingSuggestions(true);
            try {
                console.log('Searching ChatOps for:', userName);
                const results = await chatopsService.findUser(userName);
                console.log('ChatOps results:', results);
                setSuggestions(results);
            } catch (error) {
                console.error('ChatOps search failed:', error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [userName, showSuggestions]);

    const handleSelectUser = async (user: ChatOpsUser) => {
        setUserName(`${user.first_name} ${user.last_name}`.trim());
        setChatopsId(user.username);
        setEmail(user.email);
        setShowSuggestions(false);

        // Fetch Tag ID
        setIsLoadingSuggestions(true);
        try {
            const fetchedTagId = await chatopsService.findTagId(user.id);
            if (fetchedTagId) setTagId(fetchedTagId);
        } catch (error) {
            console.error('Failed to fetch Tag ID:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                id: initialData?.id,
                tag_id: tagId,
                chatops_id: chatopsId,
                user_name: userName,
                email: email,
                role: role
            });

            // If onSave doesn't throw, assume success
            // Reset form
            setTagId('');
            setChatopsId('');
            setUserName('');
            setEmail('');
            setRole(0);
            onClose();
        } catch (error) {
            // Error is handled in AdminPage but we catch here to stop loading
            console.error('AddUserPopup handleSubmit error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg glass rounded-[2.5rem] shadow-2xl border-white/40 flex flex-col"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/20 flex items-center justify-between bg-white/40">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                {initialData ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">
                                {initialData ? `Đang chỉnh sửa: ${initialData.user_name}` : 'Nhập thông tin thành viên mới'}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            {/* Họ và tên */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ví dụ: Nguyễn Văn A..."
                                        value={userName}
                                        onChange={(e) => {
                                            setUserName(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        className="w-full pl-12 pr-12 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400"
                                    />
                                    {isLoadingSuggestions && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                                            <Loader2 size={16} className="animate-spin" />
                                        </div>
                                    )}

                                    {/* Suggestions Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && userName.length >= 2 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute z-[110] left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-60"
                                            >
                                                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                    <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Gợi ý từ ChatOps</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSuggestions(false)}
                                                        className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                                    >
                                                        Đóng
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                                    {suggestions.length > 0 ? (
                                                        suggestions.map(u => (
                                                            <div
                                                                key={u.id}
                                                                onClick={() => handleSelectUser(u)}
                                                                className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer hover:bg-secondary/5 transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl bg-secondary/5 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                                                        <UserIcon size={14} className="text-secondary/40" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black tracking-tight text-slate-700">{u.nickname || `${u.first_name} ${u.last_name}`.trim() || u.username}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{u.username}</span>
                                                                    </div>
                                                                </div>
                                                                <Check size={14} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        ))
                                                    ) : isLoadingSuggestions ? (
                                                        <div className="py-8 text-center">
                                                            <Loader2 size={24} className="animate-spin text-secondary/40 mx-auto" />
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Đang tìm kiếm...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Không thấy kết quả</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Tag ID */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tag ID</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="RFID (Duy nhất)"
                                            value={tagId}
                                            onChange={(e) => setTagId(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Chatops ID */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chatops ID</label>
                                    <div className="relative group">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="LDAP/Chatops"
                                            value={chatopsId}
                                            onChange={(e) => setChatopsId(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="example@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vai trò</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(parseInt(e.target.value))}
                                        className="w-full pl-12 pr-4 py-3 bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 appearance-none cursor-pointer"
                                    >
                                        <option value={0}>Thành viên (Member)</option>
                                        <option value={1}>Quản trị viên (Admin)</option>
                                        <option value={2}>Hệ thống (System)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="flex-1 px-6 py-3 bg-white/40 border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-secondary to-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                                ) : (
                                    <Save size={16} strokeWidth={3} />
                                )}
                                {isSaving ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Lưu người dùng')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
