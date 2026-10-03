<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { untrack, type Snippet } from 'svelte';
	import DialogPortal from './dialog-portal.svelte';
	import DialogOverlay from './dialog-overlay.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { _ } from '$lib/i18n';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';
	import { createModalLayer, modalZIndex } from './modal-layer';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		fullscreen = false,
		modalLayer,
		style,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		fullscreen?: boolean;
		modalLayer?: number;
	} = $props();

	const layer = createModalLayer(untrack(() => modalLayer));
</script>

<DialogPortal {...portalProps}>
	<DialogOverlay {layer} />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			'fixed grid gap-4 overflow-y-auto border border-border bg-card p-4 sm:p-5 text-foreground shadow-2xl outline-none',
			fullscreen
				? 'inset-0 h-dvh max-h-dvh w-screen max-w-none'
				: 'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2',
			className
		)}
		style={modalZIndex(layer + 1, style)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close data-slot="dialog-close">
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						class="absolute top-0.5 right-0.5 p-0"
						size="icon-sm"
						aria-label={$_('common.close')}
					>
						<XIcon />
					</Button>
				{/snippet}
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPortal>
