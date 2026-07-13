import { useQuery } from '@tanstack/react-query';
import { paymentHistoryService } from '../services/paymentHistoryService';

export function usePaymentHistory(userId?: string, enabled: boolean = true) {
    const { data: histories, isLoading, error } = useQuery({
        queryKey: ['paymentHistories', userId],
        queryFn: async () => {
            try {
                return await paymentHistoryService.getPaymentHistories(userId);
            } catch (err) {
                console.error('Failed to fetch payment histories:', err);
                throw err;
            }
        },
        enabled: enabled
    });

    return { histories, isLoading, error };
}
