<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { MediaQuery } from 'svelte/reactivity';
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import type { CardRecord } from '$lib/types/card';

	let {
		title,
		cards,
		owned = false,
		perRow = 5,
		maxPerRow = perRow,
		onMove,
		onRemove,
		onAddAt,
		onRename,
		onDragStart,
		onDragEnd,
		onDropAt
	}: {
		title: string;
		cards: CardRecord[];
		owned?: boolean;
		/** Cartes par étagère. Plafonné plus bas sur les petites largeurs. */
		perRow?: number;
		/** Plus grand `perRow` de la page : sert à garder une taille de carte commune. */
		maxPerRow?: number;
		onMove?: (cardId: string, delta: -1 | 1) => void;
		onRemove?: (cardId: string) => void;
		onAddAt?: (index: number) => void;
		onRename?: (title: string) => void;
		onDragStart?: (cardId: string) => void;
		onDragEnd?: () => void;
		onDropAt?: (index: number) => void;
	} = $props();

	// Les paliers reprennent ceux de la feuille de style d'origine. Le découpage doit
	// connaître le nombre effectif de colonnes : sinon la grille reboucle et des cartes
	// se retrouvent sans étagère sous elles.
	const wide = new MediaQuery('(min-width: 901px)');
	const medium = new MediaQuery('(min-width: 561px)');
	const cap = (value: number) =>
		wide.current ? value : medium.current ? Math.min(value, 3) : Math.min(value, 2);

	const columns = $derived(cap(perRow));
	// Toutes les vitrines calent leur largeur de carte sur la plus dense de la page.
	const widestColumns = $derived(Math.max(cap(maxPerRow), columns));

	/** Découpe en rangées de `columns` exactement, la dernière complétée par des vides. */
	const rows = $derived.by(() => {
		const size = Math.max(1, columns);
		const chunks: Array<Array<CardRecord | null>> = [];
		for (let index = 0; index < cards.length; index += size) {
			chunks.push(cards.slice(index, index + size));
		}
		if (!chunks.length) chunks.push([]);
		// Une étagère pleine garde une rangée suivante vide : elle reste le point
		// d'ajout de cette même vitrine plutôt que de forcer une nouvelle collection.
		if (onAddAt && cards.length > 0 && cards.length % size === 0) chunks.push([]);
		const last = chunks[chunks.length - 1];
		while (last.length < size) last.push(null);
		return chunks;
	});

	let root = $state<HTMLElement | null>(null);
	let menu = $state<{ cardId: string; index: number; x: number; y: number } | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function openMenu(cardId: string, index: number, x: number, y: number) {
		const box = root?.getBoundingClientRect();
		if (!box) return;
		menu = { cardId, index, x: x - box.left, y: y - box.top };
	}

	function handleContextMenu(event: MouseEvent, cardId: string, index: number) {
		if (!onMove && !onRemove) return;
		event.preventDefault();
		openMenu(cardId, index, event.clientX, event.clientY);
	}

	/** Le clavier n'a pas de clic droit : Entrée ou Espace ouvre le même menu. */
	function handleKeydown(event: KeyboardEvent, cardId: string, index: number) {
		if (!onMove && !onRemove) return;
		if (event.target !== event.currentTarget) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		openMenu(cardId, index, box.left + box.width / 2, box.top + box.height / 2);
	}

	function run(action: () => void) {
		action();
		menu = null;
	}
</script>

<svelte:window
	onclick={() => (menu = null)}
	onkeydown={(event) => event.key === 'Escape' && (menu = null)}
/>

<section
	class="vitrine"
	bind:this={root}
	style={`--par-ligne:${columns};--colonnes-max:${widestColumns}`}
