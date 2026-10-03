import { apiRequest, ApiError, type RequestOptions } from './client';
import type { Reauthentication } from '$lib/passkeys/api';
export interface DeletionPreview {
	canDelete: boolean;
	blockers?: { code: string; guildId?: number; guildName?: string }[];
	consequences: {
		openTrades: number;
		openSales: number;
		openAuctions: number;
		leadingAuctions: number;
		refundedAmount: number;
		friends: number;
		friendRequests: number;
		wishlists: number;
		guildId?: number;
		nbCards: number;
		money: number;
	};
}
export const getDeletionPreview = (options?: RequestOptions) =>
	apiRequest<DeletionPreview>('/me/deletion', options);
// Freeze the token for the write and its diagnostic read. Neither request renews or replays authentication.
const tokenOptions = (token: string, options?: RequestOptions): RequestOptions => ({
	...options,
	skipAuth: true,
	headers: { authorization: `Bearer ${token}` }
});
export const deleteAccount = (reauth: Reauthentication, token: string, options?: RequestOptions) =>
	apiRequest<void>('/me', {
		...tokenOptions(token, options),
		method: 'DELETE',
		body: reauth
	});
export async function checkDeletion(
	token: string,
	options?: RequestOptions
): Promise<'deleted' | 'present' | 'unknown'> {
	try {
		await apiRequest('/me', tokenOptions(token, options));
		return 'present';
	} catch (error) {
		return error instanceof ApiError && error.status === 401 ? 'deleted' : 'unknown';
	}
}
