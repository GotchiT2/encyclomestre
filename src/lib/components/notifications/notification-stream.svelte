<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { apiUrl, getCurrentUser, getNotifications, isMockApiEnabled } from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import { unreadNotifications } from '$lib/notifications/store';
	import { onDestroy } from 'svelte';

	let stream: EventSource | null = null;
	let reconnecting = false;

	async function resync() {
		if (!$currentSession) return;
		const notifications = await getNotifications().catch(() => null);
		if (notifications) unreadNotifications.set(notifications.unread);
		await invalidateAll();
	}

	function openStream() {
		if (!$currentSession || stream || typeof EventSource === 'undefined' || isMockApiEnabled()) return;
		stream = new EventSource(apiUrl('/stream', 'wikiforge'), { withCredentials: true });
		stream.addEventListener('stream.ready', () => void resync());
		stream.addEventListener('stream.reset', () => void resync());
		stream.addEventListener('notification.created', (event) => {
			let payload: { unread?: number } = {};
			try { payload = JSON.parse((event as MessageEvent<string>).data) as { unread?: number }; } catch { return; }
			if (typeof payload.unread === 'number') unreadNotifications.set(payload.unread);
			void invalidateAll();
		});
		stream.addEventListener('notification.read', (event) => {
			let payload: { unread?: number } = {};
			try { payload = JSON.parse((event as MessageEvent<string>).data) as { unread?: number }; } catch { return; }
			if (typeof payload.unread === 'number') unreadNotifications.set(payload.unread);
		});
		stream.addEventListener('chat.message', () => void invalidateAll());
		stream.addEventListener('collection.changed', () => void resync());
		stream.onerror = () => {
			if (!stream || stream.readyState !== EventSource.CLOSED || reconnecting) return;
			stream.close();
			stream = null;
			reconnecting = true;
			void getCurrentUser()
				.then(() => openStream())
				.finally(() => (reconnecting = false));
		};
	}

	$effect(() => {
		if ($currentSession) {
			void resync();
			openStream();
		} else {
			stream?.close();
			stream = null;
			unreadNotifications.set(0);
		}
	});

	onDestroy(() => stream?.close());
</script>
