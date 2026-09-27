<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { clearSession, currentSession, persistSession } from '$lib/auth/session';
	import {
		getCurrentUser,
		getWikiForgePublicPages,
		toPublicPageCardRecord,
		logout,
		logoutAll,
		updateWikiForgeMe,
		updateWikiForgeImage
	} from '$lib/api';
	import { setNsfwFilterSettings } from '$lib/content/nsfw-filter';
	import SettingsPreferences from '$lib/components/settings/settings-preferences.svelte';
	import SettingsAccount from '$lib/components/settings/settings-account.svelte';
	import CensoredKeywords from '$lib/components/settings/censored-keywords.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import type { CardQuery } from '$lib/api';
	import type { CardRecord, ProfileSettings } from '$lib/types';

	let profile = $state<ProfileSettings | null>(null);
	let loading = $state(true);
	let avatarPickerOpen = $state(false);
	let avatarImageUrl = $state<string | null>(null);

	onMount(async () => {
		const user = await getCurrentUser();
		profile = {
			username: user.username,
			avatarCardId: user.imagePageId == null ? null : String(user.imagePageId),
			accentColor: '#feb823',
			bioTags: [],
			showcases: [],
			wantedCardIds: [],
			nsfwEnabled: Boolean(user.nsfwEnabled),
			censoredKeywords: user.safeWords ?? [],
			visibility: user.visibility ?? 'FRIENDS',
			mutedNotifications: user.mutedNotifications ?? []
		};
		avatarImageUrl = user.avatarUrl ?? null;
		setNsfwFilterSettings({ enabled: profile.nsfwEnabled, keywords: profile.censoredKeywords });
		loading = false;
	});
	async function save() {
		if (!profile) return;
		const user = await updateWikiForgeMe({
			name: profile.username.trim(),
			imagePageId: profile.avatarCardId ? Number(profile.avatarCardId) : null,
			nsfw: profile.nsfwEnabled,
			safeWords: profile.censoredKeywords,
			visibility: profile.visibility,
			mutedNotifications: profile.mutedNotifications
		});
		setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
		const session = $currentSession;
		if (session) persistSession(localStorage, { ...session, user });
	}

	async function loadAvatarCards(cardQuery: CardQuery) {
		const result = await getWikiForgePublicPages({
			page: Math.max(0, (cardQuery.page ?? 1) - 1),
			q: cardQuery.query,
			sortBy: cardQuery.query?.trim() ? 'relevance' : 'name'
		});
		const page = result.page + 1;
		const pageSize = 48;
		const total = result.nbResults;
		return {
			items: (result.results ?? []).map((item) =>
				toPublicPageCardRecord({ ...item, _variants: result._variants })
			),
			meta: {
				page,
				pageSize,
				total,
				totalPages: total > 0 ? Math.max(page, Math.ceil(total / pageSize)) : 1
			}
		};
	}

	async function selectAvatar(card: CardRecord) {
		if (!profile) return;
		const imagePageId = Number(card.baseCardId ?? card.catalogueId);
		const user = await updateWikiForgeImage(imagePageId);
		profile.avatarCardId = imagePageId.toString();
		avatarImageUrl = user.avatarUrl ?? card.imageUrl;
		const session = $currentSession;
		if (session) persistSession(localStorage, { ...session, user });
	}
	async function removeAvatar() {
		if (!profile) return;
		const user = await updateWikiForgeImage(null);
		profile.avatarCardId = null;
		avatarImageUrl = null;
		const session = $currentSession;
		if (session) persistSession(localStorage, { ...session, user });
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
			bind:visibility={profile.visibility}
			bind:mutedNotifications={profile.mutedNotifications}
		/>
		<CensoredKeywords bind:keywords={profile.censoredKeywords} /><SettingsAccount
			bind:username={profile.username}
			avatarUrl={avatarImageUrl}
			onChooseAvatar={() => (avatarPickerOpen = true)}
			onRemoveAvatar={removeAvatar}
			onLogout={logoutFromSettings}
			onLogoutAll={logoutFromAllDevices}
		/>
	{/if}
</section>

<WishlistPicker
	bind:open={avatarPickerOpen}
	existingCardIds={profile?.avatarCardId ? [profile.avatarCardId] : []}
	loadCards={loadAvatarCards}
	onSelect={selectAvatar}
	catalogueLabel={$_('settings.avatar_collection')}
	title={$_('settings.choose_avatar')}
/>
