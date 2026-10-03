<script lang="ts">
	import ArcadePreferences from '$lib/components/settings/arcade-preferences.svelte';
	import AvatarEditor from '$lib/components/settings/avatar-editor.svelte';
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
	import type { ProfileSettings } from '$lib/types';

	let category = $state<'profile' | 'visibility' | 'security' | 'preferences'>('profile');
	let categoryOpen = $state(false);
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

<section class="settings-workbench">
	<PageHeader eyebrow={$_('settings.eyebrow')} title={$_('settings.title')} />
	{#if saveError}<p role="alert" class="text-destructive">{saveError}</p>{/if}
	{#if saved}<p role="status">{$_('settings.saved')}</p>{/if}
	<div class="settings-layout" class:category-open={categoryOpen}>
		<nav aria-label={$_('settings.title')} class="settings-index">
			{#each ['profile', 'visibility', 'security', 'preferences'] as item (item)}
				<Button
					variant={category === item ? 'default' : 'ghost'}
					aria-current={category === item ? 'page' : undefined}
					onclick={() => {
						category = item as typeof category;
						categoryOpen = true;
					}}
				>
					{$_('arcade.settingsCategories.' + item)}
				</Button>
			{/each}
		</nav>
		<div class="settings-content">
			<Button class="settings-back" variant="ghost" onclick={() => (categoryOpen = false)}
				>← {$_('settings.title')}</Button
			>
			<h2 class="text-2xl mb-5">{$_('arcade.settingsCategories.' + category)}</h2>
			{#if loading}<p role="status">{$_('settings.loading')}</p>{:else if profile}
				<div hidden={category !== 'profile' && category !== 'security'}>
					<SettingsAccount
						bind:username={profile.username}
						{nameLocked}
						{nameChangeAvailableAt}
						view={category === 'security' ? 'security' : 'profile'}
						avatarUrl={avatarImageUrl}
						onChooseAvatar={() => (avatarPickerOpen = true)}
						onRemoveAvatar={removeAvatar}
						onLogout={logoutFromSettings}
						onLogoutAll={logoutFromAllDevices}
					/>
				</div>
				<div hidden={category !== 'visibility'} class="space-y-6">
					<SettingsPreferences
						bind:nsfwEnabled={profile.nsfwEnabled}
						bind:visibility={profile.visibility}
						bind:mutedNotifications={profile.mutedNotifications}
					/>
					<CensoredKeywords bind:keywords={profile.censoredKeywords} />
				</div>
				<div hidden={category !== 'security'}>
					<PasskeyManager onLogoutAll={logoutFromAllDevices} />
				</div>
				<div hidden={category !== 'preferences'}><ArcadePreferences /></div>
				{#if category === 'profile' || category === 'visibility'}
					<footer class="settings-save">
						<Button disabled={saving} onclick={save}>{$_('common.save')}</Button>
					</footer>
				{/if}
			{/if}
		</div>
	</div>
</section>

<AvatarEditor
	bind:open={avatarPickerOpen}
	onSaved={(user) => {
		if (profile) profile.avatarCardId = user.imagePageId == null ? null : String(user.imagePageId);
		avatarImageUrl = user.avatarUrl ?? null;
		nameChangeAvailableAt = user.nameChangeAvailableAt;
	}}
/>

<style>
	.settings-layout {
		display: grid;
		gap: 24px;
	}
	.settings-index {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 4px;
	}
	.settings-index :global(button) {
		justify-content: flex-start;
	}
	.settings-content {
		display: none;
		min-width: 0;
	}
	.category-open .settings-index {
		display: none;
	}
	.category-open .settings-content {
		display: block;
	}
	:global(.settings-back) {
		margin-bottom: 16px;
	}
	.settings-save {
		position: sticky;
		bottom: 80px;
		background: var(--background);
		padding: 12px 0;
		margin-top: 16px;
	}
	@media (min-width: 1024px) {
		.settings-layout {
			grid-template-columns: 220px minmax(0, 760px);
		}
		.settings-index,
		.category-open .settings-index {
			display: flex;
			align-self: start;
			position: sticky;
			top: 88px;
		}
		.settings-content {
			display: block;
		}
		:global(.settings-back) {
			display: none;
		}
		.settings-save {
			bottom: 0;
		}
	}
</style>
