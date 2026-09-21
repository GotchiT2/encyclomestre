<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		loadTurnstile,
		TURNSTILE_SITE_KEY,
		type TurnstileAction,
		type TurnstileApi
	} from '$lib/security/turnstile';

	let { action, onError = () => undefined }: { action: TurnstileAction; onError?: () => void } =
		$props();

	let container: HTMLDivElement;
	let api: TurnstileApi | null = null;
	let widgetId: string | null = null;
	let token: string | null = null;
	let pending: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

	function resolvePending(nextToken: string) {
		const requests = pending;
		pending = [];
		for (const request of requests) request.resolve(nextToken);
	}

	function rejectPending(message: string, notify = true) {
		const error = new Error(message);
		const requests = pending;
		pending = [];
		for (const request of requests) request.reject(error);
		if (notify) onError();
	}

	export function verify(): Promise<string> {
		if (token) return Promise.resolve(token);
		return new Promise((resolve, reject) => pending.push({ resolve, reject }));
	}

	export function reset() {
		token = null;
		if (api && widgetId) api.reset(widgetId);
	}

	onMount(() => {
		let disposed = false;
		void loadTurnstile()
			.then((loadedApi) => {
				if (disposed) return;
				api = loadedApi;
				widgetId = api.render(container, {
					sitekey: TURNSTILE_SITE_KEY,
					action,
					appearance: 'interaction-only',
					execution: 'render',
					theme: 'dark',
					size: 'flexible',
					callback: (nextToken) => {
						token = nextToken;
						resolvePending(nextToken);
					},
					'error-callback': () => rejectPending('Turnstile verification failed.'),
					'expired-callback': () => (token = null),
					'timeout-callback': () => rejectPending('Turnstile verification timed out.')
				});
			})
			.catch(() => rejectPending('Turnstile failed to load.'));
		return () => {
			disposed = true;
		};
	});

	onDestroy(() => {
		if (api && widgetId) api.remove(widgetId);
		rejectPending('Turnstile widget was removed.', false);
	});
</script>

<div bind:this={container} class="min-h-0 w-full" data-turnstile-action={action}></div>
