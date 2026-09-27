<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
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
	const isCompact = new IsMobile(1024);
	let open = $state(false);
</script>

{#if isCompact.current}
	<button
		type="button"
		class="forge-filter-fab"
		onclick={() => (open = true)}
		aria-label={$_('filters.open')}
	>
		<SlidersHorizontalIcon class="size-6" />
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
{:else}
	<!-- L'élément de grille s'étire sur la hauteur de la ligne (align-items: stretch),
	     ce qui donne au `sticky` de l'aside la place de glisser. -->
	<div>
		<aside
			class="forge-panel sticky top-[calc(var(--site-banner-height,0px)+1rem)] max-h-[calc(100dvh-var(--site-banner-height,0px)-2rem)] overflow-y-auto p-4"
			aria-label={heading}
		>
			<p class="forge-label mb-3">{heading}</p>
			<div class="@container">
				{@render children()}
			</div>
		</aside>
	</div>
{/if}
