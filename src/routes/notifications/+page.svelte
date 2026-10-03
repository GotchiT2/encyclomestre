<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { notificationTarget } from '$lib/notifications/target';
	import { groupNotifications, type NotificationFamily } from '$lib/notifications/groups';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getNotifications, markAllNotificationsRead, markNotificationRead } from '$lib/api';
	import { unreadNotifications } from '$lib/notifications/store';
	import { currentSession } from '$lib/auth/session';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { _ } from '$lib/i18n';
	import type { AppNotification } from '$lib/types';
	import { onMount, untrack } from 'svelte';

	let items = $state<AppNotification[]>([]);
	let cursor = $state<string | null>(null);
	let hasNext = $state(false);
	let unreadOnly = $state(false);
	let loading = $state(true);
	let loadingMore = $state(false);
	let failed = $state(false);
	let notificationsReady = $state(false);
	let handledRealtimeRevision = 0;
	let sequence = 0;
	let disposed = false;
	const visibleItems = $derived(unreadOnly ? items.filter((item) => !item.read) : items);
	const groups = $derived(groupNotifications(visibleItems));
	const collapsed = new SvelteSet<NotificationFamily>();
	const accountId = $derived($currentSession?.user.id);

	function label(notification: AppNotification) {
		if (notification.type.startsWith('MODERATION_')) return $_('completion.moderation.title');
		const known = new Set([
			'TRADE_RECEIVED',
			'TRADE_COUNTERED',
			'TRADE_ACCEPTED',
			'TRADE_DECLINED',
			'TRADE_CANCELLED',
			'TRADE_EXPIRED',
			'SALE_SOLD',
			'SALE_CANCELLED',
			'AUCTION_OUTBID',
			'AUCTION_WON',
			'AUCTION_SOLD',
			'AUCTION_UNSOLD',
			'AUCTION_CANCELLED',
			'FRIEND_REQUEST',
			'FRIEND_ACCEPTED',
			'ACHIEVEMENT_UNLOCKED',
			'GUILD_INVITE',
			'GUILD_JOINED',
			'GUILD_KICKED',
			'GUILD_PROMOTED',
			'GUILD_OWNER_CHANGED',
			'GUILD_DISBANDED'
		]);
		return known.has(notification.type)
			? $_(`notifications.type.${notification.type}`)
			: $_('notifications.type_unknown');
	}
	async function load(append = false) {
		if (append && (loadingMore || loading || !hasNext)) return;
		const request = ++sequence,
			account = $currentSession?.user.id;
		if (append) loadingMore = true;
		else loading = true;
		failed = false;
		try {
			const page = await getNotifications({ unreadOnly, cursor: append ? cursor : null });
			if (disposed || request !== sequence || account !== $currentSession?.user.id) return;
			items = append
				? [...new Map([...items, ...page.items].map((item) => [item.id, item])).values()]
				: page.items;
			cursor = page.nextCursor;
			hasNext = page.hasNext;
			unreadNotifications.set(page.unread);
		} catch {
			if (request === sequence) failed = true;
		} finally {
			if (request === sequence) {
				loading = false;
				loadingMore = false;
			}
		}
	}
	const marking = new SvelteSet<string>();
	async function open(notification: AppNotification) {
		const account = $currentSession?.user.id;
		if (!notification.read && !marking.has(notification.id)) {
			marking.add(notification.id);
			void markNotificationRead(notification.id)
				.then(() => {
					if (disposed || account !== $currentSession?.user.id) return;
					items = items.map((item) =>
						item.id === notification.id ? { ...item, read: true } : item
					);
					void load();
				})
				.catch(() => toast.error($_('ux.readFailed')))
				.finally(() => marking.delete(notification.id));
		}
		const href = notificationTarget(notification);
		if (notification.type.startsWith('AUCTION_') && href === '/market')
			toast.info($_('ux.missingAuction'));
		if (href) await goto(resolve(href as '/market'));
	}

	let markingAll = $state(false);
	async function markAll() {
		if (markingAll) return;
		const account = $currentSession?.user.id;
		markingAll = true;
		try {
			await markAllNotificationsRead();
			if (disposed || account !== $currentSession?.user.id) return;
			items = items.map((item) => ({ ...item, read: true }));
			void load();
		} catch {
			toast.error($_('notifications.error'));
		} finally {
			markingAll = false;
		}
	}
	onMount(() => {
		return () => {
			disposed = true;
			sequence++;
		};
	});
	$effect(() => {
		const account = accountId;
		untrack(() => {
			items = [];
			cursor = null;
			hasNext = false;
			collapsed.clear();
			notificationsReady = false;
			if (!account) return;
			void load().finally(() => {
				if (!disposed && account === $currentSession?.user.id) notificationsReady = true;
			});
		});
		return () => {
			sequence++;
		};
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

<section class="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-12">
	<PageHeader eyebrow={$_('notifications.eyebrow')} title={$_('notifications.title')} />
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-1" aria-label={$_('notifications.title')}>
			<Button
				variant={!unreadOnly ? 'default' : 'outline'}
				aria-pressed={!unreadOnly}
				onclick={() => {
					unreadOnly = false;
					void load(false);
				}}>{$_('arcade.allNotifications')}</Button
			>
			<Button
				variant={unreadOnly ? 'default' : 'outline'}
				aria-pressed={unreadOnly}
				onclick={() => {
					unreadOnly = true;
					void load(false);
				}}>{$_('arcade.unreadNotifications')}</Button
			>
		</div>
		<Button
			variant="outline"
			disabled={markingAll || $unreadNotifications === 0}
			onclick={() => void markAll()}>{$_('notifications.mark_all')}</Button
		>
	</div>
	{#if loading && !items.length}<p class="forge-label">{$_('notifications.loading')}</p>
	{:else if failed}<div class="forge-panel-flat flex items-center justify-between gap-3 p-4">
			<p class="text-destructive">{$_('notifications.error')}</p>
			<Button variant="outline" onclick={() => void load()}>{$_('common.retry')}</Button>
		</div>
	{:else if visibleItems.length}<div class="grid gap-4" data-testid="notification-groups">
			{#each groups as group (group.family)}<section
					class="border border-border"
					data-family={group.family}
				>
					<h2>
						<button
							type="button"
							class="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 bg-card px-3 py-2 text-left"
							aria-expanded={!collapsed.has(group.family)}
							onclick={() => {
								if (collapsed.has(group.family)) collapsed.delete(group.family);
								else collapsed.add(group.family);
							}}
						>
							<span class="text-xl">{$_('controls.families.' + group.family)}</span><span
								class="text-xs font-sans text-muted-foreground"
								>{$_('controls.groupLoaded', {
									values: { count: group.items.length, unread: group.unread }
								})} <span aria-hidden="true">{collapsed.has(group.family) ? '+' : '−'}</span></span
							>
						</button>
					</h2>
					<ul class="divide-y divide-border" hidden={collapsed.has(group.family)}>
						{#each group.items as notification (notification.id)}<li>
								<button
									class={`flex w-full flex-wrap gap-3 px-3 py-4 text-left hover:bg-primary/8 ${!notification.read ? 'bg-primary/10' : ''}`}
									onclick={() => void open(notification)}
								>
									<div class="min-w-0 basis-48 flex-1">
										<p class="font-bold flex justify-between gap-2">
											<span>{label(notification)}</span><span aria-hidden="true">↗</span>
										</p>
										<p class="mt-1 text-sm text-muted-foreground">
											{notification.actor ? notification.actor.name : $_('notifications.system')}
										</p>
									</div>
									<time class="shrink-0 text-xs text-muted-foreground"
										>{Number.isFinite(Date.parse(notification.createdAt))
											? new Intl.DateTimeFormat('fr-FR', {
													dateStyle: 'short',
													timeStyle: 'short'
												}).format(new Date(notification.createdAt))
											: $_('plan.unknownDate')}</time
									>
								</button>
							</li>{/each}
					</ul>
				</section>{/each}
		</div>{:else}<p class="forge-panel-flat p-6 text-muted-foreground">
			{$_('notifications.empty_tab')}
		</p>{/if}
	{#if hasNext}<Button variant="outline" disabled={loadingMore} onclick={() => void load(true)}
			>{loadingMore ? $_('notifications.loading') : $_('common.load_more')}</Button
		>{/if}
</section>
