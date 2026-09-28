import { ApiError } from '$lib/api/client';
export function nameChangeLocked(availableAt: string | undefined, now = Date.now()) {
	return Boolean(
		availableAt && Number.isFinite(Date.parse(availableAt)) && Date.parse(availableAt) > now
	);
}
export function nameChangeRefusal(cause: unknown): string | null {
	if (
		!(cause instanceof ApiError) ||
		cause.status !== 429 ||
		!cause.payload ||
		typeof cause.payload !== 'object'
	)
		return null;
	const payload = cause.payload as { error?: string; meta?: { availableAt?: unknown } };
	const date = payload.meta?.availableAt;
	return payload.error === 'NAME_CHANGE_TOO_SOON' &&
		typeof date === 'string' &&
		Number.isFinite(Date.parse(date))
		? date
		: null;
}
