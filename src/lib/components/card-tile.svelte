<script lang="ts">
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardRecord, CollectionTag } from '$lib/types';
	let {
		card,
		showFriendOwners = true,
		tags = []
	}: { card: CardRecord; showFriendOwners?: boolean; tags?: CollectionTag[] } = $props();
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
</article>
