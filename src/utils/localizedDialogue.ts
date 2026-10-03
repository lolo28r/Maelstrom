import i18n from '../i18n';

interface LocalizedDialogueEntry {
    speaker: string;
    text: string;
}

export const localizedDialogue = (key: string): Array<{ speaker: string; text: string }> => {
    const entries = i18n.t(key, { returnObjects: true }) as unknown;
    if (!Array.isArray(entries)) return [];
    return entries
        .filter((entry): entry is LocalizedDialogueEntry => (
            typeof entry === 'object'
            && entry !== null
            && typeof (entry as LocalizedDialogueEntry).speaker === 'string'
            && typeof (entry as LocalizedDialogueEntry).text === 'string'
        ))
        .map((entry) => ({ speaker: i18n.t(entry.speaker), text: entry.text }));
};
