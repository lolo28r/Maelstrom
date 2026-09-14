import React, { useState } from 'react';
import { useGameStore, Item } from '../store/useGameStore';
import './InventoryHUD.css';

export const InventoryHUD: React.FC = () => {
  const inventory = useGameStore((state) => state.inventory);
  const selectedItem = useGameStore((state) => state.selectedItem);
  const setSelectedItem = useGameStore((state) => state.setSelectedItem);
  const startDialogue = useGameStore((state) => state.startDialogue);
  const [examiningItem, setExaminingItem] = useState<Item | null>(null);

  if (inventory.length === 0) return null;

  return (
    <>
      {/* Bottom Inventory Bar */}
      <div className="inventory-bar-container">
        <span className="text-10px text-cyan-400 font-bold tracking-widest px-2 border-r border-cyan-500/30">
          INVENTAIRE
        </span>

        <div className="flex items-center gap-2">
          {inventory.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(isSelected ? null : item);
                  setExaminingItem(item);
                }}
                className={`inventory-slot-btn ${isSelected ? 'inventory-slot-selected' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>

                {/* Tooltip */}
                <div className="absolute bottom-14 left-1-2 -translate-x-1-2 hidden group-hover:block bg-slate-950 border border-cyan-500/40 text-cyan-300 text-11px px-2 py-1 whitespace-nowrap z-40 pointer-events-none">
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Examination Modal */}
      {examiningItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="vector-border p-6 max-w-md w-full bg-slate-950 font-tech space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-cyan-500/30">
              <span className="text-xs text-cyan-400 font-bold tracking-widest">
                EXAMEN D'OBJET
              </span>
              <button
                onClick={() => setExaminingItem(null)}
                className="text-slate-400 hover:text-cyan-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-3xl">
                {examiningItem.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-cyan-300 font-typewriter">
                  {examiningItem.name}
                </h3>
                <p className="text-xs text-slate-400">{examiningItem.description}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-typewriter leading-relaxed">
              {examiningItem.examineText}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const item = examiningItem;
                  setExaminingItem(null);
                  startDialogue({
                    speaker: 'EXAMEN',
                    text: item.examineText,
                  });
                }}
                className="px-4 py-2 bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs hover:bg-cyan-900 font-bold"
              >
                LIRE / INSPECTER
              </button>
              <button
                onClick={() => setExaminingItem(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
