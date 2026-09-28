import { beforeEach, describe, expect, it, vi } from 'vitest';
const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('./client', () => ({ apiRequest }));
import * as guild from './guilds';
import * as moderation from './moderation';
import { reportContent } from './reports';
import { claimAllAchievements } from './achievements';
import { createCommunityMocks } from './mocks/community';

describe('Swagger community operations', () => {
	beforeEach(() => apiRequest.mockReset().mockResolvedValue({}));
	it('uses search parameters and avoids a fake directory without a query', async () => {
		expect((await guild.searchGuilds('ab')).results).toEqual([]);
		expect(apiRequest).not.toHaveBeenCalled();
		await guild.searchGuilds('les archives', 2);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds?q=les+archives&page=2', undefined);
		await guild.readGuildMembers(4, 3);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4/members?page=3&q=', undefined);
		await guild.readGuildMessages(4, 'opaque /cursor');
		expect(apiRequest).toHaveBeenLastCalledWith(
			'/guilds/4/messages?cursor=opaque+%2Fcursor',
			undefined
		);
	});
	it('sends complete guild and permission bodies without changing array order', async () => {
		const body = { name: 'Archives', joinPolicy: 'PUBLIC' as const, imagePageId: 123 };
		await guild.createGuild(body);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds', { method: 'POST', body });
		await guild.editGuild(4, { name: 'Archives', joinPolicy: 'INVITE' });
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4', {
			method: 'PATCH',
			body: { name: 'Archives', joinPolicy: 'INVITE' }
		});
		await guild.grantGuildPermissions(4, 2, ['EDIT', 'INVITE']);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4/members/2/permissions', {
			method: 'PUT',
			body: { permissions: ['EDIT', 'INVITE'] }
		});
	});
	it.each([
		['joinGuild', [4], '/guilds/4/join', 'POST'],
		['leaveGuild', [4], '/guilds/4/members/me', 'DELETE'],
		['dissolveGuild', [4], '/guilds/4', 'DELETE'],
		['transferGuild', [4, 2], '/guilds/4/owner/2', 'POST'],
		['kickGuildMember', [4, 2], '/guilds/4/members/2', 'DELETE'],
		['revokeGuildInvitation', [4, 2], '/guilds/4/invitations/2', 'DELETE'],
		['inviteGuildMember', [4, 2], '/guilds/4/invitations/2', 'POST'],
		['answerGuildInvitation', [4, true], '/me/guild-invitations/4', 'POST'],
		['answerGuildInvitation', [4, false], '/me/guild-invitations/4', 'DELETE']
	] as const)('%s preserves method and path', async (name, args, path, method) => {
		await (guild[name] as (...args: (number | boolean)[]) => Promise<unknown>)(...args);
		expect(apiRequest).toHaveBeenLastCalledWith(path, { method });
	});
	it('reads invitations, lists, detail and moderation with omitted arrays', async () => {
		apiRequest.mockResolvedValue(undefined);
		expect(await guild.readMyGuildInvitations()).toEqual([]);
		expect(apiRequest).toHaveBeenLastCalledWith('/me/guild-invitations');
		await guild.readGuildInvitations(4);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4/invitations');
		await guild.readGuildWishlists(4);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4/wishlists');
		expect(await moderation.getSanctions()).toEqual([]);
		expect(await moderation.getModerationCases()).toEqual([]);
		apiRequest.mockResolvedValue({ id: 1 });
		expect((await moderation.getModerationCase(1)).messages).toEqual([]);
		await moderation.replyModerationCase(1, '  Bonjour  ');
		expect(apiRequest).toHaveBeenLastCalledWith('/me/cases/1/messages', {
			method: 'POST',
			body: { content: 'Bonjour' }
		});
		await guild.readGuild(4);
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4', undefined);
	});
	it('supports each report target and claims every available reward in one call', async () => {
		for (const type of ['USER', 'MESSAGE', 'GUILD_MESSAGE', 'GUILD', 'PAGE'] as const) {
			await reportContent({ type, id: 2, reason: 'OTHER', comment: 'Contexte' });
			expect(apiRequest).toHaveBeenLastCalledWith(
				'/reports',
				expect.objectContaining({
					method: 'POST',
					body: { type, id: 2, reason: 'OTHER', comment: 'Contexte' }
				})
			);
		}
		await claimAllAchievements();
		expect(apiRequest).toHaveBeenLastCalledWith('/me/achievements/claim', { method: 'POST' });
		await guild.sendGuildMessage(4, { content: 'Article', pageId: 9 });
		expect(apiRequest).toHaveBeenLastCalledWith('/guilds/4/messages', {
			method: 'POST',
			body: { content: 'Article', pageId: 9 }
		});
	});
	it('guards owner, self, and permission hierarchy', () => {
		const g: guild.Guild = { id: 1, name: 'Guild', member: true, permissions: ['KICK', 'GRANT'] };
		const m: guild.GuildMember = { id: 2, name: 'Member', permissions: [] };
		expect(guild.canManageMember(g, m, 1, 'KICK')).toBe(true);
		expect(guild.canManageMember(g, { ...m, owner: true }, 1, 'KICK')).toBe(false);
		expect(guild.canManageMember(g, { ...m, id: 1 }, 1, 'KICK')).toBe(false);
		expect(guild.canManageMember(g, { ...m, permissions: ['EDIT'] }, 1, 'KICK')).toBe(false);
	});
});
describe('mock transitions', () => {
	it('transfers ownership and removes former owner privileges', async () => {
		const mock = createCommunityMocks(),
			q = new URLSearchParams();
		expect(mock.handle('/guilds/1/owner/2', 'POST', undefined, q)?.status).toBe(204);
		expect(await mock.handle('/guilds/1', 'GET', undefined, q)?.json()).toMatchObject({
			owned: false,
			permissions: [],
			owner: { id: 2 }
		});
		expect(mock.handle('/guilds/1', 'DELETE', undefined, q)?.status).toBe(403);
	});
	it('marks a case read, accepts replies and refuses closed cases', async () => {
		const mock = createCommunityMocks(),
			q = new URLSearchParams();
		expect(await mock.handle('/me/cases/1', 'GET', undefined, q)?.json()).toMatchObject({
			unread: 0
		});
		expect(
			(await mock.handle('/me/cases/1/messages', 'POST', { content: 'Bonjour' }, q)!.json())
				.messages
		).toHaveLength(2);
		expect(mock.handle('/me/cases/2/messages', 'POST', { content: 'Bonjour' }, q)?.status).toBe(
			409
		);
	});
	it('never silently accepts self reports or two chat attachments', () => {
		const mock = createCommunityMocks(),
			q = new URLSearchParams();
		expect(
			mock.handle('/reports', 'POST', { type: 'USER', id: 1, reason: 'OTHER' }, q)?.status
		).toBe(409);
		expect(mock.handle('/guilds/1/messages', 'POST', { cardId: 1, pageId: 2 }, q)?.status).toBe(
			400
		);
	});
});
