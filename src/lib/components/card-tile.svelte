<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardEffects from '$lib/components/cards/card-effects.svelte';
	import CardStateIndicators from '$lib/components/cards/card-state-indicators.svelte';
	import FriendOwnershipChip from '$lib/components/cards/friend-ownership-chip.svelte';
	import { nsfwFilterSettings, shouldBlurCardIllustration } from '$lib/content/nsfw-filter';
	import { cn } from '$lib/utils';
	import type { CardRecord, CollectionTag } from '$lib/types';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		card,
		showFriendOwners = true,
		showCollectionState = true,
		tags = [],
		tagDisplay = 'bookmark',
		stateIndicatorsOffset = 0,
		comparisonOwnership,
		onOpen
	}: {
		card: CardRecord;
		showFriendOwners?: boolean;
		/** Masque les indicateurs propres à une collection (quantités, listes et protection). */
		showCollectionState?: boolean;
		tags?: CollectionTag[];
		tagDisplay?: 'bookmark' | 'full';
		stateIndicatorsOffset?: number;
		comparisonOwnership?: { count: number; label: string };
		onOpen?: (card: CardRecord) => void;
	} = $props();

	const frameByRarity = {
		Commune: '/images/templates/commune-v2.png',
		'Peu Commune': '/images/templates/peu-commune-v2.png',
		Rare: '/images/templates/rare-v2.png',
		'Super-Rare': '/images/templates/super-rare-v2.png',
		'Ultra-Rare': '/images/templates/ultra-rare-v2.png',
		Légendaire: '/images/templates/legendaire-v2.png'
	} satisfies Record<CardRecord['rarity'], string>;

	const frameSource = $derived(
		card.rarity === 'Légendaire' && card.isFullArt
			? '/images/card-L---Overframe-empty.png'
			: frameByRarity[card.rarity]
	);
	const isFullArt = $derived(card.rarity === 'Légendaire' && card.isFullArt);
	const titleLength = $derived(Math.max(1, card.title.trim().length));
	const hasTilt = $derived(['PC', 'R', 'SR', 'UR', 'L'].includes(card.rarityInitials));
	const hasIllustrationEffect = $derived(card.rarityInitials !== 'C');
	const illustrationBlurred = $derived(shouldBlurCardIllustration(card, $nsfwFilterSettings));
	let pointerX = $state(50);
	let pointerY = $state(50);
	let activeInteraction = $state(false);
	let landscapeFullArt = $state(false);
	const titleFontStyle = $derived(
		`--card-title-mobile:${Math.min(0.78, Math.max(0.3, 13.5 / titleLength)).toFixed(3)}rem;--card-title-desktop:${Math.min(0.7, Math.max(0.45, 23 / titleLength)).toFixed(3)}rem`
	);

	function handleOpen() {
		onOpen?.(card);
	}

	function updateInteraction(event: PointerEvent) {
		if (!hasTilt && !hasIllustrationEffect) return;
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		pointerX = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
		pointerY = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
		activeInteraction = true;
	}

	function resetInteraction() {
		pointerX = 50;
		pointerY = 50;
		activeInteraction = false;
	}

	const effectStyle = $derived(
		`--card-pointer-x:${pointerX.toFixed(2)};--card-pointer-y:${pointerY.toFixed(2)};--card-rotate-x:${((pointerY - 50) * -0.05).toFixed(2)}deg;--card-rotate-y:${((pointerX - 50) * 0.05).toFixed(2)}deg`
	);
	const artImageClass = $derived(
		cn(
			'size-full',
			isFullArt && landscapeFullArt
				? 'object-contain object-[center_35%]'
				: 'object-cover object-center'
		)
	);

	function inspectIllustration(event: Event) {
		const image = event.currentTarget as HTMLImageElement;
		landscapeFullArt = Boolean(isFullArt) && image.naturalWidth > image.naturalHeight;
	}

	$effect(() => {
		void card.imageUrl;
		void isFullArt;
		landscapeFullArt = false;
	});
