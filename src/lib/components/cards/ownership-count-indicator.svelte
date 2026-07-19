<script lang="ts">
	import LibraryIcon from '@lucide/svelte/icons/library';
	import { cn } from '$lib/utils';

	let {
		count,
		label,
		tone = 'owned',
		class: className
	}: {
		count: number;
		label: string;
		tone?: 'owned' | 'comparison';
		class?: string;
	} = $props();
</script>

<span
	class={cn(
		'flex min-h-7 items-center gap-1 border bg-background/90 px-1.5 font-mono text-[9px] font-bold shadow-lg',
		tone === 'owned' ? 'border-emerald-300/60 text-emerald-200' : 'border-sky-300/70 text-sky-200',
		className
	)}
	aria-label={label}
	title={label}
	data-testid={`ownership-count-${tone}`}
>
	<LibraryIcon class="size-3.5" /><span aria-hidden="true">×{count}</span>
</span>
