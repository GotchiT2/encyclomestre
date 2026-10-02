<script lang="ts">
	import { _ } from '$lib/i18n';
	import { boosterArtwork, boosterVisual } from './booster-visuals';
	import type { PackFamily } from '$lib/types';
	let {
		name,
		renderKey,
		family,
		cardCount
	}: {
		name: string;
		renderKey?: string;
		family?: PackFamily;
		cardCount?: number;
	} = $props();
	const id = $props.id();
	const visual = $derived(boosterVisual(renderKey, family));
	const artwork = $derived(
		boosterArtwork({
			visual,
			name,
			count: cardCount,
			brand: $_('navigation.brand'),
			cardsLabel: $_('arcade.cardsLabel'),
			id
		})
	);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- Generated vector markup; all dynamic text is XML-escaped in boosterArtwork. -->
<div class="forge-booster-art" data-visual={visual} aria-hidden="true">{@html artwork}</div>

<style>
	.forge-booster-art {
		width: 100%;
		aspect-ratio: 512/736;
		overflow: hidden;
		border-radius: 3px;
		box-shadow:
			2px 2px 0 #737669,
			5px 5px 0 #080a08,
			10px 18px 20px #0005;
	}
	.forge-booster-art :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
