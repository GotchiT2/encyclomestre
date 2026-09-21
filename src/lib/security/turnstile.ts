export const TURNSTILE_SITE_KEY = '0x4AAAAAAE-vz1m5zVUnCH2j';
export const TURNSTILE_TOKEN_HEADER = 'X-Turnstile-Token';

export type TurnstileAction = 'login' | 'open';

export interface TurnstileRenderOptions {
	sitekey: string;
	action: TurnstileAction;
	appearance: 'interaction-only';
	execution: 'render';
	theme: 'dark';
	size: 'flexible';
	callback: (token: string) => void;
	'error-callback': (code: string) => void;
	'expired-callback': () => void;
	'timeout-callback': () => void;
}

export interface TurnstileApi {
	render(container: HTMLElement, options: TurnstileRenderOptions): string;
	reset(widgetId: string): void;
	remove(widgetId: string): void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

const scriptId = 'wikiforge-turnstile-script';
let loader: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
	if (typeof window === 'undefined')
		return Promise.reject(new Error('Turnstile requires a browser.'));
	if (window.turnstile) return Promise.resolve(window.turnstile);
	if (loader) return loader;

	loader = new Promise((resolve, reject) => {
		const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
		const script = existing ?? document.createElement('script');
		const ready = () =>
			window.turnstile
				? resolve(window.turnstile)
				: reject(new Error('Turnstile did not initialize.'));
		script.addEventListener('load', ready, { once: true });
		script.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), {
			once: true
		});
		if (!existing) {
			script.id = scriptId;
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			document.head.append(script);
		}
	});

	return loader.catch((error) => {
		loader = null;
		throw error;
	});
}
