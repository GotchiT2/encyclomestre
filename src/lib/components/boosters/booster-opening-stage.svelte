<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import ForgePanel from '$lib/components/layout/forge-panel.svelte';
	import HudStat from '$lib/components/layout/hud-stat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { CardRecord } from '$lib/types';

	let {
		available,
		maximum,
		nextDelay,
		opening,
		cards,
		onOpen,
		onReset
	}: {
		available: number;
		maximum: number;
		nextDelay?: string;
		opening: boolean;
		cards: CardRecord[] | null;
		onOpen: () => void;
		onReset: () => void;
	} = $props();

	let currentIndex = $derived(cards?.length ? 0 : 0);
	const currentCard = $derived(cards?.[currentIndex]);
	const complete = $derived(Boolean(cards?.length && currentIndex === cards.length - 1));
</script>

<ForgePanel class="relative min-h-[34rem] overflow-hidden p-5 sm:p-8">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgb(25_167_170_/_20%),transparent_24rem),conic-gradient(from_45deg_at_50%_50%,transparent_0_12%,rgb(254_184_35_/_7%)_12.5%_13%,transparent_13.5%_37%)]"
	></div>
	<div class="relative flex flex-wrap items-start justify-between gap-3">
		<HudStat label={$_('boosters.reserve')} value={`${available} / ${maximum}`} accent />
		{#if nextDelay}<HudStat label={$_('boosters.nextCharge')} value={nextDelay} />{/if}
	</div>

	{#if !cards}
		<div
			class="relative z-10 mx-auto flex max-w-xl flex-col items-center py-6 text-center sm:py-10"
		>
			<p class="forge-label">{opening ? $_('boosters.opening') : $_('boosters.chamberReady')}</p>
			<h2 class="mt-3 font-serif text-3xl font-bold sm:text-4xl">{$_('boosters.stageTitle')}</h2>
			<button
				class="forge-energy-orbit mt-4 flex w-56 cursor-pointer flex-col items-center border-0 bg-transparent p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 sm:w-72"
				disabled={!available || opening}
				onclick={onOpen}
				aria-label={opening ? $_('boosters.opening') : $_('boosters.open')}
			>
				<img
					src="/images/booster.png"
					alt=""
					class="w-full drop-shadow-[0_0_2rem_rgb(253_121_12_/_38%)]"
					class:forge-booster-idle={!opening}
					class:animate-pulse={opening}
				/>
				<span
					class="mt-3 border border-accent bg-gradient-to-b from-primary to-accent px-6 py-3 text-[11px] font-bold tracking-[0.12em] text-primary-foreground uppercase"
					>{opening ? $_('boosters.opening') : $_('boosters.open')}</span
				>
			</button>
			{#if !available}<p class="mt-4 text-sm text-muted-foreground">
					{$_('boosters.emptyReserve')}
				</p>{/if}
		</div>
	{:else if currentCard}
		<div class="relative z-10 mx-auto flex max-w-3xl flex-col items-center py-4 text-center">
			<p class="forge-label">
				{$_('boosters.reveal_progress', {
					values: { current: currentIndex + 1, total: cards.length }
				})}
			</p>
			<div class="mt-4" class:booster-legendary={currentCard.rarity === 'Légendaire'}>
				<CardTile card={currentCard} showFriendOwners={false} onOpen={() => undefined} />
			</div>
			<div class="mt-5 flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="icon"
					disabled={currentIndex === 0}
					onclick={() => (currentIndex -= 1)}
					aria-label={$_('boosters.previous')}><ChevronLeftIcon /></Button
				>
				<div class="flex gap-1" aria-hidden="true">
					{#each cards as revealedCard, index (revealedCard.id)}<span
							class="h-1.5 w-7"
							class:bg-primary={index <= currentIndex}
							class:bg-secondary={index > currentIndex}
						></span>{/each}
				</div>
				{#if !complete}
					<Button size="lg" onclick={() => (currentIndex += 1)}
						>{$_('boosters.next')}<ChevronRightIcon /></Button
					>
				{:else}
					<Button variant="outline" onclick={onReset}>{$_('boosters.close')}</Button>
					{#if available}<Button onclick={onOpen}>{$_('boosters.open_next')}</Button>{/if}
				{/if}
			</div>
		</div>
	{/if}
</ForgePanel>
