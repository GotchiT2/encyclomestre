<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { WishlistRegistrySummary } from '$lib/types';

	let {
		createOpen = $bindable(false),
		editOpen = $bindable(false),
		deleteOpen = $bindable(false),
		registry,
		createImage,
		editImage,
		onPickCreateImage = () => undefined,
		onPickEditImage = () => undefined,
		onCreate,
		onUpdate,
		onDelete
	}: {
		createOpen?: boolean;
		editOpen?: boolean;
		deleteOpen?: boolean;
		registry: WishlistRegistrySummary | null;
		createImage?: { title: string; imageUrl: string; pageId: string } | null;
		editImage?: { title: string; imageUrl: string; pageId: string } | null;
		onPickCreateImage?: () => void;
		onPickEditImage?: () => void;
		onCreate: (
			title: string,
			description: string,
			imagePageId: string | null,
			sharedWithGuild?: boolean
		) => void | Promise<void>;
		onUpdate: (
			title: string,
			description: string,
			imagePageId: string | null,
			sharedWithGuild?: boolean
		) => void | Promise<void>;
		onDelete: () => void | Promise<void>;
	} = $props();

	let sharedWithGuild = $state(false);
	let editSharedWithGuild = $state(false);
	let removeEditImage = $state(false);
	let busy = $state(false);
	let error = $state('');
	let title = $state('');
	let description = $state('');
	let editTitle = $state('');
	let editDescription = $state('');

	async function create() {
		if (!title.trim() || busy) return;
		busy = true;
		error = '';
		try {
			await onCreate(
				title.trim(),
				description.trim(),
				createImage?.pageId ?? null,
				sharedWithGuild
			);
			title = '';
			description = '';
			createOpen = false;
		} catch {
			error = $_('completion.errors.generic');
		} finally {
			busy = false;
		}
	}

	async function update() {
		if (!editTitle.trim() || busy) return;
		busy = true;
		error = '';
		try {
			await onUpdate(
				editTitle.trim(),
				editDescription.trim(),
				removeEditImage ? null : (editImage?.pageId ?? registry?.imagePageId ?? null),
				editSharedWithGuild
			);
			editOpen = false;
		} catch {
			error = $_('completion.errors.generic');
		} finally {
			busy = false;
		}
	}

	$effect(() => {
		if (!editOpen || !registry) return;
		editTitle = registry.title;
		removeEditImage = false;
		editDescription = registry.description;
		editSharedWithGuild = registry.sharedWithGuild ?? false;
	});
</script>

<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="max-w-md p-0 sm:p-0 overflow-hidden">
		<Dialog.Header class="px-4 pt-4 pr-14 pb-2 sm:px-5 sm:pr-14"
			><Dialog.Title>{$_('wishlist.create_btn')}</Dialog.Title></Dialog.Header
		>
		<div class="grid gap-3 px-4 pt-2 pb-4">
			<label class="flex items-center gap-2"
				><input type="checkbox" bind:checked={sharedWithGuild} />{$_(
					'completion.guild.share'
				)}</label
			>
			<p class="text-sm text-muted-foreground">{$_('completion.guild.sharedHelp')}</p>
			{#if error}<p role="alert">{error}</p>{/if}
			<Input bind:value={title} maxlength={64} placeholder={$_('wishlist.create_placeholder')} />
			<Input
				bind:value={description}
				maxlength={256}
				placeholder={$_('wishlist.description_placeholder')}
			/>
			<Button variant="outline" onclick={onPickCreateImage}>
				{createImage
					? $_('wishlist.illustration_selected', { values: { card: createImage.title } })
					: $_('wishlist.choose_illustration')}
			</Button>
			<div class="flex gap-2">
				<Button variant="outline" class="flex-1" onclick={() => (createOpen = false)}
					>{$_('common.cancel')}</Button
				>
				<Button class="flex-1" disabled={busy} onclick={() => void create()}
					>{$_('common.save')}</Button
				>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="max-w-md p-0 sm:p-0 overflow-hidden">
		<Dialog.Header class="px-4 pt-4 pr-14 sm:px-5 sm:pr-14"
			><Dialog.Title>{$_('wishlist.edit_registry')}</Dialog.Title></Dialog.Header
		>
		<div class="grid gap-3 p-4 sm:p-5">
			<label class="flex items-center gap-2"
				><input type="checkbox" bind:checked={editSharedWithGuild} />{$_(
					'completion.guild.share'
				)}</label
			>{#if error}<p role="alert">{error}</p>{/if}
			<Input
				bind:value={editTitle}
				maxlength={64}
				placeholder={$_('wishlist.create_placeholder')}
			/>
			{#if editImage?.imageUrl || registry?.imageUrl}
				<label class="flex items-center gap-2"
					><input type="checkbox" bind:checked={removeEditImage} />{$_(
						'completion.clearImage'
					)}</label
				>
				<img
					src={editImage?.imageUrl ?? registry?.imageUrl ?? ''}
					alt=""
					class="h-24 w-full object-cover"
				/>
			{/if}
			<Button variant="outline" onclick={onPickEditImage}>
				{editImage
					? $_('wishlist.illustration_selected', { values: { card: editImage.title } })
					: $_('wishlist.choose_illustration')}
			</Button>
			<Input
				bind:value={editDescription}
				maxlength={256}
				placeholder={$_('wishlist.description_placeholder')}
			/>
			<div class="flex gap-2">
				<Button variant="outline" class="flex-1" onclick={() => (editOpen = false)}
					>{$_('common.cancel')}</Button
				>
				<Button class="flex-1" disabled={busy} onclick={() => void update()}
					>{$_('common.save')}</Button
				>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content class="max-w-md p-0 sm:p-0 overflow-hidden">
		<Dialog.Header class="px-4 pt-4 pr-14 sm:px-5 sm:pr-14">
			<Dialog.Title>{$_('wishlist.delete_title')}</Dialog.Title>
			<Dialog.Description>{registry?.title}</Dialog.Description>
		</Dialog.Header>
		<div class="flex gap-2 p-4 sm:p-5">
			<Button variant="outline" class="flex-1" onclick={() => (deleteOpen = false)}
				>{$_('common.cancel')}</Button
			>
			<Button variant="destructive" class="flex-1" onclick={() => void onDelete()}
				>{$_('wishlist.delete_registry')}</Button
			>
		</div>
	</Dialog.Content>
</Dialog.Root>
