import * as XLSX from "xlsx";

import { Application } from "@/lib/types";

type ExportRow = Record<string, string>;

const YES = "Yes";
const NO = "No";

const formatValue = (value: string | null | undefined) => value ?? "";

const formatBoolean = (value: boolean | null | undefined) => {
    if (value === undefined || value === null) return "";
    return value ? YES : NO;
};

const formatArray = (value: string[] | null | undefined) => value?.filter(Boolean).join(", ") || "";

const formatNotes = (notes: NonNullable<Application["adminData"]>["notes"] | undefined) => {
    if (!notes?.length) return "";
    return notes
        .map((note) => {
            const timestamp = "createdAt" in note ? note.createdAt : note.date;
            const author = note.author || "Unknown";
            const content = note.content || "";
            return [timestamp, `${author}: ${content}`].filter(Boolean).join(" | ");
        })
        .join("\n");
};

const getDisplayGender = (application: Application) => {
    const gender = application.section1_personal?.gender;
    if (gender === "Other") {
        return formatValue(application.section1_personal?.gender_other) || gender;
    }
    return formatValue(gender);
};

const getDisplaySubject = (application: Application) => {
    const subject = application.section1_personal?.subject;
    if (subject === "Other") {
        return formatValue(application.section1_personal?.subject_other) || subject;
    }
    return formatValue(subject);
};

const getDisplayYearOfStudy = (application: Application) => {
    const year = application.section1_personal?.year_of_study;
    if (year === "Other") {
        return formatValue(application.section1_personal?.year_of_study_other) || year;
    }
    return formatValue(year);
};

export function buildAdminApplicationExportRows(applications: Application[]): ExportRow[] {
    return applications.map((application) => ({
        "Application ID": formatValue(application.id),
        "User ID": formatValue(application.userId),
        "Status": formatValue(application.status),
        "Internal Decision": formatValue(application.adminData?.internalDecision),
        "Created At": formatValue(application.createdAt),
        "Submitted At": formatValue(application.submittedAt || application.timeline?.submittedAt),
        "Last Updated At": formatValue(application.lastUpdatedAt),
        "Decision Released At": formatValue(application.decisionReleasedAt),

        "Full Name": formatValue(application.section1_personal?.full_name),
        "Personal Email": formatValue(application.section1_personal?.personal_email),
        "Cambridge Email": formatValue(application.section1_personal?.cambridge_email),
        "Phone Number": formatValue(application.section1_personal?.phone_number),
        "Date of Birth": formatValue(application.section1_personal?.date_of_birth),
        "Gender": getDisplayGender(application),
        "Nationality": formatValue(application.section1_personal?.nationality),
        "College": formatValue(application.section1_personal?.college),
        "Subject": getDisplaySubject(application),
        "Year of Study": getDisplayYearOfStudy(application),

        "About You": formatValue(application.section2_about_you?.tell_us_about_yourself),
        "Additional File URL": formatValue(application.section2_about_you?.additional_file_url),
        "Subject Passion": formatValue(application.section3_teaching?.subject_passion),
        "Academy Motivation": formatValue(application.section3_teaching?.academy_motivation),
        "Excitement About China": formatValue(application.section4_travel?.excitement_about_china),
        "Group Dynamics": formatValue(application.section4_travel?.group_dynamics),

        "Available Dates": formatArray(application.section5_availability?.available_dates),
        "Dietary Restrictions": formatArray(application.section5_availability?.dietary_restrictions),
        "Dietary Other": formatValue(application.section5_availability?.dietary_other),
        "Availability Notes": formatValue(application.section5_availability?.additional_notes),
        "Confirms Program Dates": formatBoolean(application.section5_availability?.confirms_program_dates),
        "Confirms Flight Costs": formatBoolean(application.section5_availability?.confirms_flight_costs),
        "Confirms Visa Responsibility": formatBoolean(application.section5_availability?.confirms_visa_responsibility),

        "Round 2 Session Design Thoughts": formatValue(application.section6_round_2?.session_design_thoughts),
        "Round 2 Type A Session Title": formatValue(application.section6_round_2?.type_a_session_title),
        "Round 2 Type A Session Thoughts": formatValue(application.section6_round_2?.type_a_session_thoughts),
        "Round 2 Type B Session Title": formatValue(application.section6_round_2?.type_b_session_title),
        "Round 2 Type B Session Thoughts": formatValue(application.section6_round_2?.type_b_session_thoughts),
        "Round 2 Video URL": formatValue(application.section6_round_2?.video_url),
        "Round 2 Confirms Workload Readiness": formatBoolean(application.section6_round_2?.confirms_workload_readiness),
        "Round 2 Confirms Deposit Terms": formatBoolean(application.section6_round_2?.confirms_deposit_terms),
        "Round 2 Confirms Flight Costs": formatBoolean(application.section6_round_2?.confirms_flight_costs),
        "Round 2 Confirms Visa Responsibility": formatBoolean(application.section6_round_2?.confirms_visa_responsibility),
        "Round 2 Concerns": formatValue(application.section6_round_2?.final_round_concerns),

        "Offer Acceptance Full Name On Passport": formatValue(application.offerAcceptance?.full_name_on_passport),
        "Offer Acceptance Nationality": formatValue(application.offerAcceptance?.nationality),
        "Offer Acceptance Passport Number": formatValue(application.offerAcceptance?.passport_number),
        "Offer Acceptance Transfer Confirmed": formatBoolean(application.offerAcceptance?.transfer_confirmed),
        "Offer Acceptance Started At": formatValue(application.offerAcceptance?.startedAt),
        "Offer Acceptance Submitted At": formatValue(application.offerAcceptance?.submittedAt),

        "Admin Notes": formatNotes(application.adminData?.notes),
    }));
}

export function downloadApplicationsExcel(applications: Application[], options?: { selectedOnly?: boolean }) {
    const rows = buildAdminApplicationExportRows(applications);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.min(Math.max(key.length + 4, 16), 40),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");

    const dateStamp = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    const suffix = options?.selectedOnly ? "-selected" : "";
    XLSX.writeFile(workbook, `applicants-export-${dateStamp}${suffix}.xlsx`);
}
