<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { modalZIndex } from './modal-layer';
	let {
		ref = $bindable(null),
		class: className,
		layer = 50,
		style,
		...restProps
	}: DialogPrimitive.OverlayProps & { layer?: number } = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn('fixed inset-0 bg-black/75 backdrop-blur-sm', className)}
	style={modalZIndex(layer, style)}
	{...restProps}
/>
