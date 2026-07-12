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
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('settings.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('settings.title')}
		</h1>
		<p class="mt-3 max-w-2xl font-serif italic leading-relaxed text-muted-foreground">
			{$_('settings.description')}
		</p>
		{#if !loading && profile}
			<div class="mt-4 flex justify-end"><Button onclick={save}>{$_('common.save')}</Button></div>
		{/if}
	</header>
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
		/>{/if}
</section>
