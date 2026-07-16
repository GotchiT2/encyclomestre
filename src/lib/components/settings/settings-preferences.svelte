<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import type { UserPreferences } from '$lib/types';

	let {
		preferences = $bindable<UserPreferences>(),
		nsfwEnabled = $bindable(false)
	}: { preferences: UserPreferences; nsfwEnabled?: boolean } = $props();
</script>

<div class="flex flex-col gap-4">
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.notifications')}
		</p>
		<div class="mt-4 divide-y divide-primary/15">
			<label class="flex items-center justify-between gap-4 py-3"
				><span
					><span class="block font-serif text-lg font-black uppercase"
						>{$_('settings.email_notifications')}</span
					><span class="font-serif text-sm italic text-muted-foreground"
						>{$_('settings.email_notifications_hint')}</span
					></span
				><Switch bind:checked={preferences.emailNotifications} /></label
			><label class="flex items-center justify-between gap-4 py-3"
				><span
					><span class="block font-serif text-lg font-black uppercase"
						>{$_('settings.marketing_notifications')}</span
					><span class="font-serif text-sm italic text-muted-foreground"
						>{$_('settings.marketing_notifications_hint')}</span
					></span
				><Switch bind:checked={preferences.marketingEmails} /></label
			>
		</div>
	</section>
	<section class="border-4 border-double border-primary/30 bg-card p-4">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('settings.content')}
		</p>
		<label class="mt-4 flex items-center justify-between gap-4"
			><span
				><span class="block font-serif text-lg font-black uppercase">{$_('settings.nsfw')}</span
				><span class="font-serif text-sm italic text-muted-foreground"
					>{$_('settings.nsfw_hint')}</span
				></span
			><Switch bind:checked={nsfwEnabled} /></label
		>
	</section>
</div>
