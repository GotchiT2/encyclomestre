<script lang="ts">
	import LocalDraft from '$lib/components/layout/local-draft.svelte';
	import { draftKey, writeDraft } from '$lib/drafts/storage';
	import { currentSession } from '$lib/auth/session';
	import { operationError } from '$lib/domain/operation-error';
	import CardPicker from './card-picker.svelte';
	import CollectionVitrine from './collection-vitrine.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, CollectionTag, Showcase } from '$lib/types';
	import type { CollectionQuery } from '$lib/api';
	import { untrack } from 'svelte';

	type DraftLine = { key: string; title: string; cards: CardRecord[] };
	let {
		showcase,
		collection,
		tags = [],
		money,
		saving = false,
		buying = false,
		onSave,
		onBuySlot,
		hasMoreCards = false,
		loadingMoreCards = false,
		onLoadMoreCards,
		onFiltersChange
	}: {
		showcase: Showcase;
		collection: CardRecord[];
		tags?: CollectionTag[];
		money: number;
		saving?: boolean;
		buying?: boolean;
		onSave: (lines: Array<{ title: string; cardIds: string[] }>) => void | Promise<void>;
		onBuySlot: () => void;
		hasMoreCards?: boolean;
		loadingMoreCards?: boolean;
		onLoadMoreCards?: () => void;
		onFiltersChange?: (filters: CollectionQuery) => void;
	} = $props();

	let lines = $state<DraftLine[]>(
		untrack(() =>
			showcase.lines.map((line, index) => ({
				key: `line-${index}`,
				title: line.title,
				cards: [...line.cards]
			}))
		)
	);
	let pickerOpen = $state(false);
	let targetLineKey = $state<string | null>(null);
	let dragged = $state<{ lineKey: string; cardId: string } | null>(null);
	let nextKey = $state(untrack(() => lines.length));
	const usedIds = $derived(new Set(lines.flatMap((line) => line.cards.map((card) => card.id))));
	const usedCount = $derived(usedIds.size);

	function addLine() {
		if (lines.length >= 50) return;
		lines = [...lines, { key: `line-${nextKey++}`, title: '', cards: [] }];
	}
	function openPicker(key: string) {
		targetLineKey = key;
		pickerOpen = true;
	}
	function addCard(card: CardRecord) {
		if (!targetLineKey || usedIds.has(card.id) || usedCount >= showcase.slots) return;
		lines = lines.map((line) =>
			line.key === targetLineKey ? { ...line, cards: [...line.cards, card] } : line
		);
	}
	function removeCard(lineKey: string, cardId: string) {
		lines = lines.map((line) =>
			line.key === lineKey
				? { ...line, cards: line.cards.filter((card) => card.id !== cardId) }
				: line
		);
	}
	function renameLine(lineKey: string, title: string) {
		lines = lines.map((line) => (line.key === lineKey ? { ...line, title } : line));
	}
	function moveCard(lineKey: string, cardId: string, delta: -1 | 1) {
		lines = lines.map((line) => {
			if (line.key !== lineKey) return line;
			const index = line.cards.findIndex((card) => card.id === cardId);
			const target = index + delta;
			if (target < 0 || target >= line.cards.length) return line;
			announcement = $_('ux.position', {
				values: { position: target + 1, total: line.cards.length }
			});
			const cards = [...line.cards];
			[cards[index], cards[target]] = [cards[target], cards[index]];
			return { ...line, cards };
		});
	}
	function dropCard(targetLineKey: string, targetIndex: number) {
		const source = dragged;
		dragged = null;
		if (!source) return;
		const sourceLine = lines.find((line) => line.key === source.lineKey);
		const sourceIndex = sourceLine?.cards.findIndex((card) => card.id === source.cardId) ?? -1;
		const card = sourceLine?.cards[sourceIndex];
		if (!card || sourceIndex < 0) return;
		if (source.lineKey === targetLineKey && targetIndex < sourceLine!.cards.length) {
			lines = lines.map((line) => {
				if (line.key !== targetLineKey) return line;
				const cards = [...line.cards];
				[cards[sourceIndex], cards[targetIndex]] = [cards[targetIndex], cards[sourceIndex]];
				return { ...line, cards };
			});
			return;
		}
		const adjustedIndex =
			source.lineKey === targetLineKey && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
		let next = lines.map((line) =>
			line.key === source.lineKey
				? { ...line, cards: line.cards.filter((entry) => entry.id !== source.cardId) }
				: line
		);
		next = next.map((line) => {
			if (line.key !== targetLineKey) return line;
			const cards = [...line.cards];
			cards.splice(Math.max(0, Math.min(adjustedIndex, cards.length)), 0, card);
			return { ...line, cards };
		});
		lines = next;
	}
	let error = $state('');
	let savingLocal = $state(false);
	let announcement = $state('');
	async function save() {
		if (savingLocal || saving) return;
		savingLocal = true;
		error = '';
		try {
			await onSave(
				lines
					.filter((line) => line.cards.length)
					.map((line) => ({ title: line.title.trim(), cardIds: line.cards.map((card) => card.id) }))
			);
			writeDraft(localStorage, draftKey($currentSession?.user.id ?? '', 'showcase'), '');
		} catch (cause) {
			error = operationError(cause);
		} finally {
			savingLocal = false;
		}
	}
