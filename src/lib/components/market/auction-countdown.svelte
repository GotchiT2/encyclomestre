<script lang="ts">
	import { onMount } from 'svelte';
	import { auctionCountdown } from '$lib/domain/market/auction-display';
	import { _ } from '$lib/i18n';

	let {
		endsAt,
		mode = 'end',
		prominent = false,
		showExactDate = true
	}: {
		endsAt?: string | null;
		mode?: 'start' | 'end';
		prominent?: boolean;
		showExactDate?: boolean;
	} = $props();
	let now = $state(Date.now());
	const countdown = $derived(auctionCountdown(endsAt, now));
	const exactDate = $derived(
		endsAt && Number.isFinite(Date.parse(endsAt))
			? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(endsAt)
				)
			: null
	);

	onMount(() => {
		const timer = window.setInterval(() => (now = Date.now()), 1_000);
		return () => window.clearInterval(timer);
	});
</script>

<div class="countdown-block">
	{#if countdown.state === 'expired'}
		<span
			class="font-mono text-[10px] font-bold uppercase tracking-widest text-destructive"
			data-testid="auction-countdown"
			class:prominent
		>
			{$_('market.expired')}
		</span>
	{:else if countdown.relative && exactDate}
		<span
			class="font-mono text-[10px] font-bold uppercase tracking-widest text-primary"
			title={exactDate}
			data-testid="auction-countdown"
			class:prominent
		>
			{$_(mode === 'start' ? 'auctionHub.startsIn' : 'market.ends_in', {
				values: { delay: countdown.relative }
			})}
		</span>
	{/if}
	{#if exactDate && showExactDate}
		<p class="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
			{#if prominent}{exactDate}{:else}{$_(
					mode === 'start' ? 'auctionHub.startsLocal' : 'market.ends_local',
					{
						values: { date: exactDate }
					}
				)}{/if}
		</p>
	{/if}
</div>

<style>
	.prominent {
		display: block;
		font-family: 'Barlow Condensed', sans-serif;
		font-size: clamp(1.15rem, 2vw, 1.6rem);
		letter-spacing: 0;
		line-height: 1.15;
	}
</style>
