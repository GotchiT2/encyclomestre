<script lang="ts">
	import { _ } from '$lib/i18n';
	import { openCardDetail } from '$lib/components/cards/detail-state';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	let poolPage = $state(0);
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import type { ResolvedPackDefinition, ResolvedPackVariant } from '$lib/api/boosters';
	import type { CardRecord, PackPageSummary } from '$lib/types';
	import { filterPackPool } from './pack-pool-search';

	let { details }: { details: ResolvedPackDefinition } = $props();

	type PoolCard = { page: PackPageSummary; entry: ResolvedPackVariant };
	const pool = $derived(
		details.drawGroups.flatMap((group) =>
			group.variants.flatMap((entry) => (entry.pages ?? []).map((page) => ({ page, entry })))
		)
	);
	let query = $state('');
	let selected = $state<PoolCard | null>(null);
	let focused = $state(false);
	const filtered = $derived(filterPackPool(pool, query, ({ page }) => page.title));
	const matches = $derived(filtered.slice(poolPage * 48, (poolPage + 1) * 48));
	const percentage = (rate: number) =>
		new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 }).format(rate);

	function previewCard(entry: ResolvedPackVariant, page?: PackPageSummary): CardRecord {
		return {
			id: `pack-preview-${entry.variantId}-${page?.id ?? 'generic'}`,
			baseCardId: page?.id,
			variantId: entry.variantId,
			variant: entry.variant,
			title: page?.title ?? entry.variant.name,
			shortDescription: '',
			longDescription: '',
			imageUrl: page?.image?.trim() || '/card-placeholder.svg',
			wikipediaUrl: '',
			attack: 0,
			defense: 0,
			ownedCount: 0,
			globalSupply: 0,
			friendsWhoOwn: [],
			maxCopies: page?.maxCopies ?? entry.maxCopies
		};
	}

	function choose(item: PoolCard) {
		selected = item;
		query = item.page.title;
		focused = false;
	}
</script>

