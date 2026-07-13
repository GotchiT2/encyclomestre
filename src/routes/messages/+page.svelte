<script lang="ts">
	import { page } from '$app/state';
	import { currentSession } from '$lib/auth/session';
	import MessageInbox from '$lib/components/messages/message-inbox.svelte';
	import { _ } from '$lib/i18n';

	const userId = $derived($currentSession?.user.id ?? 'demo-user');
	const initialConversationId = $derived(
		page.url.searchParams.get('user') ? `conversation-${page.url.searchParams.get('user')}` : ''
	);
</script>

<section class="flex flex-col gap-6 pb-12">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('messages.eyebrow')}
		</p>
		<h1
			class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
		>
			{$_('messages.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('messages.description')}</p>
	</header>
	<MessageInbox {userId} {initialConversationId} />
</section>
