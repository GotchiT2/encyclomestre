# WikiForge — flamme Taillée

La proposition 01 devient la signature du site : flamme asymétrique angulaire, incision diagonale et nom **WikiForge** en **Barlow Condensed Black**. Le dessin est reconstruit en chemins vectoriels, avec aplats nets ; aucun relief ni texture ne fait partie du logo.

## Sources et usages

Le master est dans `scripts/generate-brand-assets.py`. Il génère `src/lib/brand/artwork.js`, utilisé par le composant de marque commun et les SVG des boosters. Le nom est vectorisé depuis la police locale : les logotypes ne dépendent pas d'une police chargée par le navigateur.

Les fichiers utilisables sont dans `static/brand/v1`. Ce chemin versionné permet aux navigateurs de charger la nouvelle identité même si les anciens assets sont en cache. Les signatures restent transparentes.

| Fichiers                                                         | Usage                                                                                                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `symbol-yellow`, `symbol-cream`, `symbol-ink`                    | Symbole SVG et PNG transparents à 32, 64, 128, 256, 512 et 1024 px. Jaune sur fond sombre ; anthracite sur fond clair ; crème en monochrome sombre. |
| `wordmark-*`                                                     | Nom vectorisé seul, SVG et PNG 1024 px.                                                                                                             |
| `signature-horizontal-*`, `signature-stacked-*`                  | Logo et nom, variantes sombre, claire et monochromes crème/anthracite. SVG et PNG 512/2048 px de large.                                             |
| `favicon.svg`, `favicon-16/32/48`, `favicon.ico`                 | Icônes du navigateur. Le 16 px possède un dessin optique simplifié ; les autres tailles utilisent le master.                                        |
| `icon-180`                                                       | Icône Apple avec fond anthracite.                                                                                                                   |
| `icon-192/512`, `icon-maskable-192/512`                          | Icônes d'installation ; versions maskable avec marges adaptées au découpage de l'OS.                                                                |
| `pinned-tab.svg`                                                 | Silhouette monochrome pour l'onglet épinglé Safari.                                                                                                 |
| `social-card`                                                    | Image de partage 1200 × 630 px et source SVG éditable.                                                                                              |
| `card-placeholder.svg`                                           | Image de secours vectorielle des cartes, avec symbole et nom à la place de l'ancien W.                                                              |
| `booster-signal/circuit/prism`, `card-back-signal/circuit/prism` | Modèles SVG/PNG utilisant exactement la même flamme et le même logotype que le site.                                                                |
| `inventory.json`                                                 | Inventaire des exports et couleurs.                                                                                                                 |

Palette : anthracite `#171918`, crème `#EFEBD9`, jaune `#E8EF42`. Sur fond clair, employer le symbole anthracite pour conserver le contraste. Réserver autour du symbole un espace d'au moins 1/8 de sa hauteur et conserver ses proportions. Éviter les ombres, contours, rotations ou déformations ajoutés au logo.

Les modèles d'emballage conservent leurs finitions et la cérémonie d'ouverture existante ; le logo imprimé reste le dessin flat. Les noms Signal/Circuit/Prisme identifient les modèles graphiques, sans promesse de rareté ou de contenu. Leurs intitulés et nombres de cartes sont des exemples éditables. Les SVG de modèles incorporent les polices locales pour être lisibles hors du site ; les licences OFL sont jointes.

## Intégration

Le composant partagé remplace les anciennes signatures dans la navigation, la connexion et l'accueil. Les marquages WF des cartes, le plateau des boosters, les dos, les emballages et les rendus de secours utilisent la flamme, y compris dans l'aperçu expérimental. Les anciens assets de secours `/images/booster.png` et `/card-placeholder.svg` sont également remplacés. Les illustrations et logos spécifiques aux packs fournis par les données sont conservés.

Le head commun référence les nouvelles icônes, le manifeste, le nom d'application et l'image de partage. `static/favicon.ico`, `static/favicon.svg` et `static/apple-touch-icon.png` conservent les adresses standard attendues par les navigateurs. Le manifeste décrit les icônes ; il n'ajoute pas de service worker ni de fonctionnement hors ligne.

## Régénération

Depuis la racine du dépôt, avec Python, fonttools, Pillow et les dépendances Node déjà installées :

```powershell
python scripts/generate-brand-assets.py
npx prettier --write src/lib/brand/artwork.js
node --experimental-strip-types scripts/export-brand-assets.mjs
python scripts/check-brand-assets.py
```

Pour cette livraison, fonttools reste dans le dossier temporaire `wikiforge-logo-tools`, utilisé via `PYTHONPATH`. Aucune dépendance du site n'est ajoutée. Les SVG de symbole et de signature sont entièrement vectoriels, sans référence externe ni police requise.

## Validation

- 31 SVG et 52 PNG vérifiés : transparence, dimensions, chemins vectoriels, absence de ressources externes, manifeste et favicon ICO 16/32/48 px.
- 155 combinaisons page/largeur en mocks : 31 pages à 360, 390, 768, 1024 et 1440 px. Le nom et le symbole restent contenus dans leurs emplacements, sans débordement horizontal ni erreur JavaScript. Les captures sont dans `validation/`.
- En-tête : centrage du symbole et du nom contrôlé dans Chromium et WebKit à six largeurs, avec texte normal et agrandi. Le SVG du nom ne participe plus à une ligne de texte avec espace de descente. Zone du lien de marque haute d'au moins 44 px.
- 26 scénarios d'ouverture existants, dont Express, reprise, lots, erreur incertaine, perte WebGL et réduction des mouvements ; 28 tests ciblés des cartes et des boosters. Les opérations de validation utilisent exclusivement les mocks, avec blocage des requêtes vers l'API de production.
- Svelte : aucun diagnostic. ESLint et Prettier ciblés, syntaxe Python, build FO sans mocks et `git diff --check` réussis. Les assets publics et les icônes du manifeste ont été relus en HTTPS.

Le contrôle GitNexus indique un risque faible sur les symboles indexés. Les imports Svelte et les nouveaux fichiers non indexés ont également été contrôlés directement. Les modifications préexistantes d'`AGENTS.md` sont conservées ; les anciennes propositions ne font pas partie du commit et sont supprimées après celui-ci à la demande de l'utilisateur.

Commit local demandé après validation ; aucun déploiement. Configuration HTTPS, certificats, BO, clés de session et définitions publiées conservés.

L'archive livrée regroupe les fichiers publics sous `web/`, avec leurs chemins de production (`brand/v1`, manifeste, favicons et images de secours). `sources/` contient les masters et polices ; `validation/` contient les captures et rapports.
