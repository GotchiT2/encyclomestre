<script lang="ts">
	import { apiUrl, getNotifications, isMockApiEnabled } from '$lib/api';
	import { currentSession, verifiedWikiForgeSession } from '$lib/auth/session';
	import { unreadNotifications } from '$lib/notifications/store';
	import { chatStreamEvent, toChatStreamEvent } from '$lib/messages/stream';
	import {
		publishNotificationRefresh,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let stream: EventSource | null = null;
	const knownNotificationIds = new SvelteSet<string>();

	async function resync(reset = false) {
		if (!$currentSession || !$verifiedWikiForgeSession) return;
		const notifications = await getNotifications().catch(() => null);
		if (!notifications) return;
		unreadNotifications.set(notifications.unread);
		notifications.items.forEach((notification) => knownNotificationIds.add(notification.id));
		if (reset) {
			publishRealtimeRefresh([
				'collection',
				'friends',
				'messages',
				'notifications',
				'profile',
				'trades'
			]);
		} else {
			publishRealtimeRefresh(['notifications']);
		}
	}

	function openStream() {
		if (
			!$currentSession ||
			!$verifiedWikiForgeSession ||
			stream ||
			typeof EventSource === 'undefined' ||
			isMockApiEnabled()
		)
			return;
		stream = new EventSource(apiUrl('/stream', 'wikiforge'), { withCredentials: true });
		stream.addEventListener('stream.ready', () => void resync());
		stream.addEventListener('stream.reset', () => void resync(true));
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
		stream.onerror = () => {
			// EventSource tente sinon une reconnexion automatique : on ne relance pas
			// une boucle après un refus d'authentification ou une session expirée.
			stream?.close();
			stream = null;
		};
	}

	$effect(() => {
		if ($currentSession && $verifiedWikiForgeSession) {
			openStream();
		} else {
			stream?.close();
			stream = null;
			unreadNotifications.set(0);
		}
	});

	onDestroy(() => stream?.close());
</script>
