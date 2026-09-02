<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { getConversationMessages, getConversations, sendMessage } from '$lib/api';
	import ConversationList from './conversation-list.svelte';
	import MessageThread from './message-thread.svelte';
	import type { Conversation, LastConnection, MessageRecord } from '$lib/types';
	import type { getFriends as GetFriends } from '$lib/api/users';

	const defaultLoadFriends: typeof GetFriends = async (...args) =>
		(await import('$lib/api/users')).getFriends(...args);

	let {
		userId,
		initialUserId = '',
		loadFriends = defaultLoadFriends
	}: {
		userId: string;
		initialUserId?: string;
		loadFriends?: typeof GetFriends;
	} = $props();

	let conversations = $state<Conversation[]>([]);
	let selectedConversationId = $state('');
	let thread = $state<MessageRecord[]>([]);
	let query = $state('');
	let draft = $state('');
	let loading = $state(true);
	let threadLoading = $state(false);
	let sending = $state(false);
	let loadingMoreConversations = $state(false);
	let loadingOlderMessages = $state(false);
	let conversationsCursor = $state<string | null>(null);
	let messagesCursor = $state<string | null>(null);
	let hasMoreConversations = $state(false);
	let hasOlderMessages = $state(false);
	let acceptedFriendIds = $state<string[]>([]);
	let friendPresenceByUserId = $state<Record<string, LastConnection | undefined>>({});
	let mobileViewport = $state(false);
	let mobileThreadOpen = $state(false);
	let requestSequence = 0;
	let media: MediaQueryList | undefined;

	const selectedConversation = $derived(
		conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
	);
	const canSend = $derived(
		Boolean(selectedConversation?.userId && acceptedFriendIds.includes(selectedConversation.userId))
	);
	function withFriendPresence(items: Conversation[]) {
		return items.map((conversation) =>
			conversation.userId && friendPresenceByUserId[conversation.userId]
				? { ...conversation, lastConnection: friendPresenceByUserId[conversation.userId] }
				: conversation
		);
	}

	onMount(() => {
		media = window.matchMedia('(max-width: 1023px)');
		const updateViewport = () => (mobileViewport = media?.matches ?? false);
		updateViewport();
		media.addEventListener('change', updateViewport);
		void loadInitialData();
		return () => media?.removeEventListener('change', updateViewport);
	});

	onDestroy(() => {
		requestSequence += 1;
	});

	async function loadInitialData() {
		loading = true;
		try {
			const [page, friendships] = await Promise.all([getConversations(), loadFriends()]);
			friendPresenceByUserId = Object.fromEntries(
				friendships.map((friendship) => [friendship.user.id, friendship.user.lastConnection])
			);
			conversations = withFriendPresence(page.items);
			conversationsCursor = page.nextCursor;
			hasMoreConversations = page.hasNext;
			acceptedFriendIds = friendships
				.filter((friendship) => friendship.status === 'accepted')
				.map((friendship) => friendship.user.id);
			const requested = initialUserId
				? conversations.find((conversation) => conversation.userId === initialUserId)
				: null;
			selectedConversationId = requested?.id ?? conversations[0]?.id ?? '';
			if (selectedConversationId && (!mobileViewport || requested)) {
				await loadThread(selectedConversationId);
				mobileThreadOpen = mobileViewport && Boolean(requested);
			}
		} finally {
			loading = false;
		}
	}

	async function loadMoreConversations() {
		if (!hasMoreConversations || loadingMoreConversations) return;
		loadingMoreConversations = true;
		try {
			const page = await getConversations(conversationsCursor);
			const known = new Set(conversations.map((conversation) => conversation.id));
			conversations = [
				...conversations,
				...withFriendPresence(page.items).filter((item) => !known.has(item.id))
			];
			conversationsCursor = page.nextCursor;
			hasMoreConversations = page.hasNext;
		} finally {
			loadingMoreConversations = false;
		}
	}

	async function loadThread(conversationId: string) {
		const conversation = conversations.find((item) => item.id === conversationId);
		if (!conversation) return;
		const sequence = ++requestSequence;
		threadLoading = true;
		try {
			if (!conversation.userId) return;
			const page = await getConversationMessages(conversation.userId);
			if (sequence !== requestSequence || selectedConversationId !== conversationId) return;
			thread = page.items.toReversed();
			messagesCursor = page.nextCursor;
			hasOlderMessages = page.hasNext;
			conversations = conversations.map((item) =>
				item.id === conversationId ? { ...item, unreadCount: 0 } : item
			);
		} finally {
			if (sequence === requestSequence) threadLoading = false;
		}
	}

	async function loadOlderMessages() {
		if (!selectedConversation?.userId || !hasOlderMessages || loadingOlderMessages) return;
		loadingOlderMessages = true;
		try {
			const page = await getConversationMessages(selectedConversation.userId, messagesCursor);
			const known = new Set(thread.map((message) => message.id));
			thread = [...page.items.toReversed().filter((message) => !known.has(message.id)), ...thread];
			messagesCursor = page.nextCursor;
			hasOlderMessages = page.hasNext;
		} finally {
			loadingOlderMessages = false;
		}
	}

	async function selectConversation(conversationId: string) {
		selectedConversationId = conversationId;
		if (mobileViewport) mobileThreadOpen = true;
		thread = [];
		await loadThread(conversationId);
	}

	async function submit() {
		if (
			!selectedConversation?.userId ||
			!canSend ||
			!draft.trim() ||
			draft.length > 2_000 ||
			sending
		)
			return;
		sending = true;
		try {
			const message = await sendMessage(selectedConversation.userId, { content: draft });
			thread = [...thread, message];
			draft = '';
		} finally {
			sending = false;
		}
	}
