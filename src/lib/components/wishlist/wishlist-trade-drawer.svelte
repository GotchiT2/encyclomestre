<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, FriendOwnerInfo } from '$lib/types';

	let {
		open = $bindable(false),
		card,
		friend,
		onConfirm
	}: {
		open?: boolean;
		card: CardRecord | null;
		friend: FriendOwnerInfo | null;
		onConfirm: () => void;
	} = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
		role="presentation"
		onclick={() => (open = false)}
	>
		<dialog
			open
			class="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-double border-primary/40 bg-card p-5 text-foreground shadow-2xl"
			aria-labelledby="wishlist-trade-title"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="wishlist-trade-title" class="font-serif text-2xl font-black uppercase tracking-tight">
				{$_('wishlist.action_initiate_trade')}
			</h2>
			<p class="mt-3 font-serif italic text-muted-foreground">
				{#if card && friend}{$_('wishlist.trade_confirmation', {
						values: { friend: friend.username, card: card.title }
					})}{/if}
			</p>
			<div class="mt-5 flex gap-2">
				<Button variant="outline" class="flex-1" onclick={() => (open = false)}
					>{$_('common.cancel')}</Button
				><Button class="flex-1" onclick={onConfirm}>{$_('wishlist.action_initiate_trade')}</Button>
			</div>
		</dialog>
	</div>
{/if}
