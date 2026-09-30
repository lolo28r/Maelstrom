# Maelström — Contexte technique pour une IA textuelle

Ce document est destiné à être copié dans une conversation avec une IA qui n'a pas accès au dépôt. Il décrit l'architecture existante et les règles à respecter pour produire du code compatible avec le projet.

## 1. Architecture générale

Maelström est un jeu narratif web en TypeScript utilisant :

- Phaser 3 pour les scènes, images, sons, interactions et transitions ;
- React 19 pour le HUD et les interfaces superposées au canvas ;
- Zustand 5 comme état partagé entre Phaser et React ;
- i18next et react-i18next pour les textes ;
- Vite pour le développement et le build.

Le canvas Phaser et les overlays React sont montés dans `src/App.tsx`. Phaser gère le monde du jeu. React affiche notamment les dialogues, l'inventaire, le journal, les documents, les jauges et les effets visuels.

```text
Scène Phaser
   │ lit/modifie
   ▼
Store Zustand composé de slices
   │ notifie
   ▼
Composants React
```

Le store est le contrat entre Phaser et React. Une scène ne manipule pas directement le DOM des composants React.

## 2. Fichiers importants

```text
src/
├── App.tsx                     Montage Phaser + overlays React
├── i18n.ts                     Configuration des langues
├── locales/                    fr.json, en.json et ar.json
├── game/
│   ├── config.ts               Configuration et liste des scènes
│   ├── helper/                 Choix et interactions réutilisables
│   └── scenes/                 Scènes Phaser
├── components/                 HUD et overlays React
└── store/
    ├── useGameStore.ts         Composition uniquement
    ├── types.ts                Contrats partagés
    ├── statsSlice.ts
    ├── inventorySlice.ts
    ├── choicesSlice.ts
    ├── worldSlice.ts
    ├── narrativeSlice.ts
    ├── journalSlice.ts
    ├── devSlice.ts
    └── persistenceSlice.ts
```

Ne pas recréer un second store, un contexte React global ou un gestionnaire parallèle pour une responsabilité déjà couverte par Zustand.

## 3. Responsabilités des slices

| Slice | Responsabilité |
| --- | --- |
| `statsSlice` | Santé mentale, épuisement, conscience cosmique et notifications |
| `inventorySlice` | Objets, quantités, sélection et verrouillage de la sacoche |
| `choicesSlice` | Historique des choix et application des conséquences |
| `worldSlice` | Scène courante, progression, Vraie Vue et états du monde |
| `narrativeSlice` | Dialogue courant, document ouvert et paupières |
| `journalSlice` | Notes, indices, archives et nouvelles entrées |
| `devSlice` | Mode développeur |
| `persistenceSlice` | Sauvegarde, chargement et reset |

`useGameStore.ts` doit rester un fichier de composition. La logique métier appartient à la slice concernée.

## 4. Choisir où placer un état

- État temporaire d'une animation ou d'une seule scène : propriété privée de la scène.
- État partagé entre Phaser et React, entre plusieurs scènes ou sauvegardé : Zustand.
- État purement visuel propre à un composant : état React local.

Pour étendre une slice :

1. Ajouter le champ et ses actions à l'interface correspondante dans `src/store/types.ts`.
2. Ajouter la valeur initiale et les actions dans la slice métier.
3. Pour une progression persistante, modifier dans `persistenceSlice.ts` : `SavedGame`, `saveGame`, `loadGame` et `resetGame`.
4. Pour une propriété d'`Act1Progress`, ajouter aussi sa valeur à `initialAct1Progress` dans `worldSlice.ts`.
5. Ne jamais contourner le typage avec `as any`.

Pour un nouveau domaine, créer une nouvelle slice :

```ts
export interface ExampleSlice {
    exampleValue: number;
    setExampleValue: (value: number) => void;
}
```

```ts
import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { ExampleSlice } from './types';

export const createExampleSlice: StateCreator<GameState, [], [], ExampleSlice> = (set) => ({
    exampleValue: 0,
    setExampleValue: (exampleValue) => set({ exampleValue }),
});
```

Ajouter ensuite l'interface à l'intersection `GameState` et le créateur à la composition de `useGameStore.ts`.

## 5. Utiliser le store

Dans Phaser :

```ts
const store = useGameStore.getState();
store.updateAct1Progress({ letterRead: true });
store.modifyStat('consciousness', 5);
```

Dans React, sélectionner uniquement les données nécessaires :

```tsx
const consciousness = useGameStore((state) => state.consciousness);
const modifyStat = useGameStore((state) => state.modifyStat);
```

Éviter `const store = useGameStore()` dans React, car le composant serait abonné à tout le store.

Les statistiques sont bornées entre 0 et 100 par `modifyStat`. Une décision narrative doit normalement passer par `recordChoice`, qui conserve l'historique et applique ses conséquences.

## 6. Règles i18n obligatoires

