# Demande d’évolution API WikiForge — transmission à Claude

Date : 27 septembre 2026. Destinataire : agent Claude travaillant sur le backend WikiForge.

## Mission

Implémente les évolutions ci-dessous dans le backend après vérification de son code et de son Swagger actuel. Elles doivent permettre au front office et au backoffice de terminer leurs parcours sans simuler des capacités serveur. Commence par dresser une matrice « déjà disponible / à compléter / absent », puis traite les priorités P1, P2 et P3. Une capacité déjà présente doit être documentée et testée, pas recréée sous un autre endpoint.

Les chemins et noms de champs marqués **proposés** sont des recommandations de contrat, pas des appels disponibles aujourd’hui. Préserve les conventions existantes lorsque le backend possède une solution équivalente. Fournis le contrat définitif et les exemples nécessaires aux deux fronts avant leur branchement. Aucun déploiement ni test d’écriture en production n’est demandé.

Références locales :

- FO : `D:/Documents/KTD/encyclomestre`, contrat joueur de référence `docs/contracts/api.openapi.json`, analyse `docs/api-auctions-reporting-needs.md`, recommandations `docs/ux-ui-recommendations.md`.
- BO : `D:/Documents/KTD/wikiforge-bo`, contrats administratifs dans `src/lib/api/types.ts` et `src/lib/api/admin.ts`.
- Le JSON joueur de référence couvre 117 opérations et ne constitue pas le Swagger administratif complet. Vérifie les DTO admin contre le Swagger du backend. Les constats ci-dessous portent sur ces sources locales ; une évolution serveur plus récente peut les rendre partiellement obsolètes.

## Capacités existantes à conserver

- Les signalements sont déjà disponibles par `POST /reports` : `type`, `id`, `reason`, commentaire optionnel de 1 000 caractères maximum selon le contrat. Types connus : `USER`, `MESSAGE`, `GUILD_MESSAGE`, `GUILD`, `PAGE`. Motifs connus : `CHEATING`, `NAME`, `HARASSMENT`, `SPAM`, `INAPPROPRIATE`, `OTHER`. Vérifier les contraintes exactes dans le Swagger final. Le serveur résout les preuves ; ne pas inventer un contexte `AUCTION`. Le vendeur d’une enchère est signalé comme `USER`.
- `/me/sanctions`, `/me/cases` et les messages de dossier existent. Un dossier de modération reçu n’est pas un historique des signalements envoyés. La réponse à son dossier doit rester possible sous `MUTE`.
- `PUT/DELETE /auctions/{id}/watch` servent à l’abonnement temps réel temporaire, renouvelé toutes les 60 secondes. Ce ne sont pas des favoris persistants.
- `/pages/{id}` et `/variants` permettent déjà les aperçus de variantes, lorsque `variantIds` est fourni. Ne pas inventer des associations absentes.
- Le BO gère déjà bannières, enchères administratives, signalements, sanctions et modération des cartes. Préserver notamment les mutations atomiques liées aux signalements et leurs conflits.
- La fermeture manuelle des bannières pendant la session, les modales de cartes, les sélecteurs compacts et les brouillons locaux sont réalisés côté front et ne nécessitent pas de nouvel endpoint.
- L’import CSV BO associe des cartes existantes au brouillon d’un booster. Aucune création de carte, suppression de pack ni API d’import supplémentaire n’est demandée ici.

## P1 — Fonctionnalités prioritaires

### 1. Recherche globale des enchères

**Écran :** FO `/market`, vue Explorer. Actuellement `GET /auctions?page` renvoie 48 résultats, avec filtres FO explicitement limités à la page chargée.

**Évolution proposée :** enrichir `GET /auctions` avec recherche textuelle, identifiant de carte du catalogue (`pageId`), variantes multiples, vendeur, phase, prix minimal/maximal et tri. Les filtres doivent être combinables. Documenter les valeurs de tri, les règles du texte et la différence entre prix courant et prix initial. Distinguer phase programmée/ouverte/terminée selon les états réellement exposables.

**Réponse attendue :** résultats filtrés côté serveur, pagination explicite (`page`, `pageSize`, `hasNext`, total filtré lorsque calculable), ordre stable avec départage par identifiant. Préciser visibilité des enchères futures, terminées et des utilisateurs bloqués. Ne pas exposer d’enchères privées pour obtenir un total.

**Acceptation :** une carte hors de la première page est retrouvée ; les filtres se cumulent ; pagination et total portent sur le même ensemble ; prix invalides et tri inconnu produisent une erreur documentée ; les autorisations restent appliquées.

### 2. Suppression de son propre compte

