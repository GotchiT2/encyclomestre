<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	let {
		open = $bindable(false),
		onShareLink,
		onShareGuild
	}: { open?: boolean; onShareLink: () => void; onShareGuild: () => void } = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
		role="presentation"
		onclick={() => (open = false)}
	>
		<dialog
			open
			aria-labelledby="wishlist-share-title"
			class="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-double border-primary/40 bg-card p-5 text-foreground shadow-2xl"
			onclick={(event) => event.stopPropagation()}
		>
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('wishlist.share')}
			</p>
			<h2
				id="wishlist-share-title"
				class="mt-2 font-serif text-2xl font-black uppercase tracking-tight text-foreground"
			>
				{$_('wishlist.share_title')}
			</h2>
			<div class="mt-5 grid gap-2">
				<Button onclick={onShareLink}>{$_('wishlist.share_link')}</Button><Button
					variant="outline"
					onclick={onShareGuild}>{$_('wishlist.share_guild')}</Button
				><Button variant="ghost" onclick={() => (open = false)}>{$_('common.cancel')}</Button>
			</div>
		</dialog>
	</div>
{/if}
