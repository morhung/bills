import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/30 blur-[120px] rounded-full animate-pulse decoration-1000" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-500/20 blur-[100px] rounded-full animate-bounce duration-[10000ms]" />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-8 sm:p-12 mx-4 glass rounded-[3rem] shadow-2xl border-white/20 backdrop-blur-3xl overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

                <div className="relative">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-secondary/20"
                        >
                            <User className="text-white" size={32} />
                        </motion.div>
                        <h1 className="text-3xl font-black text-slate-800 font-display uppercase italic tracking-tighter leading-none mb-2">
                            Đăng Nhập
                        </h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">Bill Management System</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-rose-500 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/40 border border-white/60 rounded-2xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400/60"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-all" size={18} />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/40 border border-white/60 rounded-2xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary/30 transition-all font-display text-sm font-bold text-slate-800 placeholder:text-slate-400/60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            disabled={isLoading}
                            type="submit"
                            className="w-full group relative overflow-hidden flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-secondary to-primary text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                ) : (
                                    <>
                                        <span>Đăng Nhập</span>
                                        <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </AnimatePresence>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            © 2026 Admin Portal
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
