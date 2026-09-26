<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { PackCatalogueItem } from '$lib/types';
	import BoosterPackArt from './booster-pack-art.svelte';
	import { packDescriptionKey, packNameKey } from './pack-labels';

	let {
		packs,
		onDetails,
		onOpen
	}: {
		packs: PackCatalogueItem[];
		onDetails: (pack: PackCatalogueItem) => void;
		onOpen: (pack: PackCatalogueItem) => void;
	} = $props();

	const sections = ['open', 'upcoming', 'past'] as const;
	const sectionFor = (pack: PackCatalogueItem) =>
		pack.status === 'OPEN' ? 'open' : pack.status === 'UPCOMING' ? 'upcoming' : 'past';
	const name = (pack: PackCatalogueItem) => {
		const key = packNameKey(pack.name);
		return key ? $_(key) : pack.name;
	};
	const description = (pack: PackCatalogueItem) => {
		const key = packDescriptionKey(pack.description);
		return key ? $_(key) : pack.description;
	};
	const canOpen = (pack: PackCatalogueItem) =>
		pack.status === 'OPEN' && Boolean(pack.credit?.available);
</script>

{#each sections as section (section)}
	{@const entries = packs.filter((pack) => sectionFor(pack) === section)}
	{#if entries.length}
		<section class="space-y-4" data-pack-section={section}>
			<div class="flex items-end justify-between gap-4 border-b border-border pb-3">
				<div>
					<p class="forge-label">{$_(`boosters.catalogue.${section}_eyebrow`)}</p>
					<h2 class="mt-1 font-serif text-2xl">{$_(`boosters.catalogue.${section}`)}</h2>
				</div>
				<p class="text-sm text-muted-foreground">{entries.length}</p>
			</div>
			<div class="pack-grid">
				{#each entries as pack (pack.id)}
					<article
						class="forge-panel grid min-h-full grid-cols-[6.5rem_minmax(0,1fr)] gap-4 p-4 max-[420px]:grid-cols-1"
					>
						<div class="mx-auto w-full max-w-36">
							<BoosterPackArt
								name={name(pack)}
								renderKey={pack.renderKey ?? 'standard'}
								cardCount={pack.nbCards}
								imageUrl={pack.imageUrl}
							/>
						</div>
						<div class="flex min-w-0 flex-col">
							<p class="forge-label">{$_(`boosters.family.${pack.family}`)}</p>
							<h3 class="mt-2 font-serif text-2xl">{name(pack)}</h3>
							<p class="mt-2 grow text-sm text-muted-foreground">{description(pack)}</p>
							{#if pack.credit}
								<p class="mt-4 text-sm font-semibold text-primary">
									{$_('boosters.credits', {
										values: { available: pack.credit.regularAvailable, max: pack.credit.max }
									})}
								</p>
								{#if pack.credit.bonus > 0}<p class="mt-1 text-xs text-energy">
										{$_('boosters.bonus_credits', { values: { count: pack.credit.bonus } })}
									</p>{/if}
							{:else if pack.status === 'OPEN'}
								<p class="mt-4 text-sm text-muted-foreground">{$_('boosters.no_credit')}</p>
							{/if}
							<div class="mt-4 flex flex-wrap gap-2">
								<Button variant="outline" size="sm" onclick={() => onDetails(pack)}
									>{$_('boosters.view_contents')}</Button
								>
								{#if pack.status === 'OPEN'}<Button
										size="sm"
										disabled={!canOpen(pack)}
										onclick={() => onOpen(pack)}>{$_('boosters.open')}</Button
									>{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
{/each}

<style>
	.pack-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
		gap: 1rem;
	}
</style>
