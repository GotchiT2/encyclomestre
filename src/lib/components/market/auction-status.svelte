<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { Auction } from '$lib/types';
	import { auctionPhase } from '$lib/auctions/presentation';
	let { auction, now = Date.now() }: { auction: Auction; now?: number } = $props();
	const phase = $derived(auctionPhase(auction, now));
</script>

<span
	class={[
		'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
		phase === 'open' ? 'border-energy/40 text-energy' : 'border-primary/30 text-muted-foreground'
	]}>{$_('auctionHub.phase.' + phase)}</span
>