</script>

<div
	class="forge-panel-flat min-h-[34rem] overflow-hidden lg:grid lg:h-[calc(100dvh-12rem)] lg:min-h-[38rem] lg:grid-cols-[21rem_minmax(0,1fr)]"
	data-testid="message-workspace"
>
	<ConversationList
		class="h-[calc(100dvh-13rem)] min-h-[34rem] lg:h-full lg:min-h-0 lg:border-r lg:border-primary/20"
		{conversations}
		selectedId={selectedConversationId}
		bind:query
		{loading}
		hasMore={hasMoreConversations}
		loadingMore={loadingMoreConversations}
		onLoadMore={() => void loadMoreConversations()}
		onSelect={(id) => void selectConversation(id)}
	/>
	<div class="hidden min-h-0 lg:block">
		{#if selectedConversation}
			<MessageThread
				conversation={selectedConversation}
				{thread}
				{userId}
				loading={threadLoading}
				{sending}
				{canSend}
				hasOlder={hasOlderMessages}
				loadingOlder={loadingOlderMessages}
				bind:draft
				onLoadOlder={() => void loadOlderMessages()}
				onSubmit={() => void submit()}
			/>
		{/if}
	</div>
</div>

{#if mobileThreadOpen && selectedConversation}
	<Dialog.Root open onOpenChange={(open) => !open && (mobileThreadOpen = false)}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-[100] bg-black/80 lg:hidden" />
			<Dialog.Content
				class="fixed inset-0 z-[101] h-dvh w-full overflow-hidden bg-card lg:hidden"
				data-testid="mobile-message-thread"
			>
				<Dialog.Title class="sr-only">{selectedConversation.title}</Dialog.Title>
				<MessageThread
					conversation={selectedConversation}
					{thread}
					{userId}
					loading={threadLoading}
					{sending}
					{canSend}
					hasOlder={hasOlderMessages}
					loadingOlder={loadingOlderMessages}
					bind:draft
					onClose={() => (mobileThreadOpen = false)}
					onLoadOlder={() => void loadOlderMessages()}
					onSubmit={() => void submit()}
				/>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
