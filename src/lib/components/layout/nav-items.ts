import BookOpenIcon from '@lucide/svelte/icons/book-open';
import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
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

/** Destinations de découverte : présentes dans la sidebar et dans la barre d'onglets mobile. */
export const exploreNavigation: NavItem[] = [
	{ href: '/', label: 'navigation.home', icon: GalleryVerticalEndIcon },
	{ href: '/cards', label: 'navigation.cards', icon: BookOpenIcon },
	{ href: '/collection', label: 'navigation.collection', icon: LibraryBigIcon }
];

/** Destinations sociales : sidebar uniquement, accessibles sur mobile via le tiroir. */
export const communityNavigation: NavItem[] = [
	{ href: '/market', label: 'navigation.auctions', icon: GavelIcon },
	{ href: '/trades', label: 'navigation.trades', icon: HandshakeIcon },
	{ href: '/wishlists', label: 'navigation.wishlist', icon: HeartIcon },
	{ href: '/guild', label: 'navigation.guild', icon: ShieldIcon },
	{ href: '/moderation', label: 'completion.moderation.title', icon: ShieldIcon },
	{ href: '/friends', label: 'navigation.friends', icon: UsersIcon },
	{ href: '/messages', label: 'navigation.messages', icon: MessageCircleIcon },
	{ href: '/achievements', label: 'navigation.achievements', icon: TrophyIcon },
	{ href: '/leaderboard', label: 'navigation.leaderboard', icon: TrophyIcon }
];

/**
 * Barre d'onglets mobile : deux entrées de part et d'autre du bouton booster central,
 * qui occupe la colonne du milieu.
 */
export const mobileTabsBefore = exploreNavigation.slice(0, 2);
export const mobileTabsAfter = exploreNavigation.slice(2);

export function isActiveRoute(pathname: string, href: NavHref) {
	return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
