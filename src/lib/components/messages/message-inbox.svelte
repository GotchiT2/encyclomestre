<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { getUserProfile } from '$lib/api/player-profile';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { draftKey, writeDraft } from '$lib/drafts/storage';
	import { operationError } from '$lib/domain/operation-error';
	import { onDestroy, onMount } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { getConversationMessages, getConversations, sendMessage } from '$lib/api';
	import { chatStreamEvent, toChatStreamMessage } from '$lib/messages/stream';
	import ConversationList from './conversation-list.svelte';
	import MessageThread from './message-thread.svelte';
	import type { Conversation, LastConnection, MessageRecord, User } from '$lib/types';
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
	let friends = $state<User[]>([]);
	let newOpen = $state(false);
	let loadError = $state('');
	let revision = 0;
	let selectedConversationId = $state('');
	let thread = $state<MessageRecord[]>([]);
	let query = $state('');
	let draft = $state('');
	let sendError = $state('');
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

	async function applyIncomingMessage() {
		const event = $chatStreamEvent;
		if (!event) return;
		const message = toChatStreamMessage(event);
		const knownConversation = conversations.find(
			(conversation) =>
				conversation.id === event.conversationId || conversation.userId === event.otherUserId
		);
		if (!knownConversation) {
			const page = await getConversations();
			conversations = [
				...new Map(
					[...conversations, ...withFriendPresence(page.items)].map((item) => [
						item.userId ?? item.id,
						item
					])
				).values()
			];
			conversationsCursor = page.nextCursor;
			hasMoreConversations = page.hasNext;
			return;
		}

		const isSelected = knownConversation.id === selectedConversationId;
		conversations = [
			{
				...knownConversation,
				preview: message.type === 'trade' ? '' : message.content,
				previewType: message.type,
				updatedAt: message.createdAt,
				unreadCount: isSelected ? 0 : event.unread
			},
			...conversations.filter((conversation) => conversation.id !== knownConversation.id)
		];
		if (isSelected && !thread.some((item) => item.id === message.id)) {
			thread = [...new Map([...thread, message].map((item) => [item.id, item])).values()];
		}
	}

	let handledStreamMessageId = '';
	$effect(() => {
		const event = $chatStreamEvent;
		if (!event || event.message.id === Number(handledStreamMessageId)) return;
		handledStreamMessageId = String(event.message.id);
		void applyIncomingMessage().catch((cause) => (loadError = operationError(cause)));
	});

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
		loadError = '';
		try {
			const [page, friendships] = await Promise.all([getConversations(), loadFriends()]);
			friendPresenceByUserId = Object.fromEntries(
				friendships.map((friendship) => [friendship.user.id, friendship.user.lastConnection])
			);
			conversations = withFriendPresence(page.items);
			conversationsCursor = page.nextCursor;
			hasMoreConversations = page.hasNext;
			friends = friendships
				.filter((friendship) => friendship.status === 'accepted')
				.map((friendship) => friendship.user);
			acceptedFriendIds = friendships
				.filter((friendship) => friendship.status === 'accepted')
				.map((friendship) => friendship.user.id);
			let requested = initialUserId
				? conversations.find((conversation) => conversation.userId === initialUserId)
				: null;
			if (initialUserId && !requested) {
				const friend = friends.find((user) => user.id === initialUserId);
				const profile = friend ? undefined : await getUserProfile(initialUserId);
				requested = makeConversation(
					initialUserId,
					friend?.username ?? profile?.name ?? '',
					friend?.avatarUrl ?? profile?.image
				);
				conversations = [requested, ...conversations];
			}
			selectedConversationId = requested?.id ?? conversations[0]?.id ?? '';
			if (selectedConversationId && (!mobileViewport || requested)) {
				await loadThread(selectedConversationId);
				mobileThreadOpen = mobileViewport && Boolean(requested);
			}
		} catch (cause) {
			loadError = operationError(cause);
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
		} catch (cause) {
			loadError = operationError(cause);
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
		} catch (cause) {
			if (sequence === requestSequence) loadError = operationError(cause);
		} finally {
			if (sequence === requestSequence) threadLoading = false;
		}
	}

	async function loadOlderMessages() {
		if (!selectedConversation?.userId || !hasOlderMessages || loadingOlderMessages) return;
		const selectedId = selectedConversation.id;
		loadingOlderMessages = true;
		try {
			const page = await getConversationMessages(selectedConversation.userId, messagesCursor);
			if (selectedConversationId !== selectedId) return;
			const known = new Set(thread.map((message) => message.id));
			thread = [...page.items.toReversed().filter((message) => !known.has(message.id)), ...thread];
			messagesCursor = page.nextCursor;
			hasOlderMessages = page.hasNext;
		} catch (cause) {
			loadError = operationError(cause);
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
		sendError = '';
		try {
			const conversation = selectedConversation;
			const content = draft;
			const message = await sendMessage(conversation.userId!, { content });
			if (selectedConversationId !== conversation.id) {
				writeDraft(localStorage, draftKey(userId, `message:${conversation.id}`), '');
				return;
			}
			thread = [...new Map([...thread, message].map((item) => [item.id, item])).values()];
			writeDraft(localStorage, draftKey(userId, `message:${selectedConversation.id}`), '');
			if (draft === content) draft = '';
		} catch (cause) {
			sendError = operationError(cause);
		} finally {
			sending = false;
		}
	}
	function makeConversation(id: string, name: string, image?: string | null): Conversation {
		return {
			id: 'player:' + id,
			userId: id,
			title: name,
			avatarUrl: image,
			preview: '',
			unreadCount: 0,
			updatedAt: new Date().toISOString(),
			kind: 'direct',
			participantIds: [userId, id]
		};
	}
	async function start(user: User) {
		let conversation = conversations.find((item) => item.userId === user.id);
		if (!conversation) {
			conversation = makeConversation(user.id, user.username, user.avatarUrl);
			conversations = [conversation, ...conversations];
		}
		newOpen = false;
		await selectConversation(conversation.id);
	}
	$effect(() => {
		const refresh = $realtimeRefresh;
		if (refresh.revision === revision || !refreshIncludes(refresh, 'messages')) return;
		revision = refresh.revision;
		void (async () => {
			const selectedUser = selectedConversation?.userId;
			const result = await getConversations();
			conversations = [
				...new Map(
					[...conversations, ...withFriendPresence(result.items)].map((item) => [
						item.userId ?? item.id,
						item
					])
				).values()
			];
			if (selectedUser)
				selectedConversationId =
					conversations.find((item) => item.userId === selectedUser)?.id ?? selectedConversationId;
			if (selectedConversationId) await loadThread(selectedConversationId);
		})().catch((cause) => (loadError = operationError(cause)));
	});
</script>

<div class="mb-3 flex flex-wrap gap-2">
	<Button onclick={() => (newOpen = true)}>{$_('plan.messages.new')}</Button>{#if loadError}<p
			role="alert"
		>
			{loadError}
		</p>
		<Button variant="outline" onclick={() => void loadInitialData()}
			>{$_('completion.retry')}</Button
		>{/if}
</div>
{#if sendError}<p role="alert" class="mb-3 text-destructive">{sendError}</p>{/if}
<div
	class="message-workbench min-h-0 overflow-hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)]"
	data-testid="message-workspace"
>
	<ConversationList
		class="h-[calc(100dvh-17rem)] min-h-0 lg:h-full lg:border-r lg:border-border"
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

<Dialog.Root bind:open={newOpen}
	><Dialog.Portal
		><Dialog.Overlay class="fixed inset-0 z-[100] bg-black/60" /><Dialog.Content
			class="fixed top-1/2 left-1/2 z-[101] max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border bg-card p-4 sm:p-5"
			><Dialog.Title class="text-xl font-semibold">{$_('plan.messages.new')}</Dialog.Title
			><Dialog.Description class="my-3 text-sm">{$_('plan.messages.newInfo')}</Dialog.Description
			>{#each friends as friend (friend.id)}<Button
					variant="ghost"
					class="w-full justify-start"
					onclick={() => void start(friend)}>{friend.username}</Button
				>{:else}<p>{$_('plan.messages.noFriends')}</p>
				<Button href="/friends">{$_('navigation.friends')}</Button>{/each}<Dialog.Close
				class="mt-4 underline">{$_('completion.cancel')}</Dialog.Close
			></Dialog.Content
		></Dialog.Portal
	></Dialog.Root
>

<style>
	.message-workbench {
		height: calc(100dvh - 18rem);
		min-height: 320px;
	}
	@media (min-width: 1024px) {
		.message-workbench {
			height: calc(100dvh - 15rem);
		}
	}
</style>
