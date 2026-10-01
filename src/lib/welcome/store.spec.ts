import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const { getWikiForgeWelcome } = vi.hoisted(() => ({ getWikiForgeWelcome: vi.fn() }));
vi.mock('$lib/api/welcome', () => ({ getWikiForgeWelcome }));

import { clearCurrentWelcome, currentWelcome, refreshCurrentWelcome } from './store';

describe('shared welcome state', () => {
	beforeEach(() => {
		clearCurrentWelcome();
		getWikiForgeWelcome.mockReset();
	});

	it('deduplicates concurrent reads and exposes the result', async () => {
		getWikiForgeWelcome.mockResolvedValue({ money: 120, collection: {} });
		await Promise.all([refreshCurrentWelcome(), refreshCurrentWelcome()]);
		expect(getWikiForgeWelcome).toHaveBeenCalledOnce();
		expect(get(currentWelcome)).toMatchObject({ money: 120 });
	});
	it('discards reads started for a previous session', async () => {
		let resolve!: (value: unknown) => void;
		getWikiForgeWelcome.mockImplementationOnce(() => new Promise((done) => (resolve = done)));
		const pending = refreshCurrentWelcome();
		clearCurrentWelcome();
		resolve({ money: 999 });
		await pending;
		expect(get(currentWelcome)).toBeNull();
	});
	it('reads again after an in-flight read when a mutation invalidates the aggregate', async () => {
		let resolve!: (value: unknown) => void;
		getWikiForgeWelcome.mockImplementationOnce(() => new Promise((done) => (resolve = done)));
		getWikiForgeWelcome.mockResolvedValueOnce({ money: 300 });
		const pending = refreshCurrentWelcome();
		const fresh = refreshCurrentWelcome(true);
		resolve({ money: 200 });
		await Promise.all([pending, fresh]);
		expect(getWikiForgeWelcome).toHaveBeenCalledTimes(2);
		expect(get(currentWelcome)).toMatchObject({ money: 300 });
	});
});
