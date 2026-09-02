<script lang="ts">
	import UserPresence from './user-presence.svelte';
	import { cn } from '$lib/utils';
	import type { LastConnection } from '$lib/types';

	let {
		image,
		name,
		lastConnection,
		presenceSize = 'md',
		size = 'sm',
		shape = 'round',
		class: className
	}: {
		image?: string | null;
		name: string;
		lastConnection?: LastConnection;
		presenceSize?: 'sm' | 'md' | 'lg';
		size?: 'sm' | 'lg';
		shape?: 'square' | 'round';
		class?: string;
	} = $props();
	const sizeClass = $derived(size === 'lg' ? 'size-20 text-3xl' : 'size-10 text-sm');
</script>

<span class={cn('relative inline-grid shrink-0 place-items-center', sizeClass, className)}>
	<span
		class={cn(
			'grid size-full place-items-center overflow-hidden border border-primary/40 bg-background',
			shape === 'round' && 'rounded-full'
		)}
	>
		{#if image}<img src={image} alt="" class="size-full object-cover" />{:else}<span
			class="font-bold text-primary"
			>{name.slice(0, 1).toUpperCase()}</span
		>{/if}
	</span>
	<UserPresence value={lastConnection} size={presenceSize} class="absolute -right-1 -bottom-1 z-10" />
</span>
