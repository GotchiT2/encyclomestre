# Enchères et carrousel des boosters

Branche `feat/arcade-experience`, validation exclusivement en mocks via `https://dev.wikiforge.fr`.

## Défauts et corrections

Le formulaire de création dépendait d'un chargement global conditionné à la vérification `/me` de la session restaurée. Lorsque cette étape n'aboutissait pas, il affichait le chargement sans lancer ses propres lectures. Le formulaire charge désormais les enchères personnelles à son ouverture, partage les requêtes déjà engagées et propose une reprise en cas d'erreur. Les données d'un autre compte ne permettent pas d'ouvrir le formulaire. La validation des canaux SSE reste inchangée.

La vidéo signalée montrait deux paquets à des hauteurs différentes pendant le raccord. La sélection démontait une scène Three.js et montait sa remplaçante, tandis que le rendu DOM apparaissait avant le WebGL. Le carrousel utilise désormais des objets SVG persistants avec relief CSS, sur un seul rail horizontal. Embla, déjà installé, gère le geste et le déplacement. La cérémonie conserve sa scène Three.js.

## Vérifications

- `auction-create-panel.svelte.spec.ts` : chargement sans vérification globale terminée, erreur/reprise sans écriture, lectures simultanées et protection, changement de compte, frais/confirmation puis création unique.
- Parcours réel du site en mocks à 390 et 1440 px : ouverture de la fiche Blackpink, arrêt simulé de la vérification globale, saisie, affichage des frais et confirmation. Un seul `POST /me/auctions`, aucun appel de production ni erreur de page.
- `scripts/check-booster-carousel.mjs` : Chromium et WebKit, 360/390/768/1024/1440 px, mouvements ordinaires et réduits. Les contrôles image par image vérifient la stabilité verticale, les dimensions, la conservation des objets et leur centrage après navigation. Boutons, dock, clavier et gestes tactiles Chromium ; aucune acquisition pendant la sélection.
- Changements rapides à 1868 px : cinq sélections espacées de 45 ms, 40 images stables, déplacement vertical nul et aucun POST.
- `scripts/check-booster-room.mjs` : 26 scénarios, dont simple/lot, Express, animation passée, découverte libre, inspection, pagination, ancien reçu, interruption/reprise, conflits, réponse incertaine, stock limité, WebGL absent/perdu, visibilité, déconnexion et texte agrandi.

Captures et relevés : `%TEMP%/wikiforge-booster-carousel`, `%TEMP%/wikiforge-booster-room` et `%TEMP%/wikiforge-booster-navigation`.

Contrôles techniques : Svelte sans erreur ni avertissement, 16 tests ciblés réussis, ESLint/Prettier ciblés et build FO sans mocks réussis. Les 20 combinaisons du carrousel représentent 5 791 images contrôlées. Index GitNexus actualisé avant le contrôle des changements et du diff. Les avertissements Vitest `derived_inert` proviennent du démontage des fixtures existantes de révélation ; aucune erreur de page dans les parcours navigateur.

La configuration HTTPS, les certificats, le BO et le contrat backend sont conservés. Le skill encyclomestre-ui reste exclu. Aucun déploiement.
