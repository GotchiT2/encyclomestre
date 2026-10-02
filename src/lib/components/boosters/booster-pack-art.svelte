<script lang="ts">
	import { _ } from '$lib/i18n';
	import ArcadePack from '$lib/card-renderer/arcade-pack.svelte';
	let {
		name,
		renderKey,
		cardCount,
		imageUrl
	}: { name: string; renderKey: string; cardCount?: number; imageUrl?: string } = $props();
</script>

<ArcadePack
	{name}
	{renderKey}
	{cardCount}
	{imageUrl}
	labels={{ brand: $_('arcade.brand'), cards: $_('arcade.cardsLabel') }}
/>
