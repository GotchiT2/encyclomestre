<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, CollectionTag } from '$lib/types';

	let { card, tags = [], onClose }: { card: CardRecord; tags?: CollectionTag[]; onClose: () => void } = $props();
</script>

<div class="fixed inset-0 z-50 bg-black/75 p-4" onclick={onClose}>
	<dialog open class="fixed top-1/2 left-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-screen-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-4 border-double border-primary/40 bg-card p-5 text-foreground" onclick={(event) => event.stopPropagation()}>
		<Button class="absolute top-4 right-4" size="sm" variant="outline" onclick={onClose}>{$_('cardDetail.close')}</Button>
		<section class="grid gap-6 lg:grid-cols-[minmax(15rem,.42fr)_minmax(0,1fr)]"><CardTile {card} {tags} showFriendOwners={false} /><div><h2 class="font-serif text-3xl font-black uppercase">{card.title}</h2><p class="mt-3 font-serif italic text-muted-foreground">{card.longDescription}</p><CardTelemetry {card} /></div></section>
	</dialog>
</div>
