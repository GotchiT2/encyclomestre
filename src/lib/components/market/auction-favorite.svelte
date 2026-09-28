<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { setAuctionFavorite } from '$lib/api/auctions';
	import { auctionErrorKey } from '$lib/auctions/errors';
	let { id, favorite = false }: { id: string; favorite?: boolean } = $props();
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

<Button variant="outline" size="sm" aria-pressed={selected} disabled={busy} onclick={toggle}
	>{$_(selected ? 'apiEvolution.removeFavorite' : 'apiEvolution.addFavorite')}</Button
>
{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