Tout texte visible doit être placé dans les trois fichiers suivants :

- `src/locales/fr.json` ;
- `src/locales/en.json` ;
- `src/locales/ar.json`.

Cela inclut dialogues, personnages, objets, boutons, hotspots, placeholders, messages visibles et attributs d'accessibilité. Les IDs techniques, noms de scènes, clés Phaser et logs ne sont pas traduits.

Le français est le fallback, mais chaque nouvelle clé doit être ajoutée aux trois langues.

Namespaces existants :

```text
characters.*       Personnages
stats.*            Statistiques
items.<id>.*       Objets
scene_actions.*    Hotspots et interactions
scene_choices.*    Choix transversaux
scene_narration.*  Narration courte
menu_dialogs.*     Menu
act1_*.*           Contenu narratif de l'acte 1
```

Pour un texte immédiatement affiché dans Phaser :

```ts
actionLabel: i18n.t('scene_actions.examineNewspaper')
speaker: i18n.t('characters.laurence')
text: i18n.t('scene_choices.yes')
```

Pour `setDialog`, `textKey` reste une clé :

```ts
store.setDialog({
    textKey: 'act1_library.librarian_greeting',
    type: 'bottom',
    speaker: i18n.t('characters.librarian'),
});
```

`NarrativeDialog` résout cette clé. Elle peut référencer une chaîne ou un tableau de paragraphes. `type: 'center'` utilise la modale narrative centrale.

Attention : l'API historique `startDialogue` reçoit actuellement un texte déjà résolu :

```ts
store.startDialogue({
    text: i18n.t('act1_store.stove_dialog'),
    speaker: i18n.t('characters.laurence'),
});
```

Ne pas mélanger les conventions de `setDialog` et `startDialogue` sans refactorer l'API.

## 7. Dialogues et choix

Dialogue simple :

```ts
store.setDialog({
    textKey: 'chapter.location.firstVisit',
    speaker: i18n.t('characters.someone'),
    onComplete: () => store.updateAct1Progress({ someFlag: true }),
});
```

Dialogue avec choix :

```ts
store.setDialog({
    textKey: 'chapter.location.question',
    speaker: i18n.t('characters.someone'),
    choices: [
        {
            id: 'location_accept_offer',
            text: i18n.t('chapter.location.choiceAccept'),
            consequences: { consciousnessDelta: 5, mentalDelta: -3 },
        },
        {
            id: 'location_refuse_offer',
            text: i18n.t('chapter.location.choiceRefuse'),
            consequences: { mentalDelta: 2 },
        },
    ],
    onComplete: (selectedChoiceId) => {
        if (selectedChoiceId === 'location_accept_offer') {
            store.updateAct1Progress({ someFlag: true });
        }
    },
});
```

`NarrativeDialog` appelle déjà `recordChoice` lors du clic. Ne pas le rappeler une seconde fois pour le même choix, sinon les conséquences peuvent être appliquées deux fois.

Les IDs de choix sont uniques, stables et en anglais technique : `location_action_variant`.

## 8. Interactions Phaser

Utiliser `HotSpotZone` pour une zone invisible :

```ts
const hotspot = new HotSpotZone({
    scene: this,
    x: 640,
    y: 360,
    width: 180,
    height: 220,
    type: 'inspect',
    actionLabel: i18n.t('scene_actions.examine'),
    onClick: () => this.inspectObject(),
});
```

Utiliser `InteractiveObject` lorsque la texture affichée est interactive :

```ts
const object = new InteractiveObject({
    scene: this,
    x: 640,
    y: 480,
    texture: 'letter_asset',
    actionLabel: i18n.t('scene_actions.read'),
    onClick: () => this.openLetter(),
});
```

Ces helpers bloquent déjà l'interaction si un dialogue, un document ou un objet d'inventaire est ouvert. Conserver les instances créées et appeler `destroy()` lors d'un changement de lieu ou de la destruction de la scène.

## 9. Inventaire

```ts
store.addItem({
    id: 'stable_item_id',
    name: i18n.t('items.stableItem.name'),
    icon: `${import.meta.env.BASE_URL}assets/stableItem.png`,
    description: i18n.t('items.stableItem.description'),
    examineText: i18n.t('items.stableItem.examineText'),
    quantity: 1,
    stackable: false,
    consumable: false,
});
```

- L'`id` est stable et non traduit.
- Un objet est empilable sauf si `stackable` vaut `false`.
- `removeItemFromInventory(id)` consomme une unité.
- Les comportements spéciaux de consommation vivent actuellement dans `InventoryHUD.tsx`.

## 10. Journal et documents

```ts
store.addJournalNote(
    i18n.t('chapter.note.title'),
    i18n.t('chapter.note.content'),
    i18n.t('chapter.note.timestamp'),
);
```

La note reste en attente jusqu'à `commitPendingNote`, déclenché par l'interface du journal.

