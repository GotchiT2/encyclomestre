<script lang="ts">
	import { resolve } from '$app/paths';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { unreadNotifications } from '$lib/notifications/store';
	import { _ } from '$lib/i18n';
	let { compact = false }: { compact?: boolean } = $props();
</script>

<a
	href={resolve('/notifications')}
	class="relative inline-grid place-items-center border border-primary/35 text-primary hover:bg-primary/10"
	class:size-10={compact}
	class:h-10={!compact}
	class:w-full={!compact}
	aria-label={$_('notifications.open', { values: { count: $unreadNotifications } })}
>
	<BellIcon class="size-4" />
	{#if $unreadNotifications > 0}<span
		class="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full border border-background bg-primary px-1 text-[9px] font-black text-primary-foreground"
		>{Math.min($unreadNotifications, 99)}{#if $unreadNotifications > 99}+{/if}</span
	>{/if}
</a>
