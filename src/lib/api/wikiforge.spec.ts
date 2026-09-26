import { describe, expect, it } from 'vitest';
import { wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

describe('WikiForge contract helpers', () => {
	it('validates numeric API identifiers', () => {
		expect(wikiForgeNumericId('42', 'carte')).toBe(42);
		expect(() => wikiForgeNumericId('uuid', 'carte')).toThrow('carte');
	});

	it('normalizes backend dates as UTC', () => {
		expect(wikiForgeUtcDate('2026-09-19T12:00:00').toISOString()).toBe('2026-09-19T12:00:00.000Z');
	});
});
