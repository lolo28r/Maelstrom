import React, { useState } from 'react';
import { useGameStore, Item } from '../store/useGameStore';
import './InventoryHUD.css';

export const InventoryHUD: React.FC = () => {
    const inventory = useGameStore((state) => state.inventory);
    const selectedItem = useGameStore((state) => state.selectedItem);
    const setSelectedItem = useGameStore((state) => state.setSelectedItem);

    // Récupération directe de modifyStat pour enchaîner les modifications de jauges
    const modifyStat = useGameStore((state) => state.modifyStat);
    const removeItemFromInventory = useGameStore((state) => state.removeItemFromInventory);

    const [isOpen, setIsOpen] = useState(false);
    const [examiningItem, setExaminingItem] = useState<Item | null>(null);

    // Nombre d'emplacements occupés en comptant le cumul
    const totalItemCount = inventory.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // Consommation d'un vice (Whisky / Tabac) avec blocage de propagation
    const handleUseSubstance = (e: React.MouseEvent, item: Item) => {
        // Bloque le clic pour qu'il ne traverse pas vers la scène Phaser
        e.stopPropagation();

        if (item.consumable || item.id === 'whisky' || item.id === 'tobacco') {

            // 1. Hausse de la Santé Mentale (+15)
            modifyStat('mental', 15);

            // 2. Décalage de 1.5s pour la hausse de l'Épuisement (+10)
            setTimeout(() => {
                modifyStat('exhaustion', 10);
            }, 1500);

            // Mise à jour de la quantité en cours d'examen
            const currentQty = item.quantity || 1;
            if (currentQty > 1) {
                setExaminingItem({ ...item, quantity: currentQty - 1 });
            } else {
                setExaminingItem(null);
            }

            removeItemFromInventory(item.id);
        }
    };

    return (
        <>
            {/* Bouton Sacoche */}
            <div className="inventory-toggle-wrapper">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className={`inventory-toggle-btn ${isOpen ? 'active' : ''}`}
                    title="Ouvrir la sacoche"
                >
                    <img src="/assets/inventory.png" alt="Sacoche d'archiviste" className="satchel-icon" />
                    {totalItemCount > 0 && <span className="inventory-count">{totalItemCount}</span>}
                </button>
            </div>

            {/* Tiroir d'Inventaire */}
            {isOpen && (
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

                                        {/* Badge de quantité (ex: x2) */}
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