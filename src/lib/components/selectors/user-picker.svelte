<script lang="ts">
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { untrack } from 'svelte';
	import { searchUsers } from '$lib/api/users';
	import type { User } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import * as Field from '$lib/components/ui/field';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { onChoose }: { onChoose: (user: User) => void } = $props();
	const uid = $props.id();
	let query = $state('');
	let users = $state<User[]>([]);
	let error = $state('');
	let busy = $state(false);
	let revision = $state(0);
	$effect(() => {
		void revision;
		const q = query;
		busy = q.trim().length >= 3;
		const abort = new AbortController();
		const timer = setTimeout(
			() =>
				untrack(async () => {
					error = '';
					try {
						const result = await searchUsers(q, {}, { signal: abort.signal });
						if (!abort.signal.aborted) users = result;
					} catch (cause) {
						if (!abort.signal.aborted) error = operationError(cause);
					} finally {
						if (!abort.signal.aborted) busy = false;
					}
				}),
			300
		);
		return () => {
			clearTimeout(timer);
			abort.abort();
		};
	});
</script>

<Field.Field
	><Field.FieldLabel for={uid}>{$_('completion.searchUser')}</Field.FieldLabel><Input
		id={uid}
		type="search"
		bind:value={query}
	/><Field.FieldDescription>{$_('completion.searchHint')}</Field.FieldDescription>
	{#if error}<div role="alert">
			<p>{error}</p>
			<button type="button" class="min-h-11 underline" onclick={() => (revision += 1)}
				>{$_('completion.retry')}</button
			>
		</div>
	{:else if busy}<p role="status">{$_('completion.loading')}</p>
	{:else if query.trim().length >= 3 && !users.length}<p>{$_('completion.empty')}</p>{/if}
	<div class="flex max-h-64 flex-col overflow-auto">
		{#each users as user (user.id)}<button
				type="button"
				aria-label={user.username}
				disabled={busy}
				class="flex items-center gap-3 border-b border-border p-3 text-left hover:bg-primary/10"
				onclick={() => onChoose(user)}
				><UserAvatar image={user.avatarUrl} crop={user.imageCrop} name={user.username} /><span
					>{user.username}</span
				></button
			>{/each}
	</div>
</Field.Field>
