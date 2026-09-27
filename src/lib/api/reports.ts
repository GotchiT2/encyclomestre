import { apiRequest, type RequestOptions } from './client';
import { wikiForgeNumericId } from './wikiforge-contract';
import type { ApiSchemas } from './schema';
export type ReportInput = ApiSchemas['ReportRequest'];
export const reportContent = (body: ReportInput, options?: RequestOptions) =>
	apiRequest<void>('/reports', { ...options, method: 'POST', body });
export async function reportPage(
	pageId: string | number,
	reason = 'INAPPROPRIATE',
	comment?: string,
	options?: RequestOptions
) {
	return apiRequest<void>('/reports', {
		...options,
		apiTarget: 'wikiforge',
		method: 'POST',
		body: {
			type: 'PAGE',
			id: wikiForgeNumericId(pageId, 'article'),
			reason,
			...(comment?.trim() ? { comment: comment.trim() } : {})
		}
	});
}
