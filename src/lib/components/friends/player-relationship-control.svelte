<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { PlayerRelationshipStatus } from '$lib/types';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	let {
		status,
		busy = false,
		onInvite
	}: {
		status: PlayerRelationshipStatus | null;
		busy?: boolean;
		onInvite?: () => void | Promise<void>;
	} = $props();

	const label = $derived(
		status === null
			? $_('friends.relationship_loading')
			: status === 'friend'
				? $_('friends.relationship_friend')
				: status === 'pending'
					? $_('friends.relationship_pending')
					: status === 'blocked'
						? $_('friends.relationship_blocked')
						: $_('friends.relationship_none')
	);
</script>

{#if status === 'none' && onInvite}
	<Button size="sm" disabled={busy} onclick={() => void onInvite()}>
		<UserPlusIcon data-icon="inline-start" />
		{busy ? $_('friends.invite_sending') : $_('friends.invite_action')}
	</Button>
{:else}
	<Badge
		variant={status === 'blocked' ? 'destructive' : status === 'friend' ? 'outline' : 'secondary'}
	>
		{label}
	</Badge>
{/if}
