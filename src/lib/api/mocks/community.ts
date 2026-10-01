import type { ApiSchemas } from '../schema';

type Guild = ApiSchemas['GuildDTO'];
type Member = ApiSchemas['GuildMemberDTO'];
type Case = ApiSchemas['ModerationCaseDTO'];
const json = (value?: unknown, status = 200) =>
	value === undefined ? new Response(null, { status: 204 }) : Response.json(value, { status });
const fail = (status: number, code: string) => json({ error: code, message: code }, status);
const stamp = () => new Date().toISOString();

/** Isolated fixtures. No request reaches the real API while mock mode is enabled. */
export function createCommunityMocks(
	cards: ApiSchemas['ShowcaseCardDTO'][] = [],
	pages: ApiSchemas['PageDTO'][] = []
) {
	const rights = ['INVITE', 'KICK', 'GRANT', 'EDIT'] as const;
	const guilds: Guild[] = [
		{
			id: 1,
			name: 'Les archivistes',
			joinPolicy: 'PUBLIC',
			maxMembers: 50,
			nbMembers: 2,
			owner: { id: 1, name: 'Administrateur' },
			member: true,
			owned: true,
			permissions: [...rights]
		},
		{
			id: 2,
			name: 'Les explorateurs',
			joinPolicy: 'PUBLIC',
			maxMembers: 50,
			nbMembers: 1,
			owner: { id: 2, name: 'Collectionneur' },
			permissions: []
		},
		{
			id: 3,
			name: 'Le cercle des lecteurs',
			joinPolicy: 'INVITE',
			maxMembers: 50,
			nbMembers: 1,
			owner: { id: 3, name: 'Lecteur' },
			permissions: []
		}
	];
	const members = new Map<number, Member[]>([
		[
			1,
			[
				{ id: 1, name: 'Administrateur', owner: true, permissions: [...rights], joinedAt: stamp() },
				{ id: 2, name: 'Collectionneur', permissions: [], joinedAt: stamp() }
			]
		],
		[
			2,
			[{ id: 2, name: 'Collectionneur', owner: true, permissions: [...rights], joinedAt: stamp() }]
		],
		[3, [{ id: 3, name: 'Lecteur', owner: true, permissions: [...rights], joinedAt: stamp() }]]
	]);
	let invitations: ApiSchemas['GuildInvitationDTO'][] = [
		{ guild: guilds[2], inviterId: 3, inviterName: 'Lecteur', invitedAt: stamp() }
	];
	const invited = new Map<number, ApiSchemas['GuildInviteeDTO'][]>();
	const messages: ApiSchemas['GuildMessageDTO'][] = [
		{
			id: 1,
			guildId: 1,
			fromUserId: 2,
			fromUser: { id: 2, name: 'Collectionneur' },
			type: 'TEXT',
			content: 'Bienvenue dans les archives !',
			creationDate: stamp()
		}
	];
	const cases: Case[] = [
		{
			id: 1,
			subject: 'Échange avec la modération',
			status: 'OPEN',
			creationDate: stamp(),
			lastMessageAt: stamp(),
			unread: 1,
			messages: [
				{
					id: 1,
					fromModeration: true,
					content: 'Bonjour, vous pouvez répondre à ce dossier.',
					creationDate: stamp()
				}
			]
		},
		{
			id: 2,
			subject: 'Dossier terminé',
			status: 'CLOSED',
			creationDate: stamp(),
			closedAt: stamp(),
			unread: 0,
			messages: []
		}
	];
	const reports = new Set<string>();
	const scenario = () =>
		typeof sessionStorage === 'undefined'
			? ''
			: sessionStorage.getItem('wikiforge-community-scenario');
	const own = () => guilds.find((g) => g.member);
	const summary = (g: Guild) => ({
		id: g.id,
		name: g.name,
		joinPolicy: g.joinPolicy,
		maxMembers: g.maxMembers,
		nbMembers: g.nbMembers,
		image: g.image,
		imagePageId: g.imagePageId
	});
	function join(guild: Guild) {
		guild.member = true;
		guild.permissions = [];
		const list = members.get(guild.id!) ?? [];
		list.push({ id: 1, name: 'Administrateur', permissions: [], joinedAt: stamp() });
		members.set(guild.id!, list);
		guild.nbMembers = list.length;
		invitations = [];
	}
	return {
		handle(
			path: string,
			method: string,
			input: unknown,
			params: URLSearchParams
		): Response | undefined {
			const body = (input ?? {}) as Record<string, unknown>;
			if (path === '/reports' && method === 'POST') {
				if (
					!['USER', 'MESSAGE', 'GUILD_MESSAGE', 'GUILD', 'PAGE'].includes(String(body.type)) ||
					!['CHEATING', 'NAME', 'HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'OTHER'].includes(
						String(body.reason)
					) ||
					!Number.isInteger(body.id) ||
					String(body.comment ?? '').length > 1000
				)
					return fail(400, 'INVALID_PARAMETER');
				if ((body.type === 'USER' && body.id === 1) || scenario() === 'conflict')
					return fail(409, 'REPORT_CONFLICT');
				reports.add(body.type + ':' + body.id);
				return json();
			}
			if (path === '/me/sanctions')
				return json(
					['mute', 'trade'].includes(scenario() ?? '')
						? [
								{
									type: scenario()!.toUpperCase(),
									reason: 'Restriction de démonstration',
									startsAt: stamp()
								}
							]
						: []
				);
			if (path === '/me/cases')
				return json(
					scenario() === 'empty' ? [] : cases.map((item) => ({ ...item, messages: undefined }))
				);
			const caseMatch = /^\/me\/cases\/(\d+)(\/messages)?$/.exec(path);
			if (caseMatch) {
				const item = cases.find((c) => c.id === Number(caseMatch[1]));
				if (!item) return fail(404, 'NOT_FOUND');
				if (method === 'GET' && !caseMatch[2]) {
					item.unread = 0;
					return json(item);
				}
				if (method === 'POST' && caseMatch[2]) {
					if (
						item.status === 'CLOSED' ||
						scenario() === 'conflict' ||
						(item.messages ?? []).filter((m) => !m.fromModeration).length >= 10
					)
						return fail(409, 'MODERATION_CASE_CONFLICT');
					const content = String(body.content ?? '').trim();
					if (!content || content.length > 2000) return fail(400, 'INVALID_PARAMETER');
					item.messages ??= [];
					item.messages.push({
						id: item.messages.length + 1,
						fromModeration: false,
						content,
						creationDate: stamp()
					});
					item.lastMessageAt = stamp();
					return json(item);
				}
			}
			if (path === '/me/guild') return own() ? json(summary(own()!)) : json();
			if (path === '/me/guild-invitations') return json(invitations);
			const answer = /^\/me\/guild-invitations\/(\d+)$/.exec(path);
			if (answer) {
				const invitation = invitations.find((i) => i.guild?.id === Number(answer[1]));
				if (!invitation) return fail(404, 'NOT_FOUND');
				if (method === 'POST') {
					if (own()) return fail(409, 'GUILD_CONFLICT');
					join(guilds.find((g) => g.id === Number(answer[1]))!);
				} else if (method === 'DELETE') invitations = invitations.filter((i) => i !== invitation);
				return json();
			}
			if (path === '/guilds') {
				if (method === 'GET') {
					const q = params.get('q')?.toLowerCase() ?? '';
					if (q.length < 3) return fail(400, 'INVALID_PARAMETER');
					const results = guilds.filter((g) => g.name!.toLowerCase().includes(q));
					const page = Number(params.get('page') ?? 0);
					return json({
						results: results.slice(page * 20, (page + 1) * 20).map(summary),
						nbResults: results.length,
						page
					});
				}
				if (method === 'POST') {
					if (own()) return fail(409, 'GUILD_CONFLICT');
					if (!String(body.name ?? '').trim() || String(body.name).length > 64)
						return fail(400, 'INVALID_PARAMETER');
					const guild: Guild = {
						id: Math.max(...guilds.map((g) => g.id!)) + 1,
						name: String(body.name),
						joinPolicy: body.joinPolicy as Guild['joinPolicy'],
						imagePageId: body.imagePageId as number,
						member: true,
						owned: true,
						owner: { id: 1, name: 'Administrateur' },
						permissions: [...rights],
						nbMembers: 1,
						maxMembers: 50
					};
					guilds.push(guild);
					members.set(guild.id!, [
						{
							id: 1,
							name: 'Administrateur',
							owner: true,
							permissions: [...rights],
							joinedAt: stamp()
						}
					]);
					invitations = [];
					return json(guild);
				}
			}
			const match = /^\/guilds\/(\d+)(.*)$/.exec(path);
			if (!match) return;
			const id = Number(match[1]),
				suffix = match[2],
				guild = guilds.find((g) => g.id === id);
			if (!guild) return fail(404, 'NOT_FOUND');
			if (method !== 'GET' && scenario() === 'conflict') return fail(409, 'GUILD_CONFLICT');
			if (!suffix) {
				if (method === 'GET') return json(guild);
				if (!guild.permissions?.includes('EDIT')) return fail(403, 'MISSING_GUILD_PERMISSION');
				if (method === 'PATCH') {
					if (!String(body.name ?? '').trim() || String(body.name).length > 64)
						return fail(400, 'INVALID_PARAMETER');
					Object.assign(guild, {
						name: body.name,
						joinPolicy: body.joinPolicy,
						imagePageId: body.imagePageId
					});
					return json(guild);
				}
				if (method === 'DELETE') {
					if (!guild.owned) return fail(403, 'MISSING_GUILD_PERMISSION');
					guilds.splice(guilds.indexOf(guild), 1);
					return json();
				}
			}
			if (suffix === '/join' && method === 'POST') {
				if (own() || guild.joinPolicy !== 'PUBLIC') return fail(409, 'GUILD_CONFLICT');
				join(guild);
				return json();
			}
			if (suffix === '/members' && method === 'GET') {
				const all = members.get(id) ?? [];
				const fold = (s: string) =>
					s
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase();
				const list = all.filter((member) =>
					fold(member.name ?? '').includes(fold(params.get('q') ?? ''))
				);
				const page = Number(params.get('page') ?? 0);
				return json({
					results: list.slice(page * 20, (page + 1) * 20),
					nbResults: list.length,
					nbMembers: all.length,
					pageSize: 20,
					hasNext: (page + 1) * 20 < list.length,
					page
				});
			}
			if (!guild.member) return fail(403, 'MISSING_GUILD_PERMISSION');
			if (suffix === '/members/me' && method === 'DELETE') {
				if (guild.owned) return fail(409, 'GUILD_CONFLICT');
				guild.member = false;
				guild.permissions = [];
				members.set(
					id,
					(members.get(id) ?? []).filter((m) => m.id !== 1)
				);
				guild.nbMembers = members.get(id)!.length;
				return json();
			}
			const memberPath = /^\/members\/(\d+)(\/permissions)?$/.exec(suffix);
			if (memberPath) {
				const target = members.get(id)?.find((m) => m.id === Number(memberPath[1]));
				const permission = memberPath[2] ? 'GRANT' : 'KICK';
				if (!target) return fail(404, 'NOT_FOUND');
				if (
					target.owner ||
					target.id === 1 ||
					!guild.permissions?.includes(permission) ||
					!target.permissions?.every((p) => guild.permissions?.includes(p))
				)
					return fail(403, 'MISSING_GUILD_PERMISSION');
				if (memberPath[2]) {
					const permissions = body.permissions as Member['permissions'];
					if (
						!Array.isArray(permissions) ||
						!permissions.every((p) => guild.permissions?.includes(p))
					)
						return fail(403, 'MISSING_GUILD_PERMISSION');
					target.permissions = permissions;
				} else {
					members.set(
						id,
						members.get(id)!.filter((m) => m !== target)
					);
					guild.nbMembers = members.get(id)!.length;
				}
				return json();
			}
			const ownerPath = /^\/owner\/(\d+)$/.exec(suffix);
			if (ownerPath) {
				const target = members.get(id)?.find((m) => m.id === Number(ownerPath[1]));
				if (!guild.owned || !target || target.id === 1) return fail(409, 'GUILD_CONFLICT');
				for (const member of members.get(id)!) {
					if (member.owner) {
						member.owner = false;
						member.permissions = [];
					}
				}
				target.owner = true;
				target.permissions = [...rights];
				guild.owner = { id: target.id, name: target.name };
				guild.owned = false;
				guild.permissions = [];
				return json();
			}
			if (suffix === '/invitations' && method === 'GET')
				return guild.permissions?.includes('INVITE')
					? json(invited.get(id) ?? [])
					: fail(403, 'MISSING_GUILD_PERMISSION');
			const invitation = /^\/invitations\/(\d+)$/.exec(suffix);
			if (invitation) {
				if (!guild.permissions?.includes('INVITE')) return fail(403, 'MISSING_GUILD_PERMISSION');
				const list = invited.get(id) ?? [];
				const userId = Number(invitation[1]);
				if (method === 'DELETE') {
					if (!list.some((u) => u.id === userId)) return fail(404, 'NOT_FOUND');
					invited.set(
						id,
						list.filter((u) => u.id !== userId)
					);
					return json();
				}
				if (!list.some((u) => u.id === userId))
					list.push({ id: userId, name: 'Joueur #' + userId, invitedAt: stamp() });
				invited.set(id, list);
				return json();
			}
			if (suffix === '/wishlists')
				return json(
					scenario() === 'empty'
						? []
						: [
								{
									id: 201,
									name: 'Cartes recherchées',
									description: 'Partagée avec les membres de la guilde.',
									ownerName: 'Collectionneur',
									nbCards: 2,
									sharedWithGuild: true
								}
							]
				);
			if (suffix === '/messages') {
				if (method === 'GET') {
					const list = messages.filter(
						(m) =>
							m.guildId === id && (!params.get('cursor') || m.id! < Number(params.get('cursor')))
					);
					const results = list.slice(-50);
					return json({
						results,
						hasNext: list.length > 50,
						...(list.length > 50 ? { nextCursor: String(results[0].id) } : {})
					});
				}
				if (scenario() === 'mute')
					return json(
						{
							code: 'SANCTIONED',
							meta: { type: 'MUTE', reason: 'Restriction de démonstration', startsAt: stamp() }
						},
						403
					);
				if (
					(body.cardId && body.pageId) ||
					(!String(body.content ?? '').trim() && !body.cardId && !body.pageId) ||
					String(body.content ?? '').length > 2000
				)
					return fail(400, 'INVALID_PARAMETER');
				const message: ApiSchemas['GuildMessageDTO'] = {
					...(body.cardId ? { card: cards.find((card) => card.id === body.cardId) } : {}),
					...(body.pageId ? { page: pages.find((page) => page.id === body.pageId) } : {}),
					id: messages.length + 1,
					guildId: id,
					fromUserId: 1,
					fromUser: { id: 1, name: 'Administrateur' },
					type: body.cardId ? 'CARD' : body.pageId ? 'PAGE' : 'TEXT',
					content: String(body.content ?? ''),
					creationDate: stamp()
				};
				messages.push(message);
				return json(message);
			}
			return fail(404, 'NOT_FOUND');
		}
	};
}
