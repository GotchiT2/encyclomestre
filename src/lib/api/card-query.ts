import type { CardSearchSort } from '$lib/types';

export interface CardQuery {
	page?: number;
	pageSize?: number;
	query?: string;
	variantIds?: number[];
	sortBy?: CardSearchSort;
	sortDirection?: 'ASC' | 'DESC';
	cursor?: string;
}
