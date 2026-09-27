import { describe, it, expect } from 'vitest';
import { notificationTarget } from './target';
describe('Notification destinations', () => {
	it.each(['AUCTION_OUTBID', 'AUCTION_WON', 'AUCTION_SOLD', 'AUCTION_UNSOLD', 'AUCTION_CANCELLED'])(
		'opens %s by documented identifier',
		(type) => expect(notificationTarget({ type, extId: '70' })).toBe('/market/70')
	);
	it.each([null, '', 'https://example.org', '../profile'])('falls back safely for %s', (extId) =>
		expect(notificationTarget({ type: 'AUCTION_WON', extId })).toBe('/market')
	);
	it('keeps moderation reachable and handles future types', () => {
		expect(notificationTarget({ type: 'MODERATION_MESSAGE', extId: '2' })).toBe('/moderation/2');
		expect(notificationTarget({ type: 'FUTURE', extId: '2' })).toBeNull();
	});
});
