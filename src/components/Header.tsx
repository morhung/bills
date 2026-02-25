import { useNavigate } from 'react-router-dom';
import { Skeleton } from './Skeleton';

interface HeaderProps {
    userName: string;
    loading?: boolean;
}

export function Header({ userName, loading }: HeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="py-4 px-4 h-13 flex items-center">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-2">
                <div
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <img src="/drink.svg" alt="Drink Icon" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-tighter text-slate-400 font-display italic">
                                    Xin chào,
                                </span>
                                <Skeleton className="h-6 w-32 mt-1" />
                            </div>
                        ) : (
                            <h1 className="text-xl font-black tracking-tighter text-slate-900 font-display italic text-shadow-sm">
                                Xin chào, {userName}
                            </h1>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
