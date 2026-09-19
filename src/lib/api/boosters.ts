import type { BoosterOpenResult, PackSummary } from '$lib/types';
import { apiRequest, type RequestOptions } from './client';
import { toCardRecord, type ImageAttributionDto, type WikiForgeCardDto } from './cards';
import { getVariants } from './variants';

export interface PackSummaryDto {
	id: number;
	name: string;
	description: string;
	image?: string | null;
	imageAttribution?: ImageAttributionDto | null;
	nbCards: number;
	available: number;
	max: number;
	nextAvailableAt?: string | null;
}

interface OpenedBoosterDto {
	packId: number;
	cards: WikiForgeCardDto[];
}

export function toPackSummary(pack: PackSummaryDto): PackSummary {
	return {
		id: pack.id,
		name: pack.name,
		description: pack.description,
		imageUrl: pack.image?.trim() || '/images/booster.png',
		...(pack.imageAttribution?.sourceUrl
			? {
					imageAttribution: {
						sourceUrl: pack.imageAttribution.sourceUrl,
						...(pack.imageAttribution.author ? { author: pack.imageAttribution.author } : {}),
						...(pack.imageAttribution.license ? { license: pack.imageAttribution.license } : {}),
						...(pack.imageAttribution.licenseUrl
							? { licenseUrl: pack.imageAttribution.licenseUrl }
							: {})
					}
				}
			: {}),
		nbCards: pack.nbCards,
		available: pack.available,
		max: pack.max,
		nextAvailableAt: pack.nextAvailableAt ?? null
	};
}

export async function getBoosters(options?: RequestOptions): Promise<PackSummary[]> {
	return (
		await apiRequest<PackSummaryDto[]>('/boosters', { ...options, apiTarget: 'wikiforge' })
	).map(toPackSummary);
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
