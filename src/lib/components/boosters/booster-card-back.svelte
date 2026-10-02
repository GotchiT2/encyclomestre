<script lang="ts">
	import { _ } from '$lib/i18n';
	import { boosterArtwork, type BoosterVisual } from './booster-visuals';
	let { visual = 'signal' }: { visual?: BoosterVisual } = $props();
	const id = $props.id();
	const artwork = $derived(
		boosterArtwork({ visual, back: true, brand: $_('navigation.brand'), id })
	);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- Generated vector markup; all dynamic text is XML-escaped in boosterArtwork. -->
<div class="booster-card-back" data-visual={visual} aria-hidden="true">{@html artwork}</div>

<style>
	.booster-card-back {
		position: absolute;
		inset: 0;
		border-radius: 5px;
		overflow: hidden;
		box-shadow:
			0 5px 12px #0008,
			inset 0 0 0 1px #efebd94a;
	}
	.booster-card-back :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
