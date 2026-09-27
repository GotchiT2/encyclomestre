import { ApiError } from '$lib/api/client';
export function auctionErrorKey(error: unknown) {
	if (!(error instanceof ApiError)) return 'auctionHub.actionError';
	const code = (error.payload as { error?: string } | null)?.error;
	if (code === 'NOT_ENOUGH_MONEY') return 'auctionHub.moneyError';
	if (error.status === 403) return 'auctionHub.sanctioned';
	if (error.status === 409) return 'auctionHub.conflict';
	if (error.status === 404) return 'auctionHub.notFound';
	return 'auctionHub.actionError';
}
