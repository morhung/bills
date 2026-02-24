interface SummaryProps {
    totalDebt: number;
    qrLink?: string;
}

export function Summary({ totalDebt, qrLink }: SummaryProps) {
    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Unpaid Card (Coral/Red theme) */}
            <div className="glass-card relative overflow-hidden group border-rose-200 rounded-[2.5rem]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-400/30 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative p-6 lg:p-7 flex flex-col h-full z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-white/60 shadow-sm flex items-center justify-center text-rose-500 drop-shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <span className="material-icons text-[22px]">account_balance_wallet</span>
                            </div>
                            <span className="text-slate-800 font-extrabold text-[11px] uppercase tracking-widest opacity-90">Cần thanh toán</span>
                        </div>
                        {totalDebt > 0 && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col mt-auto">
                        <div className="flex items-baseline gap-1.5 break-all">
                            <h2 className="text-[2.5rem] lg:text-5xl font-black text-rose-600 font-display tracking-tighter drop-shadow-md leading-none">
                                {totalDebt.toLocaleString('vi-VN')}
                            </h2>
                            <span className="text-2xl font-black text-rose-500 font-display">đ</span>
                        </div>
                    </div>

                    {totalDebt <= 0 && (
                        <div className="mt-4 text-sm font-bold text-emerald-600 flex items-center gap-2">
                            <span className="material-icons">check_circle</span>
                            Không có nợ! 😎
                        </div>
                    )}
                </div>
            </div>

            {/* Separate QR Quick Pay Card */}
            {qrLink && totalDebt > 0 && (
                <div className="glass-card relative overflow-hidden group border-indigo-200 rounded-[2.5rem]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-400/30 transition-colors"></div>

                    <div className="relative p-6 lg:p-8 flex flex-col items-center justify-center text-center z-10 w-full">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-white/60 shadow-sm flex items-center justify-center text-indigo-500 drop-shadow-sm">
                                <span className="material-icons text-[18px]">qr_code_scanner</span>
                            </div>
                            <span className="text-slate-800 font-extrabold text-[11px] uppercase tracking-widest opacity-90">
                                Thanh toán nhanh
                            </span>
                        </div>

                        <div className="w-full max-w-[200px]">
                            <div className="aspect-square rounded-[2rem] bg-white p-3 shadow-xl relative overflow-hidden w-full border border-indigo-100">
                                <img
                                    src={qrLink}
                                    alt="VietQR"
                                    className="w-full h-full object-cover rounded-[1.25rem]"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-5">
                            Sử dụng app ngân hàng quét mã<br />để thanh toán
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
