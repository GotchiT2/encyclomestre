<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { clearSession, currentSession } from '$lib/auth/session';
	import {
		deleteUser,
		getProfileSettings,
		getUser,
		logout,
		updateProfileSettings,
		updateUserPreferences
	} from '$lib/api';
	import SettingsPreferences from '$lib/components/settings/settings-preferences.svelte';
	import SettingsAccount from '$lib/components/settings/settings-account.svelte';
	import CensoredKeywords from '$lib/components/settings/censored-keywords.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { ProfileSettings, UserPreferences } from '$lib/types';

	let preferences = $state<UserPreferences>({
		language: 'fr',
		timezone: 'Europe/Paris',
		emailNotifications: true,
		marketingEmails: false
	});
	let profile = $state<ProfileSettings | null>(null);
	let loading = $state(true);
	let userId = $state('demo-user');

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		const [user, settings] = await Promise.all([getUser(userId), getProfileSettings(userId)]);
		preferences = user.preferences ?? preferences;
		profile = settings;
		loading = false;
	});
	async function save() {
		if (!profile) return;
		await Promise.all([
			updateUserPreferences(userId, preferences),
			updateProfileSettings(userId, {
				username: profile.username,
				nsfwEnabled: profile.nsfwEnabled,
				censoredKeywords: profile.censoredKeywords
			})
		]);
	}
	async function logoutFromSettings() {
		try {
			await logout();
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
			bind:preferences
			bind:nsfwEnabled={profile.nsfwEnabled}
		/><CensoredKeywords bind:keywords={profile.censoredKeywords} /><SettingsAccount
			bind:username={profile.username}
			onLogout={logoutFromSettings}
			onDelete={deleteAccount}
		/>
	{/if}
</section>
