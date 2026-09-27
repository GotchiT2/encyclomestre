<script lang="ts">
	import { _ } from '$lib/i18n';
	import { cardNumberLabel, type CardRecord } from '$lib/types';
	let { card, publicView = false }: { card: CardRecord; publicView?: boolean } = $props();
	const facts = $derived([
		{ label: $_('collection.variants'), value: card.variant.name },
		{ label: $_('auctionHub.attack'), value: card.attack },
		...(!publicView ? [{ label: $_('codex.owned'), value: card.ownedCount }] : []),
		...(card.packId == null ? [] : [{ label: $_('auctionHub.pack'), value: `#${card.packId}` }]),
		...(cardNumberLabel(card)
			? [{ label: $_('auctionHub.number'), value: cardNumberLabel(card) }]
			: []),
		...(card.maxCopies != null ? [{ label: $_('auctionHub.copies'), value: card.maxCopies }] : [])
	]);
</script>

<dl
	class="grid grid-cols-2 divide-x divide-y divide-primary/10 border border-primary/20 sm:grid-cols-4"
>
	{#each facts as fact (fact.label)}
		<div class="p-2">
			<dt class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{fact.label}
			</dt>
			<dd class="font-mono text-base text-primary">{fact.value}</dd>
		</div>
	{/each}
</dl>
{#if card.acquiredAt}<p class="text-xs text-muted-foreground">
		{$_('completion.acquired', {
			values: { date: new Date(card.acquiredAt).toLocaleString('fr-FR') }
		})}
	</p>{/if}
{#if card.createdAt}<p class="text-xs text-muted-foreground">
		{$_('completion.created', {
			values: { date: new Date(card.createdAt).toLocaleString('fr-FR') }
		})}
	</p>{/if}
