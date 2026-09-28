import { apiRequest, type RequestOptions } from './client';
import type { ApiSchemas } from './schema';
import { wikiForgeNumericId as id } from './wikiforge-contract';

export type GuildPermission = NonNullable<
	ApiSchemas['GuildPermissionsRequest']['permissions']
>[number];
export type GuildInput = ApiSchemas['GuildRequest'];
export type Guild = ApiSchemas['GuildDTO'] & {
	id: number;
	name: string;
	permissions: GuildPermission[];
};
export type GuildMember = ApiSchemas['GuildMemberDTO'] & {
	id: number;
	name: string;
	permissions: GuildPermission[];
};
export type GuildMessage = ApiSchemas['GuildMessageDTO'] & {
	id: number;
	guildId: number;
	fromUserId: number;
	creationDate: string;
};
export type GuildInvitation = ApiSchemas['GuildInvitationDTO'];
export type GuildInvitee = ApiSchemas['GuildInviteeDTO'];
export type GuildWishlist = ApiSchemas['WishlistSummaryDTO'];
const path = (guildId: number | string) => `/guilds/${id(guildId, 'guild')}`;
const normalize = (value: ApiSchemas['GuildDTO']) =>
	({ ...value, permissions: value.permissions ?? [] }) as Guild;

export async function searchGuilds(q: string, page = 0, options?: RequestOptions) {
	if (q.trim().length < 3) return { results: [], page: 0, nbResults: 0 };
	const value = await apiRequest<ApiSchemas['GuildsResult']>(
		`/guilds?${new URLSearchParams({ q: q.trim().slice(0, 50), page: String(page) })}`,
		options
	);
	return {
		results: (value.results ?? []).map(normalize),
		page: value.page ?? 0,
		nbResults: value.nbResults ?? 0
	};
}
export const readGuild = async (guildId: number | string, options?: RequestOptions) =>
	normalize(await apiRequest<ApiSchemas['GuildDTO']>(path(guildId), options));
export const createGuild = async (body: GuildInput) =>
	normalize(await apiRequest<ApiSchemas['GuildDTO']>('/guilds', { method: 'POST', body }));
export const editGuild = async (guildId: number, body: GuildInput) =>
	normalize(await apiRequest<ApiSchemas['GuildDTO']>(path(guildId), { method: 'PATCH', body }));
export const dissolveGuild = (guildId: number) =>
	apiRequest<void>(path(guildId), { method: 'DELETE' });
export const joinGuild = (guildId: number) =>
	apiRequest<void>(`${path(guildId)}/join`, { method: 'POST' });
export const leaveGuild = (guildId: number) =>
	apiRequest<void>(`${path(guildId)}/members/me`, { method: 'DELETE' });
export const transferGuild = (guildId: number, memberId: number) =>
	apiRequest<void>(`${path(guildId)}/owner/${id(memberId, 'member')}`, { method: 'POST' });
export const kickGuildMember = (guildId: number, memberId: number) =>
	apiRequest<void>(`${path(guildId)}/members/${id(memberId, 'member')}`, { method: 'DELETE' });
export const grantGuildPermissions = (
	guildId: number,
	memberId: number,
	permissions: GuildPermission[]
) =>
	apiRequest<void>(`${path(guildId)}/members/${id(memberId, 'member')}/permissions`, {
		method: 'PUT',
		body: { permissions }
	});
export async function readGuildMembers(
	guildId: number,
	page = 0,
	options?: RequestOptions,
	q = ''
) {
	const value = await apiRequest<
		ApiSchemas['GuildMembersResult'] & { nbMembers: number; pageSize: number; hasNext: boolean }
	>(`${path(guildId)}/members?${new URLSearchParams({ page: String(page), q })}`, options);
	return {
		results: (value.results ?? []).map(
			(member) => ({ ...member, permissions: member.permissions ?? [] }) as GuildMember
		),
		page: value.page ?? 0,
		nbResults: value.nbResults ?? 0,
		nbMembers: value.nbMembers,
		pageSize: value.pageSize,
		hasNext: value.hasNext
	};
}
export const readGuildInvitations = async (guildId: number) =>
	(await apiRequest<GuildInvitee[]>(`${path(guildId)}/invitations`)) ?? [];
export const inviteGuildMember = (guildId: number, invitedId: number) =>
	apiRequest<void>(`${path(guildId)}/invitations/${id(invitedId, 'user')}`, { method: 'POST' });
export const readMyGuildInvitations = async () =>
	(await apiRequest<GuildInvitation[]>('/me/guild-invitations')) ?? [];
export const answerGuildInvitation = (guildId: number, accept: boolean) =>
	apiRequest<void>(`/me/guild-invitations/${id(guildId, 'guild')}`, {
		method: accept ? 'POST' : 'DELETE'
	});
export const readGuildWishlists = async (guildId: number) =>
	(await apiRequest<GuildWishlist[]>(`${path(guildId)}/wishlists`)) ?? [];
export async function readGuildMessages(
	guildId: number,
	cursor?: string,
	options?: RequestOptions
) {
	const value = await apiRequest<ApiSchemas['GuildMessagesResult']>(
		`${path(guildId)}/messages${cursor ? '?' + new URLSearchParams({ cursor }) : ''}`,
		options
	);
	return {
		results: (value.results ?? []) as GuildMessage[],
		nextCursor: value.nextCursor,
		hasNext: Boolean(value.hasNext)
	};
}
export const sendGuildMessage = (guildId: number, body: ApiSchemas['SendGuildMessageRequest']) =>
	apiRequest<GuildMessage>(`${path(guildId)}/messages`, { method: 'POST', body });

export function canManageMember(
	guild: Guild,
	member: GuildMember,
	selfId: number,
	permission: GuildPermission
) {
	return Boolean(
		guild.member &&
		guild.permissions.includes(permission) &&
		!member.owner &&
		member.id !== selfId &&
		member.permissions.every((value) => guild.permissions.includes(value))
	);
}

export const revokeGuildInvitation = (guildId: number, invitedId: number) =>
	apiRequest<void>(`${path(guildId)}/invitations/${id(invitedId, 'user')}`, { method: 'DELETE' });
