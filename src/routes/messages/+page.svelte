<script lang="ts">
	import { page } from '$app/state';
	import { currentSession } from '$lib/auth/session';
	import MessageInbox from '$lib/components/messages/message-inbox.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { _ } from '$lib/i18n';

	const userId = $derived($currentSession?.user.id ?? 'demo-user');
	const initialConversationId = $derived(
		page.url.searchParams.get('user') ? `conversation-${page.url.searchParams.get('user')}` : ''
	);
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('messages.eyebrow')}
		title={$_('messages.title')}
		description={$_('messages.description')}
	/>
	<MessageInbox {userId} {initialConversationId} />
</section>
