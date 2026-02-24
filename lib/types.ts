export interface Application {
    id: string;
    userId: string;
    status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted' | 'enrolled';
    submittedAt?: string;
    createdAt?: string;
    lastUpdatedAt: string;
    decisionReleasedAt?: string;
    timeline?: {
        submittedAt?: string;
    };
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        dateOfBirth?: string;
        nationality?: string;
        gender?: string;
        university: string;
        college?: string;  // e.g. specific Cambridge college
        department?: string;
        programme?: string;  // degree programme
        yearOfStudy?: string;  // Year 1, 2, 3, 4, Masters, PhD, Postdoc
        subjects?: string[];  // subjects they can tutor
        otherSubject?: string;
    };
    essays: {
        motivation?: string;   // Why do you want to be a tutor?
        experience?: string;   // Teaching/mentoring experience
        additionalInfo?: string;  // Anything else
    };
    misc?: {
        availability?: string[];     // Available periods
        dietaryRestrictions?: string;
        referralSource?: string;
        agreedToTerms?: boolean;
    };
    // Admin-only data
    adminData?: {
        internalDecision?: 'accepted' | 'rejected' | 'waitlisted' | null;
        notes?: Array<{
            content: string;
            author: string;
            date: string;
        }>;
    };
}
