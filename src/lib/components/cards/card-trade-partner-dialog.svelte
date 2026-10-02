<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { FriendOwnerInfo } from '$lib/types';

	let {
		open = $bindable(false),
		owners,
		onSelect
	}: {
		open?: boolean;
		owners: FriendOwnerInfo[];
		onSelect: (owner: FriendOwnerInfo) => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-w-lg p-0 sm:p-0 overflow-hidden"
		data-testid="card-trade-partner-dialog"
	>
		<Dialog.Header class="border-b border-primary/20 p-5 pr-14">
			<Dialog.Title>{$_('cardDetail.choose_trade_partner')}</Dialog.Title>
			<Dialog.Description>{$_('cardDetail.choose_trade_partner_description')}</Dialog.Description>
		</Dialog.Header>
		<ul class="grid max-h-[60dvh] gap-2 overflow-y-auto p-4">
			{#each owners as owner (owner.friendId)}
				<li>
					<Button
						variant="outline"
						class="h-auto min-h-12 w-full justify-between px-3 py-2"
						onclick={() => {
							open = false;
							onSelect(owner);
						}}
					>
						<span class="truncate">@{owner.username}</span>
						<span class="font-mono text-[10px] uppercase tracking-widest text-primary">
							{$_('cardDetail.trade_owner_count', { values: { count: owner.ownedCount } })}
						</span>
					</Button>
				</li>
			{/each}
		</ul>
	</Dialog.Content>
</Dialog.Root>
