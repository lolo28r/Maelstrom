import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export class CityExplorerScene extends Phaser.Scene {
    private isTransitioning: boolean = true;
    private transitionBg!: Phaser.GameObjects.Image;
    private streetBg!: Phaser.GameObjects.Image;
    private textOverlay!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    preload() {
        // Chargement de tes assets déplacés dans le dossier assets
        this.load.image('sortie', 'assets/sortie.png');
        this.load.image('ville1Tobacco', 'assets/ville1Tobacco.png');
    }

    create() {
        const { width, height } = this.scale;

        // --- ÉTAPE 1 : Affichage de l'écran de transition d'errance ---
        this.transitionBg = this.add.image(width / 2, height / 2, 'sortie').setDisplaySize(width, height);

        // Boîte de dialogue narrative de transition
        this.createNarrativeBox(width, height,
            "Le froid piquant de ce 20 janvier fige l’air d'Arkham. Guidé par une étrange compulsion au milieu des ruelles embrumées, les pas de Laurence le mènent machinalement devant la vitrine givrée d'un vieux bureau de tabac..."
        );
    }

    private createNarrativeBox(width: number, height: number, text: string) {
        this.textOverlay = this.add.container(0, 0);

        // Fond sombre semi-transparent pour le texte
        const bg = this.add.rectangle(width / 2, height - 120, width - 200, 140, 0x000000, 0.85)
            .setInteractive()
            .on('pointerdown', () => this.endTransition()); // Clic pour passer au décor principal

        const narrativeText = this.add.text(width / 2, height - 130, text, {
            fontFamily: 'serif',
            fontSize: '18px',
            color: '#f4ebd0',
            align: 'center',
            wordWrap: { width: width - 240 }
        }).setOrigin(0.5);

        const promptText = this.add.text(width / 2, height - 70, "[ Cliquer pour continuer ]", {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#a89f85'
        }).setOrigin(0.5);

        this.textOverlay.add([bg, narrativeText, promptText]);
    }

    private endTransition() {
        if (!this.isTransitioning) return;
        this.isTransitioning = false;

        // Nettoyage de l'écran de transition
        this.transitionBg.destroy();
        this.textOverlay.destroy();

        const { width, height } = this.scale;

        // --- ÉTAPE 2 : Affichage du décor principal de la rue (ville1Tobacco) ---
        this.streetBg = this.add.image(width / 2, height / 2, 'ville1Tobacco').setDisplaySize(width, height);

        // --- ÉTAPE 3 : Création des Hotspots Invisibles pour les interactions ---

        // 1. Hotspot du Bureau de Tabac (situé à gauche sur ton image)
        const tobaccoZone = this.add.zone(width * 0.25, height * 0.5, 250, 350)
            .setInteractive({ useHandCursor: true });

        tobaccoZone.on('pointerdown', () => {
            this.handleTobaccoInteraction();
        });

        // 2. Hotspot de la ruelle / façade latérale à droite (pour plus tard ou pour looter l'alcool clandestin)
        const alleyZone = this.add.zone(width * 0.78, height * 0.6, 200, 300)
            .setInteractive({ useHandCursor: true });

        alleyZone.on('pointerdown', () => {
            this.handleAlleyInteraction();
        });
    }

    private handleTobaccoInteraction() {
        const store = useGameStore.getState();

        // Exemple d'action : Ajout d'une note au journal et d'un élément d'inventaire
        store.addJournalNote(
            "Acquisition de tabac",
            "La boutique sent la poussière et le vieux papier. Le marchand m'a vendu un paquet de cigarettes sans un mot, le regard fuyant vers le ciel laiteux d'Arkham.",
            "20 Jan. 1925 — Matin"
        );

        // Notification visuelle rapide ou pensée de Laurence
        console.log("Tabac acquis ! Le stock de Laurence est garni.");

        // Optionnel : Désactiver la zone pour ne pas looter en boucle
        // tobaccoZone.disableInteractive();
    }

    private handleAlleyInteraction() {
        const store = useGameStore.getState();

        // Exemple pour l'alcool de contrebande / ruelle
        store.addJournalNote(
            "Ruelle de l'Ulcère",
            "Derrière la porte dérobée de la ruelle, j'ai pu récupérer une bouteille de whisky de contrebande auprès d'un contact tremblant. De quoi réchauffer ce fichu mois de janvier.",
            "20 Jan. 1925 — Matin"
        );

        console.log("Alcool de contrebande récupéré.");
    }
}