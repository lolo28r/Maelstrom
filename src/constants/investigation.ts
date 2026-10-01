import type { InvestigationFragment } from '../store/types';

export interface ConnectionDefinition {
    id: string;
    requiredFragmentIds: [string, string];
    status: 'fact' | 'hypothesis';
    titleKey: string;
    contentKey: string;
    consciousnessReward: number;
}

export const INVESTIGATION_FRAGMENTS: Record<string, InvestigationFragment> = {
    asylum_letter_decline: { id: 'asylum_letter_decline', kind: 'document', titleKey: 'investigation.fragments.asylum_letter_decline.title', contentKey: 'investigation.fragments.asylum_letter_decline.content', sourceKey: 'investigation.sources.asylum_letter' },
    dream1_unknown_entity: { id: 'dream1_unknown_entity', kind: 'vision', titleKey: 'investigation.fragments.dream1_unknown_entity.title', contentKey: 'investigation.fragments.dream1_unknown_entity.content', sourceKey: 'investigation.sources.dream' },
    father_forgot_name_at_station: { id: 'father_forgot_name_at_station', kind: 'memory', titleKey: 'investigation.fragments.father_forgot_name_at_station.title', contentKey: 'investigation.fragments.father_forgot_name_at_station.content', sourceKey: 'investigation.sources.memory' },
    bell_change_1921: { id: 'bell_change_1921', kind: 'testimony', titleKey: 'investigation.fragments.bell_change_1921.title', contentKey: 'investigation.fragments.bell_change_1921.content', sourceKey: 'investigation.sources.bell' },
    bell_changed_behavior: { id: 'bell_changed_behavior', kind: 'testimony', titleKey: 'investigation.fragments.bell_changed_behavior.title', contentKey: 'investigation.fragments.bell_changed_behavior.content', sourceKey: 'investigation.sources.bell' },
    bell_mind_ownership_question: { id: 'bell_mind_ownership_question', kind: 'testimony', titleKey: 'investigation.fragments.bell_mind_ownership_question.title', contentKey: 'investigation.fragments.bell_mind_ownership_question.content', sourceKey: 'investigation.sources.bell' },
    bell_retained_scholarship: { id: 'bell_retained_scholarship', kind: 'testimony', titleKey: 'investigation.fragments.bell_retained_scholarship.title', contentKey: 'investigation.fragments.bell_retained_scholarship.content', sourceKey: 'investigation.sources.bell' },
    street_cult_rumor: { id: 'street_cult_rumor', kind: 'testimony', titleKey: 'investigation.fragments.street_cult_rumor.title', contentKey: 'investigation.fragments.street_cult_rumor.content', sourceKey: 'investigation.sources.rumor' },
    dream_eclipse_vision: { id: 'dream_eclipse_vision', kind: 'vision', titleKey: 'investigation.fragments.dream_eclipse_vision.title', contentKey: 'investigation.fragments.dream_eclipse_vision.content', sourceKey: 'investigation.sources.dream' },
};

export const NIGHTMARE_CONNECTIONS: ConnectionDefinition[] = [
    {
        id: 'father_changed_around_1921',
        requiredFragmentIds: ['father_forgot_name_at_station', 'bell_change_1921'],
        status: 'fact',
        titleKey: 'investigation.connections.father_changed_around_1921.title',
        contentKey: 'investigation.connections.father_changed_around_1921.content',
        consciousnessReward: 0,
    },
    {
        id: 'scholarship_without_recognition',
        requiredFragmentIds: ['father_forgot_name_at_station', 'bell_retained_scholarship'],
        status: 'hypothesis',
        titleKey: 'investigation.connections.scholarship_without_recognition.title',
        contentKey: 'investigation.connections.scholarship_without_recognition.content',
        consciousnessReward: 5,
    },
];
