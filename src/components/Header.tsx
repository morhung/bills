import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    userName: string;
}

export function Header({ userName }: HeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="py-4 px-4 h-20 flex items-center">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-2">
                <div
                    onClick={() => navigate('/')}
                    className="flex flex-col cursor-pointer group"
                >
                    <h1 className="text-xl font-black tracking-tighter text-slate-900 font-display uppercase italic text-shadow-sm">
                        Chào, {userName}
                    </h1>
                </div>
            </div>
        </header>
    );
}
