import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Button from './button.svelte';

describe('Button', () => {
	it('keeps an external href outside SvelteKit route resolution', async () => {
		render(Button, { href: 'https://fr.wikipedia.org/wiki/(G)I-DLE' });
		await expect
			.element(page.getByRole('link'))
			.toHaveAttribute('href', 'https://fr.wikipedia.org/wiki/(G)I-DLE');
	});
});
