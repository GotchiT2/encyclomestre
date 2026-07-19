<script lang="ts">
	import { onMount } from 'svelte';
	import { auctionCountdown } from '$lib/domain/market/auction-display';
	import { _ } from '$lib/i18n';

	let { endsAt }: { endsAt?: string | null } = $props();
	let now = $state(Date.now());
	const countdown = $derived(auctionCountdown(endsAt, now));
	const exactDate = $derived(
		endsAt
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

{#if countdown.state === 'expired'}
	<span
		class="font-mono text-[10px] font-bold uppercase tracking-widest text-destructive"
		data-testid="auction-countdown"
	>
		{$_('market.expired')}
	</span>
{:else if countdown.relative && exactDate}
	<span
		class="font-mono text-[10px] font-bold uppercase tracking-widest text-primary"
		title={exactDate}
		data-testid="auction-countdown"
	>
		{$_('market.ends_in', { values: { delay: countdown.relative } })}
	</span>
{/if}
{#if exactDate}
	<p class="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
		{$_('market.ends_local', { values: { date: exactDate } })}
	</p>
{/if}
