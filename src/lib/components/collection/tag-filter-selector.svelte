<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { _ } from '$lib/i18n';
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

	const options = $derived([
		{ id: untaggedValue, name: $_('collection.untagged'), color: '#9cb0bc' },
		...tags
	]);

	function toggle(id: string) {
		values = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
		onChange?.();
	}

	function selectionChanged() {
		onChange?.();
	}
</script>

<div data-testid="tag-filter-selector">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="forge-control flex cursor-pointer items-center justify-between gap-3"
		>
			<span class="truncate">
				{values.length
					? $_('collection.selectedTagCount', { values: { count: values.length } })
					: $_('collection.allTags')}
			</span>
			<ChevronDownIcon class="shrink-0 text-primary" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content
			align="start"
			sideOffset={8}
			class="max-h-72 border border-primary/35 bg-popover p-2 shadow-2xl"
		>
			<DropdownMenu.CheckboxGroup bind:value={values} onValueChange={selectionChanged}>
				{#each options as option (option.id)}
					<DropdownMenu.CheckboxItem
						value={option.id}
						checked={values.includes(option.id)}
						closeOnSelect={false}
						class="min-h-11"
					>
						<span
							class="size-3 shrink-0 border"
							style={`border-color:${option.color};background:${values.includes(option.id) ? option.color : 'transparent'}`}
						></span>
						<span class="truncate">{option.name}</span>
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.CheckboxGroup>
			{#if allowCreation}
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onSelect={() => onCreate?.()}>
						<PlusIcon data-icon="inline-start" />
						{$_('collection.addTagOption')}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
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
