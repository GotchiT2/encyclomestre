<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { clearSession, currentSession, persistSession } from '$lib/auth/session';
	import {
		deleteUser,
		getCurrentUser,
		getWikiForgePublicPages,
		logout,
		logoutAll,
		toPublicPage,
		updateWikiForgeMe
	} from '$lib/api';
	import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
	import SettingsPreferences from '$lib/components/settings/settings-preferences.svelte';
	import SettingsAccount from '$lib/components/settings/settings-account.svelte';
	import CensoredKeywords from '$lib/components/settings/censored-keywords.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
	import type { CardQuery } from '$lib/api';
	import type { CardRecord, ProfileSettings } from '$lib/types';

	let profile = $state<ProfileSettings | null>(null);
	let loading = $state(true);
	let userId = $state('demo-user');
	let avatarPickerOpen = $state(false);
	let avatarImageUrl = $state<string | null>(null);

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		const user = await getCurrentUser();
		profile = {
			username: user.username,
			avatarCardId: user.imagePageId == null ? null : String(user.imagePageId),
			accentColor: '#feb823',
			bioTags: [],
			showcases: [],
			wantedCardIds: [],
			nsfwEnabled: Boolean(user.nsfwEnabled),
			censoredKeywords: user.safeWords ?? []
		};
		avatarImageUrl = user.avatarUrl ?? null;
		setNsfwFilterSettings({ enabled: profile.nsfwEnabled, keywords: profile.censoredKeywords });
		loading = false;
	});
	async function save() {
		if (!profile) return;
		const user = await updateWikiForgeMe({
			name: profile.username.trim(),
			...(profile.avatarCardId ? { imagePageId: Number(profile.avatarCardId) } : {}),
			nsfw: profile.nsfwEnabled,
			safeWords: profile.censoredKeywords
		});
		setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
		const session = $currentSession;
		if (session) persistSession(localStorage, { ...session, user });
	}

	async function loadAvatarCards(cardQuery: CardQuery) {
		return toPublicPage(
			await getWikiForgePublicPages({
				page: Math.max(0, (cardQuery.page ?? 1) - 1),
				q: cardQuery.query,
				rarities: (cardQuery.rarities ?? []).map((rarity) => cardRarityCodeByName[rarity]),
				sortBy: cardQuery.sortBy,
				sortDirection: cardQuery.sortDirection
			})
		);
	}

	function selectAvatar(card: CardRecord) {
		if (!profile) return;
		profile.avatarCardId = String(card.baseCardId ?? card.id);
		avatarImageUrl = card.imageUrl;
		avatarPickerOpen = false;
	}
	async function logoutFromSettings() {
		try {
			await logout();
		} finally {
			clearSession(localStorage);
			await goto(resolve('/'));
		}
	}
	async function logoutFromAllDevices() {
		try {
			await logoutAll();
		} finally {
			clearSession(localStorage);
			await goto(resolve('/'));
		}
	}
	async function deleteAccount() {
		await deleteUser(userId);
		clearSession(localStorage);
		await goto(resolve('/'));
	}
</script>

<section class="flex flex-col gap-6">
	<PageHeader
		eyebrow={$_('settings.eyebrow')}
		title={$_('settings.title')}
		description={$_('settings.description')}
	>
		{#snippet actions()}{#if !loading && profile}<Button onclick={save}>{$_('common.save')}</Button
				>{/if}{/snippet}
	</PageHeader>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.loading')}
		</p>{:else if profile}<SettingsPreferences
			bind:nsfwEnabled={profile.nsfwEnabled}
		/><CensoredKeywords bind:keywords={profile.censoredKeywords} /><SettingsAccount
			bind:username={profile.username}
			avatarUrl={avatarImageUrl}
			onChooseAvatar={() => (avatarPickerOpen = true)}
			onLogout={logoutFromSettings}
			onLogoutAll={logoutFromAllDevices}
			onDelete={deleteAccount}
		/>
	{/if}
</section>

<WishlistPicker
	bind:open={avatarPickerOpen}
	existingCardIds={profile?.avatarCardId ? [profile.avatarCardId] : []}
	loadCards={loadAvatarCards}
	onSelect={selectAvatar}
/>
