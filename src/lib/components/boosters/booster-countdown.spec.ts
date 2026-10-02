import { describe, expect, it } from 'vitest';
import { formatBoosterDelay, getBoosterRefreshDelay } from './booster-countdown';

describe('formatBoosterDelay', () => {
	it('includes hours for long recharge delays', () => {
		expect(formatBoosterDelay(0)).toBe('00:00');
		expect(formatBoosterDelay(5 * 60_000 + 9_000)).toBe('05:09');
		expect(formatBoosterDelay(65 * 60_000 + 3_000)).toBe('01:05:03');
		expect(formatBoosterDelay(24 * 3600_000)).toBe('24:00:00');
		expect(formatBoosterDelay(-1)).toBe('00:00');
	});

	it('schedules one refresh only for a valid future availability', () => {
		const now = new Date('2026-08-23T12:00:00Z').getTime();
		expect(getBoosterRefreshDelay('2026-08-23T12:01:00Z', now)).toBe(60_000);
		expect(getBoosterRefreshDelay('2026-08-23T12:00:00Z', now)).toBeNull();
		expect(getBoosterRefreshDelay('2026-08-23T11:59:00Z', now)).toBeNull();
		expect(getBoosterRefreshDelay('invalid', now)).toBeNull();
		expect(getBoosterRefreshDelay(null, now)).toBeNull();
	});
});
