<script lang="ts">
	import { _ } from '$lib/i18n';
	import {
		flamePath,
		flameViewBox,
		compactFlamePath,
		wordmarkPath,
		wordmarkViewBox
	} from './artwork.js';
	let {
		kind = 'signature',
		monochrome = false,
		compact = false,
		decorative = true,
		class: className = ''
	}: {
		kind?: 'signature' | 'symbol' | 'wordmark';
		monochrome?: boolean;
		compact?: boolean;
		decorative?: boolean;
		class?: string;
	} = $props();
</script>

<span
	class={`wikiforge-brand ${className}`}
	data-brand="wikiforge"
	data-brand-kind={kind}
	aria-hidden={decorative ? 'true' : undefined}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : $_('navigation.brand')}
>
	{#if kind !== 'wordmark'}
		<svg
			class="brand-flame"
			viewBox={compact ? '0 0 16 16' : flameViewBox}
			fill={monochrome ? 'currentColor' : 'var(--primary, #E8EF42)'}
			aria-hidden="true"
		>
			<path d={compact ? compactFlamePath : flamePath} />
		</svg>
	{/if}
	{#if kind !== 'symbol'}
		<svg class="brand-wordmark" viewBox={wordmarkViewBox} fill="currentColor" aria-hidden="true"
			><path d={wordmarkPath} /></svg
		>
	{/if}
</span>

<style>
	.wikiforge-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		line-height: 1;
		flex: none;
		max-width: 100%;
	}
	.brand-flame {
		display: block;
		height: 1.2em;
		width: auto;
		flex: none;
	}
	.brand-wordmark {
		display: block;
		height: 1em;
		width: auto;
		min-width: 0;
		max-width: 100%;
	}
	[data-brand-kind='symbol'] {
		position: relative;
		display: block;
		height: 100%;
		width: 100%;
		justify-content: center;
	}
	[data-brand-kind='symbol'] .brand-flame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
</style>
