<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TemplateCard from '$lib/card-renderer/template-card.svelte';
	import type { PublishedTemplate } from '$lib/card-renderer/catalogue';
	import { untrack } from 'svelte';
	import { packNames, loadPackNames } from '$lib/arcade/pack-context';
	import { currentSession } from '$lib/auth/session';
	import { packNameKey } from '$lib/components/boosters/pack-labels';
	import { variantDefinition } from '$lib/card-renderer/presentation';
	import { parseRenderKey } from '$lib/card-renderer/render-key';
	import { nsfwFilterSettings, shouldBlurCardIllustration } from '$lib/content/nsfw-filter';
	import { cardHasStyle, type CardRecord } from '$lib/types';

	let {
		card,
		reveal = false,
		onOrientationChange = () => undefined
	}: {
		card: CardRecord;
		reveal?: boolean;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();
	$effect(() => {
		if ($currentSession && card.packId != null) untrack(() => void loadPackNames());
	});
	const edition = $derived.by(() => {
		const name = card.packId == null ? undefined : $packNames[card.packId];
		const key = name ? packNameKey(name) : undefined;
		return key ? $_(key) : name;
	});
	const fullArt = $derived(cardHasStyle(card, 'FULL_ART'));
	const chrome = $derived(cardHasStyle(card, 'CHROME'));
	const illustrationBlurred = $derived(shouldBlurCardIllustration(card, $nsfwFilterSettings));
	const fallback = $derived(variantDefinition(card.variant.color, chrome));
	const inline = $derived.by(() => {
		try {
			return { definition: parseRenderKey(card.variant.renderKey), error: false };
		} catch {
			return { definition: null, error: true };
		}
	});

	let template = $state<PublishedTemplate | null>(null),
		templateError = $state(false);
	let templateGeneration = 0;
	async function loadTemplate(key: string, generation: number) {
		try {
			const { getCardTemplate } = await import('$lib/api/card-templates');
			const value = await getCardTemplate(key);
			if (generation === templateGeneration) template = value;
		} catch {
			if (generation === templateGeneration) templateError = true;
		}
	}
	$effect(() => {
		const key = card.variant.renderKey;
		template = null;
		templateError = false;
		const generation = ++templateGeneration;
		if (key.startsWith('tpl:')) untrack(() => void loadTemplate(key, generation));
		return () => {
			templateGeneration++;
		};
	});
</script>

<TemplateCard
	definition={inline.definition ?? template?.definition ?? fallback}
	data={{
		title: card.title,
		image: card.imageUrl,
		variantName: card.variant.name,
		fullArt,
		serial: card.serialNumber,
		maximum: card.maxCopies,
		blurred: illustrationBlurred,
		edition,
		description: card.longDescription || card.shortDescription
	}}
	labels={{ missing: $_('cardTemplates.missing'), untitled: $_('cardTemplates.untitled') }}
	{onOrientationChange}
	{reveal}
/>
{#if templateError || inline.error}<p class="text-xs text-muted-foreground" role="status">
		{$_('cardTemplates.fallback')}
	</p>{/if}
