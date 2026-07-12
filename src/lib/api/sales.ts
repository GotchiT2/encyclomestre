import { apiRequest, type RequestOptions } from './client';
import type { SaleListing } from '$lib/types';

export const getSales = (sellerId: string, options?: RequestOptions) =>
	apiRequest<SaleListing[]>(`/sales?sellerId=${encodeURIComponent(sellerId)}`, options);

export const getCardSales = (cardId: string, options?: RequestOptions) =>
	apiRequest<SaleListing[]>(`/sales?cardId=${encodeURIComponent(cardId)}`, options);
