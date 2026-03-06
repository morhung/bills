import { Header } from './components/Header';
import { Summary } from './components/Summary';
import { FilterBar } from './components/FilterBar';
import { BillList } from './components/BillList';
import { AdminPage } from './components/AdminPage';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { useBills } from './hooks/useBills';
import { userService } from './services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainSkeleton } from './components/MainSkeleton';
import { generateVietQRString } from './services/vietQRService';
import type { Session } from '@supabase/supabase-js';

const MainView = ({ session }: { session: Session | null }) => {
    const { userId } = useParams();

    // 1. Build the complete tag_id for validation and fetching
    const fullTagId = useMemo(() => {
        if (!userId) return '';
        const cleanId = userId.toLowerCase().replace('-runsystem.net', '');
        return `${cleanId}-runsystem.net`;
    }, [userId]);

    // Use React Query for deduplication, caching, and handling StrictMode mounting
    const { data: targetUser, isLoading: isValidatingUser } = useQuery({
        queryKey: ['user', fullTagId],
        queryFn: async () => {
            return await userService.getUserByTagId(fullTagId);
        },
        enabled: !!fullTagId,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });

    // 3. Only fetch bills if the user is valid
    const { bills: allBills, isLoading: isAllBillsLoading, error: allBillsError } = useBills(
        targetUser ? { tagId: fullTagId } : undefined,
        !!targetUser
    );

    // Filter State
    const [statusFilter, setStatusFilter] = useState<'unpaid' | 'paid'>('unpaid');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

    // Derived state: filter bills on the client-side based on user's selected filters
    const filteredBills = useMemo(() => {
        if (!allBills) return [];

        return allBills.filter(bill => {
            // Apply status filter
            const matchesStatus = statusFilter === 'unpaid' ? !bill.is_paid : bill.is_paid;
            if (!matchesStatus) return false;

            // Apply month/year filter ONLY for paid bills
            if (statusFilter === 'paid' && monthFilter !== undefined && yearFilter !== undefined) {
                const billDate = new Date(bill.bill_date);
                if (billDate.getMonth() !== monthFilter || billDate.getFullYear() !== yearFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [allBills, statusFilter, monthFilter, yearFilter]);

    const totalDebt = useMemo(() => {
        if (!allBills) return 0;
        return allBills.filter((b: any) => !b.is_paid).reduce((acc: number, b: any) => acc + (b.total_amount || 0), 0);
    }, [allBills]);

    const qrLink = useMemo(() => {
        if (totalDebt <= 0) return '';
        return generateVietQRString(totalDebt);
    }, [totalDebt]);

    const displayUserName = useMemo(() => {
        if (targetUser) return targetUser.user_name;
        if (session?.user?.email) return session.user.email.split('@')[0];
        return userId || 'Khách';
    }, [targetUser, session, userId]);

    // Validate the route BEFORE returning MainView content
    if (isValidatingUser) {
        return <MainSkeleton />;
    }

    if (!targetUser) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-none bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-xl shadow-black/5 z-[60]">
                <Header userName={displayUserName} loading={isAllBillsLoading} />
            </div>

            <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-4 items-stretch relative">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex overflow-hidden gap-8"
                >
                    <aside className="hidden lg:flex flex-col w-[320px] flex-none">
                        <Summary totalDebt={totalDebt} qrLink={qrLink} loading={isAllBillsLoading} />
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
                            {allBillsError ? (
                                <div className="py-24 text-center border border-primary/10 rounded-xl p-12 bg-white">
                                    <p className="text-red-500 font-bold text-lg">Đã có lỗi xảy ra khi tải dữ liệu.</p>
                                    <p className="text-sm text-slate-800 mt-2 font-black uppercase tracking-widest">Vui lòng thử lại sau.</p>
                                </div>
                            ) : (
                                <div className="pb-8">
                                    <BillList bills={filteredBills} loading={isAllBillsLoading} />
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
        return <MainSkeleton />;
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50/50">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={
                        session ? <Navigate to="/admin" replace /> : <LoginPage />
                    } />

                    <Route path="/" element={<LandingPage />} />
                    <Route path="/:userId" element={<MainView session={session} />} />

                    <Route path="/admin" element={
                        session ? (
                            <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-8 items-stretch relative overflow-hidden">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 flex flex-col h-full overflow-hidden"
                                >
                                    <AdminPage userEmail={session?.user?.email} />
                                </motion.div>
                            </main>
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