</script>

<section class="flex flex-col gap-4">
	<LocalDraft
		target="showcase"
		value={JSON.stringify(lines)}
		onRestore={(value) => {
			try {
				const parsed = JSON.parse(value);
				if (
					Array.isArray(parsed) &&
					parsed.length <= 50 &&
					parsed.every(
						(line) =>
							typeof line.title === 'string' &&
							Array.isArray(line.cards) &&
							line.cards.every((card: CardRecord) => typeof card.id === 'string' && card.variant)
					)
				) {
					lines = parsed.map((line, index) => ({ ...line, key: `line-${index}` }));
					nextKey = lines.length;
				}
			} catch {
				error = $_('common.error');
			}
		}}
	/>
	{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
	<p class="sr-only" aria-live="polite">{announcement}</p>
	<div class="forge-panel-flat flex flex-wrap items-center justify-between gap-3 p-4">
		<div>
			<p class="forge-label">
				{$_('profile.showcase_capacity', { values: { count: usedCount, limit: showcase.slots } })}
			</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{$_('profile.showcase_slot_limit', { values: { max: showcase.maxSlots } })}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="outline" disabled={lines.length >= 50} onclick={addLine}
				>{$_('profile.add_showcase_line')}</Button
			><Button
				variant="outline"
				disabled={buying || showcase.slots >= showcase.maxSlots || money < showcase.slotPrice}
				onclick={onBuySlot}
				>{$_('profile.buy_showcase_slot', { values: { price: showcase.slotPrice } })}</Button
			><Button
				disabled={saving ||
					savingLocal ||
					usedCount > showcase.slots ||
					lines.some((line) => line.cards.length && !line.title.trim())}
				onclick={save}>{saving ? $_('common.loading') : $_('common.save')}</Button
			>
		</div>
	</div>

	<div class="flex flex-col gap-0">
		{#each lines as line, lineIndex (line.key)}
			<section>
				<div class="flex gap-2">
					<Button
						variant="outline"
						disabled={lineIndex === 0}
						onclick={() => {
							const next = [...lines];
							[next[lineIndex - 1], next[lineIndex]] = [next[lineIndex], next[lineIndex - 1]];
							lines = next;
							announcement = $_('ux.position', {
								values: { position: lineIndex, total: lines.length }
							});
						}}>{$_('ux.moveLineUp')}</Button
					><Button
						variant="outline"
						disabled={lineIndex === lines.length - 1}
						onclick={() => {
							const next = [...lines];
							[next[lineIndex + 1], next[lineIndex]] = [next[lineIndex], next[lineIndex + 1]];
							lines = next;
							announcement = $_('ux.position', {
								values: { position: lineIndex + 2, total: lines.length }
							});
						}}>{$_('ux.moveLineDown')}</Button
					>
				</div>
				<CollectionVitrine
					title={line.title || $_('profile.showcase_line_title')}
					cards={line.cards}
					perRow={5}
					maxPerRow={5}
					onMove={(cardId, delta) => moveCard(line.key, cardId, delta)}
					onRemove={(cardId) => removeCard(line.key, cardId)}
					onRename={(title) => renameLine(line.key, title)}
					onAddAt={() => openPicker(line.key)}
					onDragStart={(cardId) => (dragged = { lineKey: line.key, cardId })}
					onDragEnd={() => (dragged = null)}
					onDropAt={(index) => dropCard(line.key, index)}
				/>
			</section>
		{/each}
	</div>
	{#if !lines.length}<button
			class="forge-panel-flat min-h-32 border-dashed text-primary"
			onclick={addLine}>{$_('profile.add_first_showcase_line')}</button
		>{/if}
</section>

<CardPicker
	bind:open={pickerOpen}
	cards={collection.filter((card) => !usedIds.has(card.id))}
	{tags}
	title={$_('profile.select_cards')}
	onSelect={addCard}
	hasMore={hasMoreCards}
	loadingMore={loadingMoreCards}
	onLoadMore={onLoadMoreCards}
	{onFiltersChange}
/>
