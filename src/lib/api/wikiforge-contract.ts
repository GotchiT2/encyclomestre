import { ApiError } from './client';

export function wikiForgeNumericId(value: string | number, label = 'WikiForge'): number {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new Error(`Identifiant ${label} WikiForge invalide: ${value}`);
	}
	return id;
}

/** Accept both current UTC timestamps and legacy unzoned UTC timestamps. */
export function wikiForgeUtcDate(value: string): Date {
	const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
	return new Date(normalized);
}

export function wikiForgeApiErrorCode(error: unknown): string | undefined {
	if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== 'object') return;
	const payload = error.payload as Record<string, unknown>;
	return typeof payload.error === 'string'
		? payload.error
		: typeof payload.code === 'string'
			? payload.code
			: undefined;
}
