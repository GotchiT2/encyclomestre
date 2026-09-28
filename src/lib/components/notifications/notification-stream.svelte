<script lang="ts">
	import { apiUrl, getCurrentUser, getNotifications, isMockApiEnabled } from '$lib/api';
	import { currentSession, verifiedWikiForgeSession } from '$lib/auth/session';
	import { unreadNotifications } from '$lib/notifications/store';
	import { chatStreamEvent, toChatStreamEvent } from '$lib/messages/stream';
	import {
		publishNotificationRefresh,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	import { onDestroy } from 'svelte';
	import { replaceBanners } from '$lib/banners/store';
	import { SvelteSet } from 'svelte/reactivity';
	import { refreshSession } from '$lib/api/client';
	let reconnecting = false;
	let authRecoveryUsed = false;
	let disposed = false;

	let stream: EventSource | null = null;
	const knownNotificationIds = new SvelteSet<string>();

	async function resync(reset = false) {
		if (!$currentSession || !$verifiedWikiForgeSession) return;
		const notifications = await getNotifications().catch(() => null);
		if (notifications) {
			unreadNotifications.set(notifications.unread);
			notifications.items.forEach((notification) => knownNotificationIds.add(notification.id));
		}
		if (reset) {
			publishRealtimeRefresh([
				'collection',
				'friends',
				'guild',
				'messages',
				'notifications',
				'profile',
				'trades',
				'achievements',
				'moderation'
			]);
		} else {
			publishRealtimeRefresh(['notifications']);
		}
	}

	function openStream() {
		if (
			disposed ||
			!$currentSession ||
			!$verifiedWikiForgeSession ||
			stream ||
			typeof EventSource === 'undefined' ||
			isMockApiEnabled()
		)
			return;
		stream = new EventSource(apiUrl('/stream', 'wikiforge'), { withCredentials: true });
		stream.addEventListener('stream.ready', () => {
			authRecoveryUsed = false;
			void resync(true);
			void getCurrentUser()
				.then((user) => replaceBanners(user.banners))
				.catch(() => undefined);
			window.dispatchEvent(new Event('wikiforge:stream-ready'));
		});
		stream.addEventListener('stream.reset', () => {
			void resync(true);
			window.dispatchEvent(new Event('wikiforge:stream-ready'));
		});
		stream.addEventListener('banners.changed', (event) => {
			try {
				const payload = JSON.parse((event as MessageEvent<string>).data) as { banners?: unknown };
				replaceBanners(payload.banners);
			} catch {
				// A malformed event must not dismiss an announcement already displayed.
			}
		});
		stream.addEventListener('auction.updated', (event) => {
			try {
				const payload = JSON.parse((event as MessageEvent<string>).data);
				if (typeof payload?.id === 'number')
					window.dispatchEvent(new CustomEvent('wikiforge:auction-updated', { detail: payload }));
			} catch {
				/* Ignore malformed auction events. */
			}
		});
		stream.addEventListener('notification.created', (event) => {
			try {
				const payload = JSON.parse((event as MessageEvent<string>).data) as { unread?: number };
				if (typeof payload.unread === 'number') unreadNotifications.set(payload.unread);
			} catch {
				return;
			}
			void getNotifications({ unreadOnly: true })
				.then((notifications) => {
					unreadNotifications.set(notifications.unread);
					const newNotifications = notifications.items.filter(
						(notification) => !knownNotificationIds.has(notification.id)
					);
					notifications.items.forEach((notification) => knownNotificationIds.add(notification.id));
					publishNotificationRefresh(newNotifications);
				})
				.catch(() => undefined);
		});
		stream.addEventListener('notification.read', (event) => {
			try {
				const payload = JSON.parse((event as MessageEvent<string>).data) as { unread?: number };
				if (typeof payload.unread === 'number') unreadNotifications.set(payload.unread);
			} catch {
				return;
			}
		});
		stream.addEventListener('guild.message', (event) => {
			try {
				const payload = JSON.parse((event as MessageEvent<string>).data);
				if (
					Number.isSafeInteger(payload?.message?.guildId) &&
					Number.isSafeInteger(payload?.message?.id)
				)
					window.dispatchEvent(
						new CustomEvent('wikiforge:guild-message', { detail: payload.message })
					);
			} catch {
				/* Invalid events do not interrupt other domains. */
			}
		});
		stream.addEventListener('chat.message', (event) => {
			try {
				const payload = toChatStreamEvent(JSON.parse((event as MessageEvent<string>).data));
				if (payload) chatStreamEvent.set(payload);
			} catch {
				// L'événement est facultatif : une charge invalide ne doit pas casser le flux.
			}
			publishRealtimeRefresh(['messages']);
		});
		stream.addEventListener('collection.changed', () =>
			publishRealtimeRefresh(['collection', 'profile'])
		);
		const source = stream;
		stream.onerror = () => {
			if (
				source.readyState !== EventSource.CLOSED ||
				reconnecting ||
				stream !== source ||
				authRecoveryUsed
			)
				return;
			authRecoveryUsed = true;
			source.close();
			stream = null;
			reconnecting = true;
			void refreshSession()
				.then((success) => {
					if (success && $currentSession && $verifiedWikiForgeSession) openStream();
				})
				.finally(() => (reconnecting = false));
		};
	}

	$effect(() => {
		if ($currentSession && $verifiedWikiForgeSession) {
			openStream();
		} else {
			stream?.close();
			stream = null;
			unreadNotifications.set(0);
			knownNotificationIds.clear();
			authRecoveryUsed = false;
		}
	});

	onDestroy(() => {
		disposed = true;
		stream?.close();
	});
</script>
