# Correctifs UX/UI — WikiForge

Livraison sur `feat/arcade-experience`, sans déploiement. Les validations navigateur utilisent les mocks et les certificats locaux sur `https://dev.wikiforge.fr` et `https://dev-bo.wikiforge.fr:5174`. Les requêtes vers l’API réelle sont bloquées dans les scénarios FO. Aucun endpoint ajouté ; configurations Vite, stockage des sessions et définitions historiques conservés.

## Changements livrés

- Les animations des dialogues modifient uniquement l’opacité pendant 180 ms. Le décalage CSS qui centre les dialogues n’est plus écrasé. Marges communes de 16/20 px ; les espaces de travail conservent leurs sections et leur défilement.
- Marque WikiForge et monogramme WF dans l’en-tête, les cartes et les packs, avec le même moteur dans le FO et le BO.
- Selects anthracite/crème avec focus jaune. Tooltips communs sur les commandes à icône, au survol et au clavier, y compris au-dessus des dialogues.
- Collection, collections d’amis, sélecteurs et enchères : filtres directs. Recherche et tris des souhaits également accessibles sans dialogue général. L’ancien composant de dialogue des filtres est supprimé.
- Recherche des étiquettes dans les filtres, les actions multiples, la gestion et les fiches personnelles, sans sensibilité à la casse ou aux accents.
- Création/attribution dans la fiche : nom nettoyé, 64 caractères maximum, couleur `#E8EF42` et visibilité `FRIENDS`. Réutilisation d’une étiquette de même nom ; conservation de la saisie et de l’étiquette après un échec partiel. Les états incertains sont relus avant la reprise. Une actualisation du solde ne déverrouille pas une écriture en cours.
- Progression de collection et ses lectures statistiques retirées. Consentement aux brouillons placé sous la composition du message et dans le pied de l’éditeur d’échange.
- Onglets d’échange Mes cartes / Cartes du joueur, une seule collection visible, recherches et sélections conservées. Résumé et vérification de l’offre maintenus.
- Vitrines sur toute la largeur du parent, avec cartes plafonnées à 144 px.
- Notifications regroupées en familles repliables, ordonnées par date, avec compteurs limités aux éléments chargés. Le compteur global reste fourni par l’API. Le chargement attend la restauration de la session et purge le contenu lors d’un changement de compte.

## Validation

| Contrôle                     | Résultat                                              |
| ---------------------------- | ----------------------------------------------------- |
| Svelte FO et BO              | 0 erreur, 0 avertissement                             |
| Tests FO                     | 91 fichiers, 317 tests réussis                        |
| Tests BO                     | 13 fichiers, 77 tests réussis                         |
| Studio BO                    | 5 scénarios réussis aux cinq largeurs                 |
| Builds statiques FO et BO    | Réussis, mocks désactivés pour les artefacts de build |
| Lint ciblé et formatage      | Réussis                                               |
| Concordance des rendus FO/BO | Sources du moteur identiques                          |
| Contrôle du diff             | Réussi                                                |

Les tests d’étiquettes couvrent création, réutilisation, attribution partielle, réconciliation d’une écriture incertaine et absence de double écriture pendant une actualisation du solde. Le fil de notifications est testé sur plusieurs pages, avec familles inconnues, repli, filtre Non lues, compteur API distinct et restauration tardive de session.

`scripts/check-ui-corrections.mjs` contrôle les largeurs 360, 390, 768, 1024 et 1440 px, avec mouvements normaux puis réduits. Il observe l’insertion du dialogue avant le clic, puis chaque image pendant 260 ms : **60 ouvertures, 1 031 images, aucun déplacement du centre**. Les six présentations vérifiées sont vente rapide, inspection personnelle, gestion des étiquettes, invitation d’ami, création de wishlist et avatar. La vente conserve aussi sa largeur et sa hauteur pendant le fondu.

Ce scénario vérifie également tooltips au clavier dans les dialogues, filtres directs et URL, création d’étiquette par Entrée, conservation des onglets d’échange, placement des brouillons, vitrines et regroupements. Traces et captures : `%TEMP%/wikiforge-ui-corrections/`.

Les scénarios existants vérifient toutes les pages publiques et joueur aux cinq largeurs, les cibles de 44 px et le texte agrandi ; puis navigation, densité, inspection contextuelle, ouverture 3D, perte WebGL et repli DOM. Les parcours collection/vente/premier message/reconnexion/pagination et échanges/invitations/pagination numérique ou curseur passent également aux cinq largeurs.

La suite navigateur Vitest émet des avertissements `derived_inert` lors de la destruction de certaines fixtures ; les 317 tests passent et les parcours applicatifs contrôlés ne produisent aucune exception navigateur.

GitNexus : analyse des fichiers avant modification, index FO/BO actualisés et contrôle des changements indexés avant commit. L’index suit peu les relations des composants Svelte ; les usages et scénarios navigateur complètent cette analyse.
