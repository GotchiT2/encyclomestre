<script lang="ts">
	import { _ } from '$lib/i18n';
	import { getWikiForgeCard } from '$lib/api';
	import { cn } from '$lib/utils';
	import type { CardRecord, CollectionTag } from '$lib/types';
	let {
		card,
		showFriendOwners = true,
		tags = []
	}: { card: CardRecord; showFriendOwners?: boolean; tags?: CollectionTag[] } = $props();
	let detail = $state<CardRecord | null>(null);
	async function openDetail(event: MouseEvent) {
		event.preventDefault();
		try {
			const response = await getWikiForgeCard(card.id);
			detail = { ...card, title: response.wikipediaTitle, imageUrl: response.imageUrl || card.imageUrl, rarity: response.rarity as CardRecord['rarity'], attack: response.atk ?? 0, defense: response.def ?? 0, shortDescription: response.category ?? '' };
		} catch { detail = card; }
	}
</script>

<article
	class={cn(
		'relative aspect-[5/7] min-w-0 border border-primary/40 bg-card p-2 shadow-sm',
		card.isFullArt && 'p-0'
	)}
>
	<a
		href={`/cards/${card.id}`}
		class="group flex h-full flex-col transition-colors hover:border-primary/70"
		onclick={openDetail}
	>
		<div
			class={cn(
				'border border-primary/20 bg-black p-1',
				card.isFullArt && 'absolute inset-0 border-0 bg-transparent p-0'
			)}
		>
			<div
				class={cn(
					'relative overflow-hidden bg-secondary',
					card.isFullArt ? 'size-full' : 'aspect-[4/3]'
				)}
			>
				<img
					src={card.imageUrl}
					alt={card.title}
					class="size-full object-cover opacity-75 transition-opacity group-hover:opacity-100"
				/>
				<span
					class="absolute top-2 left-2 border-2 px-2 py-1 font-mono text-xs font-bold uppercase tracking-widest"
					style={`background-color:${card.rarityColor};color:white`}>{card.rarityInitials}</span
				>
			</div>
		</div>
		<div
			class={cn(
				'flex flex-1 flex-col gap-1 pt-2',
				tags.length || showFriendOwners ? 'pb-9' : 'pb-2',
				card.isFullArt &&
					`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent p-3 pt-12 ${showFriendOwners ? 'pb-12' : 'pb-3'}`
			)}
		>
			<p
				class="font-mono text-[10px] uppercase tracking-widest"
				style={`color:${card.rarityColor}`}
			>
				{card.rarity}
			</p>
			<h2
				class="min-h-5 font-serif text-base font-black uppercase tracking-tight text-foreground text-[0.705rem]"
			>
				{card.title}
			</h2>
			<p
				class="line-clamp-2 min-h-8 font-serif text-[0.55rem] italic leading-relaxed text-muted-foreground"
			>
				{card.shortDescription}
			</p>
		</div>
	</a>
	{#if tags.length}<div class="absolute right-2 bottom-2 left-2 flex items-center gap-1">
			{#each tags.slice(0, 2) as tag (tag.id)}<span
					class="max-w-20 truncate border border-primary/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-background"
					style={`background-color:${tag.color}`}>{tag.name}</span
				>{/each}
			{#if tags.length > 2}<details class="group/tags relative shrink-0">
					<summary
						class="cursor-pointer list-none border border-primary/70 bg-card px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary"
						aria-label={$_('collection.moreTags', { values: { count: tags.length - 2 } })}
						>+{tags.length - 2}</summary
					>
					<ul
						class="absolute bottom-full left-0 mb-2 hidden min-w-32 border border-primary/40 bg-card p-2 shadow-xl group-hover/tags:block group-open/tags:block"
					>
						{#each tags.slice(2) as tag (tag.id)}<li
								class="mb-1 last:mb-0 border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-background"
								style={`background-color:${tag.color}`}
							>
								{tag.name}
							</li>{/each}
					</ul>
				</details>{/if}
		</div>{/if}
	{#if showFriendOwners && card.friendsWhoOwn.length}
		<details
			class="group/friends absolute bottom-2 right-2 z-10 border border-primary/40 bg-card px-2 py-1 shadow-lg"
		>
			<summary
				class="cursor-pointer list-none font-mono text-[10px] font-bold uppercase tracking-widest text-primary"
				>{card.friendsWhoOwn.length} · {$_('codex.friends')}</summary
			>
			<ul
				class="absolute bottom-full right-0 mb-2 hidden min-w-40 border border-primary/40 bg-card p-2 shadow-xl group-hover/friends:block group-open/friends:block"
			>
				{#each card.friendsWhoOwn as friend (friend.friendId)}<li
						class="flex items-center justify-between gap-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground"
					>
						<span class="truncate">@{friend.username}</span><span class="text-primary"
							>×{friend.ownedCount}</span
						>
					</li>{/each}
			</ul>
		</details>
	{/if}
{#if detail}<div class="fixed inset-0 z-50 bg-black/75 p-4" onclick={() => (detail = null)}><dialog open class="fixed top-1/2 left-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-4 border-double border-primary/40 bg-card p-5 text-foreground" onclick={(event) => event.stopPropagation()}><button class="absolute top-4 right-4 border border-primary/50 bg-card px-3 py-1 font-mono text-primary" onclick={() => (detail = null)}>×</button><section class="grid gap-5 sm:grid-cols-[minmax(12rem,.45fr)_minmax(0,1fr)]"><div class="border border-primary/30 bg-black p-2"><img src={detail.imageUrl} alt={detail.title} class="aspect-[4/3] w-full object-cover" /></div><div><p class="font-mono text-xs uppercase tracking-widest" style={`color:${detail.rarityColor}`}>{detail.rarityInitials} · {detail.rarity}</p><h2 class="mt-2 font-serif text-3xl font-black uppercase">{detail.title}</h2><p class="mt-3 font-serif italic leading-relaxed text-muted-foreground">{detail.shortDescription}</p><dl class="mt-5 grid grid-cols-2 divide-x divide-primary/20 border-y border-primary/20"><div class="py-3"><dt class="font-mono text-[9px] text-muted-foreground">ATTAQUE</dt><dd class="font-mono text-xl text-primary">{detail.attack}</dd></div><div class="pl-3 py-3"><dt class="font-mono text-[9px] text-muted-foreground">DÉFENSE</dt><dd class="font-mono text-xl text-primary">{detail.defense}</dd></div></dl>{#if tags.length}<div class="mt-4 flex flex-wrap gap-1">{#each tags as tag (tag.id)}<span class="border px-2 py-1 font-mono text-[9px] uppercase" style={`border-color:${tag.color};color:${tag.color}`}>{tag.name}</span>{/each}</div>{/if}</div></section></dialog></div>{/if}
</article>
