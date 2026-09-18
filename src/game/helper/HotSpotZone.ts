import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

interface HotspotConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'path' | 'inspect'; // 'path' = flèche (chemin), 'inspect' = loupe (objet)
    actionLabel?: string;     // Optionnel si tu veux un tooltip texte comme ton InteractiveObject
    onClick: () => void;
}

export class HotspotZone {
    private zone: Phaser.GameObjects.Zone;
    private tooltipText?: Phaser.GameObjects.Text;
    private scene: Phaser.Scene;
    private currentW: number;
    private currentH: number;
    private debugGraphics: Phaser.GameObjects.Graphics;
    private debugText: Phaser.GameObjects.Text;
    private unsubscribeStore?: () => void;
    private wheelListener?: (pointer: Phaser.Input.Pointer, over: any[], deltaX: number, deltaY: number) => void;

    constructor(config: HotspotConfig) {
        const { scene, x, y, width, height, type, actionLabel, onClick } = config;
        this.scene = scene;
        this.currentW = width;
        this.currentH = height;

        // Création de la zone invisible interactive (avec support draggable pour le mode dev)
        this.zone = scene.add.zone(x, y, width, height)
            .setInteractive({ useHandCursor: false, draggable: true });

        const canvas = scene.game.canvas;
        const cursorClass = type === 'path' ? 'cursor-path' : 'cursor-inspect';

        if (actionLabel) {
            this.tooltipText = scene.add.text(x, y, `[ ${actionLabel} ]`, {
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '16px',
                color: '#f4ebd0',
                backgroundColor: '#020408cc',
                padding: { x: 6, y: 2 }
            }).setOrigin(0.5, 1).setAlpha(0).setDepth(1000);
        }

        // --- GRAPHICS & TEXTE DE DÉBUG (MODE DEV) ---
        this.debugGraphics = scene.add.graphics().setDepth(9998);
        this.debugText = scene.add.text(x, y - height / 2 - 12, '', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#ff00ff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5, 1).setDepth(9999);

        // Applique l'état initial du mode dev
        this.updateDebugVisuals(useGameStore.getState().devMode);

        // Abonnement en temps réel au store (détecte le "1937" instantanément)
        this.unsubscribeStore = useGameStore.subscribe((state) => {
            this.updateDebugVisuals(state.devMode);
        });

        // Événement Survol
        this.zone.on('pointerover', () => {
            if (useGameStore.getState().devMode) return;
            if (this.isInteractionBlocked()) return;
            canvas.classList.add(cursorClass);
            if (this.tooltipText) this.tooltipText.setAlpha(1);
        });

        // Événement Sortie de zone
        this.zone.on('pointerout', () => {
            if (useGameStore.getState().devMode) return;
            canvas.classList.remove('cursor-path', 'cursor-inspect');
            if (this.tooltipText) this.tooltipText.setAlpha(0);
        });

        // Événement Clic
        this.zone.on('pointerdown', () => {
            if (useGameStore.getState().devMode) return; // Laisse la priorité au déplacement en mode dev
            if (this.isInteractionBlocked()) return;
            canvas.classList.remove('cursor-path', 'cursor-inspect');
            if (this.tooltipText) this.tooltipText.setAlpha(0);
            onClick();
        });

        // --- GESTION DU DRAG & DROP (MODE DEV) ---
        this.zone.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (!useGameStore.getState().devMode) return;

            this.zone.x = Math.round(dragX);
            this.zone.y = Math.round(dragY);
            if (this.tooltipText) {
                this.tooltipText.setPosition(this.zone.x, this.zone.y);
            }
            this.updateDebugVisuals(true);
        });

        // --- REDIMENSIONNEMENT À LA MOLETTE (MODE DEV) ---
        this.wheelListener = (pointer: Phaser.Input.Pointer, over: any[], deltaX: number, deltaY: number) => {
            if (!useGameStore.getState().devMode) return;

            const bounds = this.zone.getBounds();
            if (bounds.contains(pointer.x, pointer.y)) {
                const isShiftPressed = (pointer.event as WheelEvent).shiftKey;

                if (isShiftPressed) {
                    this.currentH = Math.max(20, this.currentH + (deltaY < 0 ? 10 : -10));
                } else {
                    this.currentW = Math.max(20, this.currentW + (deltaY < 0 ? 10 : -10));
                }
                this.zone.setSize(this.currentW, this.currentH);
                this.updateDebugVisuals(true);
            }
        };
        scene.input.on('wheel', this.wheelListener);
    }

    private updateDebugVisuals(isDev: boolean) {
        this.debugGraphics.clear();

        if (isDev) {
            this.debugText.setVisible(true);
            if (this.tooltipText) this.tooltipText.setAlpha(0);

            // Dessin de la hitbox en mode dev (Rose fluo)
            this.debugGraphics.lineStyle(2, 0xff00ff, 0.9);
            this.debugGraphics.fillStyle(0xff00ff, 0.25);

            const rx = this.zone.x - this.currentW / 2;
            const ry = this.zone.y - this.currentH / 2;

            this.debugGraphics.fillRect(rx, ry, this.currentW, this.currentH);
            this.debugGraphics.strokeRect(rx, ry, this.currentW, this.currentH);

            this.debugText.setPosition(this.zone.x, ry - 4);
            this.debugText.setText(`x: ${Math.round(this.zone.x)}, y: ${Math.round(this.zone.y)} | w: ${this.currentW}, h: ${this.currentH}`);

            console.log(`[HITBOX] x: ${Math.round(this.zone.x)}, y: ${Math.round(this.zone.y)}, width: ${this.currentW}, height: ${this.currentH}`);
        } else {
            this.debugText.setVisible(false);
        }
    }

    private isInteractionBlocked(): boolean {
        const store = useGameStore.getState() as any;
        if (
            store.currentDialog ||
            store.isDialogueActive ||
            store.activeDocument ||
            store.selectedItem !== null
        ) {
            return true;
        }
        return false;
    }

    public setVisible(visible: boolean) {
        if (!visible) {
            this.zone.disableInteractive();
        } else {
            this.zone.setInteractive({ useHandCursor: false, draggable: true });
        }
        if (this.tooltipText) {
            this.tooltipText.setVisible(visible);
        }
    }

    public destroy() {
        if (this.unsubscribeStore) this.unsubscribeStore();
        if (this.wheelListener) {
            this.scene.input.off('wheel', this.wheelListener);
        }
        this.zone.destroy();
        if (this.tooltipText) {
            this.tooltipText.destroy();
        }
        if (this.debugGraphics) this.debugGraphics.destroy();
        if (this.debugText) this.debugText.destroy();
    }
}