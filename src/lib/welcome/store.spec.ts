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
});
