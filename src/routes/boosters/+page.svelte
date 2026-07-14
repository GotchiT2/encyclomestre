<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { getWikiForgeBoosterStatus, openWikiForgeBooster, toCardRecord } from '$lib/api';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord } from '$lib/types';

	let inventory = $state<{
		availableBoosters: number;
		maxBoosters?: number;
		nextBoosterAvailableAt: string | null;
	} | null>(null);
	let result = $state<CardRecord[] | null>(null);
	let opening = $state(false);
	let now = $state(Date.now());
	const nextDelay = $derived(
		inventory?.nextBoosterAvailableAt
			? Math.max(0, new Date(inventory.nextBoosterAvailableAt).getTime() - now)
			: 0
	);
	const nextDelayLabel = $derived(
		`${String(Math.floor(nextDelay / 3_600_000)).padStart(2, '0')}:${String(Math.floor((nextDelay % 3_600_000) / 60_000)).padStart(2, '0')}:${String(Math.floor((nextDelay % 60_000) / 1000)).padStart(2, '0')}`
	);

	onMount(() => {
		const timer = window.setInterval(() => (now = Date.now()), 1_000);
		void getWikiForgeBoosterStatus().then((status) => (inventory = status));
		return () => window.clearInterval(timer);
	});

	async function open() {
		if (!inventory?.availableBoosters || opening) return;
		opening = true;
		try {
			result = (await openWikiForgeBooster()).cards.map(toCardRecord);
			inventory = await getWikiForgeBoosterStatus();
		} finally {
			opening = false;
		}
	}
</script>

<section class="flex flex-col gap-8">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('boosters.eyebrow')}
		</p>
		<h1 class="wikiforge-title mt-3 text-4xl text-foreground sm:text-5xl">
			{$_('boosters.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('boosters.description')}</p>
	</header>

	{#if inventory}
		<div
			class="grid items-center gap-6 border-4 border-double border-primary/40 bg-card p-5 sm:grid-cols-[minmax(0,1fr)_13rem] sm:p-7"
		>
			<div>
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('boosters.reserve')}
				</p>
				<p class="mt-2 font-heading text-5xl tracking-wide text-foreground">
					{inventory.availableBoosters} / {inventory.maxBoosters ?? 1}
				</p>
				{#if inventory.nextBoosterAvailableAt}
					<p class="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary">
						{$_('boosters.next_available', { values: { delay: nextDelayLabel } })}
					</p>
				{/if}
			</div>
			<Button
				class="h-auto w-full border-0 bg-transparent p-0 hover:bg-transparent"
				disabled={!inventory.availableBoosters || opening}
				onclick={open}
				aria-label={opening ? $_('boosters.opening') : $_('boosters.open')}
			>
				<img
					src="/images/booster.png"
					alt=""
					class:animate-pulse={opening}
					class="w-full drop-shadow-[0_0_1.4rem_rgb(253_121_12_/_35%)]"
				/>
			</Button>
		</div>
	{/if}

	{#if result}
		<section class="flex flex-col gap-4" aria-live="polite">
			<div
				class="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary/25 pb-3"
			>
				<h2 class="wikiforge-title text-2xl text-foreground">{$_('boosters.revealed_title')}</h2>
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('boosters.revealed_count', { values: { count: result.length } })}
				</p>
			</div>
			<div class="wikiforge-card-grid">
				{#each result as card (card.id)}
					<CardTile {card} showFriendOwners={false} />
				{/each}
			</div>
		</section>
	{/if}
</section>
