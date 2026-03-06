import { motion } from 'framer-motion';

const Shimmer = () => (
    <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
            translateX: ['100%', '-100%'],
        }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
        }}
    />
);

export const MainSkeleton = () => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Header Skeleton */}
            <div className="flex-none bg-white/70 backdrop-blur-3xl border-b border-white/40 shadow-xl shadow-black/5 z-[60] h-[72px] flex items-center px-6">
                <div className="w-32 h-6 bg-slate-200 rounded-lg relative overflow-hidden">
                    <Shimmer />
                </div>
                <div className="ml-auto w-10 h-10 bg-slate-200 rounded-xl relative overflow-hidden">
                    <Shimmer />
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 gap-8 py-4 items-stretch relative">
                {/* Sidebar Skeleton */}
                <aside className="hidden lg:flex flex-col w-[320px] flex-none gap-6">
                    <div className="h-[400px] glass rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="space-y-6">
                            <div className="w-24 h-4 bg-slate-200 rounded relative overflow-hidden text-center mx-auto">
                                <Shimmer />
                            </div>
                            <div className="w-40 h-10 bg-slate-200 rounded-xl relative overflow-hidden mx-auto">
                                <Shimmer />
                            </div>
                            <div className="aspect-square w-full bg-slate-100 rounded-3xl relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    {/* FilterBar Skeleton */}
                    <div className="flex-none pb-4 border-b border-slate-200/40 mb-2 flex gap-4">
                        <div className="w-48 h-10 bg-white/60 rounded-xl relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="w-32 h-10 bg-white/60 rounded-xl relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>

                    {/* BillList Skeleton */}
                    <div className="flex-1 overflow-hidden space-y-4 pt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-24 bg-white/60 rounded-[2rem] border border-white/40 p-4 flex items-center gap-4 relative overflow-hidden">
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl relative overflow-hidden">
                                    <Shimmer />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="w-32 h-4 bg-slate-200 rounded relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                    <div className="w-20 h-3 bg-slate-100 rounded relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                </div>
                                <div className="w-24 h-6 bg-slate-200 rounded-lg relative overflow-hidden">
                                    <Shimmer />
                                </div>
                                <Shimmer />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
