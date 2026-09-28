<script lang="ts">
	import { untrack } from 'svelte';
	import { getWikiForgePublicPages, type WikiForgePublicPageCard } from '$lib/api/pages';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Field from '$lib/components/ui/field';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let {
		value = $bindable<number | undefined>(),
		label = '',
		onChoose
	}: {
		value?: number;
		label?: string;
		onChoose?: (page: WikiForgePublicPageCard | undefined) => void;
	} = $props();
	let query = $state('');
	let page = $state(0);
	let results = $state<WikiForgePublicPageCard[]>([]);
	let hasNext = $state(false);
	let truncated = $state(false);
	let maximum = $state(10000);
	let selected = $state<WikiForgePublicPageCard>();
	let busy = $state(false);
	let error = $state('');
	$effect(() => {
		const q = query;
		const index = page;
		const abort = new AbortController();
		const timer = setTimeout(
			() =>
				untrack(async () => {
					if (q.trim().length < 3) {
						busy = false;
						error = '';
						results = [];
						hasNext = false;
						return;
					}
					busy = true;
					error = '';
					try {
						const result = await getWikiForgePublicPages(
							{ q, page: index, sortBy: 'relevance' },
							{ signal: abort.signal }
						);
						if (!abort.signal.aborted) {
							results = result.results ?? [];
							hasNext = result.hasNext ?? (index + 1) * 48 < result.nbResults;
							truncated = Boolean(result.truncated);
							maximum = result.maxResults ?? 10000;
						}
					} catch (cause) {
						if (!abort.signal.aborted) error = operationError(cause);
					} finally {
						if (!abort.signal.aborted) busy = false;
					}
				}),
			300
		);
		return () => {
			clearTimeout(timer);
			abort.abort();
		};
	});
</script>

<Field.Field
	><Field.FieldLabel>{label || $_('completion.image')}</Field.FieldLabel>
	<Input
		type="search"
		bind:value={query}
		oninput={() => (page = 0)}
		placeholder={$_('completion.searchPage')}
		aria-label={$_('completion.searchPage')}
	/>
	<Field.FieldDescription>{$_('completion.searchHint')}</Field.FieldDescription>
	{#if value}<div class="flex items-center gap-3">
			{#if selected?.image}<img
					src={selected.image}
					alt=""
					class="size-16 object-cover"
				/>{/if}<span class="min-w-0 break-words">{selected?.title ?? `#${value}`}</span><Button
				variant="ghost"
				onclick={() => {
					value = undefined;
					selected = undefined;
					onChoose?.(undefined);
				}}>{$_('completion.clearImage')}</Button
			>
		</div>{/if}
	{#if truncated}<p class="text-sm text-muted-foreground">
			{$_('apiEvolution.truncated', { values: { max: maximum } })}
		</p>{/if}
	{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
	{#if busy}<p role="status">{$_('completion.loading')}</p>{/if}
	{#if results.length}<div class="max-h-64 overflow-auto border border-border">
			{#each results as item (item.id)}<button
					type="button"
					class="flex w-full items-center gap-3 border-b border-border p-3 text-left hover:bg-primary/10 focus-visible:outline-primary"
					onclick={() => {
						selected = item;
						value = item.id;
						onChoose?.(item);
					}}
					>{#if item.image}<img src={item.image} alt="" class="size-10 object-cover" />{/if}<span
						class="min-w-0 break-words">{item.title}</span
					></button
				>{/each}
		</div>
		<div class="flex justify-between gap-2">
			<Button variant="outline" disabled={page === 0 || busy} onclick={() => page--}
				>{$_('completion.previous')}</Button
			><Button variant="outline" disabled={!hasNext || busy} onclick={() => page++}
				>{$_('completion.next')}</Button
			>
		</div>{/if}
</Field.Field>
