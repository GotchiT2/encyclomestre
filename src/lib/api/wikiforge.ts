import { apiRequest, type RequestOptions } from './client';
import type { CollectionTag, GuildMember, GuildSummary, ProfileVisibility } from '$lib/types';
import { getVariants } from './variants';
import { wikiForgeApiErrorCode, wikiForgeNumericId, wikiForgeUtcDate } from './wikiforge-contract';

interface WikiForgeTagDto {
	id: number;
	name: string;
	color: string;
	visibility?: ProfileVisibility;
}

const toCollectionTag = (tag: WikiForgeTagDto): CollectionTag => ({
	id: String(tag.id),
	name: tag.name,
	color: tag.color,
	...(tag.visibility ? { visibility: tag.visibility } : {})
});
const tagOptions = (options?: RequestOptions): RequestOptions => ({
	...options,
	apiTarget: 'wikiforge'
});
const numericWikiForgeId = (value: string) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0)
		throw new Error(`Identifiant WikiForge invalide: ${value}`);
	return id;
};

export const getWikiForgeTags = async (options?: RequestOptions) =>
	(await apiRequest<WikiForgeTagDto[]>('/tags', tagOptions(options))).map(toCollectionTag);
type WikiForgeTagInput = Pick<CollectionTag, 'name' | 'color'> & { visibility: ProfileVisibility };
export const createWikiForgeTag = async (input: WikiForgeTagInput, options?: RequestOptions) =>
	toCollectionTag(
		await apiRequest<WikiForgeTagDto>('/tags', {
			...tagOptions(options),
			method: 'POST',
			body: input
		})
	);
export const updateWikiForgeTag = (
	id: string,
	input: WikiForgeTagInput,
	options?: RequestOptions
) =>
	apiRequest<WikiForgeTagDto>(`/tags/${numericWikiForgeId(id)}`, {
		...tagOptions(options),
		method: 'PATCH',
		body: input
	}).then(toCollectionTag);
export const deleteWikiForgeTag = (id: string, options?: RequestOptions) =>
	apiRequest<void>(`/tags/${numericWikiForgeId(id)}`, { ...tagOptions(options), method: 'DELETE' });

async function updateCardsTags(
	method: 'PUT' | 'DELETE',
	tagId: string,
	userCardIds: string[],
	options?: RequestOptions
) {
	const [cards, variants] = await Promise.all([
		apiRequest<import('./collection').WikiForgeCollectionCardDto[]>(
			`/collection/tags/${numericWikiForgeId(tagId)}`,
			{
				...tagOptions(options),
				method,
				body: userCardIds.map(numericWikiForgeId)
			}
		),
		getVariants(options)
	]);
	const { toWikiForgeCollectionCard } = await import('./collection');
	return cards.map((card) => toWikiForgeCollectionCard(card, variants));
}

export const applyWikiForgeTag = (tagId: string, userCardIds: string[], options?: RequestOptions) =>
	updateCardsTags('PUT', tagId, userCardIds, options);
export const removeWikiForgeTag = (
	tagId: string,
	userCardIds: string[],
	options?: RequestOptions
) => updateCardsTags('DELETE', tagId, userCardIds, options);

interface WikiForgeGuildDto {
	id: number;
	name: string;
	image?: string | null;
	joinPolicy: 'PUBLIC' | 'INVITE';
	maxMembers: number;
	nbMembers: number;
	member: boolean;
	owned: boolean;
	permissions?: string[] | null;
}

interface WikiForgeGuildMemberDto {
	id: number;
	name: string;
	image?: string | null;
	owner: boolean;
	permissions?: string[] | null;
	joinedAt?: string;
}

const toGuildSummary = (guild: WikiForgeGuildDto): GuildSummary => ({
	id: String(guild.id),
	name: guild.name,
	imageUrl: guild.image ?? null,
	joinPolicy: guild.joinPolicy,
	maxMembers: guild.maxMembers,
	memberCount: guild.nbMembers,
	member: guild.member,
	owned: guild.owned,
	permissions: guild.permissions ?? []
});

export async function getMyGuild(options?: RequestOptions): Promise<GuildSummary | null> {
	try {
		const guild = await apiRequest<WikiForgeGuildDto | undefined>('/me/guild', {
			...options,
			apiTarget: 'wikiforge'
		});
		return guild ? toGuildSummary(guild) : null;
	} catch (error) {
		if (wikiForgeApiErrorCode(error) === 'NOT_FOUND') return null;
		throw error;
	}
}

export async function getGuildMembers(
	id: string,
	options?: RequestOptions
): Promise<GuildMember[]> {
	const response = await apiRequest<{ results?: WikiForgeGuildMemberDto[] | null }>(
		`/guilds/${wikiForgeNumericId(id, 'guilde')}/members`,
		{ ...options, apiTarget: 'wikiforge' }
	);
	return (response.results ?? []).map((member) => ({
		userId: String(member.id),
		username: member.name,
		displayName: member.name,
		role: member.owner ? 'OWNER' : 'MEMBER',
		avatarUrl: member.image ?? null,
		permissions: member.permissions ?? [],
		...(member.joinedAt ? { joinedAt: wikiForgeUtcDate(member.joinedAt).toISOString() } : {})
	}));
}
export const getWikiForgeGuildWishlistShares = <T = unknown>(
	id: string,
	options?: RequestOptions
) =>
	apiRequest<T[]>(`/guilds/${encodeURIComponent(id)}/wishlists`, {
		...options,
		apiTarget: 'wikiforge'
	});
