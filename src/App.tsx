import { Header } from './components/Header';
import { Summary } from './components/Summary';
import { FilterBar } from './components/FilterBar';
import { BillList } from './components/BillList';
import { AdminPage } from './components/AdminPage';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { useBills } from './hooks/useBills';
import { useUsers } from './hooks/useUsers';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useState, useMemo, useEffect } from 'react';
import { generateVietQRString } from './services/vietQRService';
import type { Session } from '@supabase/supabase-js';

const MainView = ({ bills, isLoading, error, session }: any) => {
    const { userId } = useParams();
    const { users } = useUsers();

    // Filter State
    const [statusFilter, setStatusFilter] = useState<'unpaid' | 'paid'>('unpaid');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

    const targetUser = useMemo(() => {
        if (!users || !userId) return null;
        const cleanId = userId.toLowerCase();
        return users.find(u =>
            u.id === userId ||
            (u.tag_id && (
                u.tag_id === userId ||
                u.tag_id.toLowerCase() === cleanId ||
                u.tag_id.toLowerCase() === `${cleanId}-runsystem.net`
            )) ||
            (u.chatops_channel_id && (
                u.chatops_channel_id === userId ||
                u.chatops_channel_id.toLowerCase() === cleanId
            ))
        );
    }, [users, userId]);

    const displayBills = useMemo(() => {
        if (!bills) return [];
        if (!userId) return bills;

        if (targetUser) {
            return bills.filter((b: any) =>
                b.user_id === targetUser.id ||
                b.user_id === targetUser.tag_id ||
                b.user_id === targetUser.chatops_channel_id
            );
        }

        // Fallback for direct UUID/ID matching
        return bills.filter((b: any) => b.user_id === userId);
    }, [bills, userId, targetUser]);

    const totalDebt = useMemo(() => {
        return displayBills.filter((b: any) => !b.is_paid).reduce((acc: number, b: any) => acc + (b.total_amount || 0), 0);
    }, [displayBills]);

    const qrLink = useMemo(() => {
        if (totalDebt <= 0) return '';
        return generateVietQRString(totalDebt);
    }, [totalDebt, userId]);

    const filteredBills = useMemo(() => {
        return displayBills.filter((bill: any) => {
            const isMatch = statusFilter === 'paid' ? bill.is_paid : !bill.is_paid;
            if (!isMatch) return false;

            if (statusFilter === 'paid') {
                const billDate = new Date(bill.bill_date);
                return billDate.getMonth() === monthFilter && billDate.getFullYear() === yearFilter;
            }

            return true;
        });
    }, [displayBills, statusFilter, monthFilter, yearFilter]);

    const displayUserName = useMemo(() => {
        if (targetUser) return targetUser.user_name;
        if (session?.user?.email) return session.user.email.split('@')[0];
        return 'Khách';
    }, [targetUser, session]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-none bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-xl shadow-black/5 z-[60]">
                <Header userName={displayUserName} />
            </div>

            <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-4 items-stretch relative">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex overflow-hidden gap-8"
                >
                    <aside className="hidden lg:flex flex-col w-[320px] flex-none">
                        <Summary totalDebt={totalDebt} qrLink={qrLink} />
                    </aside>

                    <div className="flex-1 flex flex-col min-w-0 h-full">
                        <div className="flex-none pb-4 border-b border-slate-200/40 mb-2 relative z-[80]">
                            <FilterBar
                                status={statusFilter}
                                setStatus={setStatusFilter}
                                month={monthFilter}
                                setMonth={setMonthFilter}
                                year={yearFilter}
                                setYear={setYearFilter}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary/60" size={48} strokeWidth={3} />
                                </div>
                            ) : error ? (
                                <div className="py-24 text-center border border-primary/10 rounded-xl p-12 bg-white">
                                    <p className="text-red-500 font-bold text-lg">Đã có lỗi xảy ra khi tải dữ liệu.</p>
                                    <p className="text-sm text-slate-800 mt-2 font-black uppercase tracking-widest">Vui lòng thử lại sau.</p>
                                </div>
                            ) : (
                                <div className="pb-8">
                                    <BillList bills={filteredBills} />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

function App() {
    const { bills, isLoading, error } = useBills();
    const location = useLocation();
    const [session, setSession] = useState<Session | null>(null);
    const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsInitialAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isInitialAuthLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-primary/60" size={48} strokeWidth={3} />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50/50">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={
                        session ? <Navigate to="/admin" replace /> : <LoginPage />
                    } />

                    <Route path="/" element={<LandingPage />} />
                    <Route path="/:userId" element={<MainView bills={bills} isLoading={isLoading} error={error} session={session} />} />

                    <Route path="/admin" element={
                        session ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-none bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-xl shadow-black/5 z-[60]">
                                    <Header userName={session?.user?.email?.split('@')[0] || 'Admin'} />
                                </div>
                                <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-4 items-stretch relative overflow-hidden">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex-1 flex flex-col h-full overflow-hidden"
                                    >
                                        <AdminPage bills={bills || []} />
                                    </motion.div>
                                </main>
                            </div>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </div>
    );
}

export default App;
