import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Centralized Global Realtime Subscription to eliminate connection thrashing and console warnings
const isEnvMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');
if (!isEnvMissing) {
    supabase
        .channel('global_db_realtime')
        .on(
            'postgres_changes',
            { event: '*', table: 'users', schema: 'public' },
            () => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
            }
        )
        .on(
            'postgres_changes',
            { event: '*', table: 'bills', schema: 'public' },
            () => {
                queryClient.invalidateQueries({ queryKey: ['bills'] });
            }
        )
        .on(
            'postgres_changes',
            { event: '*', table: 'bill_items', schema: 'public' },
            () => {
                queryClient.invalidateQueries({ queryKey: ['bills'] });
            }
        )
        .on(
            'postgres_changes',
            { event: '*', table: 'payment_history', schema: 'public' },
            (payload: any) => {
                queryClient.invalidateQueries({ queryKey: ['paymentHistories'] });
                queryClient.invalidateQueries({ queryKey: ['users'] }); // Update user unpaid debt stats

                const historyId = payload.new?.id || payload.old?.id;
                if (historyId) {
                    queryClient.invalidateQueries({ queryKey: ['paymentHistory', historyId] });
                }
            }
        )
        .subscribe();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
);
