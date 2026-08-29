<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardVariant } from '$lib/types';

	let {
		value = $bindable<CardVariant>('all'),
		name,
		class: className,
		onChange
	}: {
		value?: CardVariant;
		name?: string;
		class?: string;
		onChange?: (value: CardVariant) => void;
	} = $props();

	const variants: Array<{ value: CardVariant; label: string }> = [
		{ value: 'all', label: 'cards.variant.all' },
		{ value: 'normal', label: 'cards.variant.normal' },
		{ value: 'alternative', label: 'cards.variant.alternative' }
	];

	function change(nextValue: string | string[]) {
		const next = (typeof nextValue === 'string' && nextValue ? nextValue : 'all') as CardVariant;
		value = next;
		onChange?.(next);
	}
</script>

<fieldset class={cn('min-w-0', className)}>
	<legend class="forge-label mb-2">{$_('cards.variant.label')}</legend>
	<ToggleGroup.Root
		type="single"
		{value}
		onValueChange={change}
		variant="outline"
		spacing={1}
		class="grid w-full grid-cols-3"
	>
		{#each variants as variant (variant.value)}
			<ToggleGroup.Item value={variant.value} class="min-h-10 min-w-0 px-1 text-[10px]">
				{$_(variant.label)}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
	{#if name}<input type="hidden" {name} {value} />{/if}
</fieldset>