**Écran futur :** paramètres du compte FO, zone de suppression avec conséquences et confirmation explicite. Le contrat joueur local de `/me` contient GET/PATCH, pas de suppression : c’est une nouvelle capacité demandée.

**Opérations proposées :**

- `GET /me/deletion` : vérifier l’éligibilité et présenter les conséquences. Réponse proposée : `canDelete`, `blockers[]` avec `code` stable et références uniquement autorisées, puis résumé des données supprimées/anonymisées. Aucune mutation lors de cette lecture.
- `DELETE /me` : supprimer le compte identifié par la session, sans accepter un `userId` arbitraire. Exiger une authentification récente selon le mécanisme OAuth existant et les protections CSRF adaptées au transport utilisé. Ne pas demander un mot de passe local à un compte OAuth qui n’en possède pas. Documenter précisément le challenge de réauthentification et l’erreur permettant de le déclencher.

**Règles à implémenter :**

1. Vérifier de nouveau les blocages dans la transaction de suppression ; une prévalidation n’est pas une autorisation définitive.
2. Refuser par `409` avec des blocages exploitables lorsque des enchères, plafonds/mises, fonds bloqués, échanges en cours ou responsabilités de propriétaire de guilde empêchent une clôture cohérente. Indiquer l’action requise : attendre le règlement, annuler une opération autorisée ou transférer/dissoudre la guilde selon le contrat existant. Ne jamais détruire silencieusement un engagement financier ni contourner les règles d’annulation.
3. Définir explicitement le sort des ventes immédiates, invitations, favoris, vitrines, cartes possédées, monnaie et relations. Recommander le blocage des engagements actifs et le nettoyage transactionnel des objets sans engagement ; ne pas réattribuer des biens à un tiers implicitement.
4. Supprimer ou anonymiser les données personnelles selon la politique réelle du service. Documenter séparément ce qui doit rester pour l’intégrité des transactions ou de la modération, avec finalité et durée définies par le responsable du service. Ne pas inventer de durée légale.
5. Retirer le compte des recherches/profils publics et invalider accès, refresh tokens, sessions et abonnements temps réel sur tous les appareils. La session courante doit être révoquée après le succès confirmé.
6. Préserver les références historiques sans fuite de données personnelles : vendeur/auteur supprimé rendu comme utilisateur supprimé, champs devenus nuls documentés. Mettre à jour FO et BO avec les exemples de DTO correspondants.
7. Éviter les suppressions partielles et les doubles traitements. Le front ne retentera pas automatiquement cette mutation après une erreur réseau. Documenter la récupération après résultat incertain : après révocation, une répétition avec l’ancien jeton peut légitimement renvoyer `401`, et non `204`.

**Contrat recommandé :** `204` après suppression terminée ; `401` pour session invalide ou réauthentification requise avec code distinct ; `409` pour blocages métier. Si la suppression doit être asynchrone, remplacer cette proposition par un contrat complet `202` avec identifiant d’opération, état consultable sécurisé et politique d’authentification pendant le traitement. Ne pas laisser le front deviner si la suppression est achevée.

**Acceptation :** impossible de supprimer un autre compte ; réauthentification périmée refusée ; nouveaux engagements concurrents détectés ; échec transactionnel sans compte partiellement effacé ; retrait des données publiques ; révocation multiappareil ; références historiques et modération encore cohérentes ; aucun double débit, transfert ou remboursement. Ajouter un scénario de résultat réseau incertain et un exemple complet de chaque blocage.

### 3. Favoris d’enchères persistants

**Écran :** nouvelle vue Suivies et bouton de favori sur fiche/carte d’enchère. `/me/bids` représente des participations, pas des favoris.

**Contrat proposé :** GET paginé `/me/auction-favorites`, PUT/DELETE `/me/auction-favorites/{auctionId}` et indicateur `viewer.isFavorite` dans les lectures concernées. Ajout/retrait idempotents ; préciser le comportement pour enchère terminée, supprimée ou inaccessible.

**Acceptation :** état retrouvé sur un autre appareil ; aucun blocage d’argent ; aucune mise ni prolongation de watch déclenchée ; pagination stable ; un retrait ne modifie pas les participations. Aucun favori local ne sera substitué à cette API.

### 4. Historiques personnels complets

**Écrans :** Mes ventes, Mes participations, Historique, profils quand autorisés. Sources actuelles : `/me/auctions` limité à 100 et à 30 jours pour les clôturées ; `/me/bids` non paginé avec `escrowed` et `auctions`.

