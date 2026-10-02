<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardSearchSort } from '$lib/types';

	let {
		query,
		sortBy,
		sortDirection
	}: { query: string; sortBy: CardSearchSort; sortDirection: string } = $props();
	let form: HTMLFormElement;
	let searchInput = $state<HTMLInputElement | null>(null);
	let timer: number | undefined;
	let localQuery = $state('');
	let localSortBy = $state<CardSearchSort>('name');
	let localSortDirection = $state<'ASC' | 'DESC'>('ASC');
	let pending = $state(false);

	$effect(() => {
		localQuery = query;
		localSortBy = sortBy;
		localSortDirection = sortDirection === 'DESC' ? 'DESC' : 'ASC';
	});

	function schedule(delay = 400) {
		window.clearTimeout(timer);
		pending = true;
		timer = window.setTimeout(() => form.requestSubmit(), delay);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const parameters = new SvelteURLSearchParams();
		for (const [key, value] of new FormData(form))
			if (typeof value === 'string') parameters.append(key, value);
		// The path is resolved above; the query is built from FormData.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(resolve('/cards') + `?${parameters}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
		pending = false;
	}
</script>

<form class="catalogue-search" bind:this={form} method="GET" onsubmit={submit}>
	<Field.FieldGroup class="flex min-w-0 items-start gap-2">
		<Field.Field class="min-w-0 flex-1">
			<Field.FieldLabel for="codex-search" class="sr-only">{$_('codex.search')}</Field.FieldLabel>
			<Input
				id="codex-search"
				bind:ref={searchInput}
				name="q"
				bind:value={localQuery}
				placeholder={$_('codex.search')}
				oninput={() => {
					if (localQuery.trim()) {
						localSortBy = 'relevance';
						localSortDirection = 'DESC';
					}
					schedule(650);
				}}
			/>
		</Field.Field>
		<details class="catalogue-sort">
			<summary>{$_('filters.sortBy')} ⌄</summary>
			<div class="sort-content">
				<Field.Field>
					<Field.FieldLabel for="codex-sort" class="forge-label"
						>{$_('filters.sortBy')}</Field.FieldLabel
					>
					<select
						id="codex-sort"
						name="sortBy"
						bind:value={localSortBy}
						onchange={() => schedule(80)}
						class="min-h-11 w-full"
					>
						<option value="relevance">{$_('collection.sortRelevance')}</option>
						<option value="name">{$_('collection.sortName')}</option>
					</select>
				</Field.Field>
				<Field.Field>
					<Field.FieldLabel for="codex-sort-direction" class="forge-label"
						>{$_('codex.sortDirection')}</Field.FieldLabel
					>
					<select
						id="codex-sort-direction"
						name="sortDirection"
						bind:value={localSortDirection}
						onchange={() => schedule(80)}
						class="min-h-11 w-full"
					>
						<option value="ASC">{$_('codex.ascending')}</option>
						<option value="DESC">{$_('codex.descending')}</option>
					</select>
				</Field.Field>
			</div>
		</details>
	</Field.FieldGroup>
	<p
		class="mt-1 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
		aria-live="polite"
	>
		{pending ? $_('codex.filtersUpdating') : ''}
	</p>
</form>

<style>
	.catalogue-sort {
		position: relative;
		flex: none;
	}
	summary {
		min-height: 44px;
		border: 1px solid var(--border);
		padding: 10px 14px;
		cursor: pointer;
		font-size: 14px;
	}
	.sort-content {
		position: absolute;
		right: 0;
		top: 50px;
		z-index: 20;
		display: grid;
		gap: 12px;
		width: 240px;
		max-width: calc(100vw - 24px);
		border: 1px solid var(--border);
		background: var(--card);
		padding: 16px;
		box-shadow: 0 12px 32px #0006;
	}
</style>
