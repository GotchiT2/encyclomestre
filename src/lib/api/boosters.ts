import { apiRequest, type RequestOptions } from './client';
import type { BoosterInventory, BoosterOpenResult } from '$lib/types';
export const getBoosterInventory = (userId: string, options?: RequestOptions) => apiRequest<BoosterInventory>(`/boosters/inventory?userId=${encodeURIComponent(userId)}`, options);
export const openBooster = (userId: string, options?: RequestOptions) => apiRequest<BoosterOpenResult>('/boosters/open', { ...options, method: 'POST', body: { userId } });
