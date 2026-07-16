<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		getWikiForgeBoosterStatus,
		openWikiForgeBooster,
		toCollectionCardRecord
	} from '$lib/api';
	import BoosterOpeningStage from '$lib/components/boosters/booster-opening-stage.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import type { CardRecord } from '$lib/types';

	let inventory = $state<{
		availableBoosters: number;
		maxBoosters?: number;
		nextBoosterAvailableAt: string | null;
	} | null>(null);
	let result = $state<CardRecord[] | null>(null);
	let opening = $state(false);
	let openingError = $state(false);
	let openingId = $state(0);
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
		result = null;
		openingError = false;
		try {
			result = (await openWikiForgeBooster()).cards.map(toCollectionCardRecord);
			openingId += 1;
			try {
				inventory = await getWikiForgeBoosterStatus();
			} catch {
				inventory = inventory
					? { ...inventory, availableBoosters: Math.max(0, inventory.availableBoosters - 1) }
					: inventory;
			}
		} catch {
			openingError = true;
		} finally {
			opening = false;
		}
	}
</script>

<section class="flex flex-col gap-8">
	<PageHeader
		eyebrow={$_('boosters.eyebrow')}
		title={$_('boosters.title')}
		description={$_('boosters.description')}
	/>
	{#if inventory}
		<BoosterOpeningStage
			available={inventory.availableBoosters}
			maximum={inventory.maxBoosters ?? 1}
			nextDelay={inventory.nextBoosterAvailableAt ? nextDelayLabel : undefined}
			{opening}
			{openingId}
			cards={result}
			error={openingError}
			onOpen={open}
			onReset={() => {
				result = null;
				openingError = false;
			}}
		/>
	{:else}
		<div class="forge-panel min-h-[34rem] animate-pulse"></div>
	{/if}
</section>
