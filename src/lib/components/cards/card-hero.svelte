<script lang="ts">
	import VariantCardFace from './variant-card-face.svelte';
	import CardInformation from './card-information.svelte';
	import { cardNumberLabel, type CardRecord } from '$lib/types';
	let { card }: { card: CardRecord } = $props();
</script>

<section class="border border-primary/30 bg-background p-4" role="group" aria-label={card.title}>
	<VariantCardFace {card} />
	<p
		class="mt-3 font-mono text-[10px] uppercase tracking-widest"
		style={`color:${card.variant.color}`}
	>
		{card.variant.name}{cardNumberLabel(card) ? ` · ${cardNumberLabel(card)}` : ''}
	</p>
	<CardInformation {card} />
</section>
