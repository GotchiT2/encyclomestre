import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TurnstileWidget from './turnstile-widget.svelte';
import type { TurnstileRenderOptions } from '$lib/security/turnstile';

function setupTurnstile() {
	let options: TurnstileRenderOptions | undefined;
	const execute = vi.fn();
	const reset = vi.fn();
	const remove = vi.fn();
	const renderWidget = vi.fn((_container: HTMLElement, renderOptions: TurnstileRenderOptions) => {
		options = renderOptions;
		return 'widget-1';
	});
	window.turnstile = { render: renderWidget, execute, reset, remove };

	return {
		execute,
		reset,
		remove,
		renderWidget,
		options: () => options
	};
}

afterEach(() => {
	delete window.turnstile;
});

describe('TurnstileWidget', () => {
	it('waits for an explicit verification before executing an interaction-only challenge', async () => {
		const turnstile = setupTurnstile();
		const result = render(TurnstileWidget, { action: 'login' });

		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);
		expect(turnstile.renderWidget.mock.calls[0][1]).toMatchObject({
			sitekey: '0x4AAAAAAE-vz1m5zVUnCH2j',
			action: 'login',
			appearance: 'interaction-only',
			execution: 'execute',
			retry: 'auto',
			'refresh-timeout': 'auto'
		});
		expect(turnstile.execute).not.toHaveBeenCalled();

		const token = result.component.verify();
		expect(turnstile.execute).toHaveBeenCalledOnce();
		expect(turnstile.execute).toHaveBeenCalledWith('widget-1');
		turnstile.options()?.callback('verified-token');
		await expect(token).resolves.toBe('verified-token');

		result.unmount();
		expect(turnstile.remove).toHaveBeenCalledWith('widget-1');
	});

	it('shares one execution between concurrent verification requests', async () => {
		const turnstile = setupTurnstile();
		const result = render(TurnstileWidget, { action: 'open' });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const first = result.component.verify();
		const second = result.component.verify();
		expect(turnstile.execute).toHaveBeenCalledOnce();

		turnstile.options()?.callback('shared-token');
		await expect(Promise.all([first, second])).resolves.toEqual(['shared-token', 'shared-token']);
		result.unmount();
	});

	it('requests a fresh token only after reset', async () => {
		const turnstile = setupTurnstile();
		const result = render(TurnstileWidget, { action: 'open' });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const first = result.component.verify();
		turnstile.options()?.callback('first-token');
		await expect(first).resolves.toBe('first-token');
		await expect(result.component.verify()).resolves.toBe('first-token');
		expect(turnstile.execute).toHaveBeenCalledOnce();

		result.component.reset();
		expect(turnstile.reset).toHaveBeenCalledWith('widget-1');
		expect(turnstile.execute).toHaveBeenCalledOnce();

		const second = result.component.verify();
		expect(turnstile.execute).toHaveBeenCalledTimes(2);
		turnstile.options()?.callback('second-token');
		await expect(second).resolves.toBe('second-token');
		result.unmount();
	});

	it('restarts a pending verification when its token expires', async () => {
		const turnstile = setupTurnstile();
		const result = render(TurnstileWidget, { action: 'open' });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const token = result.component.verify();
		turnstile.options()?.['expired-callback']();
		expect(turnstile.execute).toHaveBeenCalledTimes(2);

		turnstile.options()?.callback('renewed-token');
		await expect(token).resolves.toBe('renewed-token');
		result.unmount();
	});

	it('keeps a verification pending while Turnstile recovers from a transient error', async () => {
		const turnstile = setupTurnstile();
		const onError = vi.fn();
		const result = render(TurnstileWidget, { action: 'open', onError });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const token = result.component.verify();
		let settled = false;
		void token.finally(() => (settled = true));
		expect(turnstile.options()?.['error-callback']('200500')).toBe(false);
		await Promise.resolve();
		expect(settled).toBe(false);
		expect(onError).not.toHaveBeenCalled();

		turnstile.options()?.callback('recovered-token');
		await expect(token).resolves.toBe('recovered-token');
		result.unmount();
	});

	it('keeps a verification pending while Turnstile refreshes a timed-out puzzle', async () => {
		const turnstile = setupTurnstile();
		const onError = vi.fn();
		const result = render(TurnstileWidget, { action: 'open', onError });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const token = result.component.verify();
		let settled = false;
		void token.finally(() => (settled = true));
		turnstile.options()?.['timeout-callback']();
		await Promise.resolve();
		expect(settled).toBe(false);
		expect(onError).not.toHaveBeenCalled();

		turnstile.options()?.callback('refreshed-token');
		await expect(token).resolves.toBe('refreshed-token');
		result.unmount();
	});

	it('fails immediately for a non-retryable configuration error', async () => {
		const turnstile = setupTurnstile();
		const onError = vi.fn();
		const result = render(TurnstileWidget, { action: 'open', onError });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const token = result.component.verify();
		expect(turnstile.options()?.['error-callback']('110200')).toBe(true);
		await expect(token).rejects.toThrow('Turnstile verification failed.');
		expect(onError).toHaveBeenCalledOnce();
		result.unmount();
	});

	it('fails after three transient errors and allows a reset retry', async () => {
		const turnstile = setupTurnstile();
		const onError = vi.fn();
		const result = render(TurnstileWidget, { action: 'open', onError });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const token = result.component.verify();
		expect(turnstile.options()?.['error-callback']('200500')).toBe(false);
		expect(turnstile.options()?.['error-callback']('200500')).toBe(false);
		expect(turnstile.options()?.['error-callback']('200500')).toBe(true);
		await expect(token).rejects.toThrow('Turnstile verification failed.');
		expect(onError).toHaveBeenCalledOnce();

		result.component.reset();
		const retry = result.component.verify();
		expect(turnstile.execute).toHaveBeenCalledTimes(2);
		turnstile.options()?.callback('retry-token');
		await expect(retry).resolves.toBe('retry-token');
		result.unmount();
	});

	it('rejects pending verification without reporting an error when removed', async () => {
		const turnstile = setupTurnstile();
		const onError = vi.fn();
		const result = render(TurnstileWidget, { action: 'open', onError });
		await expect.poll(() => turnstile.renderWidget.mock.calls.length).toBe(1);

		const rejection = expect(result.component.verify()).rejects.toThrow(
			'Turnstile widget was removed.'
		);
		result.unmount();

		await rejection;
		expect(turnstile.remove).toHaveBeenCalledWith('widget-1');
		expect(onError).not.toHaveBeenCalled();
	});
});
