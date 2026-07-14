import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '$lib/i18n';
import '../../../app.css';
import TagEditor from './tag-editor.svelte';

vi.mock('$lib/api', () => ({
	createWikiForgeTag: vi.fn(),
	deleteWikiForgeTag: vi.fn(),
	updateWikiForgeTag: vi.fn()
}));

describe('TagEditor', () => {
	it('exposes the existing tag color with the same height as its text field', async () => {
		render(TagEditor, {
			open: true,
			tags: [{ id: 'favorites', name: 'Favoris', color: '#5c1dcf' }],
			assignments: {}
		});

		await page.getByRole('button', { name: 'Modifier' }).click();
		const textFields = document.querySelectorAll<HTMLInputElement>('input[data-slot="input"]');
		const colorFields = document.querySelectorAll<HTMLInputElement>('input[type="color"]');
		const editedName = textFields[textFields.length - 1];
		const editedColor = colorFields[colorFields.length - 1];

		expect(editedColor.value).toBe('#5c1dcf');
		expect(editedColor.getBoundingClientRect().height).toBe(
			editedName.getBoundingClientRect().height
		);
	});
});
