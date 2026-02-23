import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
    status: 'unpaid' | 'paid';
    setStatus: (status: 'unpaid' | 'paid') => void;
    month: number;
    setMonth: (month: number) => void;
    year: number;
    setYear: (year: number) => void;
}

export function FilterBar({ status, setStatus, month, setMonth, year, setYear }: FilterBarProps) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];


    // Close popup on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isPopupOpen && popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsPopupOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPopupOpen]);

    return (
        <motion.div layout className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 px-1">
            {/* Title Section */}
            <motion.div layout className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-gradient-to-b from-secondary via-primary to-accent rounded-full shadow-lg shadow-primary/20"></div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-secondary text-sm">history_edu</span>
                        <h2 className="text-xl font-black text-slate-900 font-display tracking-tight uppercase italic leading-none">
                            Lịch sử giao dịch
                        </h2>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 ml-6 opacity-70">Nhật ký chi tiêu cá nhân</p>
                </div>
            </motion.div>

            {/* Controls Group */}
            <motion.div layout className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <motion.div layout className="flex flex-wrap items-center gap-3 p-1 glass rounded-[1.5rem] bg-white/10 border-white/30">
                    {/* Status Segmented Control */}
                    <div className="flex relative bg-white/40 rounded-xl p-1 border border-white/50 min-w-[280px]">
                        <motion.div
                            className="absolute inset-1 bg-gradient-to-r from-secondary to-primary rounded-lg shadow-lg"
                            initial={false}
                            animate={{
                                x: status === 'unpaid' ? 0 : '100%',
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            style={{ width: 'calc(50% - 4px)' }}
                        />
                        <button
                            onClick={() => setStatus('unpaid')}
                            className={`relative z-10 flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${status === 'unpaid' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Chưa thanh toán
                        </button>
                        <button
                            onClick={() => setStatus('paid')}
                            className={`relative z-10 flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${status === 'paid' ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Đã thanh toán
                        </button>
                    </div>

                    {/* Date Popup Filter - Always visible, disabled if unpaid */}
                    <div className="relative" ref={popupRef}>
                        <button
                            disabled={status === 'unpaid'}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPopupOpen(!isPopupOpen);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${status === 'unpaid'
                                ? 'bg-slate-100/50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                : `bg-white/40 border-white/50 hover:bg-white/60 group/btn ${isPopupOpen ? 'ring-2 ring-primary/30 shadow-lg' : ''}`
                                }`}
                        >
                            <span className={`material-icons text-base ${status === 'unpaid' ? 'text-slate-300' : 'text-secondary'}`}>calendar_month</span>
                            <span className={`text-[10px] font-black font-display uppercase tracking-wider ${status === 'unpaid' ? 'text-slate-400' : 'text-slate-800'}`}>
                                {months[month]}, {year}
                            </span>
                            <span className={`material-icons text-base transition-transform duration-300 ${status === 'unpaid' ? 'text-slate-300' : 'text-secondary'} ${isPopupOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {/* Popup Selection Card */}
                        <AnimatePresence>
                            {isPopupOpen && status === 'paid' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-3 z-[100] w-72 bg-white rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 origin-top overflow-visible"
                                >
                                    <div className="flex flex-col gap-6">
                                        {/* Year Selection Section Redesign */}
                                        <div className="flex items-center justify-between bg-slate-50/80 p-1 rounded-2xl border border-slate-100">
                                            <button
                                                onClick={() => setYear(year - 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-secondary"
                                            >
                                                <span className="material-icons text-xl">chevron_left</span>
                                            </button>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Năm</span>
                                                <span className="text-sm font-black text-slate-800 font-display tabular-nums leading-none">{year}</span>
                                            </div>
                                            <button
                                                onClick={() => setYear(year + 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-secondary"
                                            >
                                                <span className="material-icons text-xl">chevron_right</span>
                                            </button>
                                        </div>

                                        {/* Month Grid Section Redesign */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {months.map((m, idx) => (
                                                <button
                                                    key={m}
                                                    onClick={() => {
                                                        setMonth(idx);
                                                        setIsPopupOpen(false);
                                                    }}
                                                    className={`py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${month === idx
                                                        ? 'bg-gradient-to-br from-secondary to-primary text-white border-transparent shadow-lg shadow-secondary/30 scale-[1.05]'
                                                        : 'bg-white text-slate-600 border-slate-50 hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary'
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
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
