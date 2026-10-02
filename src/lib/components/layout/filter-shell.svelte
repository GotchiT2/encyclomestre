<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	import { _ } from '$lib/i18n';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

	let {
		activeCount = 0,
		title,
		description,
		children
	}: {
		/** Nombre de filtres actifs, affiché en pastille sur le bouton mobile. */
		activeCount?: number;
		title?: string;
		description?: string;
		children: Snippet;
	} = $props();

	const heading = $derived(title ?? $_('filters.title'));
	const subheading = $derived(description ?? $_('filters.description'));

	// En dessous de `lg` la colonne latérale ne tient pas : les filtres passent en modale.

	let open = $state(false);
</script>

<button
	type="button"
	class="inline-flex min-h-11 w-fit items-center gap-2 border border-border px-3 text-sm"
	onclick={() => (open = true)}
	aria-label={$_('filters.open')}
>
	<SlidersHorizontalIcon class="size-4" /><span>{heading}</span>
	{#if activeCount > 0}
		<span class="forge-filter-fab-badge" aria-hidden="true">{activeCount}</span>
		<span class="sr-only">
			{$_('filters.activeCount', { values: { count: activeCount } })}
		</span>
	{/if}
</button>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header class="border-b border-primary/25 p-4">
			<Dialog.Title class="forge-wordmark text-xl">{heading}</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				{subheading}
			</Dialog.Description>
		</Dialog.Header>
		<div class="@container max-h-[65dvh] overflow-y-auto px-4 pb-4">
			{@render children()}
		</div>
	</Dialog.Content>
</Dialog.Root>