**Demande :** pagination/tri serveur des ventes et participations, filtres par état et résultat personnel. Fournir un résultat explicite pour le joueur : menée, dépassée, gagnée, perdue, vendue, invendue, annulée et attente de règlement selon le modèle métier. Le résultat ne doit pas être déduit de l’absence d’un enchérisseur visible.

**Données :** prix final, dates de clôture/règlement, exemplaire concerné, plafond personnel uniquement pour son propriétaire, argent bloqué et règle de calcul. Documenter durée de conservation et éventuelle troncature ; si elle reste limitée, l’indiquer dans les métadonnées. Une identité privée du gagnant peut rester masquée tout en fournissant `viewerOutcome`.

**Acceptation :** naviguer au-delà de 100 opérations ; distinguer victoire définitive et règlement en attente ; mêmes résultats entre liste/détail ; aucune fuite des plafonds d’autrui ; pagination sans trous pour un jeu de données stable.

### 5. Disponibilité d’un exemplaire

**Écrans :** collection, détail partagé, échanges, vente et création d’enchère. Actuellement le FO doit rapprocher la collection de `/me/auctions`.

**Demande :** ajouter aux DTO d’exemplaires un état de disponibilité uniforme avec raisons de blocage et permissions, ainsi que les identifiants d’enchère, de vente ou d’échange seulement lorsque leur consultation est autorisée. Distinguer `pageId` (carte du catalogue) et identifiant d’exemplaire. Préciser les combinaisons d’engagement autorisées.

**Acceptation :** collection correcte dès sa première lecture, sans appel par carte ; entrée vers l’enchère concernée ; actions interdites désactivables avec raison traduisible ; mutation serveur revalidée en cas de course ; règlement/annulation libèrent l’exemplaire.

### 6. Frais exacts avant modification d’une enchère

**Écran :** création/modification, confirmation des frais. Le DTO actuel ne permet pas de reconstituer les frais déjà payés après plusieurs changements de prix.

**Demande proposée :** devis serveur sans mutation pour création et changement de prix, ou données suffisantes et formule contractuelle permettant le même résultat exact. Préférer un devis indiquant frais déjà acquittés, supplément dû, prix proposé, solde requis, expiration et version de l’enchère. Les montants doivent suivre les unités et arrondis du contrat existant.

**Acceptation :** hausse puis baisse puis nouvelle hausse correctement chiffrées ; devis périmé ou version concurrente refusés explicitement par `409` ; aucune facturation à la lecture du devis ; mutation atomique et absence de double débit. Documenter la prise en charge d’une clé d’idempotence si disponible, sans ajouter de retry automatique au FO.

## P2 — Parcours sociaux et fiabilité des listes

### 7. Temps réel des conversations de guilde

**Situation :** actualisation périodique côté FO ; ne pas inventer d’événement SSE non documenté.

**Demande :** documenter/ajouter les événements de messages, suppression ou masquage, modifications et perte d’accès. Fournir identifiant d’événement, guilde/canal autorisé et curseur permettant le rattrapage après reconnexion ; définir les compteurs non lus et l’opération de lecture si ces fonctions sont prises en charge.

**Acceptation :** reconnexion sans message perdu ni doublon ; ordre stable ; révocation d’adhésion coupe immédiatement l’accès ; contenu modéré retiré ; aucune fuite interguilde. Réutiliser le flux existant si son modèle convient.

### 8. Recherche globale des membres d’une guilde

**Situation :** recherche FO limitée aux 20 membres de la page chargée.

**Demande :** recherche textuelle et tri serveur sur l’endpoint des membres, pagination et total filtré distinct de `nbMembers`. Conserver le propriétaire en tête dans le tri par défaut et documenter les autres tris.

**Acceptation :** membre trouvé hors de la page courante ; filtres et pages cohérents ; restrictions de visibilité respectées ; identités supprimées gérées sans casser la liste.

### 9. Révocation d’une invitation de guilde envoyée

**Demande :** opération dédiée permettant à l’émetteur ou aux rôles autorisés de révoquer une invitation encore en attente, distincte du refus par le destinataire et de l’exclusion d’un membre. Réutiliser le DTO/identifiant d’invitation existant.

**Acceptation :** invitation révoquée impossible à accepter ; course acceptation/révocation traitée atomiquement ; rôle non autorisé refusé ; répétition de révocation définie ; listes et notifications actualisées. Ne pas détourner un endpoint de dissolution de guilde.

### 10. Historique de ses signalements envoyés

**Demande proposée :** GET paginé `/me/reports`, accusé de réception exploitable après `POST /reports`, états publics limités et dates. Fournir type de cible, référence encore visible et résultat public uniquement si la politique du service l’autorise.

