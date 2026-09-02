<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- the resolved notification target may include a dynamic trade identifier */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getNotifications, markAllNotificationsRead, markNotificationRead } from '$lib/api';
	import { unreadNotifications } from '$lib/notifications/store';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { _ } from '$lib/i18n';
	import type { AppNotification } from '$lib/types';
	import { onMount } from 'svelte';

	let items = $state<AppNotification[]>([]);
	let cursor = $state<string | null>(null);
	let hasNext = $state(false);
	let unreadOnly = $state(false);
	let activeTab = $state<'all' | 'trades' | 'sales' | 'friends'>('all');
	let loading = $state(true);
	let loadingMore = $state(false);
	let failed = $state(false);
	let notificationsReady = $state(false);
	let handledRealtimeRevision = 0;
	const visibleItems = $derived(
		items.filter((notification) =>
			activeTab === 'all'
				? true
				: activeTab === 'trades'
					? notification.type.startsWith('TRADE_')
					: activeTab === 'sales'
						? notification.type === 'SALE_SOLD'
						: notification.type === 'FRIEND_REQUEST' || notification.type === 'FRIEND_ACCEPTED'
		)
	);

	function target(notification: AppNotification) {
		if (!notification.extId) return null;
		if (notification.type.startsWith('TRADE_'))
			return `${resolve('/trades')}?trade=${encodeURIComponent(notification.extId)}`;
		if (notification.type === 'FRIEND_REQUEST' || notification.type === 'FRIEND_ACCEPTED')
			return resolve('/friends');
		if (notification.type === 'SALE_SOLD') return resolve('/profile');
		return null;
	}
	function label(notification: AppNotification) {
		const known = new Set([
			'TRADE_RECEIVED',
			'TRADE_COUNTERED',
			'TRADE_ACCEPTED',
			'TRADE_DECLINED',
			'TRADE_CANCELLED',
			'TRADE_EXPIRED',
			'SALE_SOLD',
			'FRIEND_REQUEST',
			'FRIEND_ACCEPTED'
		]);
		return known.has(notification.type)
			? $_(`notifications.type.${notification.type}`)
			: $_('notifications.type_unknown');
	}
	async function load(append = false) {
		if (append) loadingMore = true;
		else loading = true;
		failed = false;
		try {
			const page = await getNotifications({ unreadOnly, cursor: append ? cursor : null });
			items = append ? [...items, ...page.items] : page.items;
			cursor = page.nextCursor;
			hasNext = page.hasNext;
			unreadNotifications.set(page.unread);
		} catch {
			failed = true;
		} finally {
			loading = false;
			loadingMore = false;
		}
	}
	async function open(notification: AppNotification) {
		if (!notification.read) {
			await markNotificationRead(notification.id);
			items = items.map((item) => (item.id === notification.id ? { ...item, read: true } : item));
			unreadNotifications.update((count) => Math.max(0, count - 1));
		}
		const href = target(notification);
		if (href) await goto(href);
	}
	async function markAll() {
		await markAllNotificationsRead();
		items = items.map((item) => ({ ...item, read: true }));
		unreadNotifications.set(0);
	}
	onMount(() => {
		void load().finally(() => (notificationsReady = true));
	});
	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			!notificationsReady ||
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'notifications')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void load();
	});
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('notifications.eyebrow')}
		title={$_('notifications.title')}
		description={$_('notifications.description')}
	/>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<label class="flex items-center gap-2 text-sm"
			><input type="checkbox" bind:checked={unreadOnly} onchange={() => void load(false)} />
			{$_('notifications.unread_only')}</label
		>
		<Button variant="outline" disabled={$unreadNotifications === 0} onclick={() => void markAll()}
			>{$_('notifications.mark_all')}</Button
		>
	</div>
	<div
		class="grid grid-cols-2 border border-primary/30 bg-card p-1 sm:grid-cols-4"
		role="tablist"
		aria-label={$_('notifications.tabs')}
	>
		{#each ['all', 'trades', 'sales', 'friends'] as tab (tab)}<Button
				variant={activeTab === tab ? 'default' : 'ghost'}
				role="tab"
				aria-selected={activeTab === tab}
				onclick={() => (activeTab = tab as typeof activeTab)}
				>{$_(`notifications.tab_${tab}`)}</Button
			>{/each}
	</div>
	{#if loading}<p class="forge-label">{$_('notifications.loading')}</p>
	{:else if failed}<div class="forge-panel-flat flex items-center justify-between gap-3 p-4">
			<p class="text-destructive">{$_('notifications.error')}</p>
			<Button variant="outline" onclick={() => void load()}>{$_('common.retry')}</Button>
		</div>
	{:else if visibleItems.length}<ul class="divide-y divide-primary/15 border-y border-primary/20">
			{#each visibleItems as notification (notification.id)}<li>
					<button
						class={`flex w-full gap-3 px-3 py-4 text-left hover:bg-primary/8 ${!notification.read ? 'bg-primary/10' : ''}`}
						onclick={() => void open(notification)}
					>
						<div class="min-w-0 flex-1">
							<p class="font-bold">{label(notification)}</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{notification.actor ? notification.actor.name : $_('notifications.system')}
							</p>
						</div>
						<time class="shrink-0 text-xs text-muted-foreground"
							>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
								new Date(notification.createdAt)
							)}</time
						>
					</button>
				</li>{/each}
		</ul>{:else}<p class="forge-panel-flat p-6 text-muted-foreground">
			{$_('notifications.empty_tab')}
		</p>{/if}
	{#if hasNext}<Button variant="outline" disabled={loadingMore} onclick={() => void load(true)}
			>{loadingMore ? $_('notifications.loading') : $_('common.load_more')}</Button
		>{/if}
</section>
