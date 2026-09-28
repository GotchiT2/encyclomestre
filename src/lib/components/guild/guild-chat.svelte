<script lang="ts">
	import { draftKey, writeDraft } from '$lib/drafts/storage';
	import LocalDraft from '$lib/components/layout/local-draft.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { onMount, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import { readGuildMessages, sendGuildMessage, type GuildMessage } from '$lib/api/guilds';
	import { getVariants } from '$lib/api/variants';
	import { toCardRecord } from '$lib/api/cards';
	import { toPublicPageCardRecord } from '$lib/api/pages';
	import type { VariantDefinition, CardRecord } from '$lib/types';
	import { wikiForgeUtcDate } from '$lib/api/wikiforge-contract';
	import { ApiError } from '$lib/api/client';
	import { operationError } from '$lib/domain/operation-error';
	import { currentSanctions, sanctions } from '$lib/moderation/state';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import ArticlePicker from '$lib/components/selectors/article-picker.svelte';
	import OwnedCardPicker from '$lib/components/selectors/owned-card-picker.svelte';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { _ } from '$lib/i18n';
	let { guildId }: { guildId: number } = $props();
	let messages = $state<GuildMessage[]>([]);
	let cursor = $state<string>();
	let hasNext = $state(false);
	let loading = $state(false);
	let sending = $state(false);
	let error = $state('');
	let sendError = $state('');
	let content = $state('');
	let mode = $state('text');
	let pageId = $state<number>();
	let card = $state<CardRecord>();
	let variants = $state<VariantDefinition[]>([]);
	let now = $state(Date.now());
	let alive = true;
	const muted = $derived(currentSanctions($sanctions, now).some((item) => item.type === 'MUTE'));
	let reloadPending = false;
	function merge(incoming: GuildMessage[]) {
		const map = new SvelteMap(messages.map((message) => [message.id, message]));
		incoming.forEach((message) => map.set(message.id, message));
		messages = [...map.values()].sort(
			(a, b) =>
				wikiForgeUtcDate(a.creationDate).getTime() - wikiForgeUtcDate(b.creationDate).getTime() ||
				a.id - b.id
		);
	}
	async function load(older = false) {
		if (loading) {
			if (!older) reloadPending = true;
			return;
		}
		loading = true;
		const target = guildId;
		const known = new Set(messages.map((message) => message.id));
		try {
			let next = older ? cursor : undefined;
			do {
				const result = await readGuildMessages(target, next);
				if (!alive || guildId !== target) return;
				const overlap = result.results.some((message) => known.has(message.id));
				const first = !messages.length;
				merge(result.results);
				if (older || first) {
					cursor = result.nextCursor;
					hasNext = result.hasNext;
				}
				next = result.nextCursor;
				if (older || !known.size || overlap || !result.hasNext) break;
			} while (next);
			error = '';
		} catch (cause) {
			if (alive && target === guildId) {
				error = operationError(cause);
				if (cause instanceof ApiError && [403, 404].includes(cause.status)) {
					messages = [];
					cursor = undefined;
					hasNext = false;
				}
			}
		} finally {
			loading = false;
			if (reloadPending && alive) {
				reloadPending = false;
				void load();
			}
		}
	}
	let currentGuild = untrack(() => guildId);
	$effect(() => {
		const target = guildId;
		untrack(() => {
			if (target === currentGuild) return;
			currentGuild = target;
			messages = [];
			cursor = undefined;
			hasNext = false;
			content = '';
			card = undefined;
			pageId = undefined;
			void load();
		});
	});

	async function send() {
		if (sending || muted || (!content.trim() && mode === 'text')) return;
		sending = true;
		sendError = '';
		try {
			const created = await sendGuildMessage(guildId, {
				...(content.trim() ? { content: content.trim() } : {}),
				...(mode === 'card' ? { cardId: Number(card?.id) } : {}),
				...(mode === 'article' ? { pageId } : {})
			});
			if (!alive || created.guildId !== guildId) return;
			merge([created]);
			content = '';
			writeDraft(
				localStorage,
				draftKey($currentSession?.user.id ?? '', `guild-message:${guildId}`),
				''
			);
			card = undefined;
			pageId = undefined;
			mode = 'text';
		} catch (cause) {
			sendError = operationError(cause);
		} finally {
			sending = false;
		}
	}
	onMount(() => {
		alive = true;
		void load();
		void getVariants()
			.then((value) => (variants = value))
			.catch(() => undefined);
		const refresh = () => {
			if (!document.hidden) void load();
		};
		const receive = (event: Event) => {
			const message = (event as CustomEvent<GuildMessage>).detail;
			if (!message || message.guildId !== guildId) return;
			if (message.type === 'TEXT' && message.creationDate && message.fromUserId) merge([message]);
			else void load();
		};
		window.addEventListener('wikiforge:guild-message', receive);
		window.addEventListener('wikiforge:stream-ready', refresh);
		const clock = setInterval(() => (now = Date.now()), 1000);
		window.addEventListener('focus', refresh);
		return () => {
			alive = false;
			window.removeEventListener('wikiforge:guild-message', receive);
			window.removeEventListener('wikiforge:stream-ready', refresh);
			clearInterval(clock);
			window.removeEventListener('focus', refresh);
		};
	});
