// src/game/helper/ChoiceSystem.ts

export interface RecordedChoice {
    id: string;             // Identifiant unique du choix
    scene: string;          // Scène où le choix a été fait
    timestamp: number;      // Horodatage
    consequences: {
        mentalDelta?: number;
        exhaustionDelta?: number;
        consciousnessDelta?: number;
        customPayload?: string | number;
    };
    customPayload?: string | number; // Supporte aussi la racine si besoin
}

export class ChoiceSystem {
    static hasMade(history: Record<string, RecordedChoice>, choiceId: string): boolean {
        return !!history[choiceId];
    }

    static getChoiceDetails(history: Record<string, RecordedChoice>, choiceId: string): RecordedChoice | undefined {
        return history[choiceId];
    }

    static countChoicesWithPrefix(history: Record<string, RecordedChoice>, prefix: string): number {
        return Object.keys(history).filter(id => id.startsWith(prefix)).length;
    }
}