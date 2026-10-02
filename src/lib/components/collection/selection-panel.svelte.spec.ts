import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
vi.mock('$env/dynamic/public', () => ({ env: {} }));
import SelectionPanel from './selection-panel.svelte';

describe('SelectionPanel', () => {
	it('reuses the tag filter control and exposes bulk protection', async () => {
		const onProtect = vi.fn();
		render(SelectionPanel, {
			selectedCount: 2,
			tags: [{ id: '7', name: 'Favorite', color: '#ff6600' }],
			bulkTagIds: [],
			canProtect: true,
			onSelectAll: vi.fn(),
			onApply: vi.fn(),
			onProtect,
			onOpenTagEditor: vi.fn(),
			onCancel: vi.fn()
		});

		const selector = page.getByTestId('bulk-tag-selector');
		expect(selector.element().querySelector('.forge-control')).not.toBeNull();
		const protect = page.getByTestId('protect-selection');
		expect(protect.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		await protect.click();
		expect(onProtect).toHaveBeenCalledOnce();
	});

	it('disables protection when every selected card is already protected', async () => {
		render(SelectionPanel, {
			selectedCount: 1,
			tags: [],
			bulkTagIds: [],
			canProtect: false,
			onSelectAll: vi.fn(),
			onApply: vi.fn(),
			onProtect: vi.fn(),
			onOpenTagEditor: vi.fn(),
			onCancel: vi.fn()
		});

		await expect.element(page.getByTestId('protect-selection')).toBeDisabled();
	});
});
