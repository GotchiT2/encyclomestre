import { describe, expect, it } from 'vitest';
import { formatBoosterDelay } from './booster-countdown';

describe('formatBoosterDelay', () => {
	it('formats the recharge delay with minutes and seconds only', () => {
		expect(formatBoosterDelay(0)).toBe('00:00');
		expect(formatBoosterDelay(5 * 60_000 + 9_000)).toBe('05:09');
		expect(formatBoosterDelay(65 * 60_000 + 3_000)).toBe('65:03');
	});
});
