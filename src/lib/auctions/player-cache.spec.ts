import { describe, it, expect, vi } from 'vitest';
import { createAuctionPlayerCache } from './player-cache';
vi.mock('$lib/api/public-env', () => ({ env: {} }));

describe('auction identity cache', () => {
	it('deduplicates seller and leader reads, including simultaneous requests', async () => {
		const identity = { id: '2', name: 'Vendeur', image: null };
		const read = vi.fn().mockResolvedValue(identity);
		const cache = createAuctionPlayerCache(read);
		const pending = cache.get('2');
		expect(cache.get('2')).toBe(pending);
		expect(await pending).toEqual(identity);
		expect(await cache.get('2')).toEqual(identity);
		expect(read).toHaveBeenCalledOnce();
		cache.dispose();
	});
	it('preserves fallbacks after failure and isolates visits with abort signals', async () => {
		const read = vi.fn().mockRejectedValue(new Error('unavailable'));
		const cache = createAuctionPlayerCache(read);
		expect(await cache.get('2')).toBeNull();
		expect(await cache.get('2')).toBeNull();
		const signal = read.mock.calls[0][1].signal;
		cache.dispose();
		expect(signal.aborted).toBe(true);
		const next = createAuctionPlayerCache(read);
		expect(await next.get('2')).toBeNull();
		expect(read).toHaveBeenCalledTimes(2);
		expect(read.mock.calls[1][1].signal).not.toBe(signal);
		next.dispose();
	});
});
