import React, { useState } from 'react';
import { useGameStore, Item } from '../store/useGameStore';
import './InventoryHUD.css';

export const InventoryHUD: React.FC = () => {
    const inventory = useGameStore((state) => state.inventory);
    const selectedItem = useGameStore((state) => state.selectedItem);
    const setSelectedItem = useGameStore((state) => state.setSelectedItem);
    const isInventoryLocked = useGameStore((state) => state.isInventoryLocked); // <-- Récupération du verrou

    const modifyStat = useGameStore((state) => state.modifyStat);
    const removeItemFromInventory = useGameStore((state) => state.removeItemFromInventory);
    const setStatusRevealed = useGameStore((state) => state.setStatusRevealed);
    const setDialog = useGameStore((state) => state.setDialog);

    const [isOpen, setIsOpen] = useState(false);
    const [examiningItem, setExaminingItem] = useState<Item | null>(null);

    const totalItemCount = inventory.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // Consommation d'un vice (Whisky ou Tabac)
    const handleUseSubstance = (e: React.MouseEvent, item: Item) => {
        e.stopPropagation();

        if (item.id === 'whisky') {
            // Comportement du Whisky : Soin mental immédiat + contre-coup d'épuisement
            modifyStat('mental', 15);

            setTimeout(() => {
                modifyStat('exhaustion', 10);
            }, 1500);

            updateInventoryAfterUse(item);

        } else if (item.id === 'tobacco') {
            modifyStat('mental', 15);
            modifyStat('exhaustion', 10);

            setExaminingItem(null);
            setIsOpen(false);

            // 1. D'abord les dialogues du rituel
            setDialog({
                speaker: 'LAURENCE LINDNER',
                textKey: 'intro.tobacco_ritual_steps',
                type: 'bottom',
                onComplete: () => {
                    // 2. Juste après les dialogues, on joue le SFX de fumée
                    try {
                        const baseUrl = import.meta.env.BASE_URL;
                        const smokeAudio = new Audio(`${baseUrl}assets/smokeVFX.mp3`);
                        smokeAudio.volume = 0.4;
                        smokeAudio.play().catch(err => console.warn("Audio bloqué :", err));
                    } catch (e) {
                        console.warn("Erreur lecture SFX fumée :", e);
                    }

                    // 3. On active la cinématique de fumée (background + jauges révélées)
                    useGameStore.getState().setSmokingActive(true);
                    setStatusRevealed(true);
                }
            });

            updateInventoryAfterUse(item);
        }
    };

    // Utilitaire de mise à jour des quantités de l'objet consommé
    const updateInventoryAfterUse = (item: Item) => {
        const currentQty = item.quantity || 1;
        if (currentQty > 1) {
            setExaminingItem({ ...item, quantity: currentQty - 1 });
        } else {
            setExaminingItem(null);
        }
        removeItemFromInventory(item.id);
    };

    const baseUrl = import.meta.env.BASE_URL;

    return (
        <>
            {/* Bouton Sacoche */}
            <div className="inventory-toggle-wrapper">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isInventoryLocked) return; // Empêche l'ouverture si verrouillé
                        setIsOpen(!isOpen);
                    }}
                    className={`inventory-toggle-btn ${isOpen ? 'active' : ''} ${isInventoryLocked ? 'locked' : ''}`}
                    title={isInventoryLocked ? "La sacoche est verrouillée pour l'instant..." : "Ouvrir la sacoche"}
                    style={{ opacity: isInventoryLocked ? 0.4 : 1, cursor: isInventoryLocked ? 'not-allowed' : 'pointer' }}
                >
                    <img src={`${baseUrl}assets/inventory.png`} alt="Sacoche d'archiviste" className="satchel-icon" />
                    {!isInventoryLocked && totalItemCount > 0 && <span className="inventory-count">{totalItemCount}</span>}
                </button>
            </div>

            {/* Tiroir d'Inventaire (Masqué si verrouillé ou fermé) */}
            {isOpen && !isInventoryLocked && (
                <div className="inventory-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="inventory-header">
                        <span className="inventory-title">SACOCHE D'ARCHIVISTE</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="close-btn"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="inventory-slots-grid">
                        {inventory.length === 0 ? (
                            <p className="empty-inventory-text">La sacoche est vide...</p>
                        ) : (
                            inventory.map((item) => {
                                const isSelected = selectedItem?.id === item.id;
                                const qty = item.quantity || 1;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItem(isSelected ? null : item);
                                            setExaminingItem(item);
                                        }}
                                        className={`inventory-slot ${isSelected ? 'selected' : ''}`}
                                    >
                                        {item.icon.endsWith('.png') ? (
                                            <img src={item.icon} alt={item.name} className="item-sprite" />
                                        ) : (
                                            <span className="item-emoji">{item.icon}</span>
                                        )}

                                        {qty > 1 && <span className="item-quantity-badge">x{qty}</span>}
                                        <span className="item-tooltip">{item.name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Modale d'Examen */}
            {examiningItem && (
                <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="archivist-card" onClick={(e) => e.stopPropagation()}>
                        <div className="card-header">
                            <span className="card-tag">EXAMEN D'OBJET</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExaminingItem(null);
                                }}
                                className="close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="card-body">
                            <div className="item-preview-box">
                                {examiningItem.icon.endsWith('.png') ? (
                                    <img src={examiningItem.icon} alt={examiningItem.name} />
                                ) : (
                                    <span>{examiningItem.icon}</span>
                                )}
                            </div>
                            <div className="item-meta">
                                <h3 className="item-title">
                                    {examiningItem.name}
                                    {(examiningItem.quantity || 1) > 1 && ` (x${examiningItem.quantity})`}
                                </h3>
                                <p className="item-desc">{examiningItem.description}</p>
                            </div>
                        </div>

                        <div className="card-notes">
                            <p>{examiningItem.examineText}</p>
                        </div>

                        <div className="card-actions">
                            {(examiningItem.consumable || examiningItem.id === 'whisky' || examiningItem.id === 'tobacco') && (
                                <button
                                    onClick={(e) => handleUseSubstance(e, examiningItem)}
                                    className="action-btn consume-btn"
                                >
                                    {examiningItem.id === 'whisky' ? 'BOIRE UNE GORGÉE' : 'ROULER UNE CIGARETTE'}
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExaminingItem(null);
                                }}
                                className="action-btn close-action"
                            >
                                RERANGER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};