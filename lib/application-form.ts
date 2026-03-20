import { Application } from "@/lib/types";

export type ApplicationFormData = {
    section1_personal: {
        full_name: string;
        gender: string;
        gender_other: string;
        nationality: string[];
        date_of_birth: string;
        phone_number: string;
        personal_email: string;
        cambridge_email: string;
        college: string;
        subject: string;
        subject_other: string;
        year_of_study: string;
        year_of_study_other: string;
    };
    section2_about_you: {
        tell_us_about_yourself: string;
        additional_file_url: string;
    };
    section3_teaching: {
        subject_passion: string;
        academy_motivation: string;
    };
    section4_travel: {
        excitement_about_china: string;
        group_dynamics: string;
    };
    section5_availability: {
        available_dates: string[];
        dietary_restrictions: string[];
        dietary_other: string;
        additional_notes: string;
        confirms_program_dates: boolean;
        confirms_flight_costs: boolean;
        confirms_visa_responsibility: boolean;
    };
};

export type FormSection = 1 | 2 | 3 | 4 | 5 | 6;

export type ValidationFieldPath =
    | "section1_personal.full_name"
    | "section1_personal.gender"
    | "section1_personal.gender_other"
    | "section1_personal.nationality"
    | "section1_personal.date_of_birth"
    | "section1_personal.phone_number"
    | "section1_personal.personal_email"
    | "section1_personal.cambridge_email"
    | "section1_personal.college"
    | "section1_personal.subject"
    | "section1_personal.subject_other"
    | "section1_personal.year_of_study"
    | "section1_personal.year_of_study_other"
    | "section2_about_you.tell_us_about_yourself"
    | "section3_teaching.subject_passion"
    | "section3_teaching.academy_motivation"
    | "section4_travel.excitement_about_china"
    | "section4_travel.group_dynamics"
    | "section5_availability.confirms_program_dates"
    | "section5_availability.confirms_flight_costs"
    | "section5_availability.confirms_visa_responsibility"
    | "section5_availability.dietary_restrictions"
    | "section5_availability.dietary_other";

export interface FormValidationError {
    section: Exclude<FormSection, 6>;
    field: ValidationFieldPath;
    message: string;
}

const FIELD_TO_SECTION: Record<ValidationFieldPath, Exclude<FormSection, 6>> = {
    "section1_personal.full_name": 1,
    "section1_personal.gender": 1,
    "section1_personal.gender_other": 1,
    "section1_personal.nationality": 1,
    "section1_personal.date_of_birth": 1,
    "section1_personal.phone_number": 1,
    "section1_personal.personal_email": 1,
    "section1_personal.cambridge_email": 1,
    "section1_personal.college": 1,
    "section1_personal.subject": 1,
    "section1_personal.subject_other": 1,
    "section1_personal.year_of_study": 1,
    "section1_personal.year_of_study_other": 1,
    "section2_about_you.tell_us_about_yourself": 2,
    "section3_teaching.subject_passion": 3,
    "section3_teaching.academy_motivation": 3,
    "section4_travel.excitement_about_china": 4,
    "section4_travel.group_dynamics": 4,
    "section5_availability.confirms_program_dates": 5,
    "section5_availability.confirms_flight_costs": 5,
    "section5_availability.confirms_visa_responsibility": 5,
    "section5_availability.dietary_restrictions": 5,
    "section5_availability.dietary_other": 5,
};

const FIELD_ORDER: ValidationFieldPath[] = Object.keys(FIELD_TO_SECTION) as ValidationFieldPath[];

const WORD_LIMITS: Partial<Record<ValidationFieldPath, number>> = {
    "section2_about_you.tell_us_about_yourself": 500,
    "section3_teaching.subject_passion": 500,
    "section3_teaching.academy_motivation": 500,
    "section4_travel.excitement_about_china": 500,
    "section4_travel.group_dynamics": 500,
};

export const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidCambridgeEmail = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return isValidEmail(normalizedEmail) && (
        normalizedEmail.endsWith("@cam.ac.uk") || normalizedEmail.endsWith("@cantab.ac.uk")
    );
};

