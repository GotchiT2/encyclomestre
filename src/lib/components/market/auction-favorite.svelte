<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { setAuctionFavorite } from '$lib/api/auctions';
	import { auctionErrorKey } from '$lib/auctions/errors';
	import { Heart } from '@lucide/svelte';
	let {
		id,
		favorite = false,
		compact = false
	}: { id: string; favorite?: boolean; compact?: boolean } = $props();
	let saved = $state<boolean | undefined>();
	let busy = $state(false);
	let error = $state('');
	const selected = $derived(saved ?? favorite);
	async function toggle() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await setAuctionFavorite(id, !selected);
			saved = !selected;
		} catch (cause) {
			error = $_(auctionErrorKey(cause));
		} finally {
			busy = false;
		}
	}
</script>

<Button
	variant="outline"
	size={compact ? 'icon' : 'sm'}
	aria-label={$_(selected ? 'apiEvolution.removeFavorite' : 'apiEvolution.addFavorite')}
	aria-pressed={selected}
	disabled={busy}
	onclick={toggle}
	>{#if compact}<Heart size={16} fill={selected ? 'currentColor' : 'none'} />{:else}{$_(
			selected ? 'apiEvolution.removeFavorite' : 'apiEvolution.addFavorite'
		)}{/if}</Button
>
{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
