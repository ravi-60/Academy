import { Cohort } from '@/integrations/backend/cohortApi';

export type FeedbackType = 'technical' | 'mentor' | 'coach' | 'buddy' | 'behavioral';

interface FeedbackExportConfig {
    headers: string[];
    mapRow: (response: any, cohort: Cohort) => (string | number)[];
}

const COMMON_HEADERS = [
    'Feedback Provider',
    'Associate Name',
    'Feedback Receiver',
    'Receiver Name',
    'Cohort Name',
    'Location',
    'SL',
    'BU',
    'SBU',
    'Feedback Date'
];

const getCommonData = (response: any, cohort: Cohort, receiverName: string) => [
    'Feedback Provider', // Static
    response.candidateName || 'Anonymous',
    'Feedback Receiver', // Static
    receiverName,
    cohort.code,
    cohort.trainingLocation,
    cohort.sl || '', // SL
    cohort.bu || '', // BU
    cohort.sbu || '', // SBU
    new Date(response.createdAt).toLocaleDateString(),
];

export const FEEDBACK_EXPORT_CONFIG: Record<FeedbackType, FeedbackExportConfig> = {
    technical: {
        headers: [
            ...COMMON_HEADERS,
            'Was the Technical session held this week?',
            'Rate Course Content',
            'Rate Technical Knowledge',
            'Rate Trainer Engagement',
            'Rate Concepts Schedule',
            'Rate Udemy Recap',
            'Rate Additional Scenario',
            'Low Score Explanation',
            'Aggregated Score'
        ],
        mapRow: (r, c) => [
            ...getCommonData(r, c, c.primaryTrainer?.name || 'Technical Trainer'),
            r.isTechnicalSessionHeld ? 'Yes' : 'No',
            r.courseContentRating || '',
            r.technicalKnowledgeRating || '',
            r.trainerEngagementRating || '',
            r.conceptsScheduleRating || '',
            r.udemyRecapRating || '',
            r.additionalScenarioRating || '',
            r.technicalLowScoreExplanation || '',
            // Calculate average
            ((
                (r.courseContentRating || 0) +
                (r.technicalKnowledgeRating || 0) +
                (r.trainerEngagementRating || 0) +
                (r.conceptsScheduleRating || 0) +
                (r.udemyRecapRating || 0) +
                (r.additionalScenarioRating || 0)
            ) / 6).toFixed(2)
        ]
    },
    mentor: {
        headers: [
            ...COMMON_HEADERS,
            'Was the Mentor session held this week?',
            'Please reflect on the Mentor\'s ability to provide you guidance and practical inputs related to the course topics during this week?',
            'Please give your feedback if you have scored below 3 for any of the above questions',
            'Aggregated Score'
        ],
        mapRow: (r, c) => [
            ...getCommonData(r, c, c.primaryMentor?.name || 'Mentor'),
            r.isMentorSessionHeld ? 'Yes' : 'No',
            r.mentorGuidanceRating || '',
            r.mentorLowScoreExplanation || '',
            r.mentorGuidanceRating || ''
        ]
    },
    coach: {
        headers: [
            ...COMMON_HEADERS,
            'Please reflect if your GenC HR coach was effective in guiding you on day-to-day learning schedules, milestones, checkpoints, and other necessary support you required this week?',
            'Please give your feedback if you have scored below 3 for the above question',
            'Aggregated Score'
        ],
        mapRow: (r, c) => [
            ...getCommonData(r, c, c.coach?.name || 'Coach'),
            r.coachEffectivenessRating || '',
            r.coachLowScoreExplanation || '',
            r.coachEffectivenessRating || ''
        ]
    },
    buddy: {
        headers: [
            ...COMMON_HEADERS,
            'Did your Buddy Mentor connect with you this week',
            'Were your doubts clarified by your Buddy Mentor',
            'Please reflect whether the Buddy Mentor was able to provide you guidance that gives you the confidence to clear your stage 1 qualifier assessment.',
            'Please share your concerns or suggestions regarding the Buddy Mentor Program',
            'Aggregated Score'
        ],
        mapRow: (r, c) => [
            ...getCommonData(r, c, c.buddyMentor?.name || 'Buddy Mentor'),
            r.didBuddyMentorConnect ? 'Yes' : 'No',
            r.wereDoubtsClarified ? 'Yes' : 'No',
            r.buddyMentorGuidanceRating || '',
            r.buddyMentorSuggestions || '',
            r.buddyMentorGuidanceRating || ''
        ]
    },
    behavioral: {
        headers: [
            ...COMMON_HEADERS,
            'Was the Behavioral session held this week?',
            'Please reflect on the behavioral trainer\'s ability to deliver course content',
            'Please give your feedback if you have scored below 3 for the above question',
            'Aggregated Score'
        ],
        mapRow: (r, c) => [
            ...getCommonData(r, c, c.behavioralTrainer?.name || 'Behavioral Trainer'),
            r.isBehavioralSessionHeld ? 'Yes' : 'No',
            r.behavioralDeliveryRating || '',
            r.behavioralLowScoreExplanation || '',
            r.behavioralDeliveryRating || ''
        ]
    }
};
