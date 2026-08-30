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
			imagePageId: string | null
		) => void | Promise<void>;
		onUpdate: (
			title: string,
			description: string,
			imagePageId: string | null
		) => void | Promise<void>;
		onDelete: () => void | Promise<void>;
	} = $props();

	let title = $state('');
	let description = $state('');
	let editTitle = $state('');
	let editDescription = $state('');

	async function create() {
		if (!title.trim()) return;
		await onCreate(title.trim(), description.trim(), createImage?.pageId ?? null);
		title = '';
		description = '';
		createOpen = false;
	}

	async function update() {
		if (!editTitle.trim()) return;
		await onUpdate(
			editTitle.trim(),
			editDescription.trim(),
			editImage?.pageId ?? registry?.imagePageId ?? null
		);
		editOpen = false;
	}

	$effect(() => {
		if (!editOpen || !registry) return;
		editTitle = registry.title;
		editDescription = registry.description;
	});
</script>

<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header class="px-4 pt-4 pr-12 pb-2"
			><Dialog.Title>{$_('wishlist.create_btn')}</Dialog.Title></Dialog.Header
		>
		<div class="grid gap-3 px-4 pt-2 pb-4">
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
				<Button class="flex-1" onclick={() => void create()}>{$_('common.save')}</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header><Dialog.Title>{$_('wishlist.edit_registry')}</Dialog.Title></Dialog.Header>
		<div class="grid gap-3 p-4">
			<Input
				bind:value={editTitle}
				maxlength={64}
				placeholder={$_('wishlist.create_placeholder')}
			/>
			{#if editImage?.imageUrl || registry?.imageUrl}
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
				<Button class="flex-1" onclick={() => void update()}>{$_('common.save')}</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>{$_('wishlist.delete_title')}</Dialog.Title>
			<Dialog.Description>{registry?.title}</Dialog.Description>
		</Dialog.Header>
		<div class="flex gap-2 p-4">
			<Button variant="outline" class="flex-1" onclick={() => (deleteOpen = false)}
				>{$_('common.cancel')}</Button
			>
			<Button variant="destructive" class="flex-1" onclick={() => void onDelete()}
				>{$_('wishlist.delete_registry')}</Button
			>
		</div>
	</Dialog.Content>
</Dialog.Root>
