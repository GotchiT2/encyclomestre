<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getProfileSettings, getSales, updateProfileSettings } from '$lib/api';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardPicker from '$lib/components/profile/card-picker.svelte';
	import ProfileGallery from '$lib/components/profile/profile-gallery.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Sheet from '$lib/components/ui/sheet';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type {
		CardRecord,
		ProfileGallery as Gallery,
		ProfileSettings,
		SaleListing
	} from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let settings = $state<ProfileSettings>({
		username: '',
		avatarCardId: null,
		accentColor: '#feb823',
		bioTags: [],
		showcases: [],
		wantedCardIds: [],
		nsfwEnabled: false,
		censoredKeywords: []
	});
	let ownedCards = $state<CardRecord[]>([]);
	let allCards = $state<CardRecord[]>([]);
	let sales = $state<SaleListing[]>([]);
	let loading = $state(true);
	let identityOpen = $state(false);
	let pickerOpen = $state(false);
	let pickerTitle = $state('');
	let pickerCards = $state<CardRecord[]>([]);
	let pickerAction = $state<(card: CardRecord) => void>(() => {});
	let galleryTitle = $state('');
	let editingGalleryId = $state<string | null>(null);
	let galleryEditorOpen = $state(false);
	let newBioTag = $state('');

	onMount(async () => {
		const [collection, catalogue] = await Promise.all([data.collection, data.cards]);
		ownedCards = collection.items;
		allCards = catalogue.items;
		const userId = $currentSession?.user.id ?? 'demo-user';
		const [profile, userSales] = await Promise.all([getProfileSettings(userId), getSales(userId)]);
		settings = profile;
		sales = userSales;
		loading = false;
	});

	async function persist(next: ProfileSettings) {
		settings = next;
		const userId = $currentSession?.user.id ?? 'demo-user';
		settings = await updateProfileSettings(userId, next);
	}

	function openPicker(title: string, cards: CardRecord[], action: (card: CardRecord) => void) {
		pickerTitle = title;
		pickerCards = cards;
		pickerAction = action;
		pickerOpen = true;
	}

	function galleryCards(gallery: Gallery) {
		return gallery.cardIds
			.map((id) => ownedCards.find((card) => card.id === id))
			.filter(Boolean) as CardRecord[];
	}

	function addGallery() {
		const gallery: Gallery = {
			id: crypto.randomUUID(),
			title: $_('profile.new_gallery'),
			cardIds: []
		};
		persist({ ...settings, showcases: [...settings.showcases, gallery] });
	}

	function saveGalleryTitle() {
		if (!editingGalleryId || !galleryTitle.trim()) return;
		persist({
			...settings,
			showcases: settings.showcases.map((gallery) =>
				gallery.id === editingGalleryId ? { ...gallery, title: galleryTitle.trim() } : gallery
			)
		});
		editingGalleryId = null;
	}

	function addBioTag() {
		const tag = newBioTag.trim().replace(/^#/, '');
		if (!tag || settings.bioTags.includes(tag)) return;
		persist({ ...settings, bioTags: [...settings.bioTags, tag] });
		newBioTag = '';
	}
</script>

{#if loading}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('collection.loading')}
	</p>
{:else}
	<section
		class="flex flex-col gap-6 pb-12 sm:gap-8"
		style={`--profile-accent:${settings.accentColor}`}
	>
		<header class="forge-panel p-4 sm:p-6">
			<div class="flex items-center gap-4">
				<button
					class="grid size-18 shrink-0 place-items-center border border-primary/40 bg-black p-1 text-2xl font-serif font-black text-primary"
					aria-label={$_('profile.avatar_title')}
					onclick={() =>
						openPicker($_('profile.avatar_title'), ownedCards, (card) =>
							persist({ ...settings, avatarCardId: card.id })
						)}
				>
					{#if settings.avatarCardId && ownedCards.find((card) => card.id === settings.avatarCardId)}
						<img
							class="size-full object-cover"
							src={ownedCards.find((card) => card.id === settings.avatarCardId)?.imageUrl}
							alt={settings.username}
						/>
					{:else}{settings.username.slice(0, 1).toLocaleUpperCase('fr-FR')}{/if}
				</button>
				<div class="min-w-0 flex-1">
					<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
						{$_('profile.title')}
					</p>
					<h1 class="truncate font-serif text-3xl font-bold tracking-tight sm:text-5xl">
						{settings.username}
					</h1>
					<div class="mt-2 flex flex-wrap gap-1">
						{#each settings.bioTags as tag (tag)}<span
								class="border border-primary/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary"
								>#{tag}</span
							>{/each}
					</div>
				</div>
				<Button variant="outline" size="sm" onclick={() => (identityOpen = true)}
					>{$_('profile.edit_identity')}</Button
				>
			</div>
		</header>

		<section class="flex flex-col gap-3">
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-primary/30 pb-3"
			>
				<h2 class="font-serif text-2xl font-black uppercase tracking-tight">
					{$_('profile.showcase_title')}
				</h2>
				<Button size="sm" variant="outline" onclick={addGallery}
					><PlusIcon />{$_('profile.add_gallery')}</Button
				>
			</div>
			{#if settings.showcases.length}
				{#each settings.showcases as gallery (gallery.id)}
					<ProfileGallery
						{gallery}
						cards={galleryCards(gallery)}
						onAddCard={() =>
							openPicker(
								gallery.title,
								ownedCards.filter((card) => !gallery.cardIds.includes(card.id)),
								(card) =>
									persist({
										...settings,
										showcases: settings.showcases.map((entry) =>
											entry.id === gallery.id
												? { ...entry, cardIds: [...entry.cardIds, card.id].slice(0, 6) }
												: entry
										)
									})
							)}
						onRemoveCard={(cardId) =>
							persist({
								...settings,
								showcases: settings.showcases.map((entry) =>
									entry.id === gallery.id
										? { ...entry, cardIds: entry.cardIds.filter((id) => id !== cardId) }
										: entry
								)
							})}
						onEditTitle={() => {
							editingGalleryId = gallery.id;
							galleryTitle = gallery.title;
							galleryEditorOpen = true;
						}}
						onRemove={() =>
							persist({
								...settings,
								showcases: settings.showcases.filter((entry) => entry.id !== gallery.id)
							})}
					/>
				{/each}
			{:else}<p
					class="border border-primary/20 bg-card p-5 font-serif italic text-muted-foreground"
				>
					{$_('profile.showcase_empty')}
				</p>{/if}
		</section>

		<section class="flex flex-col gap-3">
			<h2
				class="border-b border-dashed border-primary/30 pb-3 font-serif text-2xl font-black uppercase tracking-tight"
			>
				{$_('profile.wanted_title')}
			</h2>
			<ProfileGallery
				gallery={{
					id: 'wanted',
					title: $_('profile.wanted_title'),
					cardIds: settings.wantedCardIds
				}}
				cards={settings.wantedCardIds
					.map((id) => allCards.find((card) => card.id === id))
					.filter(Boolean) as CardRecord[]}
				editable={false}
				showTitle={false}
				allowCardAdd={true}
				onAddCard={() =>
					openPicker(
						$_('profile.wanted_title'),
						allCards.filter((card) => !settings.wantedCardIds.includes(card.id)),
						(card) =>
							persist({
								...settings,
								wantedCardIds: [...settings.wantedCardIds, card.id].slice(0, 6)
							})
					)}
				onRemoveCard={(cardId) =>
					persist({
						...settings,
						wantedCardIds: settings.wantedCardIds.filter((id) => id !== cardId)
					})}
			/>
		</section>

		<section class="flex flex-col gap-3">
			<h2
				class="border-b border-dashed border-primary/30 pb-3 font-serif text-2xl font-black uppercase tracking-tight"
			>
				{$_('profile.sales_title')}
			</h2>
			<div class="flex snap-x gap-3 overflow-x-auto pb-2">
				{#each sales as sale (sale.id)}
					{@const card = allCards.find((entry) => entry.id === sale.cardId)}
					{#if card}<div class="w-40 shrink-0 snap-start sm:w-44">
							<CardTile {card} showFriendOwners={false} />
							<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
								{sale.price}
								{sale.currency} · {sale.type}
							</p>
						</div>{/if}
				{/each}
			</div>
		</section>
	</section>
{/if}

<CardPicker
	bind:open={pickerOpen}
	cards={pickerCards}
	title={pickerTitle}
	onSelect={(card) => pickerAction(card)}
/>

<Sheet.Root bind:open={identityOpen}>
	<Sheet.Content
		side="right"
		class="w-full border-l-4 border-double border-primary/40 bg-card p-5 sm:max-w-md"
	>
		<Sheet.Title class="font-serif text-2xl font-black uppercase tracking-tight"
			>{$_('profile.edit_identity')}</Sheet.Title
		>
		<div class="mt-5 space-y-4">
			<label class="block font-mono text-[10px] uppercase tracking-widest text-primary"
				>{$_('profile.username')}<Input
					bind:value={settings.username}
					class="mt-1 font-serif font-bold"
				/></label
			>
			<label class="block font-mono text-[10px] uppercase tracking-widest text-primary"
				>{$_('profile.accent')}<input
					class="mt-1 h-10 w-full border border-primary/50 bg-secondary p-1"
					type="color"
					bind:value={settings.accentColor}
				/></label
			>
			<div>
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('profile.bio_tags')}
				</p>
				<div class="mt-2 flex gap-2">
					<Input
						bind:value={newBioTag}
						onkeydown={(event) => event.key === 'Enter' && addBioTag()}
					/><Button size="sm" onclick={addBioTag}><PlusIcon /></Button>
				</div>
				<div class="mt-2 flex flex-wrap gap-1">
					{#each settings.bioTags as tag (tag)}<Button
							variant="outline"
							size="xs"
							onclick={() =>
								persist({
									...settings,
									bioTags: settings.bioTags.filter((entry) => entry !== tag)
								})}>#{tag} ×</Button
						>{/each}
				</div>
			</div>
			<Button
				class="w-full"
				onclick={() => {
					persist(settings);
					identityOpen = false;
				}}>{$_('common.save')}</Button
			>
		</div>
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={galleryEditorOpen}>
	<Sheet.Content
		side="bottom"
		class="border-4 border-double border-primary/40 bg-card p-5 sm:inset-x-[25%] sm:bottom-8"
	>
		<Sheet.Title class="font-serif text-xl font-black uppercase"
			>{$_('profile.edit_gallery')}</Sheet.Title
		>
		<Input bind:value={galleryTitle} class="mt-4 font-serif" />
		<div class="mt-4 flex justify-end gap-2">
			<Button variant="outline" onclick={() => (galleryEditorOpen = false)}
				>{$_('common.cancel')}</Button
			><Button
				onclick={() => {
					saveGalleryTitle();
					galleryEditorOpen = false;
				}}>{$_('common.save')}</Button
			>
		</div>
	</Sheet.Content>
</Sheet.Root>
