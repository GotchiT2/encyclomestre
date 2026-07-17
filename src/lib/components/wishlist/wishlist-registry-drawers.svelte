<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { _ } from '$lib/i18n';
	import type { WishlistRegistrySummary } from '$lib/types';

	let {
		createOpen = $bindable(false),
		editOpen = $bindable(false),
		deleteOpen = $bindable(false),
		registry,
		onCreate,
		onUpdate,
		onDelete
	}: {
		createOpen?: boolean;
		editOpen?: boolean;
		deleteOpen?: boolean;
		registry: WishlistRegistrySummary | null;
		onCreate: (title: string, description: string, isPublic: boolean) => void;
		onUpdate: (title: string, description: string, isPublic: boolean) => void;
		onDelete: () => void;
	} = $props();

	let title = $state('');
	let description = $state('');
	let isPublic = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editIsPublic = $state(false);

	function create() {
		if (!title.trim()) return;
		onCreate(title.trim(), description.trim(), isPublic);
		title = '';
		description = '';
		isPublic = false;
		createOpen = false;
	}

	function update() {
		if (!editTitle.trim()) return;
		onUpdate(editTitle.trim(), editDescription.trim(), editIsPublic);
		editOpen = false;
	}

	$effect(() => {
		if (!editOpen || !registry) return;
		editTitle = registry.title;
		editDescription = registry.description;
		editIsPublic = registry.isPublic;
	});
</script>

{#snippet visibilityControl(editing = false)}
	<label
		class="flex min-h-11 items-center justify-between gap-3 border border-primary/30 bg-background/70 px-3"
	>
		<span class="font-mono text-[10px] uppercase tracking-widest text-foreground">
			{$_('wishlist.public_visibility')}
		</span>
		{#if editing}
			<Switch bind:checked={editIsPublic} />
		{:else}
			<Switch bind:checked={isPublic} />
		{/if}
	</label>
{/snippet}

{#if createOpen}
	<div
		class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
		role="presentation"
		onclick={() => (createOpen = false)}
	>
		<dialog
			open
			class="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-double border-primary/40 bg-card p-5 text-foreground shadow-2xl"
			aria-labelledby="wishlist-create-title"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="wishlist-create-title" class="font-serif text-2xl font-black uppercase">
				{$_('wishlist.create_btn')}
			</h2>
			<div class="mt-4 grid gap-3">
				<Input bind:value={title} placeholder={$_('wishlist.create_placeholder')} />
				<Input bind:value={description} placeholder={$_('wishlist.description_placeholder')} />
				{@render visibilityControl()}
				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" onclick={() => (createOpen = false)}>
						{$_('common.cancel')}
					</Button>
					<Button class="flex-1" onclick={create}>{$_('common.save')}</Button>
				</div>
			</div>
		</dialog>
	</div>
{/if}

{#if editOpen}
	<div
		class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
		role="presentation"
		onclick={() => (editOpen = false)}
	>
		<dialog
			open
			class="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-double border-primary/40 bg-card p-5 text-foreground shadow-2xl"
			aria-labelledby="wishlist-edit-title"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="wishlist-edit-title" class="font-serif text-2xl font-black uppercase">
				{$_('wishlist.edit_registry')}
			</h2>
			<div class="mt-4 grid gap-3">
				<Input bind:value={editTitle} placeholder={$_('wishlist.create_placeholder')} />
				<Input bind:value={editDescription} placeholder={$_('wishlist.description_placeholder')} />
				{@render visibilityControl(true)}
				<div class="flex gap-2">
					<Button variant="outline" class="flex-1" onclick={() => (editOpen = false)}>
						{$_('common.cancel')}
					</Button>
					<Button class="flex-1" onclick={update}>{$_('common.save')}</Button>
				</div>
			</div>
		</dialog>
	</div>
{/if}

{#if deleteOpen}
	<div
		class="fixed inset-0 z-50 bg-black/70"
		role="presentation"
		onclick={() => (deleteOpen = false)}
	>
		<dialog
			open
			class="fixed top-1/2 left-1/2 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-double border-destructive/40 bg-card p-5 text-foreground shadow-2xl"
			aria-labelledby="wishlist-delete-title"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="wishlist-delete-title" class="font-serif text-2xl font-black uppercase">
				{$_('wishlist.delete_title')}
			</h2>
			<p class="mt-2 font-serif italic text-muted-foreground">{registry?.title}</p>
			<div class="mt-5 flex gap-2">
				<Button variant="outline" class="flex-1" onclick={() => (deleteOpen = false)}>
					{$_('common.cancel')}
				</Button>
				<Button variant="destructive" class="flex-1" onclick={onDelete}>
					{$_('wishlist.delete_registry')}
				</Button>
			</div>
		</dialog>
	</div>
{/if}
