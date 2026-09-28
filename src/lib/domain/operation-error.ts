import { ApiError } from '$lib/api/client';
import { get } from 'svelte/store';
import { _ } from '$lib/i18n';
import { acceptSanction } from '$lib/moderation/state';

const known = new Set([
	'SANCTIONED',
	'ACCOUNT_CONFLICT',
	'INVALID_CREDENTIALS',
	'AUCTION_CONFLICT',
	'SALE_CONFLICT',
	'TRADE_CONFLICT',
	'MISSING_GUILD_PERMISSION',
	'GUILD_CONFLICT',
	'MODERATION_CASE_CONFLICT',
	'REPORT_CONFLICT',
	'NOT_FOUND',
	'INVALID_PARAMETER',
	'FORBIDDEN_NAME',
	'ALREADY_EXISTS',
	'WISHLIST_FULL',
	'NOT_ENOUGH_MONEY'
]);
export function operationError(error: unknown): string {
	let code = '';
	if (error instanceof ApiError && error.payload && typeof error.payload === 'object') {
		const payload = error.payload as { error?: string; code?: string; meta?: unknown };
		code = payload.error ?? payload.code ?? '';
		if (code === 'SANCTIONED') acceptSanction(payload.meta);
	}
	return get(_)(`completion.errors.${known.has(code) ? code : 'generic'}`);
}
