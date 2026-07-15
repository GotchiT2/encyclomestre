<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-[min(92dvh,58rem)] max-w-7xl grid-rows-[auto_minmax(0,1fr)]">
		<div class="border-b border-primary/20 p-4 pr-14">
			<Dialog.Title>{title}</Dialog.Title>
		</div>
		{@render children()}
	</Dialog.Content>
</Dialog.Root>
