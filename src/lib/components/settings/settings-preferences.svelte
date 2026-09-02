<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Switch } from '$lib/components/ui/switch';
	import type { ProfileVisibility } from '$lib/types';

	let {
		nsfwEnabled = $bindable(false),
		visibility = $bindable<ProfileVisibility>('FRIENDS')
	}: { nsfwEnabled?: boolean; visibility?: ProfileVisibility } = $props();
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
		<p class="forge-label">{$_('settings.push_title')}</p>
		<p class="mt-1 text-sm text-muted-foreground">{$_('settings.push_pending')}</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			<button class="h-10 border border-primary/25 text-sm text-muted-foreground" disabled>{$_('settings.push_browser')}</button>
			<button class="h-10 border border-primary/25 text-sm text-muted-foreground" disabled>{$_('settings.discord_relay')}</button>
		</div>
	</section>
</div>
