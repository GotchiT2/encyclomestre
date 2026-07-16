<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(true),
		class: className,
		contentClass,
		children
	}: {
		open?: boolean;
		class?: string;
		contentClass?: string;
		children: Snippet;
	} = $props();
</script>

<Collapsible.Root
	bind:open
	class={cn('border border-primary/25 bg-background/35', className)}
	data-testid="card-search-panel"
>
	<header class="flex min-h-11 items-center gap-3 px-3">
		<p class="forge-label">{$_('cards.searchPanel')}</p>
		<Collapsible.Trigger class="ml-auto">
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="sm">
					{open ? $_('common.collapseFilters') : $_('common.expandFilters')}
					<ChevronDownIcon
						data-icon="inline-end"
						class={cn('transition-transform', open && 'rotate-180')}
					/>
				</Button>
			{/snippet}
		</Collapsible.Trigger>
	</header>
	<Collapsible.Content class={cn('border-t border-primary/20 p-3', contentClass)}>
		{@render children()}
	</Collapsible.Content>
</Collapsible.Root>
