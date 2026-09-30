import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { InventorySlice } from './types';

export const createInventorySlice: StateCreator<GameState, [], [], InventorySlice> = (set, get) => ({
    inventory: [],
    selectedItem: null,
    isInventoryLocked: true,

    setSelectedItem: (item) => set({ selectedItem: item }),
    addItem: (item) => set((state) => {
        const existingIndex = state.inventory.findIndex((entry) => entry.id === item.id);
        const isStackable = item.stackable !== false;

        if (existingIndex !== -1 && isStackable) {
            const inventory = [...state.inventory];
            const quantity = inventory[existingIndex].quantity ?? 1;
            inventory[existingIndex] = {
                ...inventory[existingIndex],
                quantity: quantity + (item.quantity ?? 1),
            };
            return { inventory };
        }

        return { inventory: [...state.inventory, { ...item, quantity: item.quantity ?? 1 }] };
    }),
    removeItem: (itemId) => set((state) => {
        const item = state.inventory.find((entry) => entry.id === itemId);
        if (!item) return {};

        const quantity = item.quantity ?? 1;
        if (quantity > 1) {
            const inventory = state.inventory.map((entry) =>
                entry.id === itemId ? { ...entry, quantity: quantity - 1 } : entry
            );
            return {
                inventory,
                selectedItem: state.selectedItem?.id === itemId
                    ? { ...state.selectedItem, quantity: quantity - 1 }
                    : state.selectedItem,
            };
        }

        return {
            inventory: state.inventory.filter((entry) => entry.id !== itemId),
            selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
        };
    }),
    removeItemFromInventory: (itemId) => get().removeItem(itemId),
    setInventoryLocked: (locked) => set({ isInventoryLocked: locked }),
});
