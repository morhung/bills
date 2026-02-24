import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DetailedBill, BillItem } from '../types/database';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BillCardProps {
    bill: DetailedBill;
}

function BillCard({ bill }: BillCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            className={`flex flex-col mb-2 overflow-hidden transition-all duration-500 rounded-[2rem] border ${isExpanded ? 'bg-white shadow-xl shadow-slate-200/50 border-slate-200' : 'bg-white/60 hover:bg-white shadow-sm border-white/80 hover:shadow-md'}`}
        >
            {/* Card Header (Main Row) */}
            <div
                className="p-3 lg:p-3 flex items-center justify-between cursor-pointer gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Left side: Date & Time */}
                <div className="flex items-center gap-4 lg:gap-5 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${bill.is_paid
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-500'
                        }`}>
                        <span className="material-icons text-2xl">
                            {bill.is_paid ? 'task_alt' : 'receipt_long'}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="font-display font-black text-lg lg:text-xl tracking-tight text-slate-800 leading-none mb-1">
                            {format(new Date(bill.bill_date), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${bill.is_paid ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            {format(new Date(bill.bill_date), 'EEEE', { locale: vi })}
                        </span>
                    </div>
                </div>

                {/* Right side: Amount, Badge & Chevron */}
                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex flex-col items-end gap-1.5">
                        <div className={`flex items-baseline gap-1 ${bill.total_amount < 0
                            ? 'text-orange-500'
                            : !bill.is_paid
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}>
                            <span className="text-xl lg:text-2xl font-black font-display tracking-tighter shadow-sm leading-none">
                                {bill.total_amount.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-base font-black leading-none">đ</span>
                        </div>

                        {/* Explicit Badge */}
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${bill.is_paid
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50'
                            : 'bg-rose-50 text-rose-600 border-rose-200/50'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${bill.is_paid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                            {bill.is_paid ? 'Đã thu' : 'Chưa thu'}
                        </div>
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-500 bg-slate-50 text-slate-400 shrink-0 hidden sm:flex ${isExpanded ? 'rotate-180 bg-slate-100 text-slate-600' : ''}`}>
                        <span className="material-icons">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Expanded Details (Receipt Style) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                        <div className="p-3 lg:p-3">
                            <div className="bg-white rounded-3xl px-6 py-4 shadow-sm border border-slate-100 relative overflow-hidden">
                                {/* Receipt dashed line top */}
                                <div className="absolute top-0 left-4 right-4 h-px border-t-[3px] border-dashed border-slate-200"></div>

                                <div className="flex flex-col gap-2">
                                    {/* Header Row */}
                                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100">
                                        <div className="flex-1">Sản phẩm</div>
                                        <div className="w-12 text-center">SL</div>
                                        <div className="w-24 text-right">Đơn giá</div>
                                        <div className="w-24 text-right hidden sm:block">Giảm</div>
                                        <div className="w-28 text-right text-slate-600">Thành tiền</div>
                                    </div>

                                    {/* Items */}
                                    {bill.bill_items?.map((item: BillItem) => (
                                        <div key={item.id} className="flex items-center py-2 group/item">
                                            <div className="flex-1 font-bold text-slate-800 text-sm">{item.item_name}</div>
                                            <div className="w-12 text-center text-slate-800 font-bold bg-slate-100 rounded-md py-0.5 text-xs">{item.quantity}</div>
                                            <div className="w-24 text-right text-slate-400 font-medium line-through text-xs">
                                                {item.unit_price.toLocaleString('vi-VN')}đ
                                            </div>
                                            <div className="w-24 text-right hidden sm:block text-orange-500 font-bold text-xs">
                                                {item.discount_amount > 0 ? `-${item.discount_amount.toLocaleString('vi-VN')}đ` : '—'}
                                            </div>
                                            <div className="w-28 text-right flex items-baseline justify-end gap-0.5">
                                                <span className="font-black text-slate-900 tracking-tight">{(item.unit_price * item.quantity - item.discount_amount).toLocaleString('vi-VN')}</span>
                                                <span className="text-[10px] font-bold text-slate-500">đ</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Receipt dashed line bottom */}
                                <div className="absolute bottom-0 left-4 right-4 h-px border-b-[3px] border-dashed border-slate-200"></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function BillList({ bills }: { bills: DetailedBill[] }) {
    if (!bills || bills.length === 0) {
        return (
            <div className="py-24 bg-white/40 border border-white/60 rounded-[3rem] shadow-sm flex flex-col items-center text-center px-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none"></div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-xl shadow-slate-200/50 border border-slate-100 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 z-10">
                    <span className="material-icons text-5xl">receipt_long</span>
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed z-10 mb-4">Chưa có giao dịch nào ở mục này !</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 pb-12 w-full">
            <AnimatePresence mode="popLayout">
                {bills.map((bill) => (
                    <BillCard key={bill.id} bill={bill} />
                ))}
            </AnimatePresence>
        </div>
    );
}
