import { supabase } from './supabaseClient';

export interface MachineryAdData {
    machinery_name: string;
    machinery_type: string;
    price_per_time: number;
    time_unit: string;
    description: string;
}

export const machineryService = {
    async createMachineryAd(adData: MachineryAdData): Promise<void> {
        const { error } = await supabase.from('machinery_ads').insert({
            ...adData,
            distance_km: Math.floor(Math.random() * 20 * 10) / 10 + 1.0, // Random anonymous distance
            rating: 5.0
        });

        if (error) {
            throw error;
        }
    }
};
