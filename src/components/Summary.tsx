interface SummaryProps {
    totalDebt: number;
    qrLink?: string;
}

export function Summary({ totalDebt, qrLink }: SummaryProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Total Debt Sidecard */}
            <div className="glass-card p-6 relative overflow-hidden group border-white/50 shadow-2xl shadow-accent/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/20 transition-colors"></div>

                <div className="relative flex flex-col mb-4">
                    <span className="text-slate-800 font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-80">Dư nợ hiện tại</span>
                    <div className="flex items-baseline gap-1">
                        <h2 className="text-4xl font-black text-accent font-display tracking-tighter drop-shadow-md">
                            {totalDebt.toLocaleString('vi-VN')}
                        </h2>
                        <span className="text-xl font-black text-accent font-display">đ</span>
                    </div>
                </div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/40 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </div>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">Dư nợ tồn đọng</span>
                    </div>
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-accent shadow-xl shadow-accent/20 group-hover:scale-110 transition-transform duration-500">
                        <span className="material-icons text-xl">account_balance_wallet</span>
                    </div>
                </div>
            </div>

            {/* Payment/QR Sidebar Link - Redesigned for Dynamic VietQR */}
            <div className="glass-card p-6 relative overflow-hidden group border-white/50 shadow-2xl shadow-secondary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-secondary/20 transition-colors"></div>

                <div className="relative flex flex-col mb-1">
                    <span className="text-slate-800 font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-80">Thanh toán nhanh</span>
                </div>

                <div className="relative">
                    {qrLink && totalDebt > 0 ? (
                        <div className="w-full aspect-square rounded-[2rem] glass bg-white/60 flex flex-col items-center justify-center p-3 text-center shadow-xl border-white/80 group-hover:scale-[1.02] transition-all duration-500">
                            <a href={qrLink} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
                                <img
                                    src={qrLink}
                                    alt="VietQR"
                                    className="w-[180px] h-[180px] drop-shadow-sm mb-4 rounded-xl"
                                />
                            </a>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest leading-tight">
                                Quét để thanh toán<br />{totalDebt.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    ) : (
                        <div className="w-full aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center group/setup hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-500 cursor-default">
                            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                <span className="material-icons text-3xl">check_circle</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                Đã hoàn thành<br />hết hóa đơn
                            </span>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center opacity-60">
                    {totalDebt > 0 ? 'Mở app ngân hàng để quét mã QR' : 'Bạn không còn nợ tồn đọng'}
                </p>
            </div>
        </div>
    );
}
