# Catalogue de modèles de cartes — contrat proposé pour Claude

Cette évolution nécessite le backend. Les chemins ci-dessous sont proposés, pas annoncés comme disponibles. Les adaptateurs BO/FO et mocks existent ; les mutations du catalogue sont bloquées hors mode mock. Vérifier le Swagger et les conventions du backend avant implémentation, puis livrer le contrat définitif.

## Objectif et séparation des données

Le BO prépare des modèles HTML/CSS ; le FO reproduit exactement leurs compositions via le même moteur. Une définition contient seulement des paramètres validés. Le titre, l’image, les droits, le caractère full art et la numérotation proviennent toujours de la carte réelle. Aucun numéro d’aperçu ni contenu local ne doit être publié.

Le moteur embarqué prend en charge classique, cyberpunk, spatial, comics, kawaii et japonais traditionnel. Il propose normal/full art, orientation automatique/portrait/paysage et les finitions aucune/néon/métallique/holographique/prismatique/pailletée. Un nouveau motif ou algorithme non pris en charge nécessite une mise à jour du moteur dans les deux applications. Publier du JSON ne permet pas d’exécuter du code nouveau.

## Opérations proposées

| Méthode et chemin | Entrée | Réponse |
| --- | --- | --- |
| GET `/admin/card-templates` | Session ADMIN | Tableau des brouillons avec version et dernière révision publiée |
| POST `/admin/card-templates` | `{id,name,definition}` | Brouillon créé, version 1, dernière révision 0 |
| GET `/admin/card-templates/{id}` | Session ADMIN | Brouillon courant |
| PUT `/admin/card-templates/{id}` | `{expectedVersion,definition}` | Brouillon mis à jour, version incrémentée |
| POST `/admin/card-templates/{id}/publish` | `{expectedVersion}` | Nouvelle révision immuable du brouillon enregistré |
| GET `/card-templates` | Lecture publique | Tableau des révisions publiées, chacune identifiée par id et revision |
| GET `/card-templates/{id}/versions/{revision}` | Lecture publique | Révision publiée précise |

Un brouillon : `{id,name,version,latestRevision,definition}`. Une publication : `{id,name,revision,definition}`. Les numéros sont des entiers positifs ; `latestRevision` vaut zéro avant la première publication. L’identifiant respecte `[a-z0-9][a-z0-9-]{0,39}`. Le nom non vide est limité à 64 caractères. Le nom est fixé à la création dans cette première interface ; toute évolution du renommage doit préciser sa portée historique.

La publication prend le brouillon enregistré, pas les réglages non sauvegardés de l’atelier. Elle incrémente atomiquement la version du brouillon et sa dernière révision. L’enregistrement et la publication comparent `expectedVersion` sous verrouillage transactionnel. Un conflit renvoie `409 / TEMPLATE_CONFLICT`, sans écraser le brouillon ni créer une révision partielle. L’interface conserve les réglages locaux et demande un rechargement explicite ; aucune relance automatique d’écriture.

## Définition versionnée

Racine courante : `{schemaVersion:2,minEngineVersion:2,visual:{...},design:{...},layout:{...}}`. Les définitions v1 sont migrées à la lecture, sans modifier leur révision côté serveur. Les nouvelles publications utilisent v2.

`visual` contient exclusivement :

- `model` : `base`, `chrome` ou `signature` ; métadonnée historique ; ne déclenche aucune règle visuelle cachée.
- `color`, `cartouche` : couleurs hexadécimales à six chiffres.
- `border` de 0 à 8 ; `radius` normalisé à zéro : cadres strictement rectangulaires.
- `align` : `left`, `center`, `right` ; `fontSize` de 4 à 10 ; `lines` entier de 1 à 4.
- `fit` : `cover`, `contain` ; cadrage `x`, `y` de 0 à 100.

`design` contient exclusivement :

