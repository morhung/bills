import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Calendar, CreditCard, Receipt, FileText, ShoppingBag, Landmark } from 'lucide-react';
import { paymentHistoryService } from '../services/paymentHistoryService';
import { generateVietQRString, generateVietQRVIBString } from '../services/vietQRService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function PaymentHistoryDetail() {
    const { id } = useParams<{ id: string }>();

    const { data: history, isLoading, error } = useQuery({
        queryKey: ['paymentHistory', id],
        queryFn: () => paymentHistoryService.getPaymentHistoryById(id || ''),
        enabled: !!id,
        refetchInterval: 5000 // Poll every 5s in case admin approves while user is looking
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Đang tải biên lai...</p>
                </div>
            </div>
        );
    }

    if (error || !history) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
                <div className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Không tìm thấy hóa đơn</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">Đường dẫn hóa đơn này không chính xác hoặc đã bị xóa khỏi hệ thống.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        Quay lại Trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    const { user } = history;
    const userProfileUrl = user ? `/${user.tag_id.replace('-runsystem.net', '')}` : '/';
    const isPaid = history.status === 'paid';
    
    // Generate QR codes for the total debt amount of this specific history entry
    const qrMoMo = generateVietQRString(history.total_amount);
    const qrVib = generateVietQRVIBString(history.total_amount);

    return (
        <div className="min-h-screen bg-slate-50/60 py-8 px-4 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6 relative z-10">
                {/* Header Back Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        to={userProfileUrl}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white hover:bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                        Trang cá nhân của {user?.user_name || 'User'}
                    </Link>
                    <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Biên lai thanh toán</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Main Receipt Section */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden"
                        >
                            {/* Receipt dashed design header */}
                            <div className="absolute top-0 left-6 right-6 h-px border-t-[3px] border-dashed border-slate-200"></div>

                            <div className="p-6 md:p-8 flex flex-col gap-6">
                                {/* Header / Title */}
                                <div className="text-center pb-4 border-b border-slate-100 mt-2">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic font-display">Biên Lai Thanh Toán</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mã hóa đơn: {history.id.slice(0, 8).toUpperCase()}</p>
                                </div>

                                {/* Status & Meta Details */}
                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                                        <div className={`self-start px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border ${
                                            isPaid 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' 
                                                : 'bg-amber-50 text-amber-600 border-amber-200/50 animate-pulse'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người nhận nợ</span>
                                        <span className="text-sm font-black text-slate-800 leading-tight">{user?.user_name || 'Khách'}</span>
                                    </div>
                                </div>

                                {/* Date logs */}
                                <div className="flex flex-col gap-2.5 text-xs text-slate-500 px-1">
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                            <Calendar size={12} /> Ngày thông báo:
                                        </span>
                                        <span className="font-bold text-slate-700">
                                            {format(new Date(history.sent_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </span>
                                    </div>
                                    {isPaid && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                                    <Clock size={12} /> Ngày thanh toán:
                                                </span>
                                                <span className="font-bold text-slate-700">
                                                    {history.paid_at ? format(new Date(history.paid_at), 'dd/MM/yyyy HH:mm', { locale: vi }) : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                                    <CreditCard size={12} /> Thanh toán qua:
                                                </span>
                                                <span className="font-black text-primary capitalize flex items-center gap-1">
                                                    {history.payment_method === 'momo' ? (
                                                        <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-bold">MoMo</span>
                                                    ) : (
                                                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold">VIB</span>
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Items list section */}
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <ShoppingBag size={12} /> Danh sách sản phẩm chốt nợ
                                    </h4>

                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {history.items.map((item, index) => (
                                            <div key={index} className="flex items-center py-2 justify-between gap-4 border-b border-slate-50 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm leading-snug">{item.item_name}</span>
                                                    {item.bill_date && (
                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                            Ngày gọi: {format(new Date(item.bill_date), 'dd/MM/yyyy')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <span className="text-xs text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md">SL: {item.quantity}</span>
                                                    <div className="text-right">
                                                        <div className="font-black text-slate-900 text-sm">
                                                            {((item.unit_price * item.quantity) - item.discount_amount).toLocaleString('vi-VN')}đ
                                                        </div>
                                                        {item.discount_amount > 0 && (
                                                            <div className="text-[9px] text-orange-500 font-bold">
                                                                Giảm: -{item.discount_amount.toLocaleString('vi-VN')}đ
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="border-t border-slate-100 pt-5 flex items-baseline justify-between">
                                    <span className="font-display font-black text-lg text-slate-700">Tổng tiền cần trả:</span>
                                    <div className="text-right flex items-baseline gap-1 text-slate-900">
                                        <span className="text-3xl font-black font-display tracking-tight text-slate-900 leading-none">
                                            {history.total_amount.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-lg font-black">đ</span>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt dashed design footer */}
                            <div className="absolute bottom-0 left-6 right-6 h-px border-b-[3px] border-dashed border-slate-200"></div>
                        </motion.div>
                    </div>

                    {/* QR Code Payment Section */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 p-6 flex flex-col gap-6"
                        >
                            {!isPaid ? (
                                <>
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center justify-center gap-2">
                                            <CreditCard size={18} className="text-amber-500 animate-pulse" />
                                            Quét mã Thanh toán
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Vui lòng quét mã QR chuyển khoản bằng ứng dụng ngân hàng hoặc ví MoMo. Sau khi thanh toán, HùngND sẽ xác nhận.
                                        </p>
                                    </div>

                                    {/* Tabs or Grid for QR codes */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* MoMo QR */}
                                        {qrMoMo && (
                                            <div className="flex flex-col items-center p-4 border border-rose-100 rounded-3xl bg-rose-50/20 group">
                                                <div className="flex items-center gap-1.5 mb-3 bg-rose-50 text-rose-700 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    Momo Wallet
                                                </div>
                                                <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-rose-100/50 shadow-md group-hover:scale-105 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                                                    <img src={qrMoMo} alt="Momo QR Code" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-[10px] text-rose-500 font-bold uppercase mt-3 tracking-widest">Nạp Ví Momo</span>
                                            </div>
                                        )}

                                        {/* VIB QR */}
                                        {qrVib && (
                                            <div className="flex flex-col items-center p-4 border border-blue-100 rounded-3xl bg-blue-50/20 group">
                                                <div className="flex items-center gap-1.5 mb-3 bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
                                                    <Landmark size={12} />
                                                    VIB Bank
                                                </div>
                                                <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-blue-100/50 shadow-md group-hover:scale-105 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                                                    <img src={qrVib} alt="VIB QR Code" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-[10px] text-blue-500 font-bold uppercase mt-3 tracking-widest">Banking Chuyển khoản</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-100/80 text-[11px] text-amber-700 leading-relaxed font-medium">
                                        👉 <strong>Lưu ý:</strong> Nội dung chuyển khoản vui lòng ghi rõ họ tên và tag name để Admin đối chiếu dễ dàng hơn.
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                        <CheckCircle2 size={48} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight font-display italic">Giao Dịch Đã Thanh Toán</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                                            Biên lai này đã được Admin xác nhận thanh toán thành công thông qua {history.payment_method === 'momo' ? 'ví MoMo' : 'ngân hàng VIB'}.
                                        </p>
                                    </div>
                                    <div className="w-full border-t border-slate-100 pt-6 mt-2 flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        <div>Cảm ơn bạn đã thanh toán ! ❤️</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-4xl mx-auto w-full text-center mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Drink Bill App • HùngND Admin Service
            </div>
        </div>
    );
}
export default PaymentHistoryDetail;
