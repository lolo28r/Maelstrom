# Convention d’interface — navigation

Le jeu utilise désormais une seule grammaire de navigation.

## Déplacements dans le décor

- Une destination visible se clique directement dans l’image : porte, rue, chemin, bâtiment ou escalier.
- Le curseur de déplacement et le libellé au survol confirment que la zone est praticable.
- Une action accomplie dans le monde reste également dans l’image : examiner, parler, s’agenouiller ou emprunter l’escalier de la pièce secrète.

## Retour

- Revenir au lieu précédent utilise toujours le contrôle `← Retour`.
- Il se trouve toujours en haut à gauche.
- Il possède la même police, les mêmes couleurs, le même fond et le même comportement au survol dans toutes les scènes.
- Les anciennes zones invisibles situées en bas de l’image pour « revenir d’où l’on vient » ne sont plus utilisées.

## Sortie d’une séquence

- Le contrôle `➔ Sortir` est réservé au départ depuis un écran sans porte visible, notamment le bureau.
- Il se trouve toujours en bas à droite.
- Une sortie réellement visible dans le décor reste une zone du décor et non un bouton d’interface.

## Blocage de l’interface

Les passages, interactions et contrôles de navigation sont inactifs pendant un dialogue, la lecture d’un document, la sélection d’un objet, le tableau de connexions ou l’ouverture des réglages audio. Cela empêche un clic d’interface de déclencher simultanément le décor.
