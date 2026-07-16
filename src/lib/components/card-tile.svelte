<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardEffects from '$lib/components/cards/card-effects.svelte';
	import type { CardRecord, CollectionTag } from '$lib/types';

	let {
		card,
		showFriendOwners = true,
		tags = [],
		onOpen
	}: {
		card: CardRecord;
		showFriendOwners?: boolean;
		tags?: CollectionTag[];
		onOpen?: (card: CardRecord) => void;
	} = $props();

	const frameByRarity = {
		Commune: '/images/card-C-empty.png',
		'Peu Commune': '/images/card-PC-empty.png',
		Rare: '/images/card-R-empty.png',
		'Super-Rare': '/images/card-SR-empty.png',
		'Ultra-Rare': '/images/card-UR-empty.png',
		Légendaire: '/images/card-L-empty.png'
	} satisfies Record<CardRecord['rarity'], string>;

	const frameSource = $derived(
		card.rarity === 'Légendaire' && card.isFullArt
			? '/images/card-L---Overframe-empty.png'
			: frameByRarity[card.rarity]
	);
	const isFullArt = $derived(card.rarity === 'Légendaire' && card.isFullArt);
	const titleLength = $derived(Math.max(1, card.title.trim().length));
	const hasTilt = $derived(['R', 'SR', 'UR', 'L'].includes(card.rarityInitials));
	const hasIllustrationEffect = $derived(['PC', 'R'].includes(card.rarityInitials));
	let pointerX = $state(50);
	let pointerY = $state(50);
	let activeInteraction = $state(false);
	const titleFontStyle = $derived(
		`--card-title-mobile:${Math.min(0.78, Math.max(0.3, 13.5 / titleLength)).toFixed(3)}rem;--card-title-desktop:${Math.min(1.18, Math.max(0.45, 23 / titleLength)).toFixed(3)}rem`
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
			class="absolute right-[9%] left-[9%] overflow-hidden bg-cover bg-center bg-no-repeat {isFullArt
				? 'top-[6.3%] bottom-[9.9%]'
				: 'top-[7%] bottom-[45.2%] bg-white'}"
			style={`background-image:url(${JSON.stringify(card.imageUrl)})`}
			data-testid="card-art"
		>
			<CardEffects rarity={card.rarityInitials} active={activeInteraction} />
		</div>
		<img
			src={frameSource}
			alt=""
			class="pointer-events-none absolute inset-0 z-10 size-full drop-shadow-[0_14px_16px_rgb(0_0_0_/_45%)]"
		/>
		<p
			class="absolute right-[15%] left-[15%] z-20 flex items-center whitespace-nowrap font-serif font-bold text-[length:var(--card-title-mobile)] text-[#f8cf51] drop-shadow-[0_2px_1px_rgb(0_0_0_/_85%)] lg:text-[length:var(--card-title-desktop)] {isFullArt
				? 'top-[75.6%] h-[9.8%]'
				: 'top-[55.9%] h-[8.6%]'}"
			style={titleFontStyle}
		>
			{card.title}
		</p>
		{#if !isFullArt}
			<p
				class="absolute top-[67%] right-[15%] left-[15%] z-20 line-clamp-2 h-[14%] overflow-hidden text-ellipsis font-serif text-[0.6rem] leading-[1.35] text-[#f8e3a0] lg:line-clamp-3 lg:text-[0.8rem]"
			>
				{card.shortDescription}
			</p>
		{/if}
		<p
			class="absolute right-[62%] bottom-[3.8%] left-[13%] z-20 truncate text-center font-serif text-[0.55rem] font-bold text-[#f8c943] drop-shadow-[0_2px_1px_rgb(0_0_0_/_85%)] lg:text-[0.8rem]"
			aria-label={`ATK ${card.attack}`}
		>
			{card.attack.toLocaleString('fr-FR')}
		</p>
		<p
			class="absolute right-[13%] bottom-[3.8%] left-[75%] z-20 truncate text-center font-serif text-[0.55rem] font-bold text-[#f8c943] drop-shadow-[0_2px_1px_rgb(0_0_0_/_85%)] lg:text-[0.8rem]"
			aria-label={`DEF ${card.defense}`}
		>
			{card.defense.toLocaleString('fr-FR')}
		</p>
	</div>
	{#if onOpen}
		<button
			type="button"
			class="absolute inset-0 rounded-none outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-primary"
			aria-label={card.title}
			onclick={handleOpen}
		></button>
	{/if}
	{#if tags.length}
		<div class="absolute right-[8%] bottom-[11%] left-[8%] z-10 flex items-center gap-1">
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
	{#if showFriendOwners && card.friendsWhoOwn.length}
		<details
			class="group/friends absolute right-[8%] bottom-[17%] z-10 border border-primary/50 bg-background/90 px-1.5 py-0.5"
		>
			<summary
				class="cursor-pointer list-none font-mono text-[8px] font-bold uppercase tracking-widest text-primary"
				>{card.friendsWhoOwn.length} · {$_('codex.friends')}</summary
			>
			<ul
				class="absolute right-0 bottom-full mb-2 hidden min-w-40 border border-primary/40 bg-card p-2 shadow-xl group-open/friends:block"
			>
				{#each card.friendsWhoOwn as friend (friend.friendId)}
					<li
						class="flex items-center justify-between gap-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground"
					>
						<span class="truncate">@{friend.username}</span><span class="text-primary"
							>×{friend.ownedCount}</span
						>
					</li>
				{/each}
			</ul>
		</details>
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
