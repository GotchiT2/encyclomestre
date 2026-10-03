import PackageOpenIcon from '@lucide/svelte/icons/package-open';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import GavelIcon from '@lucide/svelte/icons/gavel';
import HandshakeIcon from '@lucide/svelte/icons/handshake';
import HeartIcon from '@lucide/svelte/icons/heart';
import LibraryBigIcon from '@lucide/svelte/icons/library-big';
import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
import ShieldIcon from '@lucide/svelte/icons/shield';
import UsersIcon from '@lucide/svelte/icons/users';
import TrophyIcon from '@lucide/svelte/icons/trophy';

export type NavHref =
	| '/'
	| '/welcome'
	| '/cards'
	| '/collection'
	| '/market'
	| '/trades'
	| '/wishlists'
	| '/guild'
	| '/moderation'
	| '/friends'
	| '/messages'
	| '/boosters'
	| '/leaderboard'
	| '/achievements';

export type NavItem = {
	href: NavHref;
	label: string;
	icon: typeof BookOpenIcon;
};

export const exploreNavigation: NavItem[] = [
	{ href: '/collection', label: 'navigation.collection', icon: LibraryBigIcon },
	{ href: '/boosters', label: 'arcade.boosters', icon: PackageOpenIcon },
	{ href: '/wishlists', label: 'arcade.wishlists', icon: HeartIcon },
	{ href: '/cards', label: 'arcade.catalogue', icon: BookOpenIcon }
];
export const transactionNavigation: NavItem[] = [
	{ href: '/market', label: 'navigation.auctions', icon: GavelIcon },
	{ href: '/trades', label: 'navigation.trades', icon: HandshakeIcon }
];
export const communityNavigation: NavItem[] = [
	{ href: '/guild', label: 'navigation.guild', icon: ShieldIcon },
	{ href: '/friends', label: 'navigation.friends', icon: UsersIcon },
	{ href: '/messages', label: 'navigation.messages', icon: MessageCircleIcon }
];
export const progressionNavigation: NavItem[] = [
	{ href: '/achievements', label: 'navigation.achievements', icon: TrophyIcon },
	{ href: '/leaderboard', label: 'navigation.leaderboard', icon: TrophyIcon },
	{ href: '/moderation', label: 'completion.moderation.title', icon: ShieldIcon }
];
export const mobileTabsBefore = [exploreNavigation[0], exploreNavigation[2]];
export const mobileTabsAfter = [exploreNavigation[3], transactionNavigation[0]];

export function isActiveRoute(pathname: string, href: NavHref) {
	return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
