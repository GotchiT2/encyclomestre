# Boosters WikiForge et corrections des compositions

Validation du 2 octobre 2026, branche `feat/arcade-experience`.

## Livraison

- Réserve intégrée au plateau : packs ouvrables, dock, navigation tactile et boutons équivalents, crédits uniques par famille, liste de consultation compacte.
- Emballages et dos Signal, Circuit et Prisme issus du même dessin vectoriel local. Les anciennes images ne servent plus aux représentations FO.
- Scène Three.js chargée à la demande, déchirure, sortie du paquet et déploiement ; commandes HTML toujours présentes, animation passée, mode Express mémorisé et découverte libre.
- Cartes compactes et emplacements stables, indices des finitions effectivement obtenues, pagination par douze et révélation globale.
- Résultat conservé par compte, progression par identifiants révélés et migration des anciens reçus. Fermeture pendant la requête, reprise, déconnexion et réponse incertaine ne répètent jamais l'acquisition.
- Correction du défaut signalé en capture : la face avant de la boîte intersectait les deux surfaces imprimées. La face doublonnée est retirée ; les plis et leur profondeur restent hors de la coque. Les fontes locales sont incorporées à la texture.
- Chronologie commune WebGL/DOM, pause hors visibilité, résolution réduite sur appareil lent et poursuite après perte du contexte.
- Marges des succès, filtres repliés sur plusieurs lignes sans barre horizontale, chevrons centrés, selects harmonisés, recherche et tri sur toute la largeur, panneau de tri opaque.
- Badge « Votre enchère » sur l'image ; prix vert en tête et rouge après surenchère, avec état accessible aux lecteurs d'écran. Demandes d'amis élargies et noms lisibles. Cadre principal sans plafond de largeur ; les objets cartes restent compacts.

Le BO, `vite.config.ts`, les certificats, le contrat backend et les rectos des cartes sont conservés. Aucun déploiement ni publication de modèle.

## Contrôles

| Contrôle                                  | Résultat                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run check`                           | 0 erreur, 0 avertissement                                                         |
| `node node_modules/vitest/vitest.mjs run` | 328 tests, 92 fichiers, tous réussis                                              |
| ESLint et Prettier ciblés                 | Réussis                                                                           |
| Build FO, `PUBLIC_API_MOCK_ENABLED=false` | Build statique réussi                                                             |
| `git diff --check`                        | Réussi                                                                            |
| GitNexus                                  | Impacts avant modification, index reconstruit, changements contrôlés avant commit |

La sortie Vitest contient des avertissements `derived_inert` pendant le démontage de fixtures. Aucun échec de test ni erreur de page dans les parcours navigateur.

## Parcours reproductibles

Les scripts utilisent `https://dev.wikiforge.fr`, des sessions et données mocks, interceptent l'API de production et remplacent les illustrations distantes par une image locale.

`node scripts/check-booster-room.mjs` : **26 scénarios**. Aux largeurs 360, 390, 768, 1024 et 1440 px, mouvements ordinaires et réduits : paquet fermé pendant la réponse, acquisition unique malgré double clic, révélation choisie au clavier, inspection et retour du focus, grille stable, bilan et absence de débordement. Autres scénarios : fermeture pendant requête, reprise après rechargement, reçu ancien, lot de 55 cartes/pagination, animation passée, tout révéler, conflit, réponse incertaine et relecture échouée, stock limité, Circuit/Prisme en Express, WebGL absent/perdu, appareil lent, balayage et déchirure, visibilité, déconnexion pendant requête, préférence Express et texte agrandi.

La perte de contexte est déclenchée par `WEBGL_lose_context` lorsqu'il est disponible, sinon par l'événement `webglcontextlost`. Ce contrôle valide le repli du site ; il ne constitue pas une mesure de performance sur des téléphones physiques.

`node scripts/check-responsive-player-controls.mjs` : **30 visites contrôlées**, collection, catalogue, succès, amis et marché, à 360, 390, 768, 1024, 1440 et 1920 px. Vérification du retour à la ligne, recherche/tri alignés et pleine largeur, fond opaque, marges, colonne de demandes et noms, badge sur la carte, distinction des prix personnels et largeur disponible.

Captures et vidéo de la cérémonie dans `%TEMP%/wikiforge-booster-room` : réserve et bilan aux cinq largeurs, images tension/déchirure/sortie, vidéo WebM et `report.json`. Captures des cinq autres pages dans `%TEMP%/wikiforge-player-controls`. Revue visuelle effectuée sur les images intermédiaires, desktop et mobile ; le défaut de surfaces perforées a disparu.
