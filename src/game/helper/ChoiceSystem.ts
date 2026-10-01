// src/game/helper/ChoiceSystem.ts

export type NarrativeAttitude = 'faith' | 'skepticism' | 'knowledge' | 'rest' | 'resistance';
export type NarrativeTendency = 'azathoth' | 'cthulhu' | 'undetermined';

export interface RecordedChoice {
    id: string;             // Identifiant unique du choix
    scene: string;          // Scène où le choix a été fait
    timestamp: number;      // Horodatage
    consequences: {
        lucidityDelta?: number;
        consciousnessDelta?: number;
        attitudeTag?: NarrativeAttitude;
        attitudeTags?: NarrativeAttitude[];
        customPayload?: string | number;
    };
    customPayload?: string | number;
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

    static getAttitudeScore(history: Record<string, RecordedChoice>, attitude: NarrativeAttitude): number {
        return Object.values(history).reduce((score, choice) => {
            const tags = new Set([
                ...(choice.consequences.attitudeTags ?? []),
                ...(choice.consequences.attitudeTag ? [choice.consequences.attitudeTag] : []),
            ]);
            return score + (tags.has(attitude) ? 1 : 0);
        }, 0);
    }

    static getNarrativeTendency(history: Record<string, RecordedChoice>): NarrativeTendency {
        const faith = this.getAttitudeScore(history, 'faith');
        const knowledge = this.getAttitudeScore(history, 'knowledge');
        const skepticism = this.getAttitudeScore(history, 'skepticism');
        const rest = this.getAttitudeScore(history, 'rest');
        const azathothReady = faith > 0 && knowledge > 0;
        const cthulhuReady = skepticism > 0 && rest > 0;

        if (azathothReady && !cthulhuReady) return 'azathoth';
        if (cthulhuReady && !azathothReady) return 'cthulhu';
        if (!azathothReady && !cthulhuReady) return 'undetermined';

        const azathothScore = faith + knowledge;
        const cthulhuScore = skepticism + rest;
        if (azathothScore === cthulhuScore) return 'undetermined';
        return azathothScore > cthulhuScore ? 'azathoth' : 'cthulhu';
    }
}
