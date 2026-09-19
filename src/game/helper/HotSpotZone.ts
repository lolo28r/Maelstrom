import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

interface HotspotConfig {
    scene: Phaser.Scene;
    x: number; // Center X
    y: number; // Center Y
    width: number;
    height: number;
    type: 'path' | 'inspect';
    actionLabel?: string;
    onClick: () => void;
}

export class HotspotZone {
    private zone: Phaser.GameObjects.Zone;
    private tooltipText?: Phaser.GameObjects.Text;
    private scene: Phaser.Scene;
    // Keep track of raw size/position based on origin 0.5,0.5 for easier math
    private zoneX: number;
    private zoneY: number;
    private currentW: number;
    private currentH: number;

    private debugGraphics: Phaser.GameObjects.Graphics;
    private debugText: Phaser.GameObjects.Text;
    private unsubscribeStore?: () => void;
    private wheelListener?: (pointer: Phaser.Input.Pointer, over: any[], deltaX: number, deltaY: number) => void;

    constructor(config: HotspotConfig) {
        const { scene, x, y, width, height, type, actionLabel, onClick } = config;
        this.scene = scene;
        this.zoneX = x;
        this.zoneY = y;
        this.currentW = width;
        this.currentH = height;

        // Zone creation (Phaser Zones default origin is 0.5, 0.5)
        this.zone = scene.add.zone(x, y, width, height)
            .setInteractive({ useHandCursor: false, draggable: true });

        const canvas = scene.game.canvas;
        const cursorClass = type === 'path' ? 'cursor-path' : 'cursor-inspect';

        if (actionLabel) {
            this.tooltipText = scene.add.text(x, y - height / 2, `[ ${actionLabel} ]`, {
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

        // Abonnement en temps réel au store
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
        this.zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (useGameStore.getState().devMode) return;
            if (this.isInteractionBlocked()) return;
            canvas.classList.remove('cursor-path', 'cursor-inspect');
            if (this.tooltipText) this.tooltipText.setAlpha(0);
            onClick();
        });

        // --- GESTION DU DRAG & DROP (MODE DEV) ---
        this.zone.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (!useGameStore.getState().devMode) return;

            // Snap to grid could be added here if needed
            this.zoneX = Math.round(dragX);
            this.zoneY = Math.round(dragY);

            this.zone.setPosition(this.zoneX, this.zoneY);

            if (this.tooltipText) {
                this.tooltipText.setPosition(this.zoneX, this.zoneY - this.currentH / 2);
            }
            this.updateDebugVisuals(true);
        });