</script>

<article
	class="wikiforge-card-size card-effect-host relative overflow-hidden bg-transparent"
	data-testid="card-tile"
	data-frame={frameSource}
	data-layout={isFullArt ? 'full-art' : 'standard'}
	data-rarity={card.rarityInitials}
	data-tilt-active={hasTilt && activeInteraction}
	data-effect-active={hasIllustrationEffect && activeInteraction}
	style={effectStyle}
	onpointermove={updateInteraction}
	onpointerdown={(event) => {
		if (event.pointerType !== 'mouse' && (hasTilt || hasIllustrationEffect)) {
			activeInteraction = true;
		}
	}}
	onpointerleave={resetInteraction}
	onpointerup={resetInteraction}
	onpointercancel={resetInteraction}
	onfocusin={() => {
		if (hasTilt || hasIllustrationEffect) activeInteraction = true;
	}}
	onfocusout={resetInteraction}
>
	<div class="card-effect-visual relative aspect-[862/1221]" aria-hidden="true">
		<div
			class="absolute right-[9%] left-[9%] overflow-hidden {isFullArt
				? 'top-[6.3%] bottom-[9.9%]'
				: 'top-[7%] bottom-[45.2%] bg-white'}"
			class:bg-white={isFullArt && landscapeFullArt}
			data-testid="card-art"
			data-landscape={landscapeFullArt}
		>
			<img
				src={card.imageUrl}
				alt=""
				class={`${artImageClass} ${illustrationBlurred ? 'blur-xl' : ''}`}
				onload={inspectIllustration}
				onerror={(event) => {
					(event.currentTarget as HTMLImageElement).src = '/card-placeholder.svg';
				}}
			/>
			{#if illustrationBlurred}
				<span
					class="absolute inset-0 grid place-items-center bg-background/55 font-mono text-[9px] uppercase tracking-widest text-primary"
					aria-label={$_('cardState.nsfw_blurred')}
					data-testid="card-nsfw-blur"
				></span>
			{/if}
			<CardEffects rarity={card.rarityInitials} fullArt={isFullArt} active={activeInteraction} />
		</div>
		<img
			src={frameSource}
			alt=""
			class="pointer-events-none absolute inset-0 z-10 size-full drop-shadow-[0_14px_16px_rgb(0_0_0_/_45%)]"
		/>
		<p
			class="absolute right-[15%] left-[16%] z-20 flex items-center whitespace-nowrap text-[length:var(--card-title-mobile)] text-[#f8cf51] lg:text-[length:var(--card-title-desktop)] {isFullArt
				? 'top-[75.6%] h-[9.8%]'
				: 'top-[45.5%] h-[8.6%]'}"
			style={titleFontStyle}
		>
			{card.title}
		</p>
		{#if !isFullArt}
			<p
				class="absolute top-[56%] right-[11%] left-[11%] z-20 line-clamp-2 h-[30%] overflow-hidden text-ellipsis text-[0.6rem] leading-[1.35] text-[#f8e3a0] lg:line-clamp-5 lg:text-[0.7rem]"
			>
				{card.shortDescription}
			</p>
		{/if}
		<p
			class="absolute text-center right-[48%] bottom-[3.2%] z-20 truncate text-[0.55rem] font-bold text-[#000] lg:text-[1rem]"
			aria-label={`ATK ${card.attack}`}
		>
			{card.attack.toLocaleString('fr-FR')}
		</p>
	</div>
	{#if card.activeSale}
		<span
			class="pointer-events-none absolute top-[8%] right-[7%] z-30 bg-primary px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-primary-foreground shadow-[0_0_16px_rgb(0_0_0_/_75%)]"
			data-testid="card-active-sale"
		>
			{$_('collection.on_sale')}
		</span>
	{/if}
	{#if onOpen}
		<button
			type="button"
			class="absolute inset-0 z-30 size-auto cursor-pointer rounded-none bg-transparent transition-colors hover:bg-primary/20 focus-visible:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-4px]"
			aria-label={card.title}
			onclick={handleOpen}
		></button>
	{/if}
	{#if tags.length}
		{#if tagDisplay === 'bookmark'}
			<div
				class="pointer-events-none absolute top-[18%] right-[2%] z-30 flex flex-col gap-1"
				data-testid="card-tag-bookmarks"
			>
				{#each tags as tag (tag.id)}
					<span
						class="h-8 w-2.5 border border-l-0 shadow-lg"
						style={`border-color:${tag.color};background:${tag.color}`}
						aria-label={tag.name}
						title={tag.name}
					></span>
				{/each}
			</div>
		{:else}
			<div class="absolute right-[8%] bottom-[11%] left-[8%] z-30 flex items-center gap-1">
				{#each tags.slice(0, 2) as tag (tag.id)}
					<span
						class="max-w-20 truncate border border-primary/70 bg-background/90 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-foreground"
						style={`border-color:${tag.color};color:${tag.color}`}>{tag.name}</span
					>
				{/each}
				{#if tags.length > 2}
					<details class="group/tags relative shrink-0">
						<summary
							class="cursor-pointer list-none border border-primary/70 bg-background/90 px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-primary"
							aria-label={$_('collection.moreTags', { values: { count: tags.length - 2 } })}
							>+{tags.length - 2}</summary
						>
						<ul
							class="absolute bottom-full left-0 mb-2 hidden min-w-32 border border-primary/40 bg-card p-2 shadow-xl group-open/tags:block"
						>
							{#each tags.slice(2) as tag (tag.id)}
								<li
									class="mb-1 last:mb-0 border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
									style={`border-color:${tag.color};color:${tag.color}`}
								>
									{tag.name}
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{/if}
	{/if}
	{#if showFriendOwners && card.friendsWhoOwn.length}
		<FriendOwnershipChip owners={card.friendsWhoOwn} />
	{/if}
	{#if showCollectionState && (card.userProtected || card.ownedCount > 0 || comparisonOwnership?.count || card.wishlistMemberships?.length || card.sharedWishlistMemberships?.length || (showFriendOwners && card.friendsWhoOwn.length))}
		<div
			class="pointer-events-none absolute left-[7%] z-40 flex flex-col items-start gap-1"
			style={`top:calc(8% + ${stateIndicatorsOffset}px)`}
			data-testid="card-left-indicators"
		>
			{#if card.userProtected}
				<span
					class="grid size-7 place-items-center border border-primary/70 bg-background/90 text-primary shadow-lg"
					aria-label={$_('collection.protected_indicator')}
					title={$_('collection.protected_indicator')}
					data-testid="card-protected-indicator"
				>
					<LockIcon class="size-3.5" />
				</span>
			{/if}
			{#if card.ownedCount > 0 || comparisonOwnership?.count || card.wishlistMemberships?.length || card.sharedWishlistMemberships?.length}
				<CardStateIndicators
					ownedCount={card.ownedCount}
					{comparisonOwnership}
					wishlists={card.wishlistMemberships}
					sharedWishlists={card.sharedWishlistMemberships}
					owners={[]}
				/>
			{/if}
		</div>
	{/if}
</article>

<style>
	.card-effect-host {
		perspective: 900px;
		transform-style: preserve-3d;
	}

	.card-effect-visual {
		transform: translateY(0) rotateX(0deg) rotateY(0deg);
		transform-style: preserve-3d;
		transition: transform 220ms ease-out;
		will-change: transform;
	}

	.card-effect-host[data-tilt-active='true'] .card-effect-visual {
		transform: translateY(-0.12rem) rotateX(var(--card-rotate-x)) rotateY(var(--card-rotate-y));
	}

	@media (prefers-reduced-motion: reduce) {
		.card-effect-visual,
		.card-effect-host[data-tilt-active='true'] .card-effect-visual {
			transform: none;
			transition: none;
		}
	}
</style>
