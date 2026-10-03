import type { PackFamily } from '$lib/types';
import {
	brandName,
	flamePath,
	flameViewBox,
	wordmarkPath,
	wordmarkViewBox
} from '../../brand/artwork.js';

export type BoosterVisual = 'signal' | 'circuit' | 'prism';
export const openingDuration = 3000;
export const openingPageSize = 12;

export function boosterVisual(key?: string, family?: PackFamily): BoosterVisual {
	if (['standard', 'arcade', 'comics', 'signal'].includes(key ?? '')) return 'signal';
	if (['chrome', 'circuit'].includes(key ?? '')) return 'circuit';
	if (['nebula', 'neon', 'prism'].includes(key ?? '')) return 'prism';
	return family === 'PREMIUM' ? 'circuit' : family === 'PREMIUM_PLUS' ? 'prism' : 'signal';
}

const escape = (text: string) =>
	text.replace(
		/[&<>"']/g,
		(char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!
	);

/** One vector master for HTML, canvas textures and the no-WebGL opening. No legacy covers. */
export function boosterArtwork({
	visual,
	name = '',
	brand = brandName,
	count,
	cardsLabel = '',
	back = false,
	id = 'pack'
}: {
	visual: BoosterVisual;
	name?: string;
	brand?: string;
	count?: number;
	cardsLabel?: string;
	back?: boolean;
	id?: string;
}) {
	const prefix = id.replace(/[^a-zA-Z0-9_-]/g, '');
	const metallic = visual === 'circuit';
	const wordmark =
		brand === brandName
			? `<svg x="${back ? 120 : 46}" y="${back ? 548 : 56}" width="${back ? 272 : 170}" height="${back ? 70 : 44}" viewBox="${wordmarkViewBox}" fill="#EFEBD9"><path d="${wordmarkPath}"/></svg>`
			: `<text x="${back ? 256 : 46}" y="${back ? 590 : 90}" text-anchor="${back ? 'middle' : 'start'}" fill="#EFEBD9" font-family="Barlow,Arial,sans-serif" font-size="22" font-weight="700">${escape(brand.toUpperCase())}</text>`;
	const pattern =
		visual === 'signal'
			? `<path d="M-40 390L360-10H470L70 390ZM110 710L540 280V390L220 710Z" fill="#E8EF42"/><path d="M40 78H152M40 78V145M472 78H360M472 78V145M40 650V592M40 650H152M472 650V592M472 650H360" stroke="#EFEBD9" stroke-width="3"/>`
			: visual === 'circuit'
				? `<g fill="none" stroke="#EFEBD9" stroke-width="2" opacity=".48"><path d="M32 130H124L204 210V430L284 510H480M32 240H90L150 300V492L210 552H480M480 160H386L320 226V406L254 472H32M480 310H424L366 368V530L286 610H32"/><path d="M50 80V670M462 80V670"/></g><g fill="#E8EF42"><circle cx="124" cy="130" r="7"/><circle cx="386" cy="160" r="7"/><circle cx="286" cy="610" r="7"/><path d="M32 330H70V480H32Z"/></g>`
				: `<path d="M0 84L256 40L512 210L378 414L512 686L256 728L0 558L134 354Z" fill="#EFEBD9" opacity=".12"/><path d="M256 40L134 354L378 414Z" fill="#EFEBD9" opacity=".4"/><path d="M0 558L134 354L256 728Z" fill="#EFEBD9" opacity=".7"/><path d="M378 414L512 686L256 728Z" fill="#E8EF42"/><g stroke="#EFEBD9" stroke-width="2" fill="none" opacity=".65"><path d="M0 84L378 414L256 728M512 210L134 354L0 558M256 40L256 728"/></g>`;
	const lines =
		name
			.toUpperCase()
			.match(/.{1,17}(?:\s|$)|.{1,17}/g)
			?.map((line) => line.trim())
			.slice(0, 3) ?? [];
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 736" width="512" height="736">
	<defs><linearGradient id="${prefix}-metal" x2="1" y2="1"><stop stop-color="#171918"/><stop offset=".28" stop-color="#777c76"/><stop offset=".5" stop-color="#292d29"/><stop offset=".8" stop-color="#51594f"/><stop offset="1" stop-color="#171918"/></linearGradient><linearGradient id="${prefix}-light"><stop stop-color="#EFEBD9" stop-opacity=".02"/><stop offset=".46" stop-color="#EFEBD9" stop-opacity=".25"/><stop offset=".54" stop-color="#EFEBD9" stop-opacity=".02"/></linearGradient><pattern id="${prefix}-seal" width="8" height="12" patternUnits="userSpaceOnUse"><path d="M2 0V12" stroke="#EFEBD9" stroke-opacity=".35" stroke-width="2"/></pattern></defs>
	<rect width="512" height="736" rx="${back ? 18 : 4}" fill="${metallic ? `url(#${prefix}-metal)` : '#171918'}"/>
	${back ? `<g opacity=".65">${pattern}<g transform="rotate(180 256 368)">${pattern}</g></g><rect x="22" y="22" width="468" height="692" rx="12" stroke="#EFEBD9" stroke-width="2" fill="none"/><rect x="34" y="34" width="444" height="668" rx="6" stroke="#E8EF42" fill="none"/>` : `${pattern}<rect y="0" width="512" height="35" fill="url(#${prefix}-seal)"/><rect y="701" width="512" height="35" fill="url(#${prefix}-seal)"/><path d="M28 38V698M484 38V698" stroke="#EFEBD9" stroke-opacity=".3"/>`}
	<rect x="150" y="${back ? 258 : 160}" width="212" height="304" rx="8" fill="#171918"/>
	<svg x="170" y="${back ? 282 : 184}" width="172" height="256" viewBox="${flameViewBox}" fill="#E8EF42"><path d="${flamePath}"/></svg>
	${wordmark}
	${back ? '' : `<rect x="38" y="496" width="436" height="175" fill="#EFEBD9"/><rect x="38" y="496" width="8" height="175" fill="#E8EF42"/>${lines.map((line, index) => `<text x="60" y="${539 + index * 38}" fill="#171918" font-family="Barlow Condensed,Arial,sans-serif" font-size="36" font-weight="900" letter-spacing="-1">${escape(line)}</text>`).join('')}${count == null ? '' : `<text x="60" y="651" fill="#171918" font-family="Barlow,Arial,sans-serif" font-size="19" font-weight="600">${count} ${escape(cardsLabel)}</text>`}`}
	<rect width="512" height="736" rx="${back ? 18 : 4}" fill="url(#${prefix}-light)" opacity="${metallic ? '.6' : '.18'}"/></svg>`;
}
