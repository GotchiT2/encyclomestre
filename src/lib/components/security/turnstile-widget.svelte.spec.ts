import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TurnstileWidget from './turnstile-widget.svelte';
import type { TurnstileRenderOptions } from '$lib/security/turnstile';

describe('TurnstileWidget', () => {
	it('executes an interaction-only challenge only when verification is requested', async () => {
		let capturedOptions: TurnstileRenderOptions | undefined;
		const renderWidget = vi.fn((container: HTMLElement, renderOptions: TurnstileRenderOptions) => {
			void container;
			capturedOptions = renderOptions;
			return 'widget-1';
		});
		const execute = vi.fn();
		const remove = vi.fn();
		window.turnstile = { render: renderWidget, execute, reset: vi.fn(), remove };

		const result = render(TurnstileWidget, { action: 'login' });
		await expect.poll(() => renderWidget.mock.calls.length).toBe(1);
		expect(renderWidget.mock.calls[0][1]).toMatchObject({
			sitekey: '0x4AAAAAAE-vz1m5zVUnCH2j',
			action: 'login',
			appearance: 'interaction-only',
			execution: 'execute'
		});
		expect(execute).not.toHaveBeenCalled();

		const token = result.component.verify();
		expect(execute).toHaveBeenCalledWith('widget-1');
		capturedOptions?.callback('verified-token');
		await expect(token).resolves.toBe('verified-token');

		result.unmount();
		expect(remove).toHaveBeenCalledWith('widget-1');
		delete window.turnstile;
	});
});
