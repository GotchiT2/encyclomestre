<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import type { CardRecord } from '$lib/types/card';

	let {
		title,
		cards,
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
		wide.current ? value : medium.current ? Math.min(value, 4) : Math.min(value, 3);

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
		if (cards.length > 0 && cards.length % size === 0) chunks.push([]);
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
						<CardTile {card} showFriendOwners={false} />
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
						aria-label={$_('profile.showcase_line_name')}
						onchange={(event) => onRename?.(event.currentTarget.value)}
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
	/* ============================================================
	   Vitrine de collections — étagères bois type bibliothèque MNHN
	   Rendu 100% CSS, sans image.

	   Une .vitrine__rangee contient exactement --par-ligne cartes :
	   le découpage est fait au rendu, pas en CSS.
	   ============================================================ */

	.vitrine {
		/* --- réglages --- */
		--par-ligne: 5;
		--colonnes-max: 5;
		--gap: 10px;
		--marge: 30px; /* laisse l'intégralité de la première carte devant le montant */
		--montant: 22px; /* largeur des montants latéraux */
		--h-etagere: 90px; /* voir note « épaisseur » plus bas */
		--h-fine: 28px;
		--h-plateau: 10px; /* dessus de l'étagère, sert au chevauchement */

		/* --- essence --- */
		--bois-0: #0e0804;
		--bois-1: #2a1809;

		position: relative;
		padding: 0 var(--marge) 4px;
		background-image:
			repeating-linear-gradient(to right, rgba(0, 0, 0, 0.4) 0 1px, transparent 1px 52px),
			repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.16) 0 1px, transparent 1px 4px),
			linear-gradient(to bottom, #1c1209, #100a04);
		box-shadow: inset 0 0 70px rgba(0, 0, 0, 0.85);
	}

	/* Montants latéraux. Purement décoratifs : les retirer ne casse rien. */
	.vitrine::before,
	.vitrine::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: var(--montant);
		z-index: 3;
	}
	.vitrine::before {
		left: 0;
		background: linear-gradient(to right, #3a2411, var(--bois-1) 55%, var(--bois-0));
	}
	.vitrine::after {
		right: 0;
		background: linear-gradient(to left, #3a2411, var(--bois-1) 55%, var(--bois-0));
	}

	/* ------------------------------------------------------------
	   Rangée de cartes
	   La largeur de carte est déduite de la vitrine la plus dense de
	   la page (--colonnes-max) et non de --par-ligne : une étagère à
	   1 carte affiche donc une carte de la même taille qu'une étagère
	   à 5. Les rangées moins denses sont centrées.
	   La marge négative fait reposer les cartes sur le plateau.
	   ------------------------------------------------------------ */
	.vitrine__rangee {
		--carte-largeur: calc((100% - (var(--colonnes-max) - 1) * var(--gap)) / var(--colonnes-max));

		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: repeat(var(--par-ligne), var(--carte-largeur));
		justify-content: center;
		gap: var(--gap);
		align-items: end;
		padding-top: 18px;
		margin-bottom: calc(var(--h-plateau) * -0.6);
	}

	/* Emplacement de carte. Le contenu remplit la boîte. */
	.vitrine__carte {
		position: relative;
		width: 100%;
		padding: 0;
		aspect-ratio: 63 / 88;
		border: 0;
		border-radius: 4px;
		overflow: hidden;
		background: transparent;
		box-shadow:
			0 6px 12px -4px rgba(0, 0, 0, 0.85),
			inset 0 0 0 1px rgba(255, 255, 255, 0.12);
	}
	button.vitrine__carte,
	[role='button'].vitrine__carte {
		cursor: grab;
	}
	button.vitrine__carte:active,
	[role='button'].vitrine__carte:active {
		cursor: grabbing;
	}
	button.vitrine__carte:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.vitrine__carte :global(.wikiforge-card-size) {
		width: 100%;
		height: 100%;
	}
	.vitrine__carte :global([data-testid='card-tile']) {
		height: 100%;
	}

	/* Emplacement de complément : tient la colonne sans simuler une carte. */
	.vitrine__carte--vide {
		background: rgba(12, 8, 4, 0.55);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
	}
	button.vitrine__carte--vide {
		cursor: pointer;
	}
	button.vitrine__carte--vide:hover,
	button.vitrine__carte--vide:focus-visible {
		background: color-mix(in srgb, var(--primary) 14%, rgba(12, 8, 4, 0.55));
		box-shadow:
			inset 0 0 0 1px color-mix(in srgb, var(--primary) 75%, transparent),
			0 0 18px color-mix(in srgb, var(--primary) 22%, transparent);
		outline: none;
	}

	/* Cible de dépôt pendant un glisser-déposer. */
	.vitrine__carte--cible {
		box-shadow:
			0 0 0 2px var(--primary),
			0 0 18px rgba(254, 184, 35, 0.55);
	}

	/* ------------------------------------------------------------
	   Étagère principale
	   Le relief est un seul dégradé vertical à arrêts durs en px.
	   ÉPAISSEUR : les arrêts sont calibrés pour --h-etagere: 90px.
	   Changer l'épaisseur impose de remettre tous les arrêts à
	   l'échelle — modifier la seule variable étire la dernière bande.
	   ------------------------------------------------------------ */
	.vitrine__etagere {
		position: relative;
		z-index: 1;
		height: var(--h-etagere);
		background-image:
			repeating-linear-gradient(
				to bottom,
				rgba(0, 0, 0, 0.17) 0 1px,
				rgba(255, 214, 168, 0.05) 1px 2px,
				transparent 2px 6px
			),
			linear-gradient(
				to right,
				rgba(0, 0, 0, 0.5),
				rgba(255, 216, 170, 0.07) 28%,
				rgba(255, 216, 170, 0.03) 72%,
				rgba(0, 0, 0, 0.55)
			),
			linear-gradient(
				to bottom,
				#4b2e19 0,
				#8e5f34 10px,
				#d3a066 10px,
				#d3a066 12px,
				#a5703c 12px,
				#7d4d27 18px,
				#512f18 26px,
				#331e0e 30px,
				#1d1006 30px,
				#1d1006 34px,
				#7a4c28 34px,
				#3d2412 40px,
				#170c04 40px,
				#170c04 42px,
				#3f2614 42px,
				#5b3820 58px,
				#472b16 82px,
				#2a1809 86px,
				#8a5a30 86px,
				#5b3820 89px,
				#0e0804 89px
			);
	}

	/* Ombre portée sur l'étagère du dessous. */
	.vitrine__etagere::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		height: 16px;
		background: linear-gradient(to bottom, rgba(10, 6, 2, 0.7), rgba(10, 6, 2, 0));
	}

	/* Étagère intermédiaire : même profil, sans bandeau ni plaque. */
	.vitrine__etagere--fine {
		height: var(--h-fine);
		background-image:
			repeating-linear-gradient(
				to bottom,
				rgba(0, 0, 0, 0.17) 0 1px,
				rgba(255, 214, 168, 0.05) 1px 2px,
				transparent 2px 6px
			),
			linear-gradient(
				to right,
				rgba(0, 0, 0, 0.5),
				rgba(255, 216, 170, 0.07) 28%,
				rgba(255, 216, 170, 0.03) 72%,
				rgba(0, 0, 0, 0.55)
			),
			linear-gradient(
				to bottom,
				#4b2e19 0,
				#8e5f34 6px,
				#d3a066 6px,
				#d3a066 7px,
				#a5703c 7px,
				#7d4d27 12px,
				#512f18 17px,
				#331e0e 19px,
				#1d1006 19px,
				#1d1006 22px,
				#7a4c28 22px,
				#3d2412 27px,
				#0e0804 27px
			);
	}

	/* ------------------------------------------------------------
	   Plaque de cuivre
	   Les deux premiers radial-gradient sont les vis, le troisième
	   une tache de patine.

	   La plaque se dimensionne sur le titre entre un plancher et la
	   largeur utile de l'étagère : la maquette d'origine tablait sur
	   des titres courts et un intitulé long débordait du bandeau.
	   `line-height` plutôt que flex, sinon l'ellipse ne s'applique pas.
	   ------------------------------------------------------------ */
	.vitrine__plaque {
		position: absolute;
		left: 50%;
		top: 44px;
		transform: translateX(-50%);
		width: max-content;
		min-width: clamp(150px, 30%, 300px);
		max-width: calc(100% - 2 * var(--montant) - 16px);
		padding-inline: 34px; /* dégage les vis */
		height: 40px;
		line-height: 40px;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-radius: 5px;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(11px, 1.7vw, 14px);
		letter-spacing: 0.16em;
		color: #42230c;
		text-shadow: 0 1px 0 rgba(243, 213, 169, 0.45);
		background-image:
			radial-gradient(circle 5px at 15px 50%, #dda86c 0 2px, #8d5423 2px 5px, transparent 5px),
			radial-gradient(
				circle 5px at calc(100% - 15px) 50%,
				#dda86c 0 2px,
				#8d5423 2px 5px,
				transparent 5px
			),
			radial-gradient(ellipse 70px 16px at 32% 38%, rgba(111, 138, 116, 0.18), transparent),
			linear-gradient(to bottom, #e8b177 0, #c98a4a 16%, #a4642c 52%, #89511f 84%, #c9904f 100%);
		box-shadow:
			0 3px 6px rgba(0, 0, 0, 0.6),
			inset 0 0 0 1.5px rgba(246, 220, 178, 0.35);
	}
	.vitrine__plaque--editable {
		border: 0;
		cursor: text;
	}
	.vitrine__plaque--editable:focus {
		outline: 2px solid color-mix(in srgb, var(--primary) 85%, white);
		outline-offset: 2px;
	}

	/* Filet gravé intérieur. */
	.vitrine__plaque::before {
		content: '';
		position: absolute;
		inset: 6px 26px;
		border: 1px solid rgba(91, 49, 16, 0.45);
		border-radius: 2px;
	}

	/* ------------------------------------------------------------
	   Menu contextuel (clic droit, ou Entrée / Espace au clavier)
	   ------------------------------------------------------------ */
	.vitrine__menu {
		position: absolute;
		z-index: 10;
		display: flex;
		min-width: 13rem;
		flex-direction: column;
		border: 1px solid color-mix(in srgb, var(--primary) 45%, transparent);
		background: var(--popover);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
	}
	.vitrine__menu > button {
		padding: 0.6rem 0.85rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--popover-foreground);
		cursor: pointer;
	}
	.vitrine__menu > button:hover:not(:disabled),
	.vitrine__menu > button:focus-visible {
		background: color-mix(in srgb, var(--primary) 18%, transparent);
		outline: none;
	}
	.vitrine__menu > button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}
	.vitrine__menu-danger {
		border-top: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
		color: var(--destructive);
	}

	/* ------------------------------------------------------------
	   Responsive
	   Le plafonnement de --par-ligne est calculé dans le composant :
	   une règle `--par-ligne: min(var(--par-ligne), 4)` serait à la
	   fois auto-référente et perdante face au style inline. Ne
	   restent ici que les mesures sans effet sur le découpage.
	   ------------------------------------------------------------ */
	@media (max-width: 560px) {
		.vitrine {
			--gap: 7px;
			--marge: 20px;
			--montant: 14px;
		}
	}
</style>
