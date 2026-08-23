export interface PaginationMeta {
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
