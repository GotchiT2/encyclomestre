# Enchères et signalements : capacités et besoins API

## Source actualisée

Le JSON OpenAPI fourni dans cette conversation est conservé dans `docs/contracts/api.openapi.json`. Il remplace les conclusions provisoires établies depuis `message (3).txt`. La matrice exhaustive des 117 opérations est dans `docs/api-fo-coverage.md`.

## Blocage résolu : signalements

POST /reports est documenté avec cinq types : USER, MESSAGE, GUILD_MESSAGE, GUILD et PAGE. Les six motifs sont CHEATING, NAME, HARASSMENT, SPAM, INAPPROPRIATE et OTHER. Le corps contient type, id, reason et le commentaire facultatif de 1 000 caractères. Aucun champ context ni type AUCTION n’est ajouté.

Le serveur détermine la cible et conserve les preuves de contexte. Le FO propose maintenant ces signalements sur les profils, vendeurs, échanges, messages, guildes et articles. Il garde le commentaire après erreur, confirme avant envoi et sépare explicitement le blocage. Un vendeur d’enchère est signalé comme USER, pas comme une cible AUCTION inventée.

GET /me/sanctions, GET /me/cases, GET /me/cases/{caseId} et POST /me/cases/{caseId}/messages permettent de consulter ses restrictions et de répondre aux dossiers ouverts. Les dossiers de modération ne sont pas un historique de ses signalements.

## Limites encore présentes

| Capacité                    | Source actuelle                                       | Limite                                                                           |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Explorer                    | GET /auctions?page                                    | 48 résultats ; les filtres FO portent sur la page chargée                        |
| Mes ventes                  | GET /me/auctions                                      | Liste bornée à 100 ; clôtures conservées 30 jours                                |
| Mes participations          | GET /me/bids                                          | Liste bornée, sans pagination ; pas des favoris                                  |
| Historique                  | Listes personnelles                                   | Incomplet hors des limites ; une identité masquée ne prouve pas qui a gagné      |
| Détail temps réel           | GET /auctions/{id}, PUT/DELETE watch, auction.updated | Abonnement technique temporaire, renouvelé toutes les 60 secondes                |
| Disponibilité en collection | Association avec /me/auctions                         | Lectures complémentaires nécessaires                                             |
| Frais de modification       | Règles contractuelles                                 | Montant historique des frais payés non exposé pour calculer tous les compléments |

## Demandes backend précises

- Recherche globale : critères combinables titre/article, variante, vendeur, phase, prix ; tri stable et nbResults filtré. Acceptation : trouver une enchère hors de la page initiale.
- Favoris : ajout, retrait et liste paginée persistante ; durée de conservation documentée. Acceptation : changement d’appareil sans perte, aucun argent engagé, indépendance de watch.
- Historiques : pagination et résultat de l’appelant fiable après règlement. Acceptation : plus de 100 entrées et victoire identifiable même avec meneur masqué.
- Disponibilité d’exemplaire : identifiant d’enchère ou vente active dans collection/détail quand accessible. Acceptation : badge et lien corrects dès une arrivée directe.
- Frais : valeur des frais déjà payés ou devis serveur. Acceptation : complément exact après baisse puis hausse de prix.

Aucune demande de contrat pour USER/MESSAGE/GUILD_MESSAGE/GUILD n’est encore bloquante : elle a été résolue par le Swagger fourni. Les autres améliorations sont détaillées dans `docs/ux-ui-recommendations.md`.
