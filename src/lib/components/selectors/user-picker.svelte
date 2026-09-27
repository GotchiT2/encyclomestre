<script lang="ts">
	import { untrack } from 'svelte';
	import { searchUsers } from '$lib/api/users';
	import type { User } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import * as Field from '$lib/components/ui/field';
	import { _ } from '$lib/i18n';
	import { operationError } from '$lib/domain/operation-error';
	let { onChoose }: { onChoose: (user: User) => void } = $props();
	let query = $state('');
	let users = $state<User[]>([]);
	let error = $state('');
	$effect(() => {
		const q = query;
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
	><Field.FieldLabel>{$_('completion.searchUser')}</Field.FieldLabel><Input
		type="search"
		bind:value={query}
	/><Field.FieldDescription>{$_('completion.searchHint')}</Field.FieldDescription>
	{#if error}<p role="alert">{error}</p>{/if}
	<div class="flex max-h-64 flex-col overflow-auto">
		{#each users as user (user.id)}<button
				type="button"
				class="flex items-center gap-3 border-b border-border p-3 text-left hover:bg-primary/10"
				onclick={() => onChoose(user)}
				>{#if user.avatarUrl}<img
						src={user.avatarUrl}
						alt=""
						class="size-9 object-cover"
					/>{/if}<span>{user.username}</span></button
			>{/each}
	</div>
</Field.Field>