        // --- REDIMENSIONNEMENT (MODE DEV) ---
        this.wheelListener = (pointer: Phaser.Input.Pointer, over: any[], deltaX: number, deltaY: number) => {
            if (!useGameStore.getState().devMode) return;

            const bounds = this.zone.getBounds();
            if (bounds.contains(pointer.x, pointer.y)) {
                // Stop propogation so page doesn't scroll
                if (pointer.event.cancelable) {
                    pointer.event.preventDefault();
                }

                const isAltPressed = (pointer.event as WheelEvent).altKey;
                const isShiftPressed = (pointer.event as WheelEvent).shiftKey; // Keep shift for faster resize if wanted

                const step = isShiftPressed ? 50 : 10;
                const delta = deltaY < 0 ? step : -step;

                if (isAltPressed) {
                    this.extendFromEdges(pointer, delta);
                } else {
                    this.resizeFromCenter(delta);
                }

                this.updateDebugVisuals(true);
            }
        };
        scene.input.on('wheel', this.wheelListener);
    }

    /**
     * Existing behavior: Expands/Shrinks equally in all directions.
     */
    private resizeFromCenter(delta: number) {
        this.currentW = Math.max(20, this.currentW + delta);
        this.currentH = Math.max(20, this.currentH + delta);
        this.zone.setSize(this.currentW, this.currentH);

        if (this.tooltipText) {
            this.tooltipText.setPosition(this.zoneX, this.zoneY - this.currentH / 2);
        }
    }

    /**
     * NEW: Detects which edge/corner is closest to mouse and extends only that side.
     */
    private extendFromEdges(pointer: Phaser.Input.Pointer, delta: number) {
        const bounds = this.zone.getBounds();

        // Determine proximity to edges (normalized to 0-1 across the width/height)
        const px = (pointer.x - bounds.left) / bounds.width;
        const py = (pointer.y - bounds.top) / bounds.height;

        let growingRight = false;
        let growingLeft = false;
        let growingBottom = false;
        let growingTop = false;

        // Threshold to determine if it's a corner or a flat edge (0.33 of the way)
        const threshold = 0.33;

        if (px > 1 - threshold) growingRight = true;
        if (px < threshold) growingLeft = true;
        if (py > 1 - threshold) growingBottom = true;
        if (py < threshold) growingTop = true;

        // Fallback: if strictly in the middle, default to right/bottom
        if (!growingLeft && !growingRight) growingRight = true;
        if (!growingTop && !growingBottom) growingBottom = true;

        // --- Apply Width Change ---
        if (growingRight && !growingLeft) {
            // Extend Right, Keep Left still
            const newW = Math.max(20, this.currentW + delta);
            const diff = newW - this.currentW;
            this.zoneX += diff / 2;
            this.currentW = newW;
        } else if (growingLeft && !growingRight) {
            // Extend Left, Keep Right still
            const newW = Math.max(20, this.currentW + delta);
            const diff = newW - this.currentW;
            this.zoneX -= diff / 2;
            this.currentW = newW;
        } else if (growingLeft && growingRight) {
            // Edge case, just resize center
            this.currentW = Math.max(20, this.currentW + delta);
        }

        // --- Apply Height Change ---
        if (growingBottom && !growingTop) {
            // Extend Bottom, Keep Top still
            const newH = Math.max(20, this.currentH + delta);
            const diff = newH - this.currentH;
            this.zoneY += diff / 2;
            this.currentH = newH;
        } else if (growingTop && !growingBottom) {
            // Extend Top, Keep Bottom still
            const newH = Math.max(20, this.currentH + delta);
            const diff = newH - this.currentH;
            this.zoneY -= diff / 2;
            this.currentH = newH;
        } else if (growingTop && growingBottom) {
            // Edge case, just resize center
            this.currentH = Math.max(20, this.currentH + delta);
        }

        // Apply new pos/size to Zone
        this.zone.setPosition(this.zoneX, this.zoneY);
        this.zone.setSize(this.currentW, this.currentH);

        // Update Tooltip position
        if (this.tooltipText) {
            this.tooltipText.setPosition(this.zoneX, this.zoneY - this.currentH / 2);
        }
    }

    private updateDebugVisuals(isDev: boolean) {
        this.debugGraphics.clear();

        if (isDev) {
            this.debugText.setVisible(true);
            if (this.tooltipText) this.tooltipText.setAlpha(0);

            this.debugGraphics.lineStyle(2, 0xff00ff, 0.9);
            this.debugGraphics.fillStyle(0xff00ff, 0.25);

            // Zone is centered at x,y
            const rx = this.zoneX - this.currentW / 2;
            const ry = this.zoneY - this.currentH / 2;

            this.debugGraphics.fillRect(rx, ry, this.currentW, this.currentH);
            this.debugGraphics.strokeRect(rx, ry, this.currentW, this.currentH);

            // Draw a tiny crosshair at the exact center point
            this.debugGraphics.lineStyle(1, 0xffffff);
            this.debugGraphics.lineBetween(this.zoneX - 5, this.zoneY, this.zoneX + 5, this.zoneY);
            this.debugGraphics.lineBetween(this.zoneX, this.zoneY - 5, this.zoneX, this.zoneY + 5);

            this.debugText.setPosition(this.zoneX, ry - 4);
            this.debugText.setText(`x: ${Math.round(this.zoneX)}, y: ${Math.round(this.zoneY)} | w: ${this.currentW}, h: ${this.currentH}`);

            // Log to console for easy copying into static configs
            // console.log(`[HITBOX] x: ${Math.round(this.zoneX)}, y: ${Math.round(this.zoneY)}, w: ${this.currentW}, h: ${this.currentH}`);
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
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
        if (this.debugText) {
            this.debugText.destroy();
        }
    }
}