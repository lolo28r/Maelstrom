import { StateCreator } from 'zustand';
import { GameState } from './useGameStore';

export interface DevSlice {
    devMode: boolean;
    toggleDevMode: () => void;
}

export const createDevSlice: StateCreator<GameState, [], [], DevSlice> = (set) => ({
    devMode: false,
    toggleDevMode: () => set((state) => {
        const next = !state.devMode;
        console.log(`%c[DEV MODE] ${next ? 'ACTIVÉ 🟢' : 'DÉSACTIVÉ 🔴'}`, 'background: #222; color: #bada55; padding: 4px;');
        return { devMode: next };
    }),
});