"use client";

import React, { useMemo, useState } from "react";
import { Application } from "@/lib/types";
import {
    COLLEGES,
    SUBJECTS_GROUPED,
    YEAR_OF_STUDY_OPTIONS,
    DIETARY_RESTRICTIONS,
    GENDER_OPTIONS,
    NATIONALITY_OPTIONS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Check, CalendarIcon, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "./section";
import { FileUpload } from "@/components/ui/file-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
    ApplicationFormData,
    countWords,
    createInitialFormData,
    FormSection,
    FormValidationError,
    getWordLimit,
    validateApplication,
    validateField,
    validateSection,
    ValidationFieldPath,
} from "@/lib/application-form";

const LOGISTICS_CONFIRMATIONS = [
    {
        key: "confirms_program_dates",
        title: "Programme Dates & Availability",
        description: "If selected, I understand that Jianshan Academy 2026 will take place in Hangzhou from August 2 to August 8, followed by the China Trip from August 8 to August 18, travelling through Hangzhou, Shanghai, and Beijing.",
        details: [
            "Scholars must arrive in Hangzhou on August 1, ideally before 17:00 China Time.",
            "Return travel can be booked from Beijing on August 18 at any time.",
            "I confirm that I am available for this full time window."
        ],
        checkboxLabel: "I understand the programme dates and confirm I am available for the full schedule.",
        field: "section5_availability.confirms_program_dates" as const,
    },
    {
        key: "confirms_flight_costs",
        title: "International Flights",
        description: "International return flights to and from China are not covered by the programme.",
        details: [
            "I will need to book and pay for my own international flights.",
            "I have checked the likely flight options and prices before applying."
        ],
        checkboxLabel: "I understand that I must arrange and cover my own international return flights.",
        field: "section5_availability.confirms_flight_costs" as const,
    },
    {
        key: "confirms_visa_responsibility",
        title: "Visa Responsibility",
        description: "It is my responsibility to confirm whether I can enter China visa-free or whether I need to apply for a visa independently.",
        details: [
            "If a visa is required, I understand that I must complete the application myself and cover any related costs."
        ],
        checkboxLabel: "I understand that checking visa eligibility and securing the correct entry permission is my responsibility.",
        field: "section5_availability.confirms_visa_responsibility" as const,
    }
] as const;

interface ApplicationFormProps {
    app: Application;
    isReadOnly?: boolean;
    onSave: (data: Partial<Application>) => Promise<void>;
    onSubmit: (data: Partial<Application>) => Promise<void>;
    saving: boolean;
    submitting: boolean;
}

type SectionKey = keyof ApplicationFormData;

const SECTION_ERROR_FIELDS: Record<Exclude<FormSection, 6>, ValidationFieldPath[]> = {
    1: [
        "section1_personal.full_name",
        "section1_personal.gender",
        "section1_personal.gender_other",
        "section1_personal.nationality",
        "section1_personal.date_of_birth",
        "section1_personal.phone_number",
        "section1_personal.personal_email",
        "section1_personal.cambridge_email",
        "section1_personal.college",
        "section1_personal.subject",
        "section1_personal.subject_other",
        "section1_personal.year_of_study",
        "section1_personal.year_of_study_other",
    ],
    2: ["section2_about_you.tell_us_about_yourself"],
    3: ["section3_teaching.subject_passion", "section3_teaching.academy_motivation"],
    4: ["section4_travel.excitement_about_china", "section4_travel.group_dynamics"],
    5: [
        "section5_availability.confirms_program_dates",
        "section5_availability.confirms_flight_costs",
        "section5_availability.confirms_visa_responsibility",
        "section5_availability.dietary_restrictions",
        "section5_availability.dietary_other",
    ],
};

const SECTION_TITLES: Record<FormSection, string> = {
    1: "Personal Profile",
    2: "Your Story",
    3: "The Academy",
    4: "China Experience",
    5: "Logistics & Details",
    6: "Review your answers",
};

const mergeErrors = (current: FormValidationError[], incoming: FormValidationError[]) => {
    const map = new Map<ValidationFieldPath, FormValidationError>();
    current.forEach((error) => map.set(error.field, error));
    incoming.forEach((error) => map.set(error.field, error));
    return Array.from(map.values());
};

const replaceFieldError = (
    current: FormValidationError[],
    field: ValidationFieldPath,
    nextError: FormValidationError | null,
) => {
    const filtered = current.filter((error) => error.field !== field);
    return nextError ? [...filtered, nextError] : filtered;
};

const replaceSectionErrors = (
    current: FormValidationError[],
    section: Exclude<FormSection, 6>,
    nextErrors: FormValidationError[],
) => {
    const sectionFields = new Set(SECTION_ERROR_FIELDS[section]);
    const filtered = current.filter((error) => !sectionFields.has(error.field));
    return mergeErrors(filtered, nextErrors);
};

const getDisplaySubject = (formData: ApplicationFormData) =>
    formData.section1_personal.subject === "Other"
        ? formData.section1_personal.subject_other || "Other"
        : formData.section1_personal.subject;

const getDisplayYearOfStudy = (formData: ApplicationFormData) =>
    formData.section1_personal.year_of_study === "Other"
        ? formData.section1_personal.year_of_study_other || "Other"
        : formData.section1_personal.year_of_study;

const getInitialUploadedFileName = (uploadedUrl?: string) => {
    if (!uploadedUrl) return "";

    try {
        const url = new URL(uploadedUrl);
        const encodedPath = url.pathname.split("/o/")[1] || "";
        const storagePath = decodeURIComponent(encodedPath);
        const rawFileName = storagePath.split("/").pop() || "";
        return rawFileName.replace(/^\d+_/, "");
    } catch {
        return "";
    }
};

