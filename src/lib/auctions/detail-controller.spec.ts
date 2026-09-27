import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuctionDetailController } from './detail-controller';
import type { Auction } from '$lib/types';

const auction = (patch: Partial<Auction> = {}): Auction =>
	({
		id: '1',
		status: 'OPEN',
		startsAt: '2026-09-27T11:00:00Z',
		endsAt: '2026-09-27T13:00:00Z',
		...patch
	}) as Auction;
function setup(value = auction()) {
	const options = {
		id: '1',
		authenticated: true,
		read: vi.fn().mockResolvedValue(value),
		watch: vi.fn().mockResolvedValue(undefined),
		unwatch: vi.fn().mockResolvedValue(undefined),
		onValue: vi.fn(),
		onLoading: vi.fn(),
		onError: vi.fn(),
		onWatchError: vi.fn()
	};
	return { options, controller: createAuctionDetailController(options) };
}
describe('auction detail network lifecycle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-27T12:00:00Z'));
	});
	afterEach(() => vi.useRealTimers());
	it('reads once and renews only at 60 seconds, even after repeated SSE refreshes', async () => {
		const { options, controller } = setup();
		await controller.reload();
		await vi.advanceTimersByTimeAsync(0);
		expect(options.watch).toHaveBeenCalledTimes(1);
		for (let index = 0; index < 20; index++) controller.event();
		await vi.advanceTimersByTimeAsync(150);
		expect(options.read).toHaveBeenCalledTimes(2);
		expect(options.watch).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(59_849);
		expect(options.watch).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(options.watch).toHaveBeenCalledTimes(2);
		controller.dispose();
		await vi.advanceTimersByTimeAsync(120_000);
		expect(options.unwatch).toHaveBeenCalledTimes(1);
		expect(options.watch).toHaveBeenCalledTimes(2);
	});
	it('waits for startsAt and follows an extension without an immediate PUT', async () => {
		const { controller, options } = setup(
			auction({ startsAt: '2026-09-27T12:01:00Z', endsAt: '2026-09-27T12:02:00Z' })
		);
		await controller.reload();
		await vi.advanceTimersByTimeAsync(59_999);
		expect(options.watch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(options.watch).toHaveBeenCalledTimes(1);
		controller.adopt(auction({ endsAt: '2026-09-27T12:03:00Z' }));
		await vi.advanceTimersByTimeAsync(60_000);
		expect(options.watch).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(60_000);
		expect(options.watch).toHaveBeenCalledTimes(2);
		controller.dispose();
	});
	it('ignores a late read after a mutation and aborts on navigation', async () => {
		const { controller, options } = setup();
		let finish!: (result: Auction) => void;
		options.read.mockImplementation(() => new Promise<Auction>((resolve) => (finish = resolve)));
		const pending = controller.reload();
		const updated = auction({ price: 600 });
		controller.adopt(updated);
		finish(auction({ price: 100 }));
		await pending;
		expect(options.onValue).toHaveBeenCalledExactlyOnceWith(updated);
		controller.dispose();
		expect(options.read.mock.calls[0][0].aborted).toBe(true);
	});
	it('does not subscribe to closed auctions and preserves the value after a failed read', async () => {
		const { controller, options } = setup(auction({ status: 'SOLD' }));
		await controller.reload();
		options.read.mockRejectedValue(new Error('timeout'));
		await controller.reload();
		await vi.advanceTimersByTimeAsync(60_000);
		expect(options.onValue).toHaveBeenCalledTimes(1);
		expect(options.onError).toHaveBeenCalledTimes(1);
		expect(options.watch).not.toHaveBeenCalled();
		controller.dispose();
	});
	it('coalesces concurrent events into one follow-up and cleans up a pending subscription', async () => {
		const { controller, options } = setup();
		let finishWatch!: () => void;
		options.watch.mockImplementation(() => new Promise<void>((resolve) => (finishWatch = resolve)));
		await controller.reload();
		await vi.advanceTimersByTimeAsync(0);
		controller.dispose();
		finishWatch();
		await Promise.resolve();
		expect(options.unwatch).toHaveBeenCalledTimes(1);
		expect(options.watch).toHaveBeenCalledTimes(1);
	});
});