>
	{#each rows as row, rowIndex (rowIndex)}
		<div class="vitrine__rangee">
			{#each row as card, slotIndex (card?.id ?? `vide-${slotIndex}`)}
				{@const index = rowIndex * columns + slotIndex}
				{#if card}
					<div
						class="vitrine__carte"
						class:vitrine__carte--cible={dragOverIndex === index}
						draggable={Boolean(onDragStart || onDropAt)}
						aria-label={card.title}
						role="button"
						tabindex="0"
						aria-haspopup={onMove || onRemove ? 'menu' : undefined}
						title={card.title}
						oncontextmenu={(event) => handleContextMenu(event, card.id, index)}
						onkeydown={(event) => handleKeydown(event, card.id, index)}
						ondragstart={(event) => {
							// Firefox exige une charge utile pour amorcer le glisser.
							event.dataTransfer?.setData('text/plain', card.id);
							onDragStart?.(card.id);
						}}
						ondragend={() => {
							dragOverIndex = null;
							onDragEnd?.();
						}}
						ondragover={(event) => {
							event.preventDefault();
							dragOverIndex = index;
						}}
						ondragleave={() => dragOverIndex === index && (dragOverIndex = null)}
						ondrop={(event) => {
							event.preventDefault();
							dragOverIndex = null;
							onDropAt?.(index);
						}}
					>
						<CardTile {owned} {card} showFriendOwners={false} showCollectionState={false} />
						{#if onRemove}<Button variant="ghost" class="w-full" onclick={() => onRemove?.(card.id)}
								>{$_('profile.remove_from_showcase')}</Button
							>{/if}
						{#if onMove}<div class="flex flex-wrap gap-1">
								<Button
									variant="outline"
									size="icon"
									aria-label={$_('profile.move_left')}
									disabled={index === 0}
									onclick={() => onMove?.(card.id, -1)}>←</Button
								><Button
									variant="outline"
									size="icon"
									aria-label={$_('profile.move_right')}
									disabled={index === cards.length - 1}
									onclick={() => onMove?.(card.id, 1)}>→</Button
								>
							</div>{/if}
					</div>
				{:else}
					{@const isNextEmpty = slotIndex === row.findIndex((entry) => entry === null)}
					{#if isNextEmpty && onAddAt}
						<button
							type="button"
							class="vitrine__carte vitrine__carte--vide"
							class:vitrine__carte--cible={dragOverIndex === index}
							aria-label={$_('profile.add_card_to_showcase')}
							onclick={() => onAddAt?.(index)}
							ondragover={(event) => {
								event.preventDefault();
								dragOverIndex = index;
							}}
							ondragleave={() => dragOverIndex === index && (dragOverIndex = null)}
							ondrop={(event) => {
								event.preventDefault();
								dragOverIndex = null;
								onDropAt?.(index);
							}}
						></button>
					{:else}
						<div
							class="vitrine__carte vitrine__carte--vide"
							class:vitrine__carte--cible={dragOverIndex === index}
							role="presentation"
							ondragover={(event) => {
								event.preventDefault();
								dragOverIndex = index;
							}}
							ondragleave={() => dragOverIndex === index && (dragOverIndex = null)}
							ondrop={(event) => {
								event.preventDefault();
								dragOverIndex = null;
								onDropAt?.(index);
							}}
						></div>
					{/if}
				{/if}
			{/each}
		</div>
		{#if rowIndex < rows.length - 1}
			<div class="vitrine__etagere vitrine__etagere--fine"></div>
		{:else}
			<div class="vitrine__etagere">
				{#if onRename}
					<input
						class="vitrine__plaque vitrine__plaque--editable"
						value={title}
						maxlength="64"
						aria-label={$_('profile.showcase_line_name')}
						oninput={(event) => onRename?.(event.currentTarget.value)}
					/>
				{:else}
					<span class="vitrine__plaque">{title}</span>
				{/if}
			</div>
		{/if}
	{/each}

	{#if menu}
		<div
			class="vitrine__menu"
			style={`left:${menu.x}px;top:${menu.y}px`}
			role="menu"
			tabindex="-1"
			aria-label={title}
		>
			<button
				type="button"
				role="menuitem"
				disabled={menu.index === 0}
				onclick={() => run(() => onMove?.(menu!.cardId, -1))}
			>
				{$_('profile.move_left')}
			</button>
			<button
				type="button"
				role="menuitem"
				disabled={menu.index === cards.length - 1}
				onclick={() => run(() => onMove?.(menu!.cardId, 1))}
			>
				{$_('profile.move_right')}
			</button>
			<button
				type="button"
				role="menuitem"
				class="vitrine__menu-danger"
				onclick={() => run(() => onRemove?.(menu!.cardId))}
			>
				{$_('profile.remove_from_showcase')}
			</button>
		</div>
	{/if}
</section>

<style>
	.vitrine {
		position: relative;
		border: 1px solid var(--border);
		padding: 1rem;
		background: var(--card);
		--gap: 0.75rem;
		width: 100%;
		max-width: calc(
			var(--colonnes-max) * 144px + (var(--colonnes-max) - 1) * var(--gap) + 2rem + 2px
		);
	}
	.vitrine__rangee {
		display: grid;
		grid-template-columns: repeat(var(--par-ligne), minmax(0, 144px));
		gap: var(--gap);
		align-items: start;
		margin-bottom: 1rem;
	}
	.vitrine__carte {
		min-width: 0;
		position: relative;
		outline-offset: 3px;
	}
	.vitrine__carte--vide {
		aspect-ratio: 1/1.416;
		min-height: 44px;
		border: 1px dashed var(--border);
		background: var(--background);
	}
	button.vitrine__carte--vide::after {
		content: '+';
		font:
			600 2rem 'Barlow Condensed',
			sans-serif;
		color: var(--primary);
	}
	.vitrine__carte--cible {
		outline: 3px solid var(--primary);
	}
	.vitrine__etagere--fine {
		border-top: 1px solid var(--border);
		margin-bottom: 1rem;
	}
	.vitrine__etagere:not(.vitrine__etagere--fine) {
		border-top: 2px solid var(--primary);
		padding-top: 0.75rem;
	}
	.vitrine__plaque {
		display: block;
		width: 100%;
		min-height: 44px;
		font:
			700 1.5rem 'Barlow Condensed',
			sans-serif;
		overflow-wrap: anywhere;
		background: transparent;
		color: var(--foreground);
	}
	.vitrine__plaque--editable {
		border: 1px solid var(--border);
		padding: 0.5rem;
	}
	.vitrine__menu {
		position: absolute;
		z-index: 10;
		display: flex;
		flex-direction: column;
		width: min(15rem, 100%);
		max-width: calc(100% - 2rem);
		border: 1px solid var(--border);
		background: var(--popover);
		box-shadow: 0 12px 30px #0005;
	}
	.vitrine__menu > button {
		min-height: 44px;
		padding: 0.5rem;
		text-align: left;
	}
	.vitrine__menu > button:focus-visible,
	.vitrine__menu > button:hover {
		background: var(--accent);
	}
	.vitrine__menu > button:disabled {
		opacity: 0.5;
	}
	.vitrine__menu-danger {
		color: var(--destructive);
	}
</style>
