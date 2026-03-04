"use client";

import React, { useState, useMemo } from "react";
import { Application } from "@/lib/types";
import { COLLEGES, SUBJECTS_GROUPED, DEGREE_LEVELS, YEAR_OF_STUDY_OPTIONS, DIETARY_RESTRICTIONS, GENDER_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Send, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Check, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "./section";
import { AvailabilityCalendar } from "./availability-calendar";
import { FileUpload } from "@/components/ui/file-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

type FormSection = 1 | 2 | 3 | 4 | 5;

interface ApplicationFormProps {
    app: Application;
    isReadOnly?: boolean;
    onSave: (data: Partial<Application>) => Promise<void>;
    onSubmit: (data: Partial<Application>) => Promise<void>;
    saving: boolean;
    submitting: boolean;
}

export function ApplicationForm({ app, isReadOnly = false, onSave, onSubmit, saving, submitting }: ApplicationFormProps) {
    const [currentSection, setCurrentSection] = useState<FormSection>(1);
    const [autoSaved, setAutoSaved] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
    const [subjectQuery, setSubjectQuery] = useState("");

    // Initialize state from app or defaults
    const [formData, setFormData] = useState({
        section1_personal: {
            full_name: app.section1_personal?.full_name || "",
            gender: app.section1_personal?.gender || "",
            gender_other: app.section1_personal?.gender_other || "",
            nationality: app.section1_personal?.nationality || "",
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
        }
    });

    const updateField = (section: keyof typeof formData, field: string, value: string | string[]) => {
        if (isReadOnly) return;
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
        // Optional: Trigger auto-save if needed, skipping for now to rely on manual save
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

    const countWords = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

    const validateForm = () => {
        const errors: string[] = [];
        const { section1_personal, section2_about_you, section3_teaching, section4_travel, section5_availability } = formData;

        // Section 1 rules
        if (!section1_personal.full_name) errors.push("Full Name");
        if (!section1_personal.gender || (section1_personal.gender === "Other" && !section1_personal.gender_other)) errors.push("Gender");
        if (!section1_personal.nationality) errors.push("Nationality");
        if (!section1_personal.date_of_birth) errors.push("Date of Birth");
        if (!section1_personal.phone_number) errors.push("Phone Number");
        if (!section1_personal.personal_email) errors.push("Personal Email");
        if (!section1_personal.cambridge_email || !section1_personal.cambridge_email.endsWith('@cam.ac.uk')) errors.push("Cambridge Email");
        if (!section1_personal.college) errors.push("College");
        if (!section1_personal.subject || (section1_personal.subject === "Other" && !section1_personal.subject_other)) errors.push("Subject");
        if (!section1_personal.year_of_study || (section1_personal.year_of_study === "Other" && !section1_personal.year_of_study_other)) errors.push("Year of Study");

        // Section 2
        if (!section2_about_you.tell_us_about_yourself) errors.push("About Yourself");
        if (countWords(section2_about_you.tell_us_about_yourself) > 300) errors.push("About Yourself (Word Limit)");

        // Section 3
        if (!section3_teaching.subject_passion) errors.push("Subject Passion");
        if (countWords(section3_teaching.subject_passion) > 300) errors.push("Subject Passion (Word Limit)");
        if (!section3_teaching.academy_motivation) errors.push("Academy Motivation");
        if (countWords(section3_teaching.academy_motivation) > 300) errors.push("Academy Motivation (Word Limit)");

        // Section 4
        if (!section4_travel.excitement_about_china) errors.push("Excitement about China");
        if (countWords(section4_travel.excitement_about_china) > 300) errors.push("Excitement about China (Word Limit)");
        if (!section4_travel.group_dynamics) errors.push("Group Dynamics");
        if (countWords(section4_travel.group_dynamics) > 300) errors.push("Group Dynamics (Word Limit)");

        // Section 5
        if (section5_availability.dietary_restrictions.length === 0) errors.push("Dietary Restrictions");
        if (section5_availability.dietary_restrictions.includes("Other") && !section5_availability.dietary_other) errors.push("Dietary Other");

        setValidationErrors(errors);
        return errors;
    };

    const handleSubmit = async () => {
        if (isReadOnly) return;
        setSubmitAttempted(true);
        const errors = validateForm();
        if (errors.length > 0) {
            // Find which section has errors and jump there
            // Simplified jump: just alert for now, or you could map fields to sections
            alert(`Please complete all required fields correctly. Missing/Invalid: \n${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err) {
            console.error("Submit failed", err);
        }
    };

    const isInvalid = (fieldLabel: string) => validationErrors.includes(fieldLabel);

    const renderFieldLabel = (label: string, required = true, className?: string) => (
        <Label className={cn("flex items-center gap-1 text-slate-700 text-sm font-semibold", isInvalid(label) && submitAttempted ? "text-red-500" : "", className)}>
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

    const filteredSubjectGroups = useMemo(() => {
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

    const hasSubjectMatches = Object.keys(filteredSubjectGroups).length > 0;

    const paginate = (newDirection: number, section: FormSection) => {
        setPage([section, newDirection]);
        setCurrentSection(section);
        // Scroll to top of form when paginating smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sectionsData = [
        { id: 1, title: "Personal Profile" },
        { id: 2, title: "Your Story" },
        { id: 3, title: "The Academy" },
        { id: 4, title: "China Experience" },
        { id: 5, title: "Logistics & Details" }
    ]; return (
        <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* Progress Bar & Header */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50 p-4 md:p-6 sticky top-20 z-40 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isReadOnly ? "Your Application" : "Application Form"}
                    </h2>
                    <div className="text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                        Section {currentSection} of 5
                    </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="grid grid-cols-5 gap-2 w-full h-2">
                    {sectionsData.map(s => (
                        <div
                            key={s.id}
                            onClick={() => !isReadOnly && paginate(s.id > currentSection ? 1 : -1, s.id as FormSection)}
                            className={cn(
                                "h-2 w-full rounded-full transition-colors duration-300 cursor-pointer",
                                s.id === currentSection ? "bg-[#1A4D2E]" : s.id < currentSection ? "bg-[#8AC1A6]" : "bg-slate-100"
                            )}
                        />
                    ))}
                </div>

                {/* Mini mobile nav text */}
                <div className="mt-3 hidden md:grid grid-cols-5 gap-2">
                    {sectionsData.map(s => (
                        <div key={s.id} className={cn("text-center text-xs text-slate-500 font-medium transition-colors cursor-pointer", currentSection === s.id ? "text-[#1A4D2E] font-bold" : "hover:text-slate-800")}
                            onClick={() => !isReadOnly && paginate(s.id > currentSection ? 1 : -1, s.id as FormSection)}>
                            {s.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Pager */}
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
                        {/* SECTION 1 */}
                        {currentSection === 1 && (
                            <Section number="01" title="Personal Profile" titleEn="Let's start with the basics">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        {renderFieldLabel("Full Name")}
                                        <Input value={formData.section1_personal.full_name} onChange={e => updateField('section1_personal', 'full_name', e.target.value)} disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        {renderFieldLabel("Gender")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.gender} onValueChange={v => {
                                            updateField('section1_personal', 'gender', v);
                                            if (v !== "Other") {
                                                updateField('section1_personal', 'gender_other', "");
                                            }
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Select your gender" /></SelectTrigger>
                                            <SelectContent>
                                                {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {formData.section1_personal.gender === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                                <Input placeholder="Please specify your gender" value={formData.section1_personal.gender_other || ""} onChange={e => updateField('section1_personal', 'gender_other', e.target.value)} disabled={isReadOnly} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {renderFieldLabel("Nationality")}
                                        <Input placeholder="If you hold multiple nationalities, please list all." value={formData.section1_personal.nationality} onChange={e => updateField('section1_personal', 'nationality', e.target.value)} disabled={isReadOnly} />
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Date of Birth")}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.section1_personal.date_of_birth && "text-muted-foreground",
                                                        isInvalid("Date of Birth") ? "border-red-500 text-red-500" : ""
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.section1_personal.date_of_birth ? format(new Date(formData.section1_personal.date_of_birth), "PPP", { locale: enGB }) : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.section1_personal.date_of_birth ? new Date(formData.section1_personal.date_of_birth.replace(/-/g, '/')) : undefined}
                                                    onSelect={(date: Date | undefined) => date && updateField('section1_personal', 'date_of_birth', format(date, 'yyyy-MM-dd'))}
                                                    initialFocus
                                                    locale={enGB}
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        {renderFieldLabel("Phone Number")}
                                        <Input type="tel" placeholder="e.g. +44 1234567890" value={formData.section1_personal.phone_number} onChange={e => updateField('section1_personal', 'phone_number', e.target.value)} disabled={isReadOnly} />
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Personal Email")}
                                        <Input type="email" value={formData.section1_personal.personal_email} onChange={e => updateField('section1_personal', 'personal_email', e.target.value)} disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        {renderFieldLabel("Cambridge Email")}
                                        <Input type="email" placeholder="abc123@cam.ac.uk" value={formData.section1_personal.cambridge_email} onChange={e => updateField('section1_personal', 'cambridge_email', e.target.value)} disabled={isReadOnly} />
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("College")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.college} onValueChange={v => updateField('section1_personal', 'college', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select your college" /></SelectTrigger>
                                            <SelectContent>
                                                {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Subject / Programme")}
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
                                                    className="w-full justify-between font-normal text-left"
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
                                                    {hasSubjectMatches ? (
                                                        (Object.entries(filteredSubjectGroups) as [string, string[]][]).map(([groupName, subjects]) => (
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
                                                                            updateField('section1_personal', 'subject', subject);
                                                                            if (subject !== "Other") {
                                                                                updateField('section1_personal', 'subject_other', "");
                                                                            }
                                                                            setSubjectPickerOpen(false);
                                                                        }}
                                                                    >
                                                                        <span className="truncate">{subject}</span>
                                                                        {formData.section1_personal.subject === subject && <Check className="h-4 w-4 shrink-0" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-2 py-6 text-sm text-center text-slate-500">
                                                            No matching subjects found.
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {formData.section1_personal.subject === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                                <Input placeholder="Please specify your subject or programme" value={formData.section1_personal.subject_other || ""} onChange={e => updateField('section1_personal', 'subject_other', e.target.value)} disabled={isReadOnly} />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {renderFieldLabel("Year of Study")}
                                        <Select disabled={isReadOnly} value={formData.section1_personal.year_of_study || undefined} onValueChange={v => updateField('section1_personal', 'year_of_study', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select year of study" /></SelectTrigger>
                                            <SelectContent>
                                                {YEAR_OF_STUDY_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {formData.section1_personal.year_of_study === "Other" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                                <Input placeholder="Please specify your current year or stage of study" value={formData.section1_personal.year_of_study_other || ""} onChange={e => updateField('section1_personal', 'year_of_study_other', e.target.value)} disabled={isReadOnly} />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* SECTION 2 */}
                        {currentSection === 2 && (
                            <Section number="02" title="Your Story" titleEn="Beyond the CV">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("Tell us about yourself.")}
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
                                                {renderWordCount(countWords(formData.section2_about_you.tell_us_about_yourself), 300)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section2_about_you.tell_us_about_yourself}
                                            onChange={e => updateField('section2_about_you', 'tell_us_about_yourself', e.target.value)}
                                            className="min-h-[250px] resize-y"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Upload your CV or any additional material you'd like to share (Optional)", false)}
                                        <p className="text-sm text-slate-500">Accepts PDF, DOC, DOCX, PNG, JPG up to 10MB.</p>
                                        <FileUpload
                                            onUpload={(url: string) => updateField('section2_about_you', 'additional_file_url', url)}
                                            disabled={isReadOnly}
                                            storagePath={`cv_uploads/${app.userId}`}
                                        />
                                        {formData.section2_about_you.additional_file_url && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="text-sm border border-slate-200 bg-white px-3 py-1.5 rounded-md flex items-center text-slate-700">
                                                    <a href={formData.section2_about_you.additional_file_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#1A4D2E] truncate max-w-[200px]">View Uploaded File</a>
                                                </div>
                                                {!isReadOnly && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => updateField('section2_about_you', 'additional_file_url', '')} className="text-red-500 h-8 px-2">Remove</Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* SECTION 3 */}
                        {currentSection === 3 && (
                            <Section number="03" title="The Academy" titleEn="Passion for Teaching">
                                <div className="p-4 bg-[#E8F3E8] text-[#0F2E18] rounded-lg text-sm border border-[#1A4D2E]/20 mb-6 italic leading-relaxed">
                                    As part of the Jianshan Scholarship, selected participants will join our Academy programme, where you will have the opportunity to engage with local students through academic and cultural exchange sessions. This is a core part of the experience, and we&apos;d love to learn more about your interest and background in this area.
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("We'd love to learn about your passion for your chosen subject. What is the story behind your choice? What initially sparked your interest, and how has your understanding of the discipline evolved since you began your university studies?")}
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section3_teaching.subject_passion), 300)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section3_teaching.subject_passion}
                                            onChange={e => updateField('section3_teaching', 'subject_passion', e.target.value)}
                                            className="min-h-[150px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {renderFieldLabel("What is your primary motivation for joining the Academy programme?")}
                                        <p className="text-sm text-slate-500 italic">Whether it is the opportunity for cultural exchange, a passion for teaching and mentorship, or another personal drive, we&apos;d love to hear what makes this experience meaningful to you.</p>
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section3_teaching.academy_motivation), 300)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section3_teaching.academy_motivation}
                                            onChange={e => updateField('section3_teaching', 'academy_motivation', e.target.value)}
                                            className="min-h-[150px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* SECTION 4 */}
                        {currentSection === 4 && (
                            <Section number="04" title="China Experience" titleEn="Cultural Exchange & Connection">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("What excites you most about visiting China?")}
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section4_travel.excitement_about_china), 300)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section4_travel.excitement_about_china}
                                            onChange={e => updateField('section4_travel', 'excitement_about_china', e.target.value)}
                                            className="min-h-[150px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("As a group of 15–20 people, we'll be travelling together across China for around two weeks. What kind of energy and personality would you bring to the group?")}
                                        <p className="text-sm text-slate-500 italic">For example, you could tell us about your role in group settings, your travel style, or how you connect with others on the road.</p>
                                        <div className="flex justify-end">
                                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                                                {renderWordCount(countWords(formData.section4_travel.group_dynamics), 300)}
                                            </div>
                                        </div>
                                        <Textarea
                                            value={formData.section4_travel.group_dynamics}
                                            onChange={e => updateField('section4_travel', 'group_dynamics', e.target.value)}
                                            className="min-h-[150px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* SECTION 5 */}
                        {currentSection === 5 && (
                            <Section number="05" title="Logistics & Details" titleEn="Making it happen">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        {renderFieldLabel("Please select all dates you are available in July and August 2026.", false)}
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 space-y-2">
                                            <p className="italic text-slate-500 font-medium">We will be running multiple programs between July and August 2026; each program typically involves 7 days in the Academy followed by an 11-day trip.</p>
                                            <p className="italic text-slate-500 font-medium">Please select all dates you are available. We will allocate participants to specific programs based on your indicated availability. You can click individual dates, drag to select a range, or use the quick-select options below.</p>
                                        </div>
                                        <AvailabilityCalendar
                                            selectedDates={formData.section5_availability.available_dates}
                                            onChange={(dates) => updateField('section5_availability', 'available_dates', dates)}
                                            readonly={isReadOnly}
                                        />
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Do you have any dietary restrictions or allergies?")}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {DIETARY_RESTRICTIONS.map(d => (
                                                <label key={d} className={cn(
                                                    "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm",
                                                    formData.section5_availability.dietary_restrictions.includes(d) ? "border-[#1A4D2E] bg-[#E8F3E8] text-[#0F2E18] font-medium shadow-sm" : "border-slate-200 hover:border-slate-300",
                                                    isReadOnly && "cursor-default"
                                                )}>
                                                    <Checkbox
                                                        checked={formData.section5_availability.dietary_restrictions.includes(d)}
                                                        onCheckedChange={(checked) => {
                                                            if (isReadOnly) return;
                                                            // Logic: If 'None' is checked, uncheck others. If others checked, uncheck 'None'.
                                                            let newDiets = [...formData.section5_availability.dietary_restrictions];
                                                            if (checked) {
                                                                if (d === 'None') newDiets = ['None'];
                                                                else {
                                                                    newDiets = newDiets.filter(x => x !== 'None');
                                                                    newDiets.push(d);
                                                                }
                                                            } else {
                                                                newDiets = newDiets.filter(x => x !== d);
                                                            }
                                                            updateField('section5_availability', 'dietary_restrictions', newDiets);
                                                        }}
                                                        disabled={isReadOnly}
                                                    />
                                                    {d}
                                                </label>
                                            ))}
                                        </div>
                                        {formData.section5_availability.dietary_restrictions.includes("Other") && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                                <Input
                                                    placeholder="Please specify your dietary restrictions"
                                                    value={formData.section5_availability.dietary_other || ""}
                                                    onChange={e => updateField('section5_availability', 'dietary_other', e.target.value)}
                                                    disabled={isReadOnly}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                    <div className="space-y-3 border-t pt-6">
                                        {renderFieldLabel("Is there anything else you would like us to know? (Optional)", false)}
                                        <Textarea
                                            value={formData.section5_availability.additional_notes || ""}
                                            onChange={e => updateField('section5_availability', 'additional_notes', e.target.value)}
                                            className="min-h-[100px]"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </Section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
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

                    {currentSection < 5 ? (
                        <Button className="flex-1 sm:flex-none bg-[#1A4D2E] hover:bg-[#0F2E18] text-[#FDFBF7] transition-colors" onClick={() => paginate(1, (currentSection + 1) as FormSection)}>
                            Next <ArrowRight className="w-4 h-4 ml-1" />
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

            {submitAttempted && validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mt-4 animate-in fade-in zoom-in duration-300">
                    <p className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Please complete all required fields:</p>
                    <ul className="list-disc pl-8 mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
