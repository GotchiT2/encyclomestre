<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { BoosterOpenResult, CardRecord } from '$lib/types';

	let {
		result,
		canOpenNext,
		onOpenNext,
		onClose
	}: {
		result: BoosterOpenResult;
		canOpenNext: boolean;
		onOpenNext: () => void;
		onClose: () => void;
	} = $props();
	const rarityOrder: Record<string, number> = {
		Commune: 0,
		'Peu Commune': 1,
		Rare: 2,
		'Super-Rare': 3,
		'Ultra-Rare': 4,
		Légendaire: 5
	};
	const pulls = $derived(
		[...result.pulls].toSorted((a, b) => rarityOrder[a.card.rarity] - rarityOrder[b.card.rarity])
	);
	let revealed = $state(0);
	let current = $derived(pulls[revealed]);

	$effect(() => {
		result;
		revealed = 0;
	});

	function next() {
		if (revealed < pulls.length - 1) revealed += 1;
	}
	function previous() {
		if (revealed > 0) revealed -= 1;
	}
</script>

<section class="border-4 border-double border-primary/30 bg-card p-4 text-center">
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('boosters.reveal_progress', { values: { current: revealed + 1, total: pulls.length } })}
	</p>
	<div
		class="mx-auto mt-4 max-w-xs"
		class:booster-legendary={current?.card.rarity === 'Légendaire'}
	>
		{#if current}<CardTile card={current.card} showFriendOwners={false} />{/if}
	</div>
	{#if current}<p class="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary">
			{current.ownedBefore
				? $_('boosters.duplicate', { values: { count: current.ownedAfter } })
				: $_('boosters.new_copy')}
		</p>{/if}
	<div class="mt-4 flex flex-wrap justify-center gap-1">
		{#each pulls as pull, index (`${pull.card.id}-${index}`)}<Button
				size="icon-xs"
				variant={index === revealed ? 'default' : 'outline'}
				aria-label={$_('boosters.reveal_progress', {
					values: { current: index + 1, total: pulls.length }
				})}
				onclick={() => (revealed = index)}>{index + 1}</Button
			>{/each}
	</div>
	<div class="mt-5 flex flex-wrap justify-center gap-2">
		<Button variant="outline" disabled={revealed === 0} onclick={previous}
			>{$_('boosters.previous')}</Button
		>
		{#if revealed < pulls.length - 1}<Button onclick={next}>{$_('boosters.next')}</Button
			>{:else}<Button variant="outline" onclick={onClose}>{$_('boosters.close')}</Button
			>{#if canOpenNext}<Button onclick={onOpenNext}>{$_('boosters.open_next')}</Button>{/if}{/if}
	</div>
</section>
