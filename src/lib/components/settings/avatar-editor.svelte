<script lang="ts">
	import { untrack } from 'svelte';
	import { _ } from '$lib/i18n';
	import { currentSession, persistSession } from '$lib/auth/session';
	import { updateWikiForgeImage } from '$lib/api/users';
	import { operationError } from '$lib/domain/operation-error';
	import type { User } from '$lib/types';
	import ArticlePicker from '$lib/components/selectors/article-picker.svelte';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	let { open = $bindable(false), onSaved }: { open?: boolean; onSaved?: (user: User) => void } =
		$props();
	let image = $state<string | null>(null);
	let pageId = $state<number | null>(null);
	let x = $state(50);
	let y = $state(50);
	let zoom = $state(1);
	let busy = $state(false);
	let error = $state('');
	$effect(() => {
		if (open)
			untrack(() => {
				const user = $currentSession?.user;
				image = user?.avatarUrl ?? null;
				pageId = user?.imagePageId ?? null;
				x = user?.imageCrop?.x ?? 50;
				y = user?.imageCrop?.y ?? 50;
				zoom = user?.imageCrop?.zoom ?? 1;
				error = '';
			});
	});
	async function save() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			const user = await updateWikiForgeImage(pageId, undefined, { x, y, zoom });
			if ($currentSession) persistSession(localStorage, { ...$currentSession, user });
			onSaved?.(user);
			open = false;
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<Dialog.Root bind:open
	><Dialog.Content class="max-h-[90dvh] overflow-y-auto p-4 sm:p-6"
		><Dialog.Header class="pr-8"
			><Dialog.Title>{$_('settings.choose_avatar')}</Dialog.Title><Dialog.Description
				>{$_('plan.avatar.help')}</Dialog.Description
			></Dialog.Header
		>
		<div class="space-y-4">
			<div class="flex justify-center">
				<UserAvatar
					{image}
					name={$currentSession?.user.username ?? ''}
					crop={{ x, y, zoom }}
					size="lg"
					class="size-32"
				/>
			</div>
			<ArticlePicker
				onChoose={(page) => {
					pageId = page?.id ?? null;
					image = page?.image ?? null;
					x = 50;
					y = 50;
					zoom = 1;
				}}
			/>{#if image}{#each ['x', 'y', 'zoom'] as axis (axis)}<label class="grid gap-2"
						><span>{$_('plan.avatar.' + axis)}</span><input
							aria-label={$_('plan.avatar.' + axis)}
							type="range"
							min={axis === 'zoom' ? 1 : 0}
							max={axis === 'zoom' ? 5 : 100}
							step={axis === 'zoom' ? 0.1 : 1}
							value={axis === 'x' ? x : axis === 'y' ? y : zoom}
							oninput={(event) => {
								const value = Number(event.currentTarget.value);
								if (axis === 'x') x = value;
								else if (axis === 'y') y = value;
								else zoom = value;
							}}
							disabled={busy}
						/></label
					>{/each}{/if}{#if error}<p role="alert" class="text-destructive">{error}</p>{/if}
			<div class="sticky bottom-0 flex flex-wrap gap-2 bg-card py-3">
				<Button disabled={busy} onclick={save}>{$_('completion.save')}</Button><Button
					variant="outline"
					disabled={busy}
					onclick={() => {
						pageId = null;
						image = null;
					}}>{$_('settings.remove_avatar')}</Button
				>
			</div>
		</div></Dialog.Content
	></Dialog.Root
>
