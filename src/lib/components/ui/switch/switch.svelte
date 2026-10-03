<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = 'default',
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: 'sm' | 'default';
	} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		'arcade-switch peer group/switch relative inline-flex h-11 w-13 shrink-0 cursor-pointer items-center outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="arcade-switch-thumb pointer-events-none absolute left-1.5 block size-5 bg-background transition-transform data-checked:translate-x-5"
	/>
</SwitchPrimitive.Root>

<style>
	:global(.arcade-switch) {
		background: transparent;
		border: 0;
	}
	:global(.arcade-switch::before) {
		content: '';
		position: absolute;
		left: 4px;
		right: 4px;
		height: 24px;
		background: var(--input);
		border: 1px solid var(--border);
	}
	:global(.arcade-switch[data-checked]::before) {
		background: var(--primary);
		border-color: var(--primary);
	}
</style>
