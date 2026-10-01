<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		loadTurnstile,
		TURNSTILE_SITE_KEY,
		type TurnstileAction,
		type TurnstileApi
	} from '$lib/security/turnstile';

	let {
		action,
		mock = false,
		onError = () => undefined
	}: { action: TurnstileAction; mock?: boolean; onError?: () => void } = $props();

	let container: HTMLDivElement;
	let api: TurnstileApi | null = null;
	let widgetId: string | null = null;
	let token: string | null = null;
	let executing = false;
	let errorCount = 0;
	let pending: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];
	const fatalErrorCodes = new Set(['110100', '110110', '110200', '400020', '400070']);
	const maxRetryableErrors = 3;

	function execute() {
		if (!api || !widgetId || executing || token || pending.length === 0) return;
		executing = true;
		api.execute(widgetId);
	}

	function resolvePending(nextToken: string) {
		const requests = pending;
		pending = [];
		for (const request of requests) request.resolve(nextToken);
	}

	function rejectPending(message: string, notify = true) {
		executing = false;
		const error = new Error(message);
		const requests = pending;
		pending = [];
		for (const request of requests) request.reject(error);
		if (notify) onError();
	}

	export function verify(): Promise<string> {
		if (mock) return Promise.resolve('mock-turnstile-token');
		if (token) return Promise.resolve(token);
		return new Promise((resolve, reject) => {
			pending.push({ resolve, reject });
			execute();
		});
	}

	export function reset() {
		token = null;
		executing = false;
		errorCount = 0;
		if (api && widgetId) api.reset(widgetId);
	}

	function handleError(code: string) {
		errorCount += 1;
		if (fatalErrorCodes.has(code) || errorCount >= maxRetryableErrors) {
			rejectPending('Turnstile verification failed.');
			return true;
		}
		return false;
	}

	onMount(() => {
		if (mock) return;
		let disposed = false;
		void loadTurnstile()
			.then((loadedApi) => {
				if (disposed) return;
				api = loadedApi;
				widgetId = api.render(container, {
					sitekey: TURNSTILE_SITE_KEY,
					action,
					appearance: 'interaction-only',
					execution: 'execute',
					theme: 'dark',
					size: 'flexible',
					retry: 'auto',
					'refresh-timeout': 'auto',
					callback: (nextToken) => {
						executing = false;
						errorCount = 0;
						token = nextToken;
						resolvePending(nextToken);
					},
					'error-callback': handleError,
					'expired-callback': () => {
						token = null;
						executing = false;
						execute();
					},
					'timeout-callback': () => undefined
				});
				execute();
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
