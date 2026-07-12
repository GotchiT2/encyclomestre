<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Sheet from '$lib/components/ui/sheet';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[92dvh] border-4 border-double border-primary/40 bg-card p-0 sm:inset-x-[6%] sm:bottom-6 sm:max-w-none"
	>
		<div class="border-b border-primary/20 p-4 pr-14">
			<Sheet.Title class="font-serif text-2xl font-black uppercase tracking-tight"
				>{title}</Sheet.Title
			>
		</div>
		{@render children()}
	</Sheet.Content>
</Sheet.Root>
