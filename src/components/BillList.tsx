import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DetailedBill, BillItem } from '../types/database';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BillRowProps {
    bill: DetailedBill;
}

function BillRow({ bill }: BillRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr
                className={`transition-all duration-300 group cursor-pointer border-b border-white/40 last:border-0 ${isExpanded ? 'bg-white/50' : 'hover:bg-white/30'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-4 py-4 w-16">
                    <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-secondary text-white rotate-90 shadow-lg shadow-secondary/20 scale-110' : 'text-secondary group-hover:scale-110'}`}>
                        <span className="material-icons text-xl font-black">chevron_right</span>
                    </div>
                </td>
                <td className="px-4 py-4 font-display">
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-base italic uppercase">
                            {format(new Date(bill.bill_date), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-secondary"></span>
                            {format(new Date(bill.bill_date), 'EEEE', { locale: vi })}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-4 w-12"></td>
                <td className="px-4 py-4 text-right pr-6">
                    <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-baseline justify-end gap-1 ${bill.total_amount < 0
                            ? 'text-orange-500'
                            : !bill.is_paid
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            }`}>
                            <span className="text-xl font-black font-display tracking-tight drop-shadow-sm">
                                {bill.total_amount.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-sm font-black">đ</span>
                        </div>
                        {bill.is_paid ? (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse"></span>
                                Đã thanh toán
                            </span>
                        ) : (
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                                Chưa thanh toán
                            </span>
                        )}
                    </div>
                </td>
            </tr>
            <AnimatePresence>
                {isExpanded && (
                    <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <td className="px-8 py-0" colSpan={4}>
                            <motion.div
                                initial={{ height: 0, opacity: 0, scaleY: 0.9 }}
                                animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
                                exit={{ height: 0, opacity: 0, scaleY: 0.9 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="my-4 glass rounded-2xl overflow-hidden border-white/60 shadow-2xl relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 pointer-events-none"></div>
                                    <table className="w-full text-xs relative">
                                        <thead className="border-b border-white/30">
                                            <tr className="font-display">
                                                <th className="px-6 py-2 font-black text-slate-800 uppercase tracking-widest text-[9px] text-left">Sản phẩm</th>
                                                <th className="px-4 py-2 font-black text-slate-800 uppercase tracking-widest text-[9px] text-right w-16">SL</th>
                                                <th className="px-4 py-2 font-black text-slate-800 uppercase tracking-widest text-[9px] text-right w-24">Giá gốc</th>
                                                <th className="px-4 py-2 font-black text-slate-800 uppercase tracking-widest text-[9px] text-right w-24">Giảm</th>
                                                <th className="px-6 py-2 font-black text-secondary uppercase tracking-widest text-[9px] text-right w-32">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10 font-display">
                                            {bill.bill_items?.map((item: BillItem) => (
                                                <tr key={item.id} className="hover:bg-white/40 transition-colors group/row">
                                                    <td className="px-6 py-2.5 font-black text-slate-900 text-sm italic">
                                                        {item.item_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-black text-slate-800">{item.quantity}</td>
                                                    <td className="px-4 py-2.5 text-right text-slate-800 font-bold line-through italic decoration-slate-900/40">
                                                        {item.unit_price.toLocaleString('vi-VN')}đ
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-accent font-black italic">
                                                        {item.discount_amount > 0 ? `-${item.discount_amount.toLocaleString('vi-VN')}đ` : '—'}
                                                    </td>
                                                    <td className="px-6 py-2.5 text-right">
                                                        <div className="flex items-baseline justify-end gap-0.5">
                                                            <span className="font-black text-slate-900 text-base tracking-tight">{(item.unit_price * item.quantity - item.discount_amount).toLocaleString('vi-VN')}</span>
                                                            <span className="text-[10px] font-black text-secondary">đ</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </td>
                    </motion.tr>
                )}
            </AnimatePresence>
        </>
    );
}

export function BillList({ bills }: { bills: DetailedBill[] }) {
    if (!bills || bills.length === 0) {
        return (
            <div className="py-24 glass rounded-[2rem] flex flex-col items-center text-center px-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-2 text-secondary group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                    <span className="material-icons text-4xl">inbox</span>
                </div>
                <p className="text-sm text-slate-800 mt-4 max-w-xs font-black leading-relaxed">Chưa có giao dịch nào được ghi lại.</p>
            </div>
        );
    }

    return (
        <div className="glass rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5 border-white/30">
            <div className="overflow-x-auto pr-1">
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-white/10">
                        {bills.map((bill) => (
                            <BillRow key={bill.id} bill={bill} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