**Acceptation :** historique indépendant de `/me/cases` ; aucune identité de tiers, preuve privée, note interne ni détail confidentiel de sanction exposé ; cible disparue gérée ; pagination et permissions testées. Le BO conserve son accès administratif sans que ce DTO public hérite de ses champs sensibles.

### 11. Métadonnées de pagination fiables du catalogue

**Demande :** expliciter `pageSize`, `hasNext` ou curseur, total et caractère exact/estimé/plafonné du total sur `/pages` et les listes concernées. Si le moteur impose une limite de profondeur telle que 10 000 résultats, l’exposer avec le maximum atteignable et le comportement au-delà ; ne pas supposer que cette limite existe sans vérifier.

**Acceptation :** bouton suivant désactivable sans déduction depuis les résultats filtrés localement ; zéro résultat, dernière page pleine et total tronqué distingués ; erreurs de page hors limite documentées ; BO et FO partagent les mêmes règles.

## P3 — Statistiques de collection

### 12. Progression réelle de collection

**Situation :** le nombre de cartes de `/welcome` représente des exemplaires et ne suffit pas à calculer la couverture du catalogue.

**Demande :** compteurs séparés pour exemplaires possédés, cartes du catalogue distinctes et couples carte/variante distincts, avec dénominateur clairement défini sur le catalogue actif et date de calcul. Préciser effet des filtres, cartes inactives, variantes limitées et exemplaires engagés dans une transaction.

**Acceptation :** deux exemplaires identiques n’augmentent pas le nombre de cartes distinctes ; deux variantes ont le comportement documenté ; numérateur et dénominateur utilisent le même périmètre ; données manquantes non remplacées par un pourcentage inventé.

## Exigences communes aux contrats

- Types OpenAPI complets : champs requis/optionnels/nullables, bornes, unités monétaires, listes vides, pagination, valeurs d’enums et exemples. Conserver un rendu de repli possible pour toute nouvelle valeur.
- Dates ISO avec fuseau explicite, idéalement UTC `Z`. Documenter la compatibilité des anciennes dates sans fuseau, actuellement interprétées comme UTC par le FO.
- Erreurs avec code métier stable et détails structurés utiles au formulaire. Documenter au minimum les cas `400`, `401`, `403`, `404` et `409`, et `422` seulement si le backend l’utilise. Les messages serveur ne doivent pas être la clé de traduction du front.
- Contrôles d’autorisation sur chaque lecture et mutation ; pas de confiance dans un identifiant de compte envoyé par le client. Les plafonds privés, preuves et données de modération ne doivent pas fuiter via listes, totaux ou SSE.
- Transactions, verrouillage/version et comportement de répétition documentés pour toute mutation sensible. Garder le traitement lié des signalements/sanctions/modération cohérent et atomique là où le contrat le prévoit.
- Ajouter les événements SSE nécessaires et leur portée, ou documenter explicitement l’actualisation requise. Une notification d’enchère doit contenir une cible exploitable ; vérifier les DTO actuels avant d’ajouter un champ redondant.
- Compatibilité ascendante : privilégier les ajouts de champs/paramètres. Toute migration de réponse de liste doit préciser la transition pour les deux applications.
- Les changements d’identité et suppressions de compte doivent rester lisibles dans les enchères, messages, guildes, notifications et écrans administratifs, sans réexposer de données effacées.

## Livrables attendus de Claude

1. Matrice de couverture confrontant chaque section au backend actuel, avec références au code/Swagger et écarts constatés.
2. Implémentation backend et migrations nécessaires, tests unitaires, tests d’intégration et tests d’autorisation/concurrence couvrant les critères ci-dessus.
3. Swagger définitif exporté, exemples JSON de succès/erreurs et jeux de données pour mocks FO/BO : compte supprimé, blocages de suppression, favoris, historiques privés, pagination plafonnée, devis périmé et reconnexion.
4. Guide d’intégration listant les endpoints définitifs, DTO modifiés, nouveaux codes traduisibles, événements SSE, compatibilités et ordre de livraison.
5. Liste explicite des décisions non techniques restant à valider : conservation/anonymisation, durée d’historique, frais et visibilité des résultats. Ne pas présenter une politique supposée comme adoptée.
6. Résultats des validations locales, limites restantes et étapes de reprise. Aucune affirmation de fonctionnement en production sans vérification autorisée.

Le branchement des nouveaux endpoints dans les fronts fera ensuite l’objet d’une modification dédiée avec leurs contrats réels. Ce document n’indique pas que ces capacités sont déjà implémentées.
