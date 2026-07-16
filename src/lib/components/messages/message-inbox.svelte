<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Dialog } from 'bits-ui';
	import {
		getConversationMessages,
		getConversations,
		markConversationRead,
		sendMessage,
		setMessageReaction
	} from '$lib/api';
	import ConversationList from './conversation-list.svelte';
	import MessageThread from './message-thread.svelte';
	import { _ } from '$lib/i18n';
	import { updateMessageReaction } from '$lib/messages/reactions';
	import type { Conversation, MessageRecord } from '$lib/types';

	let { userId, initialConversationId = '' }: { userId: string; initialConversationId?: string } =
		$props();

	let conversations = $state<Conversation[]>([]);
	let selectedConversationId = $state('');
	let loadedConversationId = $state('');
	let thread = $state<MessageRecord[]>([]);
	let query = $state('');
	let draft = $state('');
	let loading = $state(true);
	let threadLoading = $state(false);
	let sending = $state(false);
	let replyToMessageId = $state<string | null>(null);
	let mobileViewport = $state(false);
	let mobileThreadOpen = $state(false);
	let requestSequence = 0;
	let media: MediaQueryList | undefined;

	const selectedConversation = $derived(
		conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
	);

	onMount(() => {
		media = window.matchMedia('(max-width: 1023px)');
		const updateViewport = () => {
			mobileViewport = media?.matches ?? false;
			if (
				!mobileViewport &&
				selectedConversationId &&
				loadedConversationId !== selectedConversationId
			) {
				void loadThread(selectedConversationId);
			}
		};
		updateViewport();
		media.addEventListener('change', updateViewport);
		void loadConversations();
		return () => media?.removeEventListener('change', updateViewport);
	});

	onDestroy(() => {
		requestSequence += 1;
	});

	function requestedConversation(items: Conversation[]) {
		if (!initialConversationId) return null;
		const participantId = initialConversationId.replace(/^conversation-/, '');
		return (
			items.find((conversation) => conversation.id === initialConversationId) ??
			items.find((conversation) => conversation.participantIds.includes(participantId)) ??
			null
		);
	}

	async function loadConversations() {
		loading = true;
		try {
			conversations = await getConversations(userId);
			const requested = requestedConversation(conversations);
			const current = conversations.find(
				(conversation) => conversation.id === selectedConversationId
			);
			selectedConversationId = requested?.id ?? current?.id ?? conversations[0]?.id ?? '';
			if (selectedConversationId && (!mobileViewport || Boolean(requested))) {
				await loadThread(selectedConversationId);
				mobileThreadOpen = mobileViewport && Boolean(requested);
			}
		} finally {
			loading = false;
		}
	}

	async function loadThread(conversationId: string) {
		const sequence = ++requestSequence;
		threadLoading = true;
		try {
			const messages = await getConversationMessages(conversationId);
			if (sequence !== requestSequence || selectedConversationId !== conversationId) return;
			thread = messages;
			loadedConversationId = conversationId;
			await markConversationRead(conversationId);
			conversations = conversations.map((conversation) =>
				conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
			);
		} finally {
			if (sequence === requestSequence) threadLoading = false;
		}
	}

	async function selectConversation(conversationId: string) {
		selectedConversationId = conversationId;
		replyToMessageId = null;
		if (mobileViewport) mobileThreadOpen = true;
		if (loadedConversationId !== conversationId) {
			thread = [];
			await loadThread(conversationId);
		}
	}

	async function submit() {
		if (!selectedConversationId || !draft.trim() || sending) return;
		sending = true;
		try {
			const message = await sendMessage(selectedConversationId, {
				senderId: userId,
				content: draft,
				replyToMessageId
			});
			thread = [...thread, message];
			draft = '';
			replyToMessageId = null;
			conversations = await getConversations(userId);
		} finally {
			sending = false;
		}
	}

	async function react(message: MessageRecord, emoji: string) {
		const current = message.reactions.find((reaction) => reaction.emoji === emoji);
		const active = !(current?.userIds.includes(userId) ?? false);
		const previousThread = thread;
		thread = updateMessageReaction(thread, message.id, emoji, userId, active);
		try {
			await setMessageReaction(message.id, emoji, active);
		} catch {
			thread = previousThread;
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
				bind:draft
				bind:replyToMessageId
				onSubmit={() => void submit()}
				onReact={(message, emoji) => void react(message, emoji)}
			/>
		{:else}
			<div class="grid h-full place-items-center p-6 text-muted-foreground">
				{$_('messages.empty')}
			</div>
		{/if}
	</div>
</div>

{#if mobileThreadOpen && selectedConversation}
	<Dialog.Root open onOpenChange={(open) => !open && (mobileThreadOpen = false)}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-[100] bg-black/80 lg:hidden" />
			<Dialog.Content
				preventScroll={false}
				class="fixed inset-0 z-[101] h-dvh w-full overflow-hidden bg-card text-foreground outline-none lg:hidden"
				data-testid="mobile-message-thread"
			>
				<Dialog.Title class="sr-only">{selectedConversation.title}</Dialog.Title>
				<MessageThread
					conversation={selectedConversation}
					{thread}
					{userId}
					loading={threadLoading}
					{sending}
					bind:draft
					bind:replyToMessageId
					onClose={() => (mobileThreadOpen = false)}
					onSubmit={() => void submit()}
					onReact={(message, emoji) => void react(message, emoji)}
				/>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
