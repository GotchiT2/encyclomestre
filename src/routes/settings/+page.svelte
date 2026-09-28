<script lang="ts">
	import PasskeyManager from '$lib/components/security/passkey-manager.svelte';
	import { nameChangeLocked, nameChangeRefusal } from '$lib/domain/name-change';
	import { operationError } from '$lib/domain/operation-error';
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
	let saving = $state(false);
	let saveError = $state('');
	let saved = $state(false);
	let actualName = $state('');
	let nameChangeAvailableAt = $state<string>();
	let clock = $state(Date.now());
	const nameLocked = $derived(nameChangeLocked(nameChangeAvailableAt, clock));
	onMount(() => {
		const timer = setInterval(() => (clock = Date.now()), 1000);
		return () => clearInterval(timer);
	});
	let avatarPickerOpen = $state(false);
	let avatarImageUrl = $state<string | null>(null);

	onMount(async () => {
		try {
			const user = await getCurrentUser();
			actualName = user.username;
			nameChangeAvailableAt = user.nameChangeAvailableAt;
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
		} catch (cause) {
			saveError = operationError(cause);
		} finally {
			loading = false;
		}
	});
	async function save() {
		if (!profile || saving) return;
		saving = true;
		saved = false;
		saveError = '';
		try {
			const user = await updateWikiForgeMe({
				name: nameLocked ? actualName : profile.username.trim(),
				imagePageId: profile.avatarCardId ? Number(profile.avatarCardId) : null,
				nsfw: profile.nsfwEnabled,
				safeWords: profile.censoredKeywords,
				visibility: profile.visibility,
				mutedNotifications: profile.mutedNotifications
			});
			setNsfwFilterSettings({ enabled: user.nsfwEnabled, keywords: user.safeWords });
			const session = $currentSession;
			if (session) persistSession(localStorage, { ...session, user });
			actualName = user.username;
			profile.username = user.username;
			nameChangeAvailableAt = user.nameChangeAvailableAt;
			saved = true;
		} catch (cause) {
			const available = nameChangeRefusal(cause);
			if (available) {
				nameChangeAvailableAt = available;
				saveError = $_('settings.name_change_refused', {
					values: { date: new Date(available).toLocaleString('fr-FR') }
				});
			} else saveError = operationError(cause);
		} finally {
			saving = false;
		}
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
				totalPages:
					total > 0
						? Math.max(page, Math.ceil(Math.min(total, result.maxResults ?? Infinity) / pageSize))
						: 1,
				hasNext: result.hasNext,
				maxResults: result.maxResults,
				truncated: result.truncated
			}
		};
	}

	async function selectAvatar(card: CardRecord) {
		if (!profile) return;
		const imagePageId = Number(card.baseCardId ?? card.catalogueId);
		const user = await updateWikiForgeImage(imagePageId);
		nameChangeAvailableAt = user.nameChangeAvailableAt;
		profile.avatarCardId = imagePageId.toString();
		avatarImageUrl = user.avatarUrl ?? card.imageUrl;
		const session = $currentSession;
		if (session) persistSession(localStorage, { ...session, user });
	}
	async function removeAvatar() {
		if (!profile) return;
		const user = await updateWikiForgeImage(null);
		nameChangeAvailableAt = user.nameChangeAvailableAt;
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
		{#snippet actions()}{#if !loading && profile}<Button disabled={saving} onclick={save}
					>{$_('common.save')}</Button
				>{/if}{/snippet}
	</PageHeader>
	{#if saveError}<p role="alert" class="forge-panel p-4 text-destructive">{saveError}</p>{/if}
	{#if saved}<p role="status">{$_('settings.saved')}</p>{/if}
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.loading')}
		</p>{:else if profile}<SettingsPreferences
			bind:nsfwEnabled={profile.nsfwEnabled}
			bind:visibility={profile.visibility}
			bind:mutedNotifications={profile.mutedNotifications}
		/>
		<CensoredKeywords bind:keywords={profile.censoredKeywords} /><SettingsAccount
			bind:username={profile.username}
			{nameLocked}
			{nameChangeAvailableAt}
			avatarUrl={avatarImageUrl}
			onChooseAvatar={() => (avatarPickerOpen = true)}
			onRemoveAvatar={removeAvatar}
			onLogout={logoutFromSettings}
			onLogoutAll={logoutFromAllDevices}
		/>
		<PasskeyManager onLogoutAll={logoutFromAllDevices} />
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
