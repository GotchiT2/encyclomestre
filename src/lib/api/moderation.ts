import { apiRequest, type RequestOptions } from './client';
import type { ApiSchemas } from './schema';
import { wikiForgeNumericId } from './wikiforge-contract';

export type Sanction = ApiSchemas['SanctionDTO'];
export type ModerationCase = ApiSchemas['ModerationCaseDTO'] & {
	id: number;
	messages: ApiSchemas['ModerationCaseMessageDTO'][];
};
const normalize = (value: ApiSchemas['ModerationCaseDTO']) =>
	({ ...value, messages: value.messages ?? [] }) as ModerationCase;
export const getSanctions = async (options?: RequestOptions) =>
	(await apiRequest<Sanction[]>('/me/sanctions', options)) ?? [];
export const getModerationCases = async (options?: RequestOptions) =>
	((await apiRequest<ApiSchemas['ModerationCaseDTO'][]>('/me/cases', options)) ?? []).map(
		normalize
	);
export const getModerationCase = async (caseId: number | string, options?: RequestOptions) =>
	normalize(
		await apiRequest<ApiSchemas['ModerationCaseDTO']>(
			`/me/cases/${wikiForgeNumericId(caseId, 'case')}`,
			options
		)
	);
export const replyModerationCase = async (caseId: number, content: string) =>
	normalize(
		await apiRequest<ApiSchemas['ModerationCaseDTO']>(`/me/cases/${caseId}/messages`, {
			method: 'POST',
			body: { content: content.trim() }
		})
	);