```ts
store.addArchivedDocument(id, title, content, timestamp);       // avec notification
store.silentAddArchivedDocument(id, title, content, timestamp); // sans notification
```

```ts
store.openDocument({
    title: i18n.t('documents.letter.title'),
    content: i18n.t('documents.letter.content'),
    onClose: () => store.updateAct1Progress({ letterRead: true }),
});
```

Les IDs de documents et d'indices doivent rester stables afin d'éviter les doublons.

## 11. Ajouter une scène

Une scène doit :

1. étendre `Phaser.Scene` et avoir une clé stable ;
2. charger ses assets avec `import.meta.env.BASE_URL` ;
3. appeler `setScene` dans `create()` ;
4. être enregistrée dans `src/game/config.ts` ;
5. nettoyer sons, timers, événements, abonnements et helpers ;
6. externaliser tous ses textes ;
7. placer toute progression persistante dans le store.

```ts
import Phaser from 'phaser';
import i18n from '../../i18n';
import { useGameStore } from '../../store/useGameStore';

export class ExampleScene extends Phaser.Scene {
    constructor() {
        super('ExampleScene');
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;
        this.load.image('example_bg', `${baseUrl}assets/example.jpg`);
    }

    create() {
        useGameStore.getState().setScene('ExampleScene');
        this.add.image(640, 360, 'example_bg').setDisplaySize(1280, 720);
    }
}
```

Transition correcte :

```ts
store.setScene('ExampleScene');
this.scene.start('ExampleScene');
```

Le jeu utilise une résolution logique de `1280 × 720`, `Phaser.Scale.FIT` et `CENTER_BOTH`.

## 12. Sauvegarde

La sauvegarde utilise `localStorage` avec la clé `maelstrom_save_v1`. Toute donnée requise pour reprendre une partie doit être ajoutée explicitement à `persistenceSlice.ts`.

Le chargement utilise `??` et une valeur par défaut pour rester compatible avec les anciennes sauvegardes. Ne jamais sauvegarder de callbacks, objets Phaser, références DOM, sons, timers ou états d'animation temporaires.

Après une modification du schéma, tester : nouvelle partie, sauvegarde, rechargement, reprise et reset.

## 13. Conventions TypeScript

- Pas de `any`, `as any` ni `@ts-ignore`.
- Utiliser `import type` pour les imports uniquement typés.
- Ne pas redéclarer localement un type déjà présent dans le store.
- Préférer `??` à `||` lorsque `0`, `false` ou `''` sont valides.
- Préserver l'immutabilité dans les setters Zustand.
- Les IDs et clés i18n sont stables et en anglais ; les textes sont dans les locales.
- Ne pas modifier une API publique existante sans adapter tous ses consommateurs.

## 14. Vérifications obligatoires

```bash
npm run lint
npm run build
```

Checklist :

- aucun texte visible codé en dur ;
- chaque nouvelle clé présente dans les trois locales ;
- chaque nouvel état persistant couvert par save/load/reset ;
- aucun `any` ajouté ;
- nouvelle scène enregistrée dans `game/config.ts` ;
- sons, événements, timers et abonnements correctement nettoyés.

## 15. Dettes techniques à ne pas reproduire

- `CityExplorerScene.ts` concentre plusieurs lieux et devrait être découpée progressivement.
- `startDialogue` prend un texte résolu alors que `setDialog` prend une clé.
- Certaines traductions historiques anglaises et arabes sont absentes et utilisent le fallback français.
- Certains composants React historiques ont encore des textes visibles en dur ; les externaliser lorsqu'ils sont modifiés.
- Les effets des consommables sont encore couplés à `InventoryHUD.tsx`.

Ne pas lancer une réécriture générale pour une petite fonctionnalité. Étendre l'existant par étapes cohérentes.

## 16. Prompt réutilisable

Après avoir fourni ce document à l'IA, utiliser :

```text
Tu travailles sur Maelström selon le contexte technique fourni.

Objectif : [décrire précisément la fonctionnalité].

Contraintes :
- appuie-toi sur les slices, helpers et composants existants ;
- ne crée aucun système parallèle ;
- aucun texte visible codé en dur ;
- ajoute les nouvelles clés dans fr.json, en.json et ar.json ;
- couvre save/load/reset pour tout nouvel état persistant ;
- n'utilise ni any ni @ts-ignore ;
- indique tous les fichiers à créer ou modifier ;
- fournis des fichiers complets ou des patchs applicables ;
- termine par les commandes et tests à exécuter.

Fichiers pertinents :
[coller ici les fichiers concernés]
```

Une IA textuelle ne voit pas le dépôt. Lui joindre au minimum les fichiers à modifier, `src/store/types.ts`, `src/store/useGameStore.ts` et les slices concernées. Pour une scène, joindre aussi `src/game/config.ts`, une scène similaire et les sections utiles des trois locales.