export const isValidInternationalPhone = (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return false;
    if (!/^[+\d()\-\s]+$/.test(trimmed)) return false;

    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
};

export const normalizeNationalityInput = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

export const formatNationalityList = (value: unknown) => normalizeNationalityInput(value).join(", ");

export const createInitialFormData = (app: Application): ApplicationFormData => ({
    section1_personal: {
        full_name: app.section1_personal?.full_name || "",
        gender: app.section1_personal?.gender || "",
        gender_other: app.section1_personal?.gender_other || "",
        nationality: normalizeNationalityInput(app.section1_personal?.nationality),
        date_of_birth: app.section1_personal?.date_of_birth || "",
        phone_number: app.section1_personal?.phone_number || "",
        personal_email: app.section1_personal?.personal_email || "",
        cambridge_email: app.section1_personal?.cambridge_email || "",
        college: app.section1_personal?.college || "",
        subject: app.section1_personal?.subject || "",
        subject_other: app.section1_personal?.subject_other || "",
        year_of_study: app.section1_personal?.year_of_study || "",
        year_of_study_other: app.section1_personal?.year_of_study_other || "",
    },
    section2_about_you: {
        tell_us_about_yourself: app.section2_about_you?.tell_us_about_yourself || "",
        additional_file_url: app.section2_about_you?.additional_file_url || "",
    },
    section3_teaching: {
        subject_passion: app.section3_teaching?.subject_passion || "",
        academy_motivation: app.section3_teaching?.academy_motivation || "",
    },
    section4_travel: {
        excitement_about_china: app.section4_travel?.excitement_about_china || "",
        group_dynamics: app.section4_travel?.group_dynamics || "",
    },
    section5_availability: {
        available_dates: app.section5_availability?.available_dates || [],
        dietary_restrictions: app.section5_availability?.dietary_restrictions || [],
        dietary_other: app.section5_availability?.dietary_other || "",
        additional_notes: app.section5_availability?.additional_notes || "",
        confirms_program_dates: app.section5_availability?.confirms_program_dates || false,
        confirms_flight_costs: app.section5_availability?.confirms_flight_costs || false,
        confirms_visa_responsibility: app.section5_availability?.confirms_visa_responsibility || false,
    },
});

const buildError = (field: ValidationFieldPath, message: string): FormValidationError => ({
    section: FIELD_TO_SECTION[field],
    field,
    message,
});