</script>

<section class="flex flex-col gap-4">
	<SanctionNotice kind="MUTE" />
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-muted-foreground">{$_('completion.guild.chatHelp')}</p>
		<Button variant="outline" disabled={loading} onclick={() => void load()}
			>{$_('completion.refresh')}</Button
		>
	</div>
	{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
	{#if hasNext}<Button variant="outline" disabled={loading} onclick={() => void load(true)}
			>{$_('completion.guild.older')}</Button
		>{/if}
	<ol class="flex flex-col gap-3">
		{#each messages as message (message.id)}<li class="forge-panel flex flex-col gap-3 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<a class="underline" href={resolve('/users/[id]', { id: String(message.fromUserId) })}
						>{$_('completion.guild.author', { values: { id: message.fromUserId } })}</a
					><time class="text-xs"
						>{wikiForgeUtcDate(message.creationDate).toLocaleString('fr-FR')}</time
					>
				</div>
				<p class="whitespace-pre-wrap break-words">{message.content}</p>
				{#if message.card}<div class="w-36">
						<CardTile
							card={toCardRecord(message.card as Parameters<typeof toCardRecord>[0], variants)}
							showCollectionState={false}
						/>
					</div>{:else if message.page}<div class="w-36">
						<CardTile
							card={toPublicPageCardRecord(
								message.page as Parameters<typeof toPublicPageCardRecord>[0],
								variants
							)}
						/>
					</div>{:else if message.type === 'CARD' || message.type === 'PAGE'}<p
						class="text-muted-foreground"
					>
						{$_('completion.guild.unavailable')}
					</p>{/if}
				{#if String(message.fromUserId) !== $currentSession?.user.id}<ReportDialog
						target={{ type: 'GUILD_MESSAGE', id: message.id }}
						title={message.content ?? $_('completion.guild.unavailable')}
						userId={message.fromUserId}
					/>{/if}
			</li>{:else}<p>{$_('completion.empty')}</p>{/each}
	</ol>
	{#if sendError}<p role="alert" class="text-destructive">{sendError}</p>{/if}
	<LocalDraft
		target={`guild-message:${guildId}`}
		value={content}
		onRestore={(value) => (content = value.slice(0, 2000))}
	/>
	<form
		class="forge-panel flex flex-col gap-4 p-5"
		onsubmit={(event) => {
			event.preventDefault();
			void send();
		}}
	>
		<Field.FieldGroup
			><Field.Field
				><Field.FieldLabel for="guild-message">{$_('completion.guild.message')}</Field.FieldLabel
				><textarea
					id="guild-message"
					bind:value={content}
					disabled={muted || sending}
					maxlength={2000}
					class="min-h-24 w-full border border-border bg-background p-3"
				></textarea><Field.FieldDescription
					>{$_('completion.guild.maxMessage')}</Field.FieldDescription
				></Field.Field
			><Field.Field
				><Field.FieldLabel for="guild-attachment"
					>{$_('completion.guild.attachment')}</Field.FieldLabel
				><select
					id="guild-attachment"
					bind:value={mode}
					disabled={muted || sending}
					class="min-h-11 border border-border bg-background p-2"
					>{#each ['text', 'card', 'article'] as value (value)}<option {value}
							>{$_('completion.guild.' + value)}</option
						>{/each}</select
				></Field.Field
			>{#if mode === 'article'}<ArticlePicker
					bind:value={pageId}
					label={$_('completion.guild.article')}
				/>{:else if mode === 'card'}<OwnedCardPicker
					onChoose={(value) => (card = value)}
				/>{#if card}<p>
						{$_('completion.selected', {
							values: { name: card.title + ' · ' + card.variant.name }
						})}
					</p>{/if}{/if}</Field.FieldGroup
		><Button
			type="submit"
			disabled={muted ||
				sending ||
				(mode === 'text' && !content.trim()) ||
				(mode === 'card' && !card) ||
				(mode === 'article' && !pageId)}
			>{$_(sending ? 'completion.busy' : 'completion.guild.send')}</Button
		>
	</form>
</section>
