"use client"

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Application } from "@/lib/types";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Send, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { SUBJECTS, YEAR_OPTIONS, AVAILABILITY_OPTIONS, REFERRAL_SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Simple textarea component (no import needed since we use native)
function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn("flex min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y", className)} {...props} />;
}

type Section = 'personal' | 'essays' | 'misc';

export default function ApplicationForm() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [autoSaved, setAutoSaved] = useState(false);
    const [section, setSection] = useState<Section>('personal');

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [nationality, setNationality] = useState('');
    const [gender, setGender] = useState('');
    const [university, setUniversity] = useState('');
    const [college, setCollege] = useState('');
    const [department, setDepartment] = useState('');
    const [programme, setProgramme] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [otherSubject, setOtherSubject] = useState('');

    const [motivation, setMotivation] = useState('');
    const [experience, setExperience] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    const [availability, setAvailability] = useState<string[]>([]);
    const [dietaryRestrictions, setDietaryRestrictions] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const isReadOnly = app?.status !== 'draft';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load existing application
    useEffect(() => {
        const fetchApp = async () => {
            if (!user) return;
            try {
                const myApp = await dbService.getMyApplication(user.uid);
                if (!myApp) {
                    router.replace('/welcome');
                    return;
                }
                setApp(myApp);
                // Populate form fields
                setFirstName(myApp.personalInfo?.firstName || '');
                setLastName(myApp.personalInfo?.lastName || '');
                setEmail(myApp.personalInfo?.email || user.email || '');
                setPhone(myApp.personalInfo?.phone || '');
                setDateOfBirth(myApp.personalInfo?.dateOfBirth || '');
                setNationality(myApp.personalInfo?.nationality || '');
                setGender(myApp.personalInfo?.gender || '');
                setUniversity(myApp.personalInfo?.university || '');
                setCollege(myApp.personalInfo?.college || '');
                setDepartment(myApp.personalInfo?.department || '');
                setProgramme(myApp.personalInfo?.programme || '');
                setYearOfStudy(myApp.personalInfo?.yearOfStudy || '');
                setSubjects(myApp.personalInfo?.subjects || []);
                setOtherSubject(myApp.personalInfo?.otherSubject || '');
                setMotivation(myApp.essays?.motivation || '');
                setExperience(myApp.essays?.experience || '');
                setAdditionalInfo(myApp.essays?.additionalInfo || '');
                setAvailability(myApp.misc?.availability || []);
                setDietaryRestrictions(myApp.misc?.dietaryRestrictions || '');
                setReferralSource(myApp.misc?.referralSource || '');
                setAgreedToTerms(myApp.misc?.agreedToTerms || false);
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [user, router]);

    const getFormData = useCallback((): Partial<Application> => ({
        personalInfo: {
            firstName, lastName, email, phone, dateOfBirth, nationality, gender,
            university, college, department, programme, yearOfStudy,
            subjects, otherSubject,
        },
        essays: { motivation, experience, additionalInfo },
        misc: { availability, dietaryRestrictions, referralSource, agreedToTerms },
    }), [firstName, lastName, email, phone, dateOfBirth, nationality, gender, university, college, department, programme, yearOfStudy, subjects, otherSubject, motivation, experience, additionalInfo, availability, dietaryRestrictions, referralSource, agreedToTerms]);

    const handleSave = async () => {
        if (!user || isReadOnly) return;
        setSaving(true);
        try {
            await dbService.saveApplication(user.uid, getFormData());
            setAutoSaved(true);
            setTimeout(() => setAutoSaved(false), 2000);
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || isReadOnly) return;
        if (!firstName || !lastName || !email || !university || !yearOfStudy) {
            alert("Please fill in all required fields (name, email, university, year of study).");
            return;
        }
        if (!motivation) {
            alert("Please write your motivation essay before submitting.");
            setSection('essays');
            return;
        }
        if (!agreedToTerms) {
            alert("Please agree to the terms and conditions.");
            setSection('misc');
            return;
        }

        setSubmitting(true);
        try {
            await dbService.saveApplication(user.uid, getFormData());
            await dbService.submitApplication(user.uid);
            router.push('/dashboard');
        } catch (err) {
            console.error("Submit failed:", err);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSubject = (s: string) => {
        if (isReadOnly) return;
        setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const toggleAvailability = (a: string) => {
        if (isReadOnly) return;
        setAvailability(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
    };

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!user || !app) return null;

    const sections: { key: Section; label: string }[] = [
        { key: 'personal', label: 'Personal Details' },
        { key: 'essays', label: 'Essays' },
        { key: 'misc', label: 'Additional Info' },
    ];

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mb-4 text-slate-500">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {isReadOnly ? 'Your Application' : 'Tutor Application Form'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isReadOnly ? 'Your submitted application (read-only)' : 'Fill in your details to apply as a Cambridge tutor'}
                    </p>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSection(s.key)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                section === s.key
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                    {section === 'personal' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Personal Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name *</Label>
                                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name *</Label>
                                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" disabled={isReadOnly} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="js123@cam.ac.uk" disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7..." disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nationality</Label>
                                    <Input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. British" disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={gender} onValueChange={setGender} disabled={isReadOnly}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="non-binary">Non-binary</SelectItem>
                                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Academic Background</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>University *</Label>
                                        <Input value={university} onChange={e => setUniversity(e.target.value)} placeholder="University of Cambridge" disabled={isReadOnly} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>College</Label>
                                        <Input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. Trinity College" disabled={isReadOnly} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Department of Engineering" disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Degree Programme</Label>
                                        <Input value={programme} onChange={e => setProgramme(e.target.value)} placeholder="e.g. MEng Engineering" disabled={isReadOnly} />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label>Year of Study *</Label>
                                    <Select value={yearOfStudy} onValueChange={setYearOfStudy} disabled={isReadOnly}>
                                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                        <SelectContent>
                                            {YEAR_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Subjects You Can Tutor</h3>
                                <p className="text-sm text-slate-500 mb-4">Select all subjects you&apos;re comfortable teaching</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {SUBJECTS.map(s => (
                                        <label key={s} className={cn(
                                            "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm",
                                            subjects.includes(s) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300",
                                            isReadOnly && "cursor-default"
                                        )}>
                                            <Checkbox checked={subjects.includes(s)} onCheckedChange={() => toggleSubject(s)} disabled={isReadOnly} />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                                {subjects.includes('Other') && (
                                    <div className="mt-3 space-y-2">
                                        <Label>Please specify</Label>
                                        <Input value={otherSubject} onChange={e => setOtherSubject(e.target.value)} placeholder="Other subject(s)" disabled={isReadOnly} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {section === 'essays' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Essays</h2>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Why do you want to be a tutor for this programme? *</Label>
                                <p className="text-sm text-slate-500 mb-2">Tell us about your motivation and what you hope to bring to the students. (200-500 words recommended)</p>
                                <Textarea value={motivation} onChange={e => setMotivation(e.target.value)} placeholder="Share your motivation..." rows={8} disabled={isReadOnly} />
                                <p className="text-xs text-slate-400 text-right">{motivation.split(/\s+/).filter(Boolean).length} words</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Teaching or Mentoring Experience</Label>
                                <p className="text-sm text-slate-500 mb-2">Describe any relevant teaching, tutoring, or mentoring experience you have. (optional but recommended)</p>
                                <Textarea value={experience} onChange={e => setExperience(e.target.value)} placeholder="Describe your experience..." rows={6} disabled={isReadOnly} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Anything Else?</Label>
                                <p className="text-sm text-slate-500 mb-2">Is there anything else you&apos;d like us to know about you?</p>
                                <Textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Optional..." rows={4} disabled={isReadOnly} />
                            </div>
                        </div>
                    )}

                    {section === 'misc' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Information</h2>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Availability</Label>
                                <p className="text-sm text-slate-500 mb-3">Select the periods you&apos;re available for the programme</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {AVAILABILITY_OPTIONS.map(a => (
                                        <label key={a} className={cn(
                                            "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm",
                                            availability.includes(a) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300",
                                            isReadOnly && "cursor-default"
                                        )}>
                                            <Checkbox checked={availability.includes(a)} onCheckedChange={() => toggleAvailability(a)} disabled={isReadOnly} />
                                            {a}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Dietary Restrictions</Label>
                                <Input value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)} placeholder="e.g. Vegetarian, Halal, None" disabled={isReadOnly} />
                            </div>

                            <div className="space-y-2">
                                <Label>How did you hear about this programme?</Label>
                                <Select value={referralSource} onValueChange={setReferralSource} disabled={isReadOnly}>
                                    <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
                                    <SelectContent>
                                        {REFERRAL_SOURCES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-6 mt-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <Checkbox
                                        checked={agreedToTerms}
                                        onCheckedChange={(v) => setAgreedToTerms(!!v)}
                                        disabled={isReadOnly}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm text-slate-700 leading-relaxed">
                                        I confirm that the information provided is accurate and I agree to the programme&apos;s terms and conditions,
                                        including the data privacy policy. *
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Draft
                            </Button>
                            {autoSaved && (
                                <span className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Saved
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {section !== 'personal' && (
                                <Button variant="outline" onClick={() => setSection(section === 'misc' ? 'essays' : 'personal')}>
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                            )}
                            {section !== 'misc' ? (
                                <Button onClick={() => { setSection(section === 'personal' ? 'essays' : 'misc'); }}>
                                    Next <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Submit Application
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
