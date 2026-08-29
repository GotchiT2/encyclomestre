<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { WishlistFollower } from '$lib/types';

	let {
		open = $bindable(false),
		followers,
		onInvite,
		onRevoke
	}: {
		open?: boolean;
		followers: WishlistFollower[];
		onInvite: (userId: string) => void | Promise<void>;
		onRevoke: (userId: string) => void | Promise<void>;
	} = $props();

	let invitedId = $state('');
	const validId = $derived(/^\d+$/.test(invitedId) && Number(invitedId) > 0);

	async function invite() {
		if (!validId) return;
		await onInvite(invitedId);
		invitedId = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{$_('wishlist.manage_access')}</Dialog.Title>
			<Dialog.Description>{$_('wishlist.invite_id_hint')}</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 p-4">
			<div class="flex gap-2">
				<Input
					bind:value={invitedId}
					inputmode="numeric"
					pattern="[0-9]*"
					placeholder={$_('wishlist.invite_id_placeholder')}
					aria-label={$_('wishlist.invite_id_label')}
				/>
				<Button disabled={!validId} onclick={() => void invite()}>{$_('wishlist.invite')}</Button>
			</div>
			{#if followers.length}
				<ul class="grid gap-2">
					{#each followers as follower (follower.id)}
						<li class="flex items-center gap-3 border border-primary/20 bg-background p-3">
							{#if follower.imageUrl}<img
									src={follower.imageUrl}
									alt=""
									class="size-10 shrink-0 object-cover"
								/>{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate font-serif font-bold">{follower.name}</p>
								<p class="forge-label">
									{follower.accepted
										? $_('wishlist.access_accepted')
										: $_('wishlist.access_pending')}
								</p>
							</div>
							<Button size="sm" variant="destructive" onclick={() => void onRevoke(follower.id)}
								>{$_('wishlist.revoke')}</Button
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm italic text-muted-foreground">{$_('wishlist.no_followers')}</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
