// src/constants/gameChoices.ts

export const CHOICES = {
    // Acte 1 / Rêve avec Nyarlathotep
    NYARL_ACCEPT_TRUTH: 'nyarl_accept_truth',
    NYARL_REJECT_SANITY: 'nyarl_reject_sanity',

    // Tu pourras ajouter tes futurs choix ici au fil du développement
    // OFFICE_BURN_LETTER: 'office_burn_letter',
} as const;

export type ChoiceId = typeof CHOICES[keyof typeof CHOICES];