<script lang="ts">
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import UserPicker from '$lib/components/selectors/user-picker.svelte';
	import { operationError } from '$lib/domain/operation-error';
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
	let busy = $state(false);
	let error = $state('');
	let invitedName = $state('');
	const validId = $derived(/^\d+$/.test(invitedId) && Number(invitedId) > 0);

	async function invite() {
		if (!validId || busy) return;
		busy = true;
		error = '';
		try {
			await onInvite(invitedId);
			invitedId = '';
			invitedName = '';
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
	async function revoke(id: string) {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await onRevoke(id);
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg p-0 sm:p-0 overflow-hidden">
		<Dialog.Header class="px-4 pt-4 pr-12 pb-2">
			<Dialog.Title>{$_('wishlist.manage_access')}</Dialog.Title>
			<Dialog.Description>{$_('plan.wishlist.inviteHint')}</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 px-4 pt-2 pb-4">
			<UserPicker
				onChoose={(user) => {
					invitedId = user.id;
					invitedName = user.username;
				}}
			/>
			{#if invitedId}<p>
					{$_('completion.selected', { values: { name: invitedName } })}
				</p>{/if}<Button disabled={!validId || busy} onclick={() => void invite()}
				>{$_('wishlist.invite')}</Button
			>{#if error}<p role="alert">{error}</p>{/if}
			{#if followers.length}
				<ul class="grid gap-2">
					{#each followers as follower (follower.id)}
						<li class="flex items-center gap-3 border border-primary/20 bg-background p-3">
							<UserAvatar
								image={follower.imageUrl}
								crop={follower.imageCrop}
								name={follower.name}
							/>
							<div class="min-w-0 flex-1">
								<p class="truncate font-bold">{follower.name}</p>
								<p class="forge-label">
									{follower.accepted
										? $_('wishlist.access_accepted')
										: $_('wishlist.access_pending')}
								</p>
							</div>
							<Button
								size="sm"
								variant="destructive"
								disabled={busy}
								onclick={() => void revoke(follower.id)}>{$_('wishlist.revoke')}</Button
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
