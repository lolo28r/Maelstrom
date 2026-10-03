import type { InvestigationFragment } from '../store/types';

export interface ConnectionDefinition {
    id: string;
    requiredFragmentIds: string[];
    status: 'fact' | 'hypothesis';
    titleKey: string;
    contentKey: string;
    consciousnessReward: number;
    scope?: 'nightmare' | 'day2';
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
    asylum_sealed_room: { id: 'asylum_sealed_room', kind: 'observation', titleKey: 'day2.fragments.sealedRoom.title', contentKey: 'day2.fragments.sealedRoom.content', sourceKey: 'day2.sources.asylum' },
    asylum_room_undisturbed: { id: 'asylum_room_undisturbed', kind: 'observation', titleKey: 'day2.fragments.undisturbedRoom.title', contentKey: 'day2.fragments.undisturbedRoom.content', sourceKey: 'day2.sources.asylum' },
    asylum_no_departure: { id: 'asylum_no_departure', kind: 'document', titleKey: 'day2.fragments.noDeparture.title', contentKey: 'day2.fragments.noDeparture.content', sourceKey: 'day2.sources.asylum' },
    asylum_admission_1924: { id: 'asylum_admission_1924', kind: 'document', titleKey: 'day2.fragments.admission1924.title', contentKey: 'day2.fragments.admission1924.content', sourceKey: 'day2.sources.asylum' },
    asylum_change_1921: { id: 'asylum_change_1921', kind: 'document', titleKey: 'day2.fragments.change1921.title', contentKey: 'day2.fragments.change1921.content', sourceKey: 'day2.sources.asylum' },
    father_photo_before_1921: { id: 'father_photo_before_1921', kind: 'memory', titleKey: 'day2.fragments.familyPhoto.title', contentKey: 'day2.fragments.familyPhoto.content', sourceKey: 'day2.sources.suitcase' },
    father_note_cache: { id: 'father_note_cache', kind: 'document', titleKey: 'day2.fragments.cacheNote.title', contentKey: 'day2.fragments.cacheNote.content', sourceKey: 'day2.sources.suitcase' },
    yith_cache_found: { id: 'yith_cache_found', kind: 'observation', titleKey: 'day2.fragments.cacheFound.title', contentKey: 'day2.fragments.cacheFound.content', sourceKey: 'day2.sources.crypt' },
    future_object: { id: 'future_object', kind: 'observation', titleKey: 'day2.fragments.futureObject.title', contentKey: 'day2.fragments.futureObject.content', sourceKey: 'day2.sources.crypt' },
    yith_library_vision: { id: 'yith_library_vision', kind: 'vision', titleKey: 'day2.fragments.yithLibrary.title', contentKey: 'day2.fragments.yithLibrary.content', sourceKey: 'day2.sources.vision' },
    cult_meeting: { id: 'cult_meeting', kind: 'testimony', titleKey: 'day2.fragments.cultMeeting.title', contentKey: 'day2.fragments.cultMeeting.content', sourceKey: 'day2.sources.thomas' },
    shopkeeper_night_bell: { id: 'shopkeeper_night_bell', kind: 'testimony', titleKey: 'day2.fragments.nightBell.title', contentKey: 'day2.fragments.nightBell.content', sourceKey: 'day2.sources.shopkeeper' },
    organic_growth: { id: 'organic_growth', kind: 'observation', titleKey: 'day2.fragments.organicGrowth.title', contentKey: 'day2.fragments.organicGrowth.content', sourceKey: 'day2.sources.street' },
    organic_hoofprints: { id: 'organic_hoofprints', kind: 'observation', titleKey: 'day2.fragments.hoofprints.title', contentKey: 'day2.fragments.hoofprints.content', sourceKey: 'day2.sources.street' },
    virgin_dream_memory: { id: 'virgin_dream_memory', kind: 'vision', titleKey: 'day2.fragments.virginMemory.title', contentKey: 'day2.fragments.virginMemory.content', sourceKey: 'day2.sources.vision' },
    rosary_street_reaction: { id: 'rosary_street_reaction', kind: 'observation', titleKey: 'day2.fragments.rosaryReaction.title', contentKey: 'day2.fragments.rosaryReaction.content', sourceKey: 'day2.sources.street' },
    thomas_slip: { id: 'thomas_slip', kind: 'testimony', titleKey: 'day2.fragments.thomasSlip.title', contentKey: 'day2.fragments.thomasSlip.content', sourceKey: 'day2.sources.thomas' },
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

export const DAY2_CONNECTIONS: ConnectionDefinition[] = [
    { id: 'day2_disappearance_not_escape', requiredFragmentIds: ['asylum_sealed_room', 'asylum_room_undisturbed', 'asylum_no_departure'], status: 'fact', titleKey: 'day2.connections.disappearance.title', contentKey: 'day2.connections.disappearance.content', consciousnessReward: 0, scope: 'day2' },
    { id: 'day2_father_knew_cache', requiredFragmentIds: ['asylum_change_1921', 'father_note_cache', 'yith_cache_found'], status: 'hypothesis', titleKey: 'day2.connections.cache.title', contentKey: 'day2.connections.cache.content', consciousnessReward: 5, scope: 'day2' },
    { id: 'day2_object_and_archive', requiredFragmentIds: ['yith_cache_found', 'future_object', 'yith_library_vision'], status: 'hypothesis', titleKey: 'day2.connections.object.title', contentKey: 'day2.connections.object.content', consciousnessReward: 5, scope: 'day2' },
    { id: 'day2_rite_and_growth', requiredFragmentIds: ['cult_meeting', 'organic_growth', 'organic_hoofprints'], status: 'hypothesis', titleKey: 'day2.connections.growth.title', contentKey: 'day2.connections.growth.content', consciousnessReward: 5, scope: 'day2' },
    { id: 'day2_thomas_involved', requiredFragmentIds: ['shopkeeper_night_bell', 'thomas_slip'], status: 'hypothesis', titleKey: 'day2.connections.thomas.title', contentKey: 'day2.connections.thomas.content', consciousnessReward: 0, scope: 'day2' },
];

export const DAY2_COMPLETION_GROUPS = [
    ['day2_disappearance_not_escape', 'day2_father_knew_cache'],
    ['day2_object_and_archive'],
    ['day2_rite_and_growth', 'day2_thomas_involved'],
] as const;

export const DAY2_FRAGMENT_IDS = [
    'asylum_sealed_room',
    'asylum_room_undisturbed',
    'asylum_no_departure',
    'asylum_admission_1924',
    'asylum_change_1921',
    'father_photo_before_1921',
    'father_note_cache',
    'yith_cache_found',
    'future_object',
    'yith_library_vision',
    'cult_meeting',
    'shopkeeper_night_bell',
    'organic_growth',
    'organic_hoofprints',
    'virgin_dream_memory',
    'rosary_street_reaction',
    'thomas_slip',
];

export const ALL_CONNECTIONS = [...NIGHTMARE_CONNECTIONS, ...DAY2_CONNECTIONS];
