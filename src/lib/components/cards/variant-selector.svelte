<script lang="ts">
	import { onMount } from 'svelte';
	import { Popover } from 'bits-ui';
	import { getVariants } from '$lib/api/variants';
	import type { VariantDefinition } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { createModalLayer, modalZIndex } from '$lib/components/ui/dialog/modal-layer';
	let {
		selected = $bindable<number[]>([]),
		name = 'variant',
		compact = false,
		inline = false,
		multiple = true,
		options,
		onChange
	}: {
		selected?: number[];
		name?: string;
		compact?: boolean;
		inline?: boolean;
		multiple?: boolean;
		options?: VariantDefinition[];
		onChange?: () => void;
	} = $props();
	let catalogue = $state<VariantDefinition[]>([]);
	let error = $state(false);
	let open = $state(false);
	let search = $state('');
	const layer = createModalLayer();
	const variants = $derived(options ?? catalogue);
	const choices = $derived(
		[
			...variants,
			...selected
				.filter((id) => !variants.some((v) => v.id === id))
				.map((id) => ({ id, name: '#' + id, color: '', styles: [], renderKey: '' }))
		].filter((v) => v.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
	);
	const label = $derived(
		selected.length === 1
			? (variants.find((v) => v.id === selected[0])?.name ?? '#' + selected[0])
			: selected.length
				? $_('ux.selected', { values: { count: selected.length } })
				: $_('ux.allVariants')
	);
	async function load() {
		error = false;
		try {
			catalogue = await getVariants();
		} catch {
			error = true;
		}
	}
	onMount(() => {
		if (!options) void load();
	});
	function toggle(id: number) {
		selected = multiple
			? selected.includes(id)
				? selected.filter((value) => value !== id)
				: [...selected, id]
			: [id];
		onChange?.();
		if (!multiple) open = false;
	}
	function move(event: KeyboardEvent) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		const controls = [
			...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
				'[data-variant-option]'
			)
		];
		if (!controls.length) return;
		const current = controls.indexOf(document.activeElement as HTMLButtonElement);
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? controls.length - 1
					: (current + (event.key === 'ArrowUp' ? -1 : 1) + controls.length) % controls.length;
		event.preventDefault();
		controls[next]?.focus();
	}
</script>

{#snippet selector()}
	<div class="flex flex-col gap-2">
		<input
			type="search"
			bind:value={search}
			aria-label={$_('ux.variantSearch')}
			placeholder={$_('ux.variantSearch')}
			class="h-11 min-w-0 border border-border bg-background px-3"
		/>
		<Button
			variant="ghost"
			onclick={() => {
				selected = [];
				onChange?.();
			}}>{$_('ux.clear')}</Button
		>
		{#if error}<Button variant="outline" onclick={load}>{$_('completion.retry')}</Button>{/if}
		<div class="max-h-64 overflow-y-auto" role="group" aria-label={$_('ux.variants')}>
			{#each choices as variant (variant.id)}<button
					type="button"
					data-variant-option
					class="flex min-h-11 w-full items-center gap-2 px-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
					aria-pressed={selected.includes(variant.id)}
					onclick={() => toggle(variant.id)}
					><span aria-hidden="true">{selected.includes(variant.id) ? '✓' : '○'}</span><span
						class="size-3 shrink-0 border"
						style:background={variant.color}
					></span><span class="break-words">{variant.name}</span></button
				>{:else}<p class="p-2 text-sm text-muted-foreground">{$_('ux.noVariants')}</p>{/each}
		</div>
	</div>
{/snippet}
{#if inline}<div
		onkeydown={move}
		role="toolbar"
		aria-label={$_('ux.variants')}
		aria-orientation="vertical"
		tabindex="-1"
	>
		{@render selector()}
	</div>{:else}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}<Button
					{...props}
					variant="outline"
					size={compact ? 'sm' : 'default'}
					class="max-w-full min-w-0 justify-between"
					aria-label={$_('ux.variants') + ': ' + label}
					><span class="truncate">{label}</span><ChevronDownIcon /></Button
				>{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				align="start"
				sideOffset={4}
				style={modalZIndex(layer + 2)}
				class="w-72 max-w-[calc(100vw-2rem)] border border-primary/30 bg-card p-3 shadow-xl"
				onkeydown={move}
			>
				{@render selector()}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
{/if}
{#each selected as id (id)}<input type="hidden" {name} value={id} />{/each}
