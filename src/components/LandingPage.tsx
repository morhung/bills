import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../hooks/useUsers';
import { removeAccents } from '../utils/stringUtils';

export function LandingPage() {
    const navigate = useNavigate();
    const { users } = useUsers();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery || !users) return [];
        const cleanQuery = removeAccents(searchQuery.trim());

        return users
            .map(u => {
                const userName = u.user_name || '';
                const tagId = u.tag_id || '';
                const strippedTagId = tagId.replace('-runsystem.net', '');

                const normalizedName = removeAccents(userName);
                const normalizedTagId = removeAccents(tagId);
                const normalizedStrippedTagId = removeAccents(strippedTagId);

                let score = 0;

                // Priority 1: Exact search on tag_id (stripped or full)
                if (normalizedStrippedTagId === cleanQuery || normalizedTagId === cleanQuery) {
                    score = 100;
                }
                // Priority 2: Name starts with query
                else if (normalizedName.startsWith(cleanQuery)) {
                    score = 80;
                }
                // Priority 3: Tag ID starts with query
                else if (normalizedStrippedTagId.startsWith(cleanQuery) || normalizedTagId.startsWith(cleanQuery)) {
                    score = 60;
                }
                // Priority 4: Name contains query
                else if (normalizedName.includes(cleanQuery)) {
                    score = 40;
                }
                // Priority 5: Tag ID contains query
                else if (normalizedTagId.includes(cleanQuery)) {
                    score = 20;
                }

                return { ...u, score };
            })
            .filter(u => u.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, [users, searchQuery]);

    const handleUserSelect = (user: any) => {
        // Use tag_id as the primary identifier for the URL, stripping the domain suffix
        const rawTagId = user.tag_id?.trim() || '';
        const identifier = rawTagId.replace('-runsystem.net', '') || user.id;
        navigate(`/${identifier}`);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] overflow-hidden relative font-display">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] mb-8 uppercase italic italic-font">
                            Drink <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent">Bill</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg font-bold text-slate-800 leading-relaxed opacity-80 uppercase tracking-wide">
                            Truy xuất hóa đơn cá nhân
                        </p>
                    </motion.div>
                </div>

                {/* Search Interface */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-2xl mx-auto mb-24"
                >
                    <div className="glass rounded-[3rem] p-4 shadow-2xl shadow-black/5 border-white/40 ring-1 ring-black/[0.03]">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-800 group-focus-within:text-secondary transition-colors">
                                <Search size={22} strokeWidth={3} />
                            </div>
                            <input
                                type="text"
                                placeholder="Nhập tên của bạn để tìm hóa đơn..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-16 pr-6 py-6 bg-white/50 border-none rounded-[2rem] focus:ring-4 focus:ring-secondary/10 transition-all font-bold text-lg text-slate-900 placeholder:text-slate-800/40"
                            />
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                            {searchQuery && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-4 space-y-2 px-2"
                                >
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleUserSelect(u)}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/80 transition-all group border border-transparent hover:border-slate-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-black shadow-inner">
                                                        {u.user_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-black text-slate-900 uppercase italic tracking-tight">{u.user_name}</h4>
                                                        <p className="text-[10px] font-black text-slate-800/60 uppercase">
                                                            {u.tag_id?.trim() ? `@${u.tag_id}` : 'Chưa có ID'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={20} className="text-slate-300 group-hover:text-secondary transition-colors group-hover:translate-x-1" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center bg-white/30 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm font-black text-slate-800/40 uppercase tracking-widest">Không tìm thấy người dùng này</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
