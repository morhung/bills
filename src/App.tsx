import { Header } from './components/Header';
import { Summary } from './components/Summary';
import { FilterBar } from './components/FilterBar';
import { BillList } from './components/BillList';
import { useBills } from './hooks/useBills';
import { usePaymentHistory } from './hooks/usePaymentHistory';
import { userService } from './services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, Navigate, useParams, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainSkeleton } from './components/MainSkeleton';
import { generateVietQRString } from './services/vietQRService';
import type { Session } from '@supabase/supabase-js';

// Lazy load pages to split the bundle and optimize initial load performance
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })));
const PaymentHistoryDetail = lazy(() => import('./components/PaymentHistoryDetail').then(m => ({ default: m.PaymentHistoryDetail })));

const PaymentHistoryList = ({ histories, loading }: { histories: any[]; loading: boolean }) => {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 pb-12 w-full animate-pulse">
                <div className="h-16 bg-slate-100 rounded-[2rem]"></div>
                <div className="h-16 bg-slate-100 rounded-[2rem]"></div>
                <div className="h-16 bg-slate-100 rounded-[2rem]"></div>
            </div>
        );
    }

    if (!histories || histories.length === 0) {
        return (
            <div className="py-24 bg-white/40 border border-white/60 rounded-[3rem] shadow-sm flex flex-col items-center text-center px-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none"></div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-700 z-10">
                    <span className="material-icons text-5xl">history</span>
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed z-10">Chưa có lịch sử thanh toán nào !</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 pb-12 w-full">
            {histories.map((h: any) => {
                const formattedDate = new Date(h.sent_at).toLocaleDateString('vi-VN');
                const isPaid = h.status === 'paid';
                return (
                    <Link
                        key={h.id}
                        to={`/payment-history/${h.id}`}
                        className="flex items-center justify-between p-3 flex-wrap sm:flex-nowrap bg-white/60 hover:bg-white border border-white/80 hover:border-slate-200 hover:shadow-md rounded-[2rem] transition-all duration-300 cursor-pointer group gap-2"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'
                                }`}>
                                <span className="material-icons text-xl">
                                    {isPaid ? 'task_alt' : 'notifications_active'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-display font-black text-base text-slate-800 tracking-tight leading-snug">
                                    Biên lai thanh toán ngày {formattedDate}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    Chốt {h.items?.length || 0} item
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto sm:ml-0">
                            <div className="flex flex-col items-end gap-1.5">
                                <span className={`font-display font-black text-lg leading-none ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {h.total_amount.toLocaleString('vi-VN')}đ
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border leading-none ${isPaid
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                    }`}>
                                    {isPaid ? 'Đã thu' : 'Chưa thu'}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 shrink-0 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">
                                <span className="material-icons text-sm">chevron_right</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

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

    // Fetch payment histories
    const { histories: paymentHistories, isLoading: isHistoriesLoading } = usePaymentHistory(
        targetUser ? targetUser.id : undefined,
        !!targetUser
    );

    // Filter State & Tab State
    const [userTab, setUserTab] = useState<'bills' | 'history'>('bills');
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
                        {/* Tab Switcher */}
                        <div className="flex gap-6 mb-4 border-b border-slate-200/20 pb-1 flex-none">
                            <button
                                onClick={() => setUserTab('bills')}
                                className={`pb-2.5 px-1 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${userTab === 'bills' ? 'border-primary text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Đơn hàng chi tiết
                            </button>
                            <button
                                onClick={() => setUserTab('history')}
                                className={`pb-2.5 px-1 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${userTab === 'history' ? 'border-primary text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Lịch sử thanh toán
                            </button>
                        </div>

                        {userTab === 'bills' ? (
                            <>
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
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <PaymentHistoryList histories={paymentHistories || []} loading={isHistoriesLoading} />
                            </div>
                        )}
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
                        <Suspense fallback={<MainSkeleton />}>
                            {session ? <Navigate to="/admin" replace /> : <LoginPage />}
                        </Suspense>
                    } />

                    <Route path="/" element={
                        <Suspense fallback={<MainSkeleton />}>
                            <LandingPage />
                        </Suspense>
                    } />
                    <Route path="/:userId" element={<MainView session={session} />} />
                    <Route path="/payment-history/:id" element={
                        <Suspense fallback={<MainSkeleton />}>
                            <PaymentHistoryDetail />
                        </Suspense>
                    } />

                    <Route path="/admin" element={
                        session ? (
                            <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-8 items-stretch relative overflow-hidden">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 flex flex-col h-full overflow-hidden"
                                >
                                    <Suspense fallback={<MainSkeleton />}>
                                        <AdminPage userEmail={session?.user?.email} />
                                    </Suspense>
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
