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

<form bind:this={form} method="GET" onsubmit={submit}>
	<Field.FieldGroup class="gap-5">
		<Field.Field>
			<Field.FieldLabel for="codex-search" class="forge-label"
				>{$_('codex.search')}</Field.FieldLabel
			>
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
		<Field.Field>
			<Field.FieldLabel for="codex-sort" class="forge-label"
				>{$_('filters.sortBy')}</Field.FieldLabel
			>
			<select
				id="codex-sort"
				name="sortBy"
				bind:value={localSortBy}
				onchange={() => schedule(80)}
				class="w-full"
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
				class="w-full"
			>
				<option value="ASC">{$_('codex.ascending')}</option>
				<option value="DESC">{$_('codex.descending')}</option>
			</select>
		</Field.Field>
	</Field.FieldGroup>
	<p
		class="mt-3 min-h-4 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
		aria-live="polite"
	>
		{pending ? $_('codex.filtersUpdating') : ''}
	</p>
</form>