export const validateField = (formData: ApplicationFormData, field: ValidationFieldPath): FormValidationError | null => {
    const { section1_personal, section2_about_you, section3_teaching, section4_travel, section5_availability } = formData;

    switch (field) {
        case "section1_personal.full_name":
            return section1_personal.full_name.trim() ? null : buildError(field, "Full name is required.");
        case "section1_personal.gender":
            return section1_personal.gender ? null : buildError(field, "Please select your gender.");
        case "section1_personal.gender_other":
            if (section1_personal.gender !== "Other") return null;
            return section1_personal.gender_other.trim() ? null : buildError(field, "Please specify your gender.");
        case "section1_personal.nationality":
            return section1_personal.nationality.length > 0 ? null : buildError(field, "Please select at least one nationality.");
        case "section1_personal.date_of_birth":
            return section1_personal.date_of_birth ? null : buildError(field, "Date of birth is required.");
        case "section1_personal.phone_number":
            if (!section1_personal.phone_number.trim()) return buildError(field, "Phone number is required.");
            return isValidInternationalPhone(section1_personal.phone_number)
                ? null
                : buildError(field, "Please enter a valid international phone number.");
        case "section1_personal.personal_email":
            if (!section1_personal.personal_email.trim()) return buildError(field, "Personal email is required.");
            return isValidEmail(section1_personal.personal_email) ? null : buildError(field, "Please enter a valid email address.");
        case "section1_personal.cambridge_email":
            if (!section1_personal.cambridge_email.trim()) return buildError(field, "Cambridge email is required.");
            return isValidCambridgeEmail(section1_personal.cambridge_email)
                ? null
                : buildError(field, "Please use a valid @cam.ac.uk or @cantab.ac.uk address.");
        case "section1_personal.college":
            return section1_personal.college ? null : buildError(field, "Please select your college.");
        case "section1_personal.subject":
            return section1_personal.subject ? null : buildError(field, "Please select your subject or programme.");
        case "section1_personal.subject_other":
            if (section1_personal.subject !== "Other") return null;
            return section1_personal.subject_other.trim() ? null : buildError(field, "Please specify your subject or programme.");
        case "section1_personal.year_of_study":
            return section1_personal.year_of_study ? null : buildError(field, "Please select your year of study.");
        case "section1_personal.year_of_study_other":
            if (section1_personal.year_of_study !== "Other") return null;
            return section1_personal.year_of_study_other.trim() ? null : buildError(field, "Please specify your current year or stage of study.");
        case "section2_about_you.tell_us_about_yourself":
            if (!section2_about_you.tell_us_about_yourself.trim()) return buildError(field, "This response is required.");
            return countWords(section2_about_you.tell_us_about_yourself) <= 500 ? null : buildError(field, "Please keep this response within 500 words.");
        case "section3_teaching.subject_passion":
            if (!section3_teaching.subject_passion.trim()) return buildError(field, "This response is required.");
            return countWords(section3_teaching.subject_passion) <= 500 ? null : buildError(field, "Please keep this response within 500 words.");
        case "section3_teaching.academy_motivation":
            if (!section3_teaching.academy_motivation.trim()) return buildError(field, "This response is required.");
            return countWords(section3_teaching.academy_motivation) <= 500 ? null : buildError(field, "Please keep this response within 500 words.");
        case "section4_travel.excitement_about_china":
            if (!section4_travel.excitement_about_china.trim()) return buildError(field, "This response is required.");
            return countWords(section4_travel.excitement_about_china) <= 500 ? null : buildError(field, "Please keep this response within 500 words.");
        case "section4_travel.group_dynamics":
            if (!section4_travel.group_dynamics.trim()) return buildError(field, "This response is required.");
            return countWords(section4_travel.group_dynamics) <= 500 ? null : buildError(field, "Please keep this response within 500 words.");
        case "section5_availability.confirms_program_dates":
            return section5_availability.confirms_program_dates ? null : buildError(field, "Please confirm the programme dates and availability.");
        case "section5_availability.confirms_flight_costs":
            return section5_availability.confirms_flight_costs ? null : buildError(field, "Please confirm the flight cost responsibility.");
        case "section5_availability.confirms_visa_responsibility":
            return section5_availability.confirms_visa_responsibility ? null : buildError(field, "Please confirm the visa responsibility.");
        case "section5_availability.dietary_restrictions":
            return section5_availability.dietary_restrictions.length > 0 ? null : buildError(field, "Please select your dietary restrictions.");
        case "section5_availability.dietary_other":
            if (!section5_availability.dietary_restrictions.includes("Other")) return null;
            return section5_availability.dietary_other.trim() ? null : buildError(field, "Please specify your dietary restrictions.");
        default:
            return null;
    }
};

export const validateSection = (formData: ApplicationFormData, section: Exclude<FormSection, 6>) =>
    FIELD_ORDER
        .filter((field) => FIELD_TO_SECTION[field] === section)
        .map((field) => validateField(formData, field))
        .filter((error): error is FormValidationError => error !== null);

export const validateApplication = (formData: ApplicationFormData) =>
    FIELD_ORDER
        .map((field) => validateField(formData, field))
        .filter((error): error is FormValidationError => error !== null);

export const getSectionErrorSummary = (errors: FormValidationError[]) => {
    const sections = new Map<number, string[]>();

    errors.forEach((error) => {
        const existing = sections.get(error.section) || [];
        existing.push(error.message);
        sections.set(error.section, existing);
    });

    return sections;
};

export const getWordLimit = (field: ValidationFieldPath) => WORD_LIMITS[field] ?? null;