| Champs | Valeurs / limites |
| --- | --- |
| theme | classic, cyberpunk, space, comics, kawaii, japanese |
| orientation | auto, portrait, landscape |
| titlePosition | bottom, top, side |
| titleWidth / margin | 40–100 % / 2–12 % |
| pattern | none, lines, dots, waves |
| density / patternOpacity | 5–40 / 0–60 % |
| secondary | Couleur hexadécimale |
| font / weight / lineHeight | sans, serif, mono / 400–900 / 1–1,5 |
| serialPosition / serialSize / serialFinish | left, right / 3–7 / plain, silver, gold |
| foil | none, metallic, holographic, prismatic, glitter |
| foilColor / foilColor2 | Couleurs hexadécimales |
| intensity / angle / shineWidth / scale | 0–70 % / 0–360° / 5–60 % / 5–60 |
| target | frame, image, decoration |
| motion / speed | static, pointer, animated / 2–20 secondes |

Toutes les valeurs numériques sont finies. Les bornes représentent les possibilités actuelles du moteur et doivent être validées côté serveur comme côté client. Aucun HTML, URL de décoration ni police distante. Les seules chaînes CSS admises sont les déclarations de présentation isolées et validées de `layout.zones`. Les valeurs sont des identifiants interprétés par du code embarqué. Le validateur canonique et les fixtures se trouvent dans le module partagé `src/lib/card-renderer` du BO ; le script de synchronisation copie ce module dans le FO.

En automatique, seul le full art passe en paysage lorsque le ratio naturel de l’image atteint 1,2. Les orientations explicites prennent priorité. Le numéro et le plafond viennent de l’exemplaire ; leur apparence seule appartient au modèle. Les restrictions d’image du FO continuent de s’appliquer.

## Surfaces et finitions v2

`layout` est obligatoire en v2. Les champs `theme` et `model` n'activent aucun style : toutes les propriétés sont sérialisées et éditables.

- `zones` : exactement les zones `frame`, `inner`, `image`, `decor`, `title`, `serial`, `logo`. Chaque surface contient `background`, `borderColor` (hexadécimal six ou huit chiffres), `borderWidth` 0–8, `borderStyle` solid/double/dashed, `padding` 0–8, `opacity` 0–100, `shadow` 0–20 et `css` (4 000 caractères maximum). Dimensions de bordure, padding et ombre proportionnelles à la largeur de la carte.
- `frameFinish`, `imageFinish`, `decorFinish` : objets indépendants avec `type` none/neon/metallic/holographic/prismatic/glitter, `color`, `second`, `intensity` 0–100, `width` 1–15, `angle` 0–360, `scale` 4–60, `motion` static/pointer/animated, `speed` 2–20 secondes.
- `logoCorner` : top-left/top-right/bottom-left/bottom-right ; `logoSize` 5–25 % ; `logoMargin` 2–12 % ; `titleOffset` 0–15 % ; `titleTilt` -5 à 5 degrés ; `ornament` none/orbits/circuit/stripes.
- Les anciens réglages `design.foil` et associés restent lisibles pour migrer v1. En v2, seules les finitions de `layout` font autorité.

Le serveur doit reprendre la liste blanche exacte de `layout.ts` : pas de sélecteur, accolade, import, échappement CSS, URL, variable CSS libre ou `!important`. Ne pas effectuer de filtrage par simple remplacement de chaînes. Les déclarations valides surchargent uniquement la zone concernée ; les géométries extérieures restent rectangulaires et confinées. Les aides d'édition, les brouillons CSS invalides et l'historique annuler/rétablir ne font pas partie d'une publication.

## Logo du booster — ajout backend à confirmer

Le logo appartient au booster, pas à la variante ni au modèle. Proposer un champ optionnel `logoUrl` sur les DTO administratifs et publics du booster, et une projection optionnelle `boosterLogoUrl` dans les données de carte nécessaires à la collection, aux enchères, aux échanges et aux modales. Vérifier les DTO réels pour choisir les emplacements exacts et éviter des requêtes individuelles supplémentaires par carte.

