<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { CollectionTag } from '$lib/types';

	let {
		values = $bindable<string[]>([]),
		tags,
		untaggedValue,
		allowCreation = true,
		onChange,
		onCreate
	}: {
		values: string[];
		tags: CollectionTag[];
		untaggedValue: string;
		allowCreation?: boolean;
		onChange?: () => void;
		onCreate?: () => void;
	} = $props();

	let details: HTMLDetailsElement;
	const options = $derived([
		{ id: untaggedValue, name: $_('collection.untagged'), color: '#9cb0bc' },
		...tags
	]);

	function toggle(id: string) {
		values = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
		onChange?.();
	}

	function create() {
		details.open = false;
		onCreate?.();
	}
</script>

<div>
	<details bind:this={details} class="group relative">
		<summary class="forge-control flex cursor-pointer list-none items-center justify-between gap-3">
			<span class="truncate">
				{values.length
					? $_('collection.selectedTagCount', { values: { count: values.length } })
					: $_('collection.allTags')}
			</span>
			<ChevronDownIcon
				class="size-4 shrink-0 text-primary transition-transform group-open:rotate-180"
			/>
		</summary>
		<div
			class="absolute top-full right-0 left-0 z-40 mt-2 border border-primary/35 bg-popover p-2 shadow-2xl"
		>
			<div class="max-h-60 overflow-y-auto">
				{#each options as option (option.id)}
					<button
						type="button"
						class="flex min-h-11 w-full items-center gap-3 border border-transparent px-3 text-left text-sm hover:border-primary/25 hover:bg-secondary/70"
						class:bg-secondary={values.includes(option.id)}
						onclick={() => toggle(option.id)}
					>
						<span
							class="grid size-5 shrink-0 place-items-center border"
							style={`border-color:${option.color};background:${values.includes(option.id) ? option.color : 'transparent'};color:#080f19`}
						>
							{#if values.includes(option.id)}<CheckIcon class="size-3.5" />{/if}
						</span>
						<span class="truncate">{option.name}</span>
					</button>
				{/each}
			</div>
			{#if allowCreation}<Button
					type="button"
					variant="ghost"
					class="mt-2 w-full justify-start border-t border-primary/20"
					onclick={create}><PlusIcon />{$_('collection.addTagOption')}</Button
				>{/if}
		</div>
	</details>
	{#if values.length}
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each values as value (value)}
				{@const tag = options.find((option) => option.id === value)}
				{#if tag}<button
						type="button"
						class="flex min-h-8 items-center gap-2 border border-primary/25 bg-background/65 px-2 text-[10px] font-bold tracking-wide uppercase"
						onclick={() => toggle(value)}
						><span class="size-2.5" style={`background:${tag.color}`}></span>{tag.name}<span
							aria-hidden="true">×</span
						></button
					>{/if}
			{/each}
		</div>
	{/if}
</div>