{#if pool.length}
	<section class="forge-panel-flat relative p-4 sm:p-5">
		<label class="forge-label" for="pack-card-search">{$_('boosters.detail.search_card')}</label>
		<p class="mt-1 text-sm text-muted-foreground">{$_('boosters.detail.search_card_hint')}</p>
		<div class="relative mt-3">
			<input
				id="pack-card-search"
				type="search"
				bind:value={query}
				oninput={() => (poolPage = 0)}
				class="h-11 w-full border border-primary/35 bg-background px-3"
				placeholder={$_('boosters.detail.search_card_placeholder')}
				role="combobox"
				aria-expanded={matches.length > 0}
				aria-controls="pack-card-suggestions"
				onfocus={() => (focused = true)}
				onkeydown={(event) => {
					if (event.key === 'Enter' && matches[0]) {
						event.preventDefault();
						choose(matches[0]);
					}
				}}
			/>
			{#if matches.length}
				<ul
					id="pack-card-suggestions"
					class="relative mt-1 max-h-72 w-full overflow-y-auto border border-primary/40 bg-card shadow-2xl"
					role="listbox"
				>
					{#each matches as item (`${item.entry.variantId}-${item.page.id}`)}
						<li>
							<button
								type="button"
								class="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-primary/10 px-3 py-2 text-left last:border-0 hover:bg-primary/10 focus-visible:bg-primary/10"
								role="option"
								aria-selected={selected?.page.id === item.page.id &&
									selected.entry.variantId === item.entry.variantId}
								onclick={() => choose(item)}
							>
								<div class="size-10 overflow-hidden bg-background">
									{#if item.page.image}<img
											src={item.page.image}
											alt=""
											class="size-full object-cover"
										/>{/if}
								</div>
								<span class="min-w-0"
									><strong class="block truncate">{item.page.title}</strong><small
										style={`color:${item.entry.variant.color}`}>{item.entry.variant.name}</small
									></span
								>
								<span class="text-xs text-muted-foreground"
									>{item.page.remainingCopies ?? '—'} / {item.page.maxCopies ??
										item.entry.maxCopies ??
										'—'}</span
								>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if query.trim() && !matches.length && focused}<p class="mt-3 text-sm text-muted-foreground">
				{$_('boosters.detail.search_no_result')}
			</p>{/if}

		<div class="mt-3 flex justify-between gap-2">
			<Button variant="outline" disabled={!poolPage} onclick={() => poolPage--}
				>{$_('completion.previous')}</Button
			><Button
				variant="outline"
				disabled={(poolPage + 1) * 48 >= filtered.length}
				onclick={() => poolPage++}>{$_('completion.next')}</Button
			>
		</div>
		{#if selected}
			<div
				class="mt-5 grid gap-5 border-t border-primary/20 pt-5 sm:grid-cols-[9rem_1fr] sm:items-center"
			>
				<div class="mx-auto w-36">
					<CardTile card={previewCard(selected.entry, selected.page)} showCollectionState={false} />
				</div>
				<div>
					<p class="forge-label" style={`color:${selected.entry.variant.color}`}>
						{selected.entry.variant.name}
					</p>
					<h3 class="mt-1 font-serif text-2xl">
						<button
							class="underline"
							onclick={() => selected && openCardDetail(previewCard(selected.entry, selected.page))}
							>{selected.page.title}</button
						>
					</h3>
					<p class="mt-3 text-sm font-semibold">
						{$_('boosters.detail.page_stock', {
							values: {
								remaining: selected.page.remainingCopies ?? '—',
								max: selected.page.maxCopies ?? selected.entry.maxCopies ?? '—'
							}
						})}
					</p>
				</div>
			</div>
		{/if}
	</section>
{/if}

<div class="space-y-8" class:mt-8={pool.length > 0}>
	{#each details.drawGroups as group, index (index)}
		<section>
			<div class="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
				<div>
					<p class="forge-label">
						{$_('boosters.detail.draw_group', { values: { number: index + 1 } })}
					</p>
					<h3 class="mt-1 font-serif text-xl">
						{$_('boosters.detail.group_cards', { values: { count: group.count } })}
					</h3>
				</div>
			</div>
			<div
				class="mb-4 flex flex-wrap gap-2"
				aria-label={$_('ux.draws', { values: { count: group.count } })}
			>
				{#each Array.from({ length: Math.max(0, Math.min(50, group.count)) }, (_, index) => index + 1) as slot (slot)}<div
						class="flex h-16 w-11 items-center justify-center border border-primary/40 bg-card text-primary"
						aria-hidden="true"
					>
						{slot + 1}
					</div>{/each}
			</div>
			<p class="mb-3 text-xs text-muted-foreground">{$_('ux.chance')}</p>
			<div class="grid gap-4 lg:grid-cols-2">
				{#each group.variants as entry (entry.variantId)}
					{@const example =
						entry.pages?.find((page) => (page.remainingCopies ?? 1) > 0) ?? entry.pages?.[0]}
					<article
						class="grid gap-4 border border-border bg-card/35 p-4 sm:grid-cols-[7rem_1fr]"
						style={`--variant-color:${entry.variant.color}`}
					>
						<div class="mx-auto w-28"><VariantCardFace card={previewCard(entry, example)} /></div>
						<div class="min-w-0">
							<p class="font-semibold" style="color:var(--variant-color)">{entry.variant.name}</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{$_('boosters.detail.drop_rate', { values: { rate: percentage(entry.dropRate) } })}
							</p>
							{#if entry.remainingCopies != null}
								<p class="mt-3 text-sm font-semibold">
									{$_('boosters.detail.global_stock', { values: { count: entry.remainingCopies } })}
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									{$_('boosters.detail.per_subject_run', {
										values: { count: entry.maxCopies ?? 0 }
									})}
								</p>
							{:else}
								<p class="mt-3 text-xs text-muted-foreground">
									{$_('boosters.detail.global_pool')}
								</p>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>
