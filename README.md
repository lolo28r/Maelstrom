# Maelström

Jeu narratif web développé avec Phaser, React, Zustand, TypeScript et i18next.

## Documentation technique

Le guide [Contexte technique pour une IA textuelle](docs/AI_TECHNICAL_CONTEXT.md) décrit l'architecture, les conventions et les procédures d'implantation du projet. Il peut être copié dans une conversation avec une IA qui n'a pas accès au dépôt.

La documentation de conception est séparée en deux références :

- [Jauges, choix et dialogues](docs/GAMEPLAY_JAUGES_ET_DIALOGUES.md) ;
- [Bible narrative](docs/BIBLE_NARRATIVE.md).

## Commandes

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Architecture résumée

- `src/game/scenes` : scènes Phaser ;
- `src/components` : HUD et interfaces React ;
- `src/store` : état Zustand découpé en slices ;
- `src/locales` : textes français, anglais et arabes ;
- `src/game/helper` : helpers d'interaction et système de choix.
