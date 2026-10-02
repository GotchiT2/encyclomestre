<script lang="ts">
	import { operationError } from '$lib/domain/operation-error';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { User } from '$lib/types';

	let {
		open = $bindable(false),
		user,
		blocked,
		onConfirm
	}: {
		open?: boolean;
		user: User | null;
		blocked: boolean;
		onConfirm: () => void | Promise<void>;
	} = $props();

	let submitting = $state(false);
	let error = $state('');

	async function confirm() {
		if (!user || submitting) return;
		submitting = true;
		error = '';
		try {
			await onConfirm();
			open = false;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md p-0 sm:p-0 overflow-hidden" data-testid="user-block-dialog">
		<Dialog.Header class="border-b border-primary/20 p-5 pr-14">
			<Dialog.Title class="text-2xl font-black uppercase text-foreground">
				{blocked ? $_('friends.unblock_title') : $_('friends.block_title')}
			</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm italic text-muted-foreground">
				{blocked
					? $_('friends.unblock_description', { values: { user: user?.username ?? '' } })
					: $_('friends.block_description', { values: { user: user?.username ?? '' } })}
			</Dialog.Description>
		</Dialog.Header>
		{#if error}<p role="alert" class="px-4 text-destructive">{error}</p>{/if}<Dialog.Footer
			class="border-t border-primary/20 p-4"
		>
			<Button variant="outline" onclick={() => (open = false)}>{$_('common.cancel')}</Button>
			<Button variant={blocked ? 'default' : 'destructive'} disabled={submitting} onclick={confirm}>
				{blocked ? $_('friends.unblock') : $_('friends.block')}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
