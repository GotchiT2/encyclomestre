<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { getWikiForgeBoosterStatus, openWikiForgeBooster } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import type { WikiForgeCard } from '$lib/api/wikiforge';
	let inventory = $state<{
		availableBoosters: number;
		maxBoosters?: number;
		nextBoosterAvailableAt: string | null;
	} | null>(null);
	let result = $state<WikiForgeCard[] | null>(null);
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
		result = (await openWikiForgeBooster()).cards;
		inventory = await getWikiForgeBoosterStatus();
		opening = false;
	}
</script>

<section class="flex flex-col gap-6">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('boosters.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('boosters.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('boosters.description')}</p>
	</header>
	{#if inventory}<div class="border-4 border-double border-primary/30 bg-card p-5 text-center">
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('boosters.reserve')}
			</p>
			<p class="mt-2 font-serif text-5xl font-black">
				{inventory.availableBoosters} / {inventory.maxBoosters ?? 1}
			</p>
			{#if inventory.nextBoosterAvailableAt}<p
					class="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary"
				>
					Prochain booster dans {nextDelayLabel}
				</p>{/if}
			<Button class="mt-5" disabled={!inventory.availableBoosters || opening} onclick={open}
				>{opening ? $_('boosters.opening') : $_('boosters.open')}</Button
			>
		</div>{/if}{#if result}<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
			{#each result as card (card.id)}<article class="border border-primary/30 p-2">
					<img
						src={card.imageUrl || '/card-placeholder.svg'}
						alt={card.wikipediaTitle}
						class="aspect-[4/3] w-full object-cover"
					/>
					<p class="mt-2 font-serif font-black uppercase">{card.wikipediaTitle}</p>
					<p class="font-mono text-[10px] text-primary">{card.rarity}</p>
				</article>{/each}
		</div>{/if}
</section>