Le backend doit définir le contrat de sélection/téléversement et de suppression du logo (PNG/WebP transparent recommandé), les limites de fichier, le stockage, les droits ADMIN et les règles de cache. Aucun endpoint de téléversement n'est supposé existant. Les fronts attendent une URL de ressource exploitable ; jamais un `blob:` de l'atelier. Le moteur accepte `RenderData.boosterLogo`, mais l'adaptateur FO ne prétend pas recevoir ce champ avant sa présence dans le Swagger.

Critères : le même booster conserve son logo pour toutes ses variantes ; sans logo, aucune marque ni texte de remplacement ; positions aux quatre angles, titre et numéro lisibles ; remplacement/suppression propagés aux lectures concernées. Les anciens boosters restent compatibles avec une valeur absente. La politique de modification du logo pour les boosters gelés doit être explicitée par le backend.

## Référencement et compatibilité

La variante référence une publication par `renderKey = tpl:<id>@<revision>` ; le format reste inférieur à la limite de 64 caractères. Valider lors de l’association administrative qu’une révision publiée existe. Les styles de variante `FULL_ART` et les données de l’exemplaire restent distincts de la définition. Pour une clé de modèle, la finition de sa définition est la source de vérité visuelle ; les styles inconnus ne sont pas effacés.

Les anciennes clés de rendu restent valides. Une nouvelle publication ne change aucune variante automatiquement. Le changement de clé d’une variante existante affectera les cartes déjà distribuées utilisant cette variante : conserver l’avertissement administratif actuel.

Les révisions publiées ne sont jamais modifiées ou supprimées dans ce périmètre. Les conserver pour les anciens exemplaires. Les réponses versionnées peuvent être mises en cache avec ETag et une politique immutable ; ne pas appliquer cette politique au catalogue administratif ou public non versionné. Le client regroupe les lectures concurrentes, borne son cache et ne met pas en cache les échecs.

Erreurs : 400 paramètres/définition invalides, 401 session manquante pour l’admin, 403 non ADMIN, 404 identifiant/révision introuvable, 409 version périmée ou identifiant déjà utilisé. Fournir des codes stables et détails traduisibles ; ne pas mélanger erreur d’autorisation et absence de modèle.

Le moteur 1 refuse les définitions exigeant une autre version ; le FO conserve un rendu standard lisible avec un état explicite. Une stratégie future de versions compatibles devra être documentée avant d’accepter un nouveau schéma.

## Validation attendue du backend

- Création, mise à jour, publication puis lecture publique ; aucun brouillon exposé publiquement.
- Concurrence entre deux admins : une seule mutation valide pour une version donnée ; révisions uniques et immuables.
- Référence à une révision inexistante rejetée lors de l’association à une variante.
- Valeurs hors limites, CSS/HTML injecté, champs inconnus et versions non prises en charge rejetés.
- Aucun titre, image locale ou numéro fictif du bac à sable dans une définition publiée.
- L’accès ADMIN est contrôlé sur toutes les écritures et lectures de brouillon.
- Fournir Swagger, exemples JSON, codes d’erreur et tests d’intégration. Le branchement des mutations réelles sera fait ensuite ; ne pas déduire leur disponibilité de l’existence des mocks.

## Reprise côté fronts

Le BO garde ses comparaisons au format workspace version 2 et migre automatiquement les imports/sauvegardes version 1. Cet export contient des données d’exemple et n’est pas le DTO de publication. Le catalogue simulé est en mémoire et se réinitialise au rechargement ; exporter la comparaison pour conserver une exploration.

Synchronisation portable depuis le BO : `node scripts/sync-card-renderer.mjs --target=<dossier-du-FO>`. Vérification sans écriture : même commande avec `--check`. Le moteur utilise des imports relatifs, des données typées et des libellés fournis par chaque application. Synchroniser puis valider les deux dépôts avant publication d’un moteur.
