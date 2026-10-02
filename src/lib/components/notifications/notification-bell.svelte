<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import BellIcon from '@lucide/svelte/icons/bell';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getNotifications, markNotificationRead } from '$lib/api';
	import { unreadNotifications } from '$lib/notifications/store';
	import { notificationTarget } from '$lib/notifications/target';
	import { currentSession } from '$lib/auth/session';
	import { realtimeRefresh } from '$lib/realtime/resource-refresh';
	import type { AppNotification } from '$lib/types';
	import { _ } from '$lib/i18n';
	let { compact = false }: { compact?: boolean } = $props();
	let open = $state(false),
		loading = $state(false),
		failed = $state(false);
	let items = $state<AppNotification[]>([]),
		generation = 0;
	async function load() {
		const request = ++generation,
			account = $currentSession?.user.id;
		loading = true;
		failed = false;
		try {
			const page = await getNotifications();
			if (request !== generation || account !== $currentSession?.user.id) return;
			items = page.items.slice(0, 6);
			unreadNotifications.set(page.unread);
		} catch {
			if (request === generation) failed = true;
		} finally {
			if (request === generation) loading = false;
		}
	}
	$effect(() => {
		const shown = open,
			account = $currentSession?.user.id;
		void $realtimeRefresh.revision;
		if (shown && account) untrack(() => void load());
		return () => {
			generation++;
		};
	});
	function visit(item: AppNotification) {
		const account = $currentSession?.user.id;
		if (!item.read)
			void markNotificationRead(item.id)
				.then(() => {
					if (account === $currentSession?.user.id) {
						items = items.map((n) => (n.id === item.id ? { ...n, read: true } : n));
						void load();
					}
				})
				.catch(() => undefined);
		const href = notificationTarget(item);
		if (href) void goto(resolve(href as '/notifications'));
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger
		class={`notification-trigger ${compact ? 'compact' : ''}`}
		aria-label={$_('notifications.open', { values: { count: $unreadNotifications } })}
		data-testid="notification-trigger"
		data-tooltip={$_('notifications.open', { values: { count: $unreadNotifications } })}
	>
		<BellIcon class="size-5" />
		{#if $unreadNotifications > 0}<span class="notification-count"
				>{Math.min(99, $unreadNotifications)}{#if $unreadNotifications > 99}+{/if}</span
			>{/if}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		align="end"
		sideOffset={12}
		class="notification-popover"
		data-testid="notification-popover"
	>
		<DropdownMenu.Label class="flex items-center justify-between gap-3 text-lg"
			><span>{$_('notifications.title')}</span><span class="text-primary tabular-nums"
				>{$unreadNotifications}</span
			></DropdownMenu.Label
		>
		<DropdownMenu.Separator />
		{#if loading}<p role="status" class="p-4">{$_('notifications.loading')}</p>
		{:else if failed}<DropdownMenu.Item
				onSelect={(event) => {
					event.preventDefault();
					void load();
				}}>{$_('common.retry')}</DropdownMenu.Item
			>
		{:else if !items.length}<p class="p-4 text-sm text-muted-foreground">
				{$_('notifications.empty_tab')}
			</p>
		{:else}{#each items as item (item.id)}<DropdownMenu.Item
					class="notification-preview"
					onSelect={() => visit(item)}
				>
					<span class="notification-dot" class:unread={!item.read} aria-hidden="true"></span>
					<span class="min-w-0"
						><strong class="block"
							>{item.type.startsWith('MODERATION_')
								? $_('completion.moderation.title')
								: $_('notifications.type.' + item.type, {
										default: $_('notifications.type_unknown')
									})}</strong
						><span class="text-xs text-muted-foreground"
							>{item.actor?.name ?? $_('notifications.system')}</span
						></span
					>
				</DropdownMenu.Item>{/each}{/if}
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			class="min-h-11 justify-center font-semibold"
			onSelect={() => void goto(resolve('/notifications'))}
			>{$_('arcade.seeNotifications')} →</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style>
	:global(.notification-trigger) {
		position: relative;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 1px solid var(--border);
	}
	.notification-count {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 18px;
		padding: 1px 4px;
		background: var(--primary);
		color: var(--primary-foreground);
		font-size: 10px;
		font-weight: 800;
		border: 2px solid var(--background);
	}
	:global(.notification-popover) {
		width: min(360px, calc(100vw - 24px));
		max-height: calc(100dvh - 90px);
		overflow: auto;
		padding: 8px;
	}
	:global(.notification-preview) {
		gap: 10px;
		min-height: 64px;
		align-items: center;
		padding: 10px;
	}
	.notification-dot {
		width: 6px;
		height: 6px;
		flex: none;
		background: var(--border);
	}
	.notification-dot.unread {
		background: var(--primary);
	}
</style>