export function ApplicationForm({ app, isReadOnly = false, onSave, onSubmit, saving, submitting }: ApplicationFormProps) {
    const [currentSection, setCurrentSection] = useState<FormSection>(1);
    const [autoSaved, setAutoSaved] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FormValidationError[]>([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
    const [subjectQuery, setSubjectQuery] = useState("");
    const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
    const [nationalityQuery, setNationalityQuery] = useState("");
    const [touchedFields, setTouchedFields] = useState<Partial<Record<ValidationFieldPath, boolean>>>({});
    const [validatedSections, setValidatedSections] = useState<Partial<Record<Exclude<FormSection, 6>, boolean>>>({});
    const [formData, setFormData] = useState<ApplicationFormData>(() => createInitialFormData(app));
    const [uploadedFileName, setUploadedFileName] = useState(() => getInitialUploadedFileName(app.section2_about_you?.additional_file_url || ""));

    const setFieldTouched = (field: ValidationFieldPath) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    const syncFieldValidation = (nextFormData: ApplicationFormData, field: ValidationFieldPath) => {
        const nextError = validateField(nextFormData, field);
        setFieldErrors((prev) => replaceFieldError(prev, field, nextError));
    };

    const updateField = <K extends SectionKey, F extends keyof ApplicationFormData[K]>(
        section: K,
        field: F,
        value: ApplicationFormData[K][F],
        validationField?: ValidationFieldPath,
    ) => {
        if (isReadOnly) return;

        const nextFormData = {
            ...formData,
            [section]: {
                ...formData[section],
                [field]: value,
            },
        } as ApplicationFormData;

        setFormData(nextFormData);

        if (validationField && touchedFields[validationField]) {
            syncFieldValidation(nextFormData, validationField);
        }
    };

    const handleBlurValidation = (field: ValidationFieldPath) => {
        setFieldTouched(field);
        syncFieldValidation(formData, field);
    };

    const handleSave = async () => {
        if (isReadOnly) return;
        try {
            await onSave(formData);
            setAutoSaved(true);
            setTimeout(() => setAutoSaved(false), 2000);
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const getFieldError = (field: ValidationFieldPath) => fieldErrors.find((error) => error.field === field);
    const hasFieldError = (field: ValidationFieldPath) => Boolean(getFieldError(field));
    const shouldShowFieldError = (field: ValidationFieldPath) =>
        Boolean(submitAttempted || touchedFields[field] || fieldErrors.some((error) => error.field === field));

    const renderFieldError = (field: ValidationFieldPath) => {
        const error = getFieldError(field);
        if (!error || !shouldShowFieldError(field)) return null;
        return <p className="text-xs text-red-500 font-medium">{error.message}</p>;
    };

    const renderFieldLabel = (label: string, required = true, field?: ValidationFieldPath, className?: string) => (
        <Label className={cn("flex items-center gap-1 text-slate-700 text-sm font-semibold", field && hasFieldError(field) && shouldShowFieldError(field) ? "text-red-500" : "", className)}>
            {label}
            {required && <span className="text-red-500">*</span>}
        </Label>
    );

    const renderWordCount = (current: number, max: number) => (
        <div className={cn("text-xs transition-colors", current > max ? "text-red-500 font-bold" : "text-slate-400")}>
            {current} / {max} words
        </div>
    );

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        })
    };

    const [[page, direction], setPage] = useState([1, 0]);
    const normalizedSubjectQuery = subjectQuery.trim().toLowerCase();
    const normalizedNationalityQuery = nationalityQuery.trim().toLowerCase();

    const filteredSubjectGroups = useMemo<Record<string, string[]>>(() => {
        if (!normalizedSubjectQuery) return SUBJECTS_GROUPED;
        return Object.fromEntries(
            Object.entries(SUBJECTS_GROUPED)
                .map(([groupName, subjects]) => [
                    groupName,
                    subjects.filter(subject => subject.toLowerCase().includes(normalizedSubjectQuery))
                ])
                .filter(([, subjects]) => subjects.length > 0)
        );
    }, [normalizedSubjectQuery]);

    const filteredNationalities = useMemo(() => {
        if (!normalizedNationalityQuery) return NATIONALITY_OPTIONS;
        return NATIONALITY_OPTIONS.filter((option) => option.toLowerCase().includes(normalizedNationalityQuery));
    }, [normalizedNationalityQuery]);

    const hasSubjectMatches = Object.keys(filteredSubjectGroups).length > 0;
    const hasOtherSubjectOption = Object.values(filteredSubjectGroups).some(subjects => subjects.includes("Other"));
    const shouldShowFallbackOtherOption = normalizedSubjectQuery.length > 0 && !hasOtherSubjectOption;
    const hasVisibleSubjectOptions = hasSubjectMatches || shouldShowFallbackOtherOption;

    const paginate = (newDirection: number, section: FormSection) => {
        setPage([section, newDirection]);
        setCurrentSection(section);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const validateAndStoreSection = (section: Exclude<FormSection, 6>) => {
        const errors = validateSection(formData, section);
        setFieldErrors((prev) => replaceSectionErrors(prev, section, errors));
        setValidatedSections((prev) => ({ ...prev, [section]: true }));
        return errors;
    };

    const goToSection = (target: FormSection) => {
        if (target === currentSection) return;

        if (!isReadOnly && target > currentSection && currentSection <= 5) {
            const errors = validateAndStoreSection(currentSection as Exclude<FormSection, 6>);
            if (errors.length > 0) {
                return;
            }
        }

        paginate(target > currentSection ? 1 : -1, target);
    };

    const handleNext = () => {
        if (currentSection >= 6) return;

        if (isReadOnly) {
            paginate(1, (currentSection + 1) as FormSection);
            return;
        }

        const errors = validateAndStoreSection(currentSection as Exclude<FormSection, 6>);
        if (errors.length > 0) return;
        paginate(1, (currentSection + 1) as FormSection);
    };

    const handleSubmit = async () => {
        if (isReadOnly) return;

        setSubmitAttempted(true);
        const errors = validateApplication(formData);
        setFieldErrors(errors);
        setValidatedSections({ 1: true, 2: true, 3: true, 4: true, 5: true });

        if (errors.length > 0) {
            paginate(-1, 6);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err) {
            console.error("Submit failed", err);
        }
    };

    const sectionsData = [
        { id: 1, title: "Personal Profile" },
        { id: 2, title: "Your Story" },
        { id: 3, title: "The Academy" },
        { id: 4, title: "China Experience" },
        { id: 5, title: "Logistics & Details" },
        { id: 6, title: "Review" },
    ];

    const sectionErrors = sectionsData.reduce<Record<number, FormValidationError[]>>((acc, section) => {
        acc[section.id] = fieldErrors.filter((error) => error.section === section.id);
        return acc;
    }, {});

    const reviewSections = [
        {
            id: 1 as const,
            title: "Personal Profile",
            items: [
                { label: "Full Name", value: formData.section1_personal.full_name || "-", field: "section1_personal.full_name" as const },
                {
                    label: "Gender",
                    value: formData.section1_personal.gender === "Other" ? formData.section1_personal.gender_other || "-" : formData.section1_personal.gender || "-",
                    field: formData.section1_personal.gender === "Other" ? "section1_personal.gender_other" as const : "section1_personal.gender" as const,
                },
                {
                    label: "Nationality",
                    value: formData.section1_personal.nationality.length > 0 ? formData.section1_personal.nationality.join(", ") : "-",
                    field: "section1_personal.nationality" as const,
                },
                { label: "Date of Birth", value: formData.section1_personal.date_of_birth || "-", field: "section1_personal.date_of_birth" as const },
                { label: "Phone Number", value: formData.section1_personal.phone_number || "-", field: "section1_personal.phone_number" as const },
                { label: "Personal Email", value: formData.section1_personal.personal_email || "-", field: "section1_personal.personal_email" as const },
                { label: "Cambridge Email", value: formData.section1_personal.cambridge_email || "-", field: "section1_personal.cambridge_email" as const },
                { label: "College", value: formData.section1_personal.college || "-", field: "section1_personal.college" as const },
                { label: "Subject / Programme", value: getDisplaySubject(formData) || "-", field: formData.section1_personal.subject === "Other" ? "section1_personal.subject_other" as const : "section1_personal.subject" as const },
                { label: "Year of Study", value: getDisplayYearOfStudy(formData) || "-", field: formData.section1_personal.year_of_study === "Other" ? "section1_personal.year_of_study_other" as const : "section1_personal.year_of_study" as const },
            ],
        },
        {
            id: 2 as const,
            title: "Your Story",
            items: [
                { label: "Tell us about yourself", value: formData.section2_about_you.tell_us_about_yourself || "-", field: "section2_about_you.tell_us_about_yourself" as const },
                { label: "Additional Material", value: formData.section2_about_you.additional_file_url || "No file uploaded", field: "section2_about_you.tell_us_about_yourself" as const },
            ],
        },
        {
            id: 3 as const,
            title: "The Academy",
            items: [
                { label: "Subject Passion", value: formData.section3_teaching.subject_passion || "-", field: "section3_teaching.subject_passion" as const },
                { label: "Academy Motivation", value: formData.section3_teaching.academy_motivation || "-", field: "section3_teaching.academy_motivation" as const },
            ],
        },
        {
            id: 4 as const,
            title: "China Experience",
            items: [
                { label: "Excitement About China", value: formData.section4_travel.excitement_about_china || "-", field: "section4_travel.excitement_about_china" as const },
                { label: "Group Dynamics", value: formData.section4_travel.group_dynamics || "-", field: "section4_travel.group_dynamics" as const },
            ],
        },
        {
            id: 5 as const,
            title: "Logistics & Details",
            items: [
                {
                    label: "Programme Dates Confirmation",
                    value: formData.section5_availability.confirms_program_dates ? "Confirmed" : "Not confirmed",
                    field: "section5_availability.confirms_program_dates" as const,
                },
                {
                    label: "Flight Costs Confirmation",
                    value: formData.section5_availability.confirms_flight_costs ? "Confirmed" : "Not confirmed",
                    field: "section5_availability.confirms_flight_costs" as const,
                },
                {
                    label: "Visa Responsibility Confirmation",
                    value: formData.section5_availability.confirms_visa_responsibility ? "Confirmed" : "Not confirmed",
                    field: "section5_availability.confirms_visa_responsibility" as const,
                },
                {
                    label: "Dietary Restrictions",
                    value: formData.section5_availability.dietary_restrictions.length > 0
                        ? `${formData.section5_availability.dietary_restrictions.join(", ")}${formData.section5_availability.dietary_other ? ` (${formData.section5_availability.dietary_other})` : ""}`
                        : "-",
                    field: formData.section5_availability.dietary_restrictions.includes("Other")
                        ? "section5_availability.dietary_other" as const
                        : "section5_availability.dietary_restrictions" as const,
                },
                { label: "Additional Notes", value: formData.section5_availability.additional_notes || "No additional notes", field: "section5_availability.dietary_restrictions" as const },
            ],
        },
    ];

    return (
        <div className="max-w-4xl mx-auto w-full space-y-8">
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50 p-4 md:p-6 sticky top-20 z-40 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isReadOnly ? "Your Application" : "Application Form"}
                    </h2>
                    <div className="text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                        Section {currentSection} of 6
                    </div>
                </div>

                <div className="grid grid-cols-6 gap-2 w-full h-2">
                    {sectionsData.map(s => (
                        <div
                            key={s.id}
                            onClick={() => goToSection(s.id as FormSection)}
                            className={cn(
                                "h-2 w-full rounded-full transition-colors duration-300 cursor-pointer",
                                s.id === currentSection ? "bg-[#1A4D2E]" : s.id < currentSection ? "bg-[#8AC1A6]" : "bg-slate-100"
                            )}
                        />
                    ))}
                </div>

                <div className="mt-3 hidden md:grid grid-cols-6 gap-2">
                    {sectionsData.map(s => (
                        <div key={s.id} className={cn("text-center text-xs text-slate-500 font-medium transition-colors cursor-pointer", currentSection === s.id ? "text-[#1A4D2E] font-bold" : "hover:text-slate-800")}
                            onClick={() => goToSection(s.id as FormSection)}>
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-full">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                    >
                        {currentSection === 1 && (
                            <Section number="01" title="Personal Profile" titleEn="Let's start with the basics">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        {renderFieldLabel("Full Name", true, "section1_personal.full_name")}
                                        <Input
                                            value={formData.section1_personal.full_name}
                                            onChange={e => updateField("section1_personal", "full_name", e.target.value, "section1_personal.full_name")}
                                            onBlur={() => handleBlurValidation("section1_personal.full_name")}
                                            disabled={isReadOnly}
                                            className={cn(hasFieldError("section1_personal.full_name") && shouldShowFieldError("section1_personal.full_name") && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {renderFieldError("section1_personal.full_name")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Gender", true, "section1_personal.gender")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.gender} onValueChange={v => {
                                            setFieldTouched("section1_personal.gender");
                                            updateField("section1_personal", "gender", v, "section1_personal.gender");
                                            if (v !== "Other") {
                                                updateField("section1_personal", "gender_other", "", "section1_personal.gender_other");
                                                setFieldErrors((prev) => replaceFieldError(prev, "section1_personal.gender_other", null));
                                            }
                                            syncFieldValidation({
                                                ...formData,
                                                section1_personal: {
                                                    ...formData.section1_personal,
                                                    gender: v,
                                                    gender_other: v === "Other" ? formData.section1_personal.gender_other : "",
                                                },
                                            }, "section1_personal.gender");
                                        }}>
                                            <SelectTrigger className={cn(hasFieldError("section1_personal.gender") && shouldShowFieldError("section1_personal.gender") && "border-red-500 focus:ring-red-500")}>
                                                <SelectValue placeholder="Select your gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {renderFieldError("section1_personal.gender")}
                                        {formData.section1_personal.gender === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 space-y-2">
                                                <Input
                                                    placeholder="Please specify your gender"
                                                    value={formData.section1_personal.gender_other || ""}
                                                    onChange={e => updateField("section1_personal", "gender_other", e.target.value, "section1_personal.gender_other")}
                                                    onBlur={() => handleBlurValidation("section1_personal.gender_other")}
                                                    disabled={isReadOnly}
                                                    className={cn(hasFieldError("section1_personal.gender_other") && shouldShowFieldError("section1_personal.gender_other") && "border-red-500 focus-visible:ring-red-500")}
                                                />
                                                {renderFieldError("section1_personal.gender_other")}
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        {renderFieldLabel("Nationality", true, "section1_personal.nationality")}
                                        <p className="text-sm text-slate-500">If you hold multiple nationalities, please select all that apply.</p>
                                        <Popover
                                            open={nationalityPickerOpen}
                                            onOpenChange={(open) => {
                                                setNationalityPickerOpen(open);
                                                if (!open) setNationalityQuery("");
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "w-full h-10 justify-between font-normal text-left px-3",
                                                        hasFieldError("section1_personal.nationality") && shouldShowFieldError("section1_personal.nationality") && "border-red-500 text-red-600"
                                                    )}
                                                >
                                                    <span className={cn("truncate", formData.section1_personal.nationality.length === 0 && "text-slate-500")}>
                                                        {formData.section1_personal.nationality.length > 0
                                                            ? formData.section1_personal.nationality.join(", ")
                                                            : "Select your nationality or nationalities"}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <div className="p-2 border-b">
                                                    <Input
                                                        placeholder="Search nationality..."
                                                        value={nationalityQuery}
                                                        onChange={(e) => setNationalityQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-72 overflow-y-auto p-1">
                                                    {filteredNationalities.length > 0 ? filteredNationalities.map((option) => {
                                                        const selected = formData.section1_personal.nationality.includes(option);
                                                        return (
                                                            <button
                                                                key={option}
                                                                type="button"
                                                                className={cn(
                                                                    "w-full px-2 py-2 rounded-sm text-sm flex items-center justify-between hover:bg-slate-100 text-left",
                                                                    selected && "bg-[#E8F3E8] text-[#0F2E18] font-medium"
                                                                )}
                                                                onClick={() => {
                                                                    setFieldTouched("section1_personal.nationality");
                                                                    const nextNationalities = selected
                                                                        ? formData.section1_personal.nationality.filter((item) => item !== option)
                                                                        : [...formData.section1_personal.nationality, option].sort((a, b) => a.localeCompare(b));
                                                                    const nextFormData = {
                                                                        ...formData,
                                                                        section1_personal: {
                                                                            ...formData.section1_personal,
                                                                            nationality: nextNationalities,
                                                                        },
                                                                    };
                                                                    setFormData(nextFormData);
                                                                    syncFieldValidation(nextFormData, "section1_personal.nationality");
                                                                }}
                                                            >
                                                                <span className="truncate">{option}</span>
                                                                {selected && <Check className="h-4 w-4 shrink-0" />}
                                                            </button>
                                                        );
                                                    }) : (
                                                        <div className="px-2 py-6 text-sm text-center text-slate-500">
                                                            No matching nationalities found.
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {formData.section1_personal.nationality.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {formData.section1_personal.nationality.map((item) => (
                                                    <Badge key={item} variant="secondary" className="bg-[#E8F3E8] text-[#0F2E18] hover:bg-[#D8EAD8]">
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {renderFieldError("section1_personal.nationality")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Date of Birth", true, "section1_personal.date_of_birth")}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.section1_personal.date_of_birth && "text-muted-foreground",
                                                        hasFieldError("section1_personal.date_of_birth") && shouldShowFieldError("section1_personal.date_of_birth") && "border-red-500 text-red-500"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.section1_personal.date_of_birth ? format(new Date(formData.section1_personal.date_of_birth), "PPP", { locale: enGB }) : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.section1_personal.date_of_birth ? new Date(formData.section1_personal.date_of_birth.replace(/-/g, "/")) : undefined}
                                                    onSelect={(date: Date | undefined) => {
                                                        if (!date) return;
                                                        const nextValue = format(date, "yyyy-MM-dd");
                                                        setFieldTouched("section1_personal.date_of_birth");
                                                        updateField("section1_personal", "date_of_birth", nextValue, "section1_personal.date_of_birth");
                                                        syncFieldValidation({
                                                            ...formData,
                                                            section1_personal: {
                                                                ...formData.section1_personal,
                                                                date_of_birth: nextValue,
                                                            },
                                                        }, "section1_personal.date_of_birth");
                                                    }}
                                                    initialFocus
                                                    locale={enGB}
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {renderFieldError("section1_personal.date_of_birth")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Phone Number", true, "section1_personal.phone_number")}
                                        <Input
                                            type="tel"
                                            placeholder="e.g. +44 1234 567890"
                                            value={formData.section1_personal.phone_number}
                                            onChange={e => updateField("section1_personal", "phone_number", e.target.value, "section1_personal.phone_number")}
                                            onBlur={() => handleBlurValidation("section1_personal.phone_number")}
                                            disabled={isReadOnly}
                                            className={cn(hasFieldError("section1_personal.phone_number") && shouldShowFieldError("section1_personal.phone_number") && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {renderFieldError("section1_personal.phone_number")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Personal Email", true, "section1_personal.personal_email")}
                                        <Input
                                            type="email"
                                            value={formData.section1_personal.personal_email}
                                            onChange={e => updateField("section1_personal", "personal_email", e.target.value, "section1_personal.personal_email")}
                                            onBlur={() => handleBlurValidation("section1_personal.personal_email")}
                                            disabled={isReadOnly}
                                            className={cn(hasFieldError("section1_personal.personal_email") && shouldShowFieldError("section1_personal.personal_email") && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {renderFieldError("section1_personal.personal_email")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Cambridge Email", true, "section1_personal.cambridge_email")}
                                        <Input
                                            type="email"
                                            placeholder="abc123@cam.ac.uk or abc123@cantab.ac.uk"
                                            value={formData.section1_personal.cambridge_email}
                                            onChange={e => updateField("section1_personal", "cambridge_email", e.target.value, "section1_personal.cambridge_email")}
                                            onBlur={() => handleBlurValidation("section1_personal.cambridge_email")}
                                            disabled={isReadOnly}
                                            className={cn(hasFieldError("section1_personal.cambridge_email") && shouldShowFieldError("section1_personal.cambridge_email") && "border-red-500 focus-visible:ring-red-500")}
                                        />
                                        {renderFieldError("section1_personal.cambridge_email")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("College", true, "section1_personal.college")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.college} onValueChange={v => {
                                            setFieldTouched("section1_personal.college");
                                            updateField("section1_personal", "college", v, "section1_personal.college");
                                            syncFieldValidation({
                                                ...formData,
                                                section1_personal: {
                                                    ...formData.section1_personal,
                                                    college: v,
                                                },
                                            }, "section1_personal.college");
                                        }}>
                                            <SelectTrigger className={cn(hasFieldError("section1_personal.college") && shouldShowFieldError("section1_personal.college") && "border-red-500 focus:ring-red-500")}>
                                                <SelectValue placeholder="Select your college" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {renderFieldError("section1_personal.college")}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Subject / Programme", true, "section1_personal.subject")}
                                        <Popover
                                            open={subjectPickerOpen}
                                            onOpenChange={(open) => {
                                                setSubjectPickerOpen(open);
                                                if (!open) {
                                                    setSubjectQuery("");
                                                }
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "w-full justify-between font-normal text-left",
                                                        hasFieldError("section1_personal.subject") && shouldShowFieldError("section1_personal.subject") && "border-red-500 text-red-600"
                                                    )}
                                                >
                                                    <span className={cn("truncate", !formData.section1_personal.subject && "text-slate-500")}>
                                                        {formData.section1_personal.subject || "Select your primary subject"}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-60" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <div className="p-2 border-b">
                                                    <Input
                                                        placeholder="Search subject or programme..."
                                                        value={subjectQuery}
                                                        onChange={(e) => setSubjectQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-72 overflow-y-auto p-1">
                                                    {hasVisibleSubjectOptions ? (
                                                        <>
                                                            {(Object.entries(filteredSubjectGroups) as [string, string[]][]).map(([groupName, subjects]) => (
                                                                <div key={groupName} className="py-1">
                                                                    <div className="px-2 py-1 text-xs font-semibold text-slate-500">{groupName}</div>
                                                                    {subjects.map(subject => (
                                                                        <button
                                                                            key={subject}
                                                                            type="button"
                                                                            className={cn(
                                                                                "w-full px-2 py-1.5 rounded-sm text-sm flex items-center justify-between hover:bg-slate-100 text-left",
                                                                                formData.section1_personal.subject === subject && "bg-[#E8F3E8] text-[#0F2E18] font-medium"
                                                                            )}
                                                                            onClick={() => {
                                                                                setFieldTouched("section1_personal.subject");
                                                                                const nextFormData = {
                                                                                    ...formData,
                                                                                    section1_personal: {
                                                                                        ...formData.section1_personal,
                                                                                        subject,
                                                                                        subject_other: subject === "Other" ? formData.section1_personal.subject_other : "",
                                                                                    },
                                                                                };
                                                                                setFormData(nextFormData);
                                                                                syncFieldValidation(nextFormData, "section1_personal.subject");
                                                                                syncFieldValidation(nextFormData, "section1_personal.subject_other");
                                                                                setSubjectPickerOpen(false);
                                                                            }}
                                                                        >
                                                                            <span className="truncate">{subject}</span>
                                                                            {formData.section1_personal.subject === subject && <Check className="h-4 w-4 shrink-0" />}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                            {shouldShowFallbackOtherOption && (
                                                                <div className="py-1 border-t border-slate-100 mt-1 pt-2">
                                                                    <div className="px-2 py-1 text-xs font-semibold text-slate-500">Other</div>
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "w-full px-2 py-1.5 rounded-sm text-sm flex items-center justify-between hover:bg-slate-100 text-left",
                                                                            formData.section1_personal.subject === "Other" && "bg-[#E8F3E8] text-[#0F2E18] font-medium"
                                                                        )}
                                                                        onClick={() => {
                                                                            setFieldTouched("section1_personal.subject");
                                                                            const nextFormData = {
                                                                                ...formData,
                                                                                section1_personal: {
                                                                                    ...formData.section1_personal,
                                                                                    subject: "Other",
                                                                                },
                                                                            };
                                                                            setFormData(nextFormData);
                                                                            syncFieldValidation(nextFormData, "section1_personal.subject");
                                                                            setSubjectPickerOpen(false);
                                                                        }}
                                                                    >
                                                                        <span className="truncate">Other</span>
                                                                        {formData.section1_personal.subject === "Other" && <Check className="h-4 w-4 shrink-0" />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="px-2 py-6 text-sm text-center text-slate-500">
                                                            No matching subjects found.
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {renderFieldError("section1_personal.subject")}
                                        {formData.section1_personal.subject === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 space-y-2">
                                                <Input
                                                    placeholder="Please specify your subject or programme"
                                                    value={formData.section1_personal.subject_other || ""}
                                                    onChange={e => updateField("section1_personal", "subject_other", e.target.value, "section1_personal.subject_other")}
                                                    onBlur={() => handleBlurValidation("section1_personal.subject_other")}
                                                    disabled={isReadOnly}
                                                    className={cn(hasFieldError("section1_personal.subject_other") && shouldShowFieldError("section1_personal.subject_other") && "border-red-500 focus-visible:ring-red-500")}
                                                />
                                                {renderFieldError("section1_personal.subject_other")}
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Year of Study", true, "section1_personal.year_of_study")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.year_of_study || undefined} onValueChange={v => {
                                            setFieldTouched("section1_personal.year_of_study");
                                            const nextFormData = {
                                                ...formData,
                                                section1_personal: {
                                                    ...formData.section1_personal,
                                                    year_of_study: v,
                                                    year_of_study_other: v === "Other" ? formData.section1_personal.year_of_study_other : "",
                                                },
                                            };
                                            setFormData(nextFormData);
                                            syncFieldValidation(nextFormData, "section1_personal.year_of_study");
                                            syncFieldValidation(nextFormData, "section1_personal.year_of_study_other");
                                        }}>
                                            <SelectTrigger className={cn(hasFieldError("section1_personal.year_of_study") && shouldShowFieldError("section1_personal.year_of_study") && "border-red-500 focus:ring-red-500")}>
                                                <SelectValue placeholder="Select year of study" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YEAR_OF_STUDY_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {renderFieldError("section1_personal.year_of_study")}
                                        {formData.section1_personal.year_of_study === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 space-y-2">
                                                <Input
                                                    placeholder="Please specify your current year or stage of study"
                                                    value={formData.section1_personal.year_of_study_other || ""}
                                                    onChange={e => updateField("section1_personal", "year_of_study_other", e.target.value, "section1_personal.year_of_study_other")}
                                                    onBlur={() => handleBlurValidation("section1_personal.year_of_study_other")}
                                                    disabled={isReadOnly}
                                                    className={cn(hasFieldError("section1_personal.year_of_study_other") && shouldShowFieldError("section1_personal.year_of_study_other") && "border-red-500 focus-visible:ring-red-500")}
                                                />
                                                {renderFieldError("section1_personal.year_of_study_other")}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </Section>
                        )}

                        {currentSection === 2 && (
                            <Section number="02" title="Your Story" titleEn="Beyond the CV">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("Tell us about yourself.", true, "section2_about_you.tell_us_about_yourself")}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 space-y-2">
                                            <p>This is your chance to help us understand who you are beyond your academic profile. You may wish to touch on any of the following (but are not limited to):</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Academic achievements you&apos;re proud of</li>
                                                <li>Unique experiences that have shaped who you are</li>
                                                <li>Moments or accomplishments you&apos;re most proud of</li>
                                                <li>Personal qualities, interests, or anything else that helps us get to know you better</li>
                                            </ul>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section2_about_you.tell_us_about_yourself), getWordLimit("section2_about_you.tell_us_about_yourself") || 500)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section2_about_you.tell_us_about_yourself}
                                            onChange={e => updateField("section2_about_you", "tell_us_about_yourself", e.target.value, "section2_about_you.tell_us_about_yourself")}
                                            onBlur={() => handleBlurValidation("section2_about_you.tell_us_about_yourself")}
                                            className={cn("min-h-[250px] resize-y", hasFieldError("section2_about_you.tell_us_about_yourself") && shouldShowFieldError("section2_about_you.tell_us_about_yourself") && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isReadOnly}
                                        />
                                        {renderFieldError("section2_about_you.tell_us_about_yourself")}
                                    </div>

                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Upload your CV or any additional material you'd like to share (Optional)", false)}
                                        <p className="text-sm text-slate-500">Accepts PDF, DOC, DOCX, PNG, JPG up to 10MB.</p>
                                        <FileUpload
                                            onUpload={(url: string, fileName: string) => {
                                                updateField("section2_about_you", "additional_file_url", url);
                                                setUploadedFileName(fileName);
                                            }}
                                            disabled={isReadOnly}
                                            storagePath={`cv_uploads/${app.userId}`}
                                            uploadedUrl={formData.section2_about_you.additional_file_url}
                                            uploadedFileName={uploadedFileName}
                                            onRemove={() => {
                                                updateField("section2_about_you", "additional_file_url", "");
                                                setUploadedFileName("");
                                            }}
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {currentSection === 3 && (
                            <Section number="03" title="The Academy" titleEn="Passion for Teaching">
                                <div className="p-4 bg-[#E8F3E8] text-[#0F2E18] rounded-lg text-sm border border-[#1A4D2E]/20 mb-6 italic leading-relaxed">
                                    As part of the Jianshan Scholarship, selected participants will join our Academy programme, where you will have the opportunity to engage with local students through academic and cultural exchange sessions. This is a core part of the experience, and we&apos;d love to learn more about your interest and background in this area.
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("We'd love to learn about your passion for your chosen subject. What is the story behind your choice? What initially sparked your interest, and how has your understanding of the discipline evolved since you began your university studies?", true, "section3_teaching.subject_passion")}
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section3_teaching.subject_passion), getWordLimit("section3_teaching.subject_passion") || 500)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section3_teaching.subject_passion}
                                            onChange={e => updateField("section3_teaching", "subject_passion", e.target.value, "section3_teaching.subject_passion")}
                                            onBlur={() => handleBlurValidation("section3_teaching.subject_passion")}
                                            className={cn("min-h-[150px]", hasFieldError("section3_teaching.subject_passion") && shouldShowFieldError("section3_teaching.subject_passion") && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isReadOnly}
                                        />
                                        {renderFieldError("section3_teaching.subject_passion")}
                                    </div>
                                    <div className="space-y-3">
                                        {renderFieldLabel("What is your primary motivation for joining the Academy programme?", true, "section3_teaching.academy_motivation")}
                                        <p className="text-sm text-slate-500 italic">Whether it is the opportunity for cultural exchange, a passion for teaching and mentorship, or another personal drive, we&apos;d love to hear what makes this experience meaningful to you.</p>
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section3_teaching.academy_motivation), getWordLimit("section3_teaching.academy_motivation") || 500)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section3_teaching.academy_motivation}
                                            onChange={e => updateField("section3_teaching", "academy_motivation", e.target.value, "section3_teaching.academy_motivation")}
                                            onBlur={() => handleBlurValidation("section3_teaching.academy_motivation")}
                                            className={cn("min-h-[150px]", hasFieldError("section3_teaching.academy_motivation") && shouldShowFieldError("section3_teaching.academy_motivation") && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isReadOnly}
                                        />
                                        {renderFieldError("section3_teaching.academy_motivation")}
                                    </div>
                                </div>
                            </Section>
                        )}

                        {currentSection === 4 && (
                            <Section number="04" title="China Experience" titleEn="Cultural Exchange & Connection">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("What excites you most about visiting China?", true, "section4_travel.excitement_about_china")}
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section4_travel.excitement_about_china), getWordLimit("section4_travel.excitement_about_china") || 500)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section4_travel.excitement_about_china}
                                            onChange={e => updateField("section4_travel", "excitement_about_china", e.target.value, "section4_travel.excitement_about_china")}
                                            onBlur={() => handleBlurValidation("section4_travel.excitement_about_china")}
                                            className={cn("min-h-[150px]", hasFieldError("section4_travel.excitement_about_china") && shouldShowFieldError("section4_travel.excitement_about_china") && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isReadOnly}
                                        />
                                        {renderFieldError("section4_travel.excitement_about_china")}
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("As a group of 15–20 people, we'll be travelling together across China for around two weeks. What kind of energy and personality would you bring to the group?", true, "section4_travel.group_dynamics")}
                                        <p className="text-sm text-slate-500 italic">For example, you could tell us about your role in group settings, your travel style, or how you connect with others on the road.</p>
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section4_travel.group_dynamics), getWordLimit("section4_travel.group_dynamics") || 500)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section4_travel.group_dynamics}
                                            onChange={e => updateField("section4_travel", "group_dynamics", e.target.value, "section4_travel.group_dynamics")}
                                            onBlur={() => handleBlurValidation("section4_travel.group_dynamics")}
                                            className={cn("min-h-[150px]", hasFieldError("section4_travel.group_dynamics") && shouldShowFieldError("section4_travel.group_dynamics") && "border-red-500 focus-visible:ring-red-500")}
                                            disabled={isReadOnly}
                                        />
                                        {renderFieldError("section4_travel.group_dynamics")}
                                    </div>
                                </div>
                            </Section>
                        )}

                        {currentSection === 5 && (
                            <Section number="05" title="Logistics & Details" titleEn="Making it happen">
                                <div className="space-y-8">
                                    <div className="space-y-8">
                                        {LOGISTICS_CONFIRMATIONS.map((item) => (
                                            <div key={item.key} className="space-y-3">
                                                {renderFieldLabel(item.title, true, item.field)}
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 space-y-2">
                                                    <p>{item.description}</p>
                                                    {item.details.length > 0 && (
                                                        <ul className="list-disc pl-5 space-y-1">
                                                            {item.details.map((detail) => (
                                                                <li key={detail}>
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <label className={cn(
                                                    "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all text-sm mt-3",
                                                    formData.section5_availability[item.key] ? "border-[#1A4D2E] bg-[#E8F3E8] text-[#0F2E18] font-medium shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white",
                                                    hasFieldError(item.field) && shouldShowFieldError(item.field) ? "border-red-500 bg-red-50 text-red-700" : "",
                                                    isReadOnly && "cursor-default"
                                                )}>
                                                    <Checkbox
                                                        className="mt-0.5"
                                                        checked={formData.section5_availability[item.key]}
                                                        onCheckedChange={(checked) => {
                                                            setFieldTouched(item.field);
                                                            const nextFormData = {
                                                                ...formData,
                                                                section5_availability: {
                                                                    ...formData.section5_availability,
                                                                    [item.key]: checked === true,
                                                                },
                                                            };
                                                            setFormData(nextFormData);
                                                            syncFieldValidation(nextFormData, item.field);
                                                        }}
                                                        disabled={isReadOnly}
                                                    />
                                                    <span className="leading-snug">{item.checkboxLabel}</span>
                                                </label>
                                                {renderFieldError(item.field)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Do you have any dietary restrictions or allergies?", true, "section5_availability.dietary_restrictions")}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {DIETARY_RESTRICTIONS.map(d => (
                                                <label key={d} className={cn(
                                                    "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm",
                                                    formData.section5_availability.dietary_restrictions.includes(d) ? "border-[#1A4D2E] bg-[#E8F3E8] text-[#0F2E18] font-medium shadow-sm" : "border-slate-200 hover:border-slate-300",
                                                    hasFieldError("section5_availability.dietary_restrictions") && shouldShowFieldError("section5_availability.dietary_restrictions") ? "border-red-500 bg-red-50" : "",
                                                    isReadOnly && "cursor-default"
                                                )}>
                                                    <Checkbox
                                                        checked={formData.section5_availability.dietary_restrictions.includes(d)}
                                                        onCheckedChange={(checked) => {
                                                            if (isReadOnly) return;
                                                            setFieldTouched("section5_availability.dietary_restrictions");
                                                            let newDiets = [...formData.section5_availability.dietary_restrictions];
                                                            if (checked) {
                                                                if (d === "None") newDiets = ["None"];
                                                                else {
                                                                    newDiets = newDiets.filter(x => x !== "None");
                                                                    if (!newDiets.includes(d)) newDiets.push(d);
                                                                }
                                                            } else {
                                                                newDiets = newDiets.filter(x => x !== d);
                                                            }

                                                            const nextFormData = {
                                                                ...formData,
                                                                section5_availability: {
                                                                    ...formData.section5_availability,
                                                                    dietary_restrictions: newDiets,
                                                                    dietary_other: newDiets.includes("Other") ? formData.section5_availability.dietary_other : "",
                                                                },
                                                            };
                                                            setFormData(nextFormData);
                                                            syncFieldValidation(nextFormData, "section5_availability.dietary_restrictions");
                                                            syncFieldValidation(nextFormData, "section5_availability.dietary_other");
                                                        }}
                                                        disabled={isReadOnly}
                                                    />
                                                    {d}
                                                </label>
                                            ))}
                                        </div>
                                        {renderFieldError("section5_availability.dietary_restrictions")}
                                        {formData.section5_availability.dietary_restrictions.includes("Other") && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2 space-y-2">
                                                <Input
                                                    placeholder="Please specify your dietary restrictions"
                                                    value={formData.section5_availability.dietary_other || ""}
                                                    onChange={e => updateField("section5_availability", "dietary_other", e.target.value, "section5_availability.dietary_other")}
                                                    onBlur={() => handleBlurValidation("section5_availability.dietary_other")}
                                                    disabled={isReadOnly}
                                                    className={cn(hasFieldError("section5_availability.dietary_other") && shouldShowFieldError("section5_availability.dietary_other") && "border-red-500 focus-visible:ring-red-500")}
                                                />
                                                {renderFieldError("section5_availability.dietary_other")}
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Is there anything else you would like us to know? (Optional)", false)}
                                        <Textarea
                                            value={formData.section5_availability.additional_notes || ""}
                                            onChange={e => updateField("section5_availability", "additional_notes", e.target.value)}
                                            className="min-h-[100px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {currentSection === 6 && (
                            <Section number="06" title="Review your answers" titleEn="Final check before submission">
                                <div className="space-y-6">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 leading-6">
                                        Please review your answers carefully before submitting. If anything looks off, jump back to the relevant section and update it.
                                    </div>

                                    {submitAttempted && fieldErrors.length > 0 && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                            <div className="flex items-center gap-2 text-red-700 font-semibold">
                                                <CircleAlert className="h-4 w-4" />
                                                We found a few things to fix before submission.
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {[1, 2, 3, 4, 5].map((sectionNumber) => {
                                                    const errors = sectionErrors[sectionNumber] || [];
                                                    if (errors.length === 0) return null;
                                                    return (
                                                        <div key={sectionNumber} className="flex items-start justify-between gap-4 rounded-lg border border-red-100 bg-white px-4 py-3">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{SECTION_TITLES[sectionNumber as FormSection]}</p>
                                                                <ul className="mt-1 text-sm text-red-700 list-disc pl-5">
                                                                    {errors.map((error) => <li key={error.field}>{error.message}</li>)}
                                                                </ul>
                                                            </div>
                                                            <Button type="button" variant="outline" onClick={() => paginate(-1, sectionNumber as FormSection)}>
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {reviewSections.map((section) => {
                                            const errors = sectionErrors[section.id] || [];
                                            return (
                                                <div
                                                    key={section.id}
                                                    className={cn(
                                                        "rounded-xl border bg-white p-5 shadow-sm",
                                                        errors.length > 0 ? "border-red-200" : "border-slate-200"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-4 mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                                                            {errors.length > 0 && <p className="text-sm text-red-600 mt-1">{errors.length} issue{errors.length > 1 ? "s" : ""} to fix</p>}
                                                        </div>
                                                        <Button type="button" variant="outline" onClick={() => paginate(-1, section.id)}>
                                                            Edit section
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {section.items.map((item) => {
                                                            const error = fieldErrors.find((fieldError) => fieldError.field === item.field);
                                                            return (
                                                                <div key={`${section.id}-${item.label}`} className={cn("rounded-lg border px-4 py-3", error ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50")}>
                                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                                                                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800 break-words">{item.value}</div>
                                                                    {error && <div className="mt-2 text-xs font-medium text-red-600">{error.message}</div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {!isReadOnly && (
                        <>
                            <Button variant="outline" onClick={handleSave} disabled={saving} className="w-full sm:w-auto border-[#1A4D2E]/20 text-[#1A4D2E] hover:bg-[#E8F3E8] hover:text-[#0F2E18] transition-colors">
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Draft
                            </Button>
                            {autoSaved && (
                                <span className="text-sm text-green-600 flex items-center gap-1 absolute ml-[140px] sm:relative sm:ml-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </span>
                            )}
                        </>
                    )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    {currentSection > 1 && (
                        <Button variant="outline" className="flex-1 sm:flex-none border-[#1A4D2E]/20 text-[#1A4D2E] hover:bg-[#E8F3E8] hover:text-[#0F2E18] transition-colors" onClick={() => paginate(-1, (currentSection - 1) as FormSection)}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                    )}

                    {currentSection < 6 ? (
                        <Button className="flex-1 sm:flex-none bg-[#1A4D2E] hover:bg-[#0F2E18] text-[#FDFBF7] transition-colors" onClick={handleNext}>
                            {currentSection === 5 ? "Continue to Review" : "Next"} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        !isReadOnly && (
                            <Button
                                onClick={handleSubmit}
                                disabled={saving || submitting}
                                className="flex-1 sm:flex-none bg-[#1A4D2E] hover:bg-[#0F2E18] text-[#FDFBF7] hover:shadow-lg transition-all"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" /> Submit Application</>
                                )}
                            </Button>
                        )
                    )}
                </div>
            </div>

            {!isReadOnly && currentSection !== 6 && validatedSections[currentSection as Exclude<FormSection, 6>] && sectionErrors[currentSection]?.length > 0 && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mt-4 animate-in fade-in zoom-in duration-300">
                    <p className="font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Please complete this section before moving on:
                    </p>
                    <ul className="list-disc pl-8 mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {sectionErrors[currentSection].map((err) => (
                            <li key={err.field}>{err.message}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
