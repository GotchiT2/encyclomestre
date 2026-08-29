import { ApiError } from './client';

export function wikiForgeNumericId(value: string | number, label = 'WikiForge'): number {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new Error(`Identifiant ${label} WikiForge invalide: ${value}`);
	}
	return id;
}

/** WikiForge serializes most UTC dates without an offset. */
export function wikiForgeUtcDate(value: string): Date {
	const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
	return new Date(normalized);
}

export function wikiForgeApiErrorCode(error: unknown): string | undefined {
	if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== 'object') return;
	const payload = error.payload as Record<string, unknown>;
	return typeof payload.code === 'string' ? payload.code : undefined;
}
