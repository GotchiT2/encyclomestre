<script lang="ts">
	import CardHero from './card-hero.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';

	let { card }: { card: CardRecord } = $props();
</script>

<section class="flex flex-col gap-5" data-testid="public-card-detail">
	<div>
		<Button href="/cards" variant="outline" size="sm">{$_('codex.back')}</Button>
	</div>
	<div
		class="grid gap-6 border-2 border-double border-primary/35 bg-card p-4 sm:p-6 lg:grid-cols-[minmax(17rem,0.42fr)_minmax(0,1fr)] lg:gap-8"
	>
		<div class="mx-auto w-full max-w-sm self-start">
			<CardHero {card} />
		</div>
		<div class="flex min-w-0 flex-col gap-5">
			<header class="forge-divider pb-5">
				<p class="forge-label" style={`color:${card.rarityColor}`}>
					{card.rarityInitials} · {card.rarity}
				</p>
				<h1 class="mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
					{card.title}
				</h1>
				{#if card.longDescription}
					<p class="mt-3 max-w-3xl font-serif italic leading-relaxed text-muted-foreground">
						{card.longDescription}
					</p>
				{/if}
			</header>
			<CardTelemetry {card} />
			<Button href={card.wikipediaUrl} target="_blank" class="w-fit">
				{$_('codex.wikipedia')}
			</Button>
		</div>
	</div>
</section>
