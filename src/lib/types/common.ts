export interface PaginationMeta {
	hasNext?: boolean;
	truncated?: boolean;
	maxResults?: number;
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
	nextCursor?: string | null;
}

export interface PaginatedResponse<T> {
	items: T[];
	meta: PaginationMeta;
}
