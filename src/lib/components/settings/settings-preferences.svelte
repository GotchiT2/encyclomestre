<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Switch } from '$lib/components/ui/switch';
	import type { MutedNotificationCategory, ProfileVisibility } from '$lib/types';

	let {
		nsfwEnabled = $bindable(false),
		visibility = $bindable<ProfileVisibility>('FRIENDS'),
		mutedNotifications = $bindable<MutedNotificationCategory[]>([])
	}: {
		nsfwEnabled?: boolean;
		visibility?: ProfileVisibility;
		mutedNotifications?: MutedNotificationCategory[];
	} = $props();

	const notificationCategories: Array<{ value: MutedNotificationCategory; label: string }> = [
		{ value: 'TRADE', label: 'settings.mute_trade' },
		{ value: 'SALE', label: 'settings.mute_sale' },
		{ value: 'FRIEND', label: 'settings.mute_friend' },
		{ value: 'GUILD', label: 'settings.mute_guild' },
		{ value: 'ACHIEVEMENT', label: 'settings.mute_achievement' }
	];

	function toggleMuted(category: MutedNotificationCategory) {
		mutedNotifications = mutedNotifications.includes(category)
			? mutedNotifications.filter((value) => value !== category)
			: [...mutedNotifications, category];
	}
</script>

<div class="flex flex-col gap-4">
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.content')}
		</p>
		<label class="mt-4 flex items-center justify-between gap-4"
			><span
				><span class="block text-lg font-black uppercase">{$_('settings.nsfw')}</span><span
					class="text-sm italic text-muted-foreground">{$_('settings.nsfw_hint')}</span
				></span
			><Switch bind:checked={nsfwEnabled} /></label
		>
	</section>
	<section class="forge-panel-flat p-4">
		<label class="forge-label" for="profile-visibility">{$_('settings.visibility')}</label>
		<p class="mt-1 text-sm text-muted-foreground">{$_('settings.visibility_hint')}</p>
		<select id="profile-visibility" bind:value={visibility} class="mt-3 h-11 w-full">
			<option value="PRIVATE">{$_('settings.visibility_private')}</option>
			<option value="FRIENDS">{$_('settings.visibility_friends')}</option>
			<option value="PUBLIC">{$_('settings.visibility_public')}</option>
		</select>
	</section>
	<section class="forge-panel-flat p-4">
		<p class="forge-label">{$_('settings.muted_notifications')}</p>
		<p class="mt-1 text-sm text-muted-foreground">{$_('settings.muted_notifications_hint')}</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			{#each notificationCategories as category (category.value)}
				<label
					class="flex min-h-10 items-center gap-3 border border-primary/20 bg-background/35 px-3 text-sm"
				>
					<Switch
						checked={mutedNotifications.includes(category.value)}
						onCheckedChange={() => toggleMuted(category.value)}
					/>
					{$_(category.label)}
				</label>
			{/each}
		</div>
	</section>
	<section class="forge-panel-flat p-4">
		<p class="forge-label">{$_('settings.push_title')}</p>
		<p class="mt-1 text-sm text-muted-foreground">{$_('settings.push_pending')}</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			<button class="h-10 border border-primary/25 text-sm text-muted-foreground" disabled
				>{$_('settings.push_browser')}</button
			>
			<button class="h-10 border border-primary/25 text-sm text-muted-foreground" disabled
				>{$_('settings.discord_relay')}</button
			>
		</div>
	</section>
</div>
