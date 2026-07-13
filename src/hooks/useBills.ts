import { useQuery } from '@tanstack/react-query';
import { billService } from '../services/billService';
import type { BillFilters } from '../services/billService';

export function useBills(filters?: BillFilters, enabled: boolean = true) {
    const { data: bills, isLoading, error } = useQuery({
        queryKey: ['bills', filters],
        queryFn: async () => {
            try {
                return await billService.getBills(filters);
            } catch (err) {
                console.error('Failed to fetch bills:', err);
                throw err;
            }
        },
        enabled: enabled
    });

    return { bills, isLoading, error };
}
