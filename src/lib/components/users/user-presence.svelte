<script lang="ts">
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { LastConnection } from '$lib/types';

	let {
		value,
		size = 'md',
		class: className
	}: { value?: LastConnection; size?: 'sm' | 'md' | 'lg'; class?: string } = $props();
	const colorByValue: Record<LastConnection, string> = {
		TODAY: 'bg-emerald-500',
		THIS_WEEK: 'bg-cyan-400',
		THIS_MONTH: 'bg-amber-400',
		AWAY: 'bg-slate-500'
	};
	const label = $derived(value ? $_(`presence.${value}`) : '');
</script>

{#if value}
	<span
		class={cn(
			'block rounded-full border-2 border-background shadow-sm',
			size === 'sm' ? 'size-2.5' : size === 'lg' ? 'size-5' : 'size-3',
			colorByValue[value],
			className
		)}
		role="img"
		aria-label={label}
		title={label}
		style={`width:${size === 'sm' ? '0.625rem' : size === 'lg' ? '1.25rem' : '0.75rem'};height:${size === 'sm' ? '0.625rem' : size === 'lg' ? '1.25rem' : '0.75rem'}`}
		><span aria-hidden="true">&nbsp;</span></span
	>
{/if}
