<script lang="ts">
	import { tick } from 'svelte';
	import { Popover } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import TagChoices from './tag-choices.svelte';
	import { createModalLayer, modalZIndex } from '$lib/components/ui/dialog/modal-layer';
	import type { CollectionTag } from '$lib/types';
	let {
		values = $bindable<string[]>([]),
		tags,
		untaggedValue,
		allowCreation = true,
		inline = false,
		onChange,
		onCreate
	}: {
		values: string[];
		tags: CollectionTag[];
		untaggedValue?: string;
		allowCreation?: boolean;
		inline?: boolean;
		onChange?: () => void;
		onCreate?: () => void;
	} = $props();
	let search = $state('');
	let open = $state(false);
	const layer = createModalLayer();
	const options = $derived([
		...(untaggedValue
			? [{ id: untaggedValue, name: $_('collection.untagged'), color: '#9cb0bc' }]
			: []),
		...tags
	]);
	const label = $derived(
		values.length
			? (options.find((tag) => tag.id === values[0])?.name ?? $_('collection.tags')) +
					(values.length > 1 ? ' +' + (values.length - 1) : '')
			: $_('collection.tags')
	);
	function toggle(id: string) {
		values = values.includes(id)
			? values.filter((value) => value !== id)
			: id === untaggedValue
				? [id]
				: [...values.filter((value) => value !== untaggedValue), id];
		onChange?.();
	}
	async function manage() {
		open = false;
		await tick();
		onCreate?.();
	}
</script>

{#snippet choices()}
	<TagChoices tags={options} selected={values} bind:search onSelect={toggle} />
	{#if values.length}<Button
			variant="ghost"
			onclick={() => {
				values = [];
				onChange?.();
			}}>{$_('controls.clearTags')}</Button
		>{/if}
	{#if allowCreation && onCreate}<Button variant="outline" onclick={manage}
			>{$_('collection.editTags')}</Button
		>{/if}
{/snippet}
<div data-testid="tag-filter-selector">
	{#if inline}{@render choices()}{:else}<Popover.Root bind:open>
			<Popover.Trigger
				>{#snippet child({ props })}<Button
						{...props}
						variant={values.length ? 'default' : 'outline'}
						aria-label={$_('collection.tags') + ': ' + label}>{label} ⌄</Button
					>{/snippet}</Popover.Trigger
			>
			<Popover.Portal
				><Popover.Content
					align="start"
					sideOffset={4}
					style={modalZIndex(layer + 2)}
					class="grid w-72 max-w-[calc(100vw-2rem)] gap-2 border border-border bg-card p-3 shadow-xl"
					>{@render choices()}</Popover.Content
				></Popover.Portal
			>
		</Popover.Root>{/if}
</div>
