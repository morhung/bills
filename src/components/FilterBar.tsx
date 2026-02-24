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
        <motion.div layout className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-1">
            {/* Title Section */}
            <motion.div layout className="flex items-center gap-3">
                <div className="w-1.5 h-7 bg-gradient-to-b from-rose-400 via-primary to-emerald-400 rounded-full shadow-lg shadow-primary/10"></div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-primary text-lg drop-shadow-sm">history_edu</span>
                        <h2 className="text-xl font-black text-slate-900 font-display tracking-tight uppercase italic leading-none">
                            Lịch sử chi tiêu
                        </h2>
                    </div>
                </div>
            </motion.div>

            {/* Controls Group */}
            <motion.div layout className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <motion.div layout className="flex flex-wrap items-center gap-2 p-1 glass rounded-full bg-white/40 border-white/60 shadow-sm">
                    {/* Status Segmented Control */}
                    <div className="flex relative bg-slate-100/50 rounded-[1.75rem] p-1 border border-white/80 min-w-[300px] shadow-inner backdrop-blur-md">
                        <motion.div
                            className="absolute inset-y-1 rounded-[1.5rem] shadow-sm bg-white"
                            initial={false}
                            animate={{
                                x: status === 'unpaid' ? '3px' : 'calc(100% + 3px)',
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            style={{ width: 'calc(50% - 5px)' }}
                        />
                        <button
                            onClick={() => setStatus('unpaid')}
                            className={`relative z-10 flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap flex items-center justify-center gap-1.5 rounded-[1.5rem] ${status === 'unpaid' ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
                        >
                            <span className="material-icons text-[15px]">{status === 'unpaid' ? 'local_fire_department' : 'receipt_long'}</span>
                            Chưa thanh toán
                        </button>
                        <button
                            onClick={() => setStatus('paid')}
                            className={`relative z-10 flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap flex items-center justify-center gap-1.5 rounded-[1.5rem] ${status === 'paid' ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-400'}`}
                        >
                            <span className="material-icons text-[15px]">{status === 'paid' ? 'verified' : 'task_alt'}</span>
                            Đã thanh toán
                        </button>
                    </div>

                    {/* Date Popup Filter (Always Visible, Youthful Design) */}
                    <div className="relative origin-left" ref={popupRef}>
                        <button
                            onClick={(e) => {
                                if (status === 'unpaid') return;
                                e.stopPropagation();
                                setIsPopupOpen(!isPopupOpen);
                            }}
                            disabled={status === 'unpaid'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-[1.5rem] transition-all duration-300 group/btn ${status === 'unpaid'
                                ? 'bg-slate-100/50 text-slate-400 border border-slate-200/50 cursor-not-allowed opacity-70'
                                : isPopupOpen
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 border border-slate-800'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <span className={`material-icons text-[17px] transition-colors ${status === 'unpaid'
                                ? 'text-slate-300'
                                : isPopupOpen ? 'text-rose-400' : 'text-slate-400 group-hover/btn:text-rose-500'
                                }`}>calendar_month</span>
                            <span className="text-[11px] font-black font-display uppercase tracking-widest mt-0.5 w-[110px] text-center">
                                {status === 'unpaid'
                                    ? `${months[new Date().getMonth()]}, ${new Date().getFullYear()}`
                                    : `${months[month]}, ${year}`}
                            </span>
                            <span className={`material-icons text-lg transition-transform duration-300 ${status === 'unpaid'
                                    ? 'text-slate-300 opacity-40'
                                    : isPopupOpen ? 'rotate-180 text-white/50' : 'text-slate-300 group-hover/btn:text-slate-400'
                                }`}>expand_more</span>
                        </button>

                        {/* Popup Selection Card */}
                        <AnimatePresence>
                            {isPopupOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(4px)' }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="absolute right-0 top-[calc(100%+8px)] z-[100] w-[300px] bg-white rounded-[1.75rem] p-4 shadow-2xl shadow-slate-900/10 border border-slate-100 origin-top overflow-visible"
                                >
                                    <div className="flex flex-col gap-5">
                                        {/* Year Selection */}
                                        <div className="flex items-center justify-between bg-slate-50/80 p-1 rounded-[1.25rem] border border-slate-100/50">
                                            <button
                                                onClick={() => setYear(year - 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow hover:text-rose-500 transition-all text-slate-500"
                                            >
                                                <span className="material-icons text-xl">chevron_left</span>
                                            </button>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Năm</span>
                                                <span className="text-lg font-black text-slate-800 font-display tabular-nums leading-none">{year}</span>
                                            </div>
                                            <button
                                                onClick={() => setYear(year + 1)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow hover:text-rose-500 transition-all text-slate-500"
                                            >
                                                <span className="material-icons text-xl">chevron_right</span>
                                            </button>
                                        </div>

                                        {/* Month Grid */}
                                        <div className="grid grid-cols-4 gap-2">
                                            {months.map((m, idx) => (
                                                <button
                                                    key={m}
                                                    onClick={() => {
                                                        setMonth(idx);
                                                        setIsPopupOpen(false);
                                                    }}
                                                    className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${month === idx
                                                        ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                                                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
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
