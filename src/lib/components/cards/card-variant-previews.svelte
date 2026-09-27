<script lang="ts">
	import { untrack } from 'svelte';
	import {
		getWikiForgePublicPage,
		type WikiForgePublicPageCard,
		toPublicPageCardRecord
	} from '$lib/api/pages';
	import type { CardRecord } from '$lib/types';
	import VariantSelector from './variant-selector.svelte';
	import VariantCardFace from './variant-card-face.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { card, onResolved }: { card: CardRecord; onResolved?: (card: CardRecord) => void } =
		$props();
	let record = $state<WikiForgePublicPageCard>();
	let selected = $state<number[]>([]);
	let comparison = $state<number[]>([]);
	let compare = $state(false);
	let busy = $state(false);
	let error = $state('');
	let generation = 0;
	const pageId = $derived(
		card.baseCardId ?? card.catalogueId ?? (card.packId == null ? card.id : undefined)
	);
	const variants = $derived(
		record?._variants?.filter((v) => record?.variantIds?.includes(v.id)) ?? []
	);
	async function load() {
		const id = pageId;
		const request = ++generation;
		record = undefined;
		error = '';
		if (!id) return;
		busy = true;
		try {
			const result = await getWikiForgePublicPage(id);
			if (request === generation) {
				record = result;
				onResolved?.(toPublicPageCardRecord(result));
				selected = [
					result.variantIds?.includes(card.variantId) ? card.variantId : result.variantIds?.[0]
				].filter((v): v is number => v != null);
				comparison = result.variantIds?.slice(1, 2) ?? [];
			}
		} catch (cause) {
			if (request === generation) error = operationError(cause);
		} finally {
			if (request === generation) busy = false;
		}
	}
	$effect(() => {
		void pageId;
		untrack(() => void load());
		return () => {
			generation++;
		};
	});
	function preview(id: number) {
		const base = toPublicPageCardRecord(record!);
		return {
			...base,
			variantId: id,
			variant: variants.find((v) => v.id === id)!,
			ownedCount: 0,
			serialNumber: undefined,
			maxCopies: undefined
		};
	}
</script>

<section
	class="mt-4 flex min-w-0 flex-col gap-3 border-t border-primary/20 pt-4"
	aria-label={$_('ux.variants')}
>
	<h3 class="forge-label">{$_('completion.availableVariants')}</h3>
	{#if busy}<p role="status">{$_('completion.loading')}</p>{:else if error}<p role="alert">
			{error}
		</p>
		<Button variant="outline" onclick={load}>{$_('completion.retry')}</Button
		>{:else if variants.length}
		<p class="text-xs text-muted-foreground">{$_('ux.preview')}</p>
		<div class="flex flex-wrap items-center gap-2">
			<VariantSelector options={variants} bind:selected multiple={false} /><label
				class="flex min-h-11 items-center gap-2 text-sm"
				><input type="checkbox" bind:checked={compare} />{$_('ux.compare')}</label
			>{#if compare}<VariantSelector
					options={variants}
					bind:selected={comparison}
					multiple={false}
				/>{/if}
		</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each (compare ? [...selected, ...comparison] : selected).filter( (id) => variants.some((v) => v.id === id) ) as id, index (`${id}-${index}`)}<div
					class="mx-auto w-full max-w-52"
				>
					<VariantCardFace card={preview(id)} />
					<p class="mt-2 text-center text-xs">{variants.find((v) => v.id === id)?.name}</p>
				</div>{/each}
		</div>
	{:else}<p class="text-sm text-muted-foreground">{$_('ux.variantsUnavailable')}</p>{/if}
</section>
