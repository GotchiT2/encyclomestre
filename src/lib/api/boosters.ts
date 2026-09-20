import type {
	BoosterOpenResult,
	PackCatalogueItem,
	PackDefinition,
	PackDrawGroup,
	PackFamily,
	PackPageSummary,
	PackStatus,
	PackSummary,
	PackVariantAvailability,
	VariantDefinition
} from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type WikiForgeCardDto } from './cards';
import { getVariants } from './variants';

export interface BoosterFamilyDto {
	family: PackFamily;
	available: number;
	max: number;
	bonus?: number;
	nextAvailableAt?: string | null;
}

export interface BoosterSlotPackDto {
	id: number;
	name: string;
	description: string;
	image?: string | null;
	renderKey?: string | null;
	family: PackFamily;
	nbCards: number;
	openAll: boolean;
}

export interface BoosterSlotDto {
	id: number;
	name: string;
	pack?: BoosterSlotPackDto | null;
}

export interface BoostersDto {
	families?: BoosterFamilyDto[] | null;
	slots?: BoosterSlotDto[] | null;
}

interface OpenedBoosterDto {
	packId: number;
	cards: WikiForgeCardDto[];
}

type PackPageSummaryDto = PackPageSummary;
interface PackVariantAvailabilityDto extends Omit<PackVariantAvailability, 'pages'> {
	pages?: PackPageSummaryDto[];
}
interface PackDrawGroupDto extends Omit<PackDrawGroup, 'variants'> {
	variants: PackVariantAvailabilityDto[];
}

export interface PackDefinitionDto {
	id: number;
	slotId: number;
	position: number;
	family: PackFamily;
	name: string;
	description: string;
	image?: string | null;
	renderKey?: string | null;
	status: PackStatus;
	startsAt?: string;
	endsAt?: string;
	nbCards: number;
	openAll: boolean;
	drawGroups: PackDrawGroupDto[];
}

export interface ResolvedPackVariant extends PackVariantAvailability {
	variant: VariantDefinition;
}

export interface ResolvedPackDrawGroup extends Omit<PackDrawGroup, 'variants'> {
	variants: ResolvedPackVariant[];
}

export interface ResolvedPackDefinition extends Omit<PackDefinition, 'drawGroups'> {
	drawGroups: ResolvedPackDrawGroup[];
}

export function toPackSummaries(inventory: BoostersDto): PackSummary[] {
	const families = new Map((inventory.families ?? []).map((entry) => [entry.family, entry]));
	return (inventory.slots ?? []).flatMap((slot) => {
		const pack = slot.pack;
		if (!pack) return [];
		const credit = families.get(pack.family);
		const regularAvailable = credit?.available ?? 0;
		const bonus = credit?.bonus ?? 0;
		return [
			{
				id: pack.id,
				slotId: slot.id,
				family: pack.family,
				name: pack.name,
				description: pack.description,
				imageUrl: pack.image?.trim() || '/images/booster.png',
				nbCards: pack.nbCards,
				regularAvailable,
				bonus,
				available: regularAvailable + bonus,
				max: credit?.max ?? 0,
				nextAvailableAt: credit?.nextAvailableAt ?? null
			}
		];
	});
}

export async function getBoosters(options?: RequestOptions): Promise<PackSummary[]> {
	return toPackSummaries(
		await apiRequest<BoostersDto>('/boosters', { ...options, apiTarget: 'wikiforge' })
	);
}

function toPackDefinition(pack: PackDefinitionDto): PackDefinition {
	const { image, renderKey, ...definition } = pack;
	return {
		...definition,
		...(image?.trim() ? { imageUrl: image.trim() } : {}),
		...(renderKey?.trim() ? { renderKey: renderKey.trim() } : {}),
		drawGroups: pack.drawGroups.map((group) => ({
			count: group.count,
			variants: group.variants.map((variant) => ({
				...variant,
				...(variant.pages ? { pages: variant.pages } : {})
			}))
		}))
	};
}

export async function getPacks(options?: RequestOptions): Promise<PackDefinition[]> {
	const packs = await apiRequest<PackDefinitionDto[]>('/packs', {
		...options,
		apiTarget: 'wikiforge'
	});
	return packs.map(toPackDefinition);
}

const packDetails = new Map<number, Promise<PackDefinition>>();

export function getPackDetails(id: number, options?: RequestOptions): Promise<PackDefinition> {
	let request = packDetails.get(id);
	if (!request) {
		request = apiRequest<PackDefinitionDto>(`/packs/${id}`, {
			...options,
			apiTarget: 'wikiforge'
		})
			.then(toPackDefinition)
			.catch((error) => {
				packDetails.delete(id);
				throw error;
			});
		packDetails.set(id, request);
	}
	return request;
}

export function resetPackDetailsCache() {
	packDetails.clear();
}

export function mergePackCatalogue(
	packs: PackDefinition[],
	credits: PackSummary[]
): PackCatalogueItem[] {
	const byId = new Map(credits.map((credit) => [credit.id, credit]));
	return packs.map((pack) => ({ ...pack, credit: byId.get(pack.id) ?? null }));
}

export function resolvePackDefinition(
	pack: PackDefinition,
	variants: VariantDefinition[]
): ResolvedPackDefinition {
	return {
		...pack,
		drawGroups: pack.drawGroups.map((group) => ({
			...group,
			variants: group.variants.map((entry) => ({
				...entry,
				variant: variants.find((variant) => variant.id === entry.variantId) ?? {
					id: entry.variantId,
					name: `#${entry.variantId}`,
					color: '#b8f2d5',
					styles: [],
					renderKey: 'standard'
				}
			}))
		}))
	};
}

export async function openBooster(
	packId: number,
	options?: RequestOptions
): Promise<BoosterOpenResult> {
	const [response, variants] = await Promise.all([
		apiRequest<OpenedBoosterDto>(`/boosters/${packId}/open`, {
			...options,
			apiTarget: 'wikiforge',
			method: 'POST'
		}),
		getVariants(options)
	]);
	return {
		packId: response.packId,
		cards: response.cards.map((card) => toCardRecord(card, variants))
	};
}

export async function openAllBoosters(
	packId: number,
	options?: RequestOptions
): Promise<BoosterOpenResult> {
	const [response, variants] = await Promise.all([
		apiRequest<OpenedBoosterDto>(`/boosters/${packId}/open-all`, {
			...options,
			apiTarget: 'wikiforge',
			method: 'POST'
		}),
		getVariants(options)
	]);
	return {
		packId: response.packId,
		cards: response.cards.map((card) => toCardRecord(card, variants))
	};
}
