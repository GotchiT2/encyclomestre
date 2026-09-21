import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TurnstileWidget from './turnstile-widget.svelte';
import type { TurnstileRenderOptions } from '$lib/security/turnstile';

describe('TurnstileWidget', () => {
	it('configures an interaction-only challenge with the requested action', async () => {
		const renderWidget = vi.fn((container: HTMLElement, options: TurnstileRenderOptions) => {
			void container;
			void options;
			return 'widget-1';
		});
		const remove = vi.fn();
		window.turnstile = { render: renderWidget, reset: vi.fn(), remove };

		const result = render(TurnstileWidget, { action: 'login' });
		await expect.poll(() => renderWidget.mock.calls.length).toBe(1);
		expect(renderWidget.mock.calls[0][1]).toMatchObject({
			sitekey: '0x4AAAAAAE-vz1m5zVUnCH2j',
			action: 'login',
			appearance: 'interaction-only',
			execution: 'render'
		});

		result.unmount();
		expect(remove).toHaveBeenCalledWith('widget-1');
		delete window.turnstile;
	});
});
