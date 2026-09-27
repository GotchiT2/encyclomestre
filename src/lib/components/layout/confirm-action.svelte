<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let {
		label,
		description,
		disabled = false,
		destructive = false,
		onConfirm
	}: {
		label: string;
		description: string;
		disabled?: boolean;
		destructive?: boolean;
		onConfirm: () => Promise<unknown>;
	} = $props();
	let open = $state(false);
	let busy = $state(false);
	let error = $state('');
	async function submit() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await onConfirm();
			open = false;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<Button
	variant={destructive ? 'destructive' : 'outline'}
	{disabled}
	onclick={() => {
		error = '';
		open = true;
	}}>{label}</Button
>
<Dialog.Root bind:open>
	<Dialog.Content
		class="max-w-lg overflow-y-auto p-4 sm:p-6"
		onInteractOutside={(event) => {
			if (busy) event.preventDefault();
		}}
		onEscapeKeydown={(event) => {
			if (busy) event.preventDefault();
		}}
	>
		<Dialog.Title>{label}</Dialog.Title><Dialog.Description>{description}</Dialog.Description>
		{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
		<Dialog.Footer
			><Button variant="outline" disabled={busy} onclick={() => (open = false)}
				>{$_('completion.cancel')}</Button
			><Button disabled={busy} onclick={() => void submit()}
				>{$_(busy ? 'completion.busy' : 'completion.confirm')}</Button
			></Dialog.Footer
		>
	</Dialog.Content>
</Dialog.Root>
