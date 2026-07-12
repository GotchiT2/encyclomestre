import { apiRequest, type RequestOptions } from './client';
import type { CardRecord, PaginatedResponse } from '$lib/types';

export const getCollection = (options?: RequestOptions) =>
	apiRequest<PaginatedResponse<CardRecord>>('/collection', options);
