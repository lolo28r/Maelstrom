import { create } from 'zustand';

export const useGameStore = create((set) => ({
  consciousness: 0, // Ta jauge de Conscience Cosmique (0 à 100)
  currentScene: 'MainMenu',
  inventory: [],
  codex: [],
  
  // Fonction pour incrémenter la conscience (bloquée à 100 max)
  increaseConsciousness: (amount) => set((state) => ({ 
    consciousness: Math.min(state.consciousness + amount, 100) 
  })),
  
  // Fonction pour changer de scène
  setScene: (sceneName) => set({ currentScene: sceneName }),
}));