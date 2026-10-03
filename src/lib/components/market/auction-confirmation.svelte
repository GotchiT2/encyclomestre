<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	let {
		open = $bindable(false),
		title,
		description,
		busy,
		onConfirm
	}: {
		open?: boolean;
		title: string;
		description: string;
		busy: boolean;
		onConfirm: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="max-w-lg overflow-y-auto border p-4 sm:p-5"
		modalLayer={150}
		showCloseButton={!busy}
		onInteractOutside={(event) => {
			if (busy) event.preventDefault();
		}}
		onEscapeKeydown={(event) => {
			if (busy) event.preventDefault();
		}}
	>
		<Dialog.Title class="pr-6 font-serif text-2xl">{title}</Dialog.Title>
		<Dialog.Description class="whitespace-pre-line leading-relaxed"
			>{description}</Dialog.Description
		>
		<div class="flex flex-wrap justify-end gap-2">
			<Button variant="outline" disabled={busy} onclick={() => (open = false)}
				>{$_('auctionHub.cancel')}</Button
			>
			<Button disabled={busy} onclick={onConfirm}
				>{$_(busy ? 'auctionHub.busy' : 'auctionHub.confirm')}</Button
			>
		</div>
	</Dialog.Content>
</Dialog.Root>
