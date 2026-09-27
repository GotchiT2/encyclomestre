<script lang="ts">
	import { untrack } from 'svelte';
	import { getWikiForgeCollectionPage, type CollectionPageResult } from '$lib/api/collection';
	import type { CardRecord } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { onChoose }: { onChoose: (card: CardRecord) => void } = $props();
	let query = $state('');
	let result = $state<CollectionPageResult>();
	let busy = $state(false);
	let error = $state('');
	let positions = $state<Array<{ cursor?: string; page: number }>>([{ page: 0 }]);
	let index = $state(0);
	let generation = 0;
	async function load(cursor?: string, page = 0, signal?: AbortSignal) {
		const request = ++generation;
		busy = true;
		error = '';
		try {
			const next = await getWikiForgeCollectionPage({ query, cursor, page }, { signal });
			if (!signal?.aborted && request === generation) {
				result = next;
				return true;
			}
		} catch (cause) {
			if (!signal?.aborted && request === generation) error = operationError(cause);
		} finally {
			if (!signal?.aborted && request === generation) busy = false;
		}
	}
	$effect(() => {
		const q = query;
		const abort = new AbortController();
		const timer = setTimeout(
			() =>
				untrack(() => {
					void q;
					positions = [{ page: 0 }];
					index = 0;
					void load(undefined, 0, abort.signal);
				}),
			300
		);
		return () => {
			clearTimeout(timer);
			abort.abort();
		};
	});
</script>

<div class="flex flex-col gap-3">
	<Input type="search" bind:value={query} aria-label={$_('completion.guild.card')} />{#if error}<p
			role="alert"
		>
			{error}
		</p>{/if}
	<div class="max-h-60 overflow-y-auto">
		{#each result?.items ?? [] as card (card.id)}<button
				type="button"
				class="flex w-full items-center gap-3 border-b border-border p-3 text-left hover:bg-primary/10"
				onclick={() => onChoose(card)}
				><img src={card.imageUrl} alt="" class="size-10 object-cover" /><span
					>{card.title} · {card.variant.name} · #{card.id}</span
				></button
			>{/each}
	</div>
	<div class="flex justify-between gap-2">
		<Button
			variant="outline"
			disabled={busy || index === 0}
			onclick={async () => {
				const position = positions[index - 1];
				if (await load(position.cursor, position.page)) index--;
			}}>{$_('completion.previous')}</Button
		>
		<Button
			variant="outline"
			disabled={busy || !result?.hasNext}
			onclick={async () => {
				const position = {
					cursor: result?.nextCursor ?? undefined,
					page: result?.nextCursor ? 0 : (result?.page ?? 0) + 1
				};
				if (await load(position.cursor, position.page)) {
					positions = [...positions.slice(0, index + 1), position];
					index++;
				}
			}}>{$_('completion.next')}</Button
		>
	</div>
</div>
