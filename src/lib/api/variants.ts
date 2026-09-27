import type { CardStyle, VariantDefinition } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';

const knownRenderKeys = new Set([
	'standard',
	'full-art',
	'chrome',
	'nebula',
	'arcade',
	'neon',
	'comics'
]);

export const standardVariant: VariantDefinition = {
	id: 0,
	name: 'Standard',
	color: '#b8f2d5',
	styles: ['NORMAL'],
	renderKey: 'standard'
};

interface VariantDto {
	id: number;
	name: string;
	color: string;
	styles: CardStyle[];
	renderKey?: string | null;
}

function normalizeVariant(variant: VariantDto): VariantDefinition {
	const requestedKey = variant.renderKey?.trim().toLowerCase();
	return {
		...variant,
		styles: Array.isArray(variant.styles) ? variant.styles : [],
		renderKey:
			requestedKey && (knownRenderKeys.has(requestedKey) || requestedKey.startsWith('tpl:'))
				? requestedKey
				: 'standard'
	};
}

let variantsPromise: Promise<VariantDefinition[]> | undefined;

export function getVariants(options?: RequestOptions): Promise<VariantDefinition[]> {
	variantsPromise ??= apiRequest<VariantDto[]>('/variants', {
		...options,
		apiTarget: 'wikiforge'
	})
		.then((variants) => variants.map(normalizeVariant))
		.catch((error) => {
			variantsPromise = undefined;
			throw error;
		});
	return variantsPromise;
}

export function resetVariantsCache() {
	variantsPromise = undefined;
}

export function resolveVariant(variants: VariantDefinition[], id?: number | null) {
	return variants.find((variant) => variant.id === id) ?? standardVariant;
}

export function defaultPageVariant(variants: VariantDefinition[], id?: number | null) {
	return (
		variants.find((variant) => variant.id === id) ??
		variants.find((variant) => variant.styles.includes('NORMAL')) ??
		standardVariant
	);
}
