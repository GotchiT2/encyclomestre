<script lang="ts">
	import { _ } from '$lib/i18n';
	import { resolve } from '$app/paths';
	import type { AuctionCard } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardTelemetry from '$lib/components/cards/card-telemetry.svelte';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	import { openCardDetail } from '$lib/components/cards/detail-state';
	let { card }: { card: AuctionCard } = $props();
</script>

<section class="space-y-4" aria-label={$_('auctionHub.cardDetails')}>
	<div class="mx-auto w-full max-w-80">
		<CardTile
			inspection
			{card}
			showCollectionState={false}
			showFriendOwners={false}
			onOpen={() => openCardDetail(card)}
		/>
	</div>
	<Button variant="outline" class="w-full" onclick={() => openCardDetail(card)}
		>{$_('auctionHub.cardDetails')}</Button
	>
	<p class="text-sm leading-relaxed text-muted-foreground">
		{card.longDescription || card.shortDescription}
	</p>
	<CardTelemetry {card} publicView />
	<div class="flex flex-wrap gap-2">
		{#if card.wikipediaUrl}<Button
				variant="outline"
				href={card.wikipediaUrl}
				target="_blank"
				rel="noopener noreferrer">{$_('auctionHub.article')}</Button
			>{/if}
		{#if card.packId}<Button
				variant="outline"
				href={resolve('/packs/[id]', { id: String(card.packId) })}
				>{$_('auctionHub.packCatalogue')}</Button
			>{/if}
		{#if card.pageId}<Button variant="outline" onclick={() => openCardDetail(card)}
				>{$_('completion.article')}</Button
			><ReportDialog pageId={card.pageId} title={card.title} />{/if}
	</div>
</section>
