export interface Application {
    id: string;
    userId: string;
    status: 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'round_2_submitted' | 'round_2_under_review' | 'accepted' | 'accepted_pending_payment' | 'accepted_paid' | 'payment_received' | 'offer_declined' | 'rejected' | 'waitlisted';
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
        gender?: string;
        gender_other?: string | null;
        nationality: string[];
        date_of_birth: string;
        phone_number: string;
        personal_email: string;
        cambridge_email: string;
        college: string;
        subject: string;
        subject_other?: string | null;
        year_of_study: string;
        year_of_study_other?: string | null;
    };
    section2_about_you?: {
        tell_us_about_yourself: string;
        additional_file_url?: string | null;
    };
    section3_teaching?: {
        subject_passion: string;
        academy_motivation: string;
    };
    section4_travel?: {
        excitement_about_china: string;
        group_dynamics: string;
    };
    section5_availability?: {
        available_dates?: string[];
        dietary_restrictions: string[];
        dietary_other?: string | null;
        additional_notes?: string | null;
        confirms_program_dates?: boolean;
        confirms_flight_costs?: boolean;
        confirms_visa_responsibility?: boolean;
    };
    section6_round_2?: {
        session_design_thoughts?: string;
        type_a_session_title?: string;
        type_a_session_thoughts?: string;
        type_b_session_title?: string;
        type_b_session_thoughts?: string;
        video_url: string;
        confirms_workload_readiness?: boolean;
        confirms_deposit_terms?: boolean;
        confirms_flight_costs?: boolean;
        confirms_visa_responsibility?: boolean;
        final_round_concerns?: string | null;
    };
    offerAcceptance?: {
        full_name_on_passport?: string;
        nationality?: string;
        passport_number?: string;
        transfer_confirmed?: boolean;
        startedAt?: string;
        submittedAt?: string;
    };
    // Admin-only data
    adminData?: {
        internalDecision?: 'shortlisted' | 'accepted' | 'rejected' | 'waitlisted' | null;
        notes?: Array<{
            content: string;
            author: string;
            date: string;
        }>;
    };
}
