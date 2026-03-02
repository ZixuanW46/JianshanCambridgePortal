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

    // NEW STRUCTURE
    section1_personal?: {
        full_name: string;
        nationality: string;
        date_of_birth: string;
        phone_number: string;
        personal_email: string;
        cambridge_email: string;
        college: string;
        subject: string;
        subject_other?: string | null;
        degree_level?: string;
        year_of_study: string;
        year_of_study_other?: string | null;
    };
    section2_about_you?: {
        tell_us_about_yourself: string;
        additional_file_url?: string | null;
    };
    section3_teaching?: {
        interest_and_motivation: string;
        experience_and_strengths: string;
    };
    section4_travel?: {
        excitement_about_china: string;
        group_dynamics: string;
    };
    section5_availability?: {
        available_dates: string[];
        dietary_restrictions: string[];
        dietary_other?: string | null;
        additional_notes?: string | null;
    };

    // LEGACY STRUCTURE (Keeping for backwards compatibility)
    personalInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        dateOfBirth?: string;
        nationality?: string;
        gender?: string;
        university: string;
        college?: string;
        department?: string;
        programme?: string;
        yearOfStudy?: string;
        subjects?: string[];
        otherSubject?: string;
    };
    essays?: {
        motivation?: string;
        experience?: string;
        additionalInfo?: string;
    };
    misc?: {
        availability?: string[];
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
