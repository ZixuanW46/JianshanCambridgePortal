import React from "react";
import { Application } from "@/lib/types";

function formatDate(dateStr?: string) {
    if (!dateStr) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

interface OfferLetterTemplateProps {
    application: Application;
}

export const OfferLetterTemplate = React.forwardRef<HTMLDivElement, OfferLetterTemplateProps>(
    function OfferLetterTemplate({ application }, ref) {
        const name = [application.personalInfo?.firstName, application.personalInfo?.lastName].filter(Boolean).join(' ') || "Applicant";
        const year = "2026";
        const decisionDate = formatDate(application.decisionReleasedAt);
        const appId = application.id?.slice(0, 8).toUpperCase() || "";

        return (
            <div
                ref={ref}
                id="offer-letter-container"
                style={{
                    width: "794px",
                    height: "1123px",
                    backgroundColor: "#ffffff",
                    position: "relative",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    fontFamily: "'Times New Roman', Times, serif",
                    color: "#1f495b",
                }}
            >
                {/* Background Decoration */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
                    <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(225, 177, 104, 0.05)" }} />
                    <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(31, 73, 91, 0.03)" }} />
                </div>

                <div style={{ position: "relative", zIndex: 1, padding: "80px 80px", height: "100%", display: "flex", flexDirection: "column" }}>
                    {/* Header */}
                    <div style={{ borderBottom: "1px solid rgba(31, 73, 91, 0.1)", paddingBottom: "20px", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <img src="/logo_black.png" alt="Logo" style={{ height: "40px", width: "auto" }} crossOrigin="anonymous" />
                                <span style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "0.05em", color: "#1f495b", fontFamily: "Arial, sans-serif" }}>
                                    Jianshan Academy
                                </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(31, 73, 91, 0.6)", fontFamily: "Arial, sans-serif" }}>
                                Admissions Office
                            </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(31, 73, 91, 0.4)", fontFamily: "Arial, sans-serif" }}>
                            {decisionDate}
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.15em", color: "#E1B168", marginBottom: "16px", fontFamily: "Arial, sans-serif" }}>
                            Official Admission Decision
                        </div>

                        <h1 style={{ fontSize: "48px", fontWeight: 800, margin: "0 0 32px 0", color: "#1f495b", lineHeight: "1.1" }}>
                            Congratulations!
                        </h1>

                        <p style={{ fontSize: "16px", marginBottom: "24px", fontFamily: "Arial, sans-serif" }}>
                            Dear <strong>{name}</strong>,
                        </p>

                        <div style={{ fontSize: "16px", lineHeight: "1.8", color: "#1f495b", textAlign: "justify" }}>
                            <p style={{ marginBottom: "20px" }}>
                                We are delighted to inform you that you have been accepted as a <strong style={{ color: "#1f495b" }}>Cambridge Tutor for the Jianshan Summer Program {year}</strong>.
                            </p>
                            <p style={{ marginBottom: "20px" }}>
                                Your application stood out among a highly competitive pool of candidates. The selection committee was deeply impressed by your academic achievements, teaching experience, and your passion for mentoring young students.
                            </p>
                            <p style={{ marginBottom: "20px" }}>
                                We look forward to seeing the unique perspective you will bring to the program.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div style={{ marginTop: "40px", marginBottom: "40px", padding: "30px", backgroundColor: "rgba(31, 73, 91, 0.03)", borderRadius: "8px", display: "flex", justifyContent: "space-between", border: "1px solid rgba(31, 73, 91, 0.05)" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: "11px", color: "#E1B168", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>Program Dates</div>
                                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1f495b" }}>July 15 – Aug 1</div>
                            </div>
                            <div style={{ width: "1px", backgroundColor: "rgba(31, 73, 91, 0.1)" }}></div>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: "11px", color: "#E1B168", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>Role</div>
                                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1f495b" }}>Cambridge Tutor</div>
                            </div>
                            <div style={{ width: "1px", backgroundColor: "rgba(31, 73, 91, 0.1)" }}></div>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <div style={{ fontSize: "11px", color: "#E1B168", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>Cohort</div>
                                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1f495b" }}>Class of {year}</div>
                            </div>
                        </div>

                        <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#1f495b" }}>
                            We eagerly await your confirmation and look forward to welcoming you to the Jianshan Academy community!
                        </p>
                    </div>

                    {/* Signature */}
                    <div style={{ marginTop: "60px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ fontSize: "24px", fontStyle: "italic", fontFamily: "'Brush Script MT', cursive", color: "#1f495b", marginBottom: "10px" }}>
                            Sarah Jenkins
                        </div>
                        <div style={{ width: "200px", height: "1px", backgroundColor: "#1f495b", opacity: 0.2, marginBottom: "10px" }}></div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1f495b", fontFamily: "Arial, sans-serif" }}>Sarah Jenkins</div>
                        <div style={{ fontSize: "12px", color: "rgba(31, 73, 91, 0.6)", fontFamily: "Arial, sans-serif" }}>Director of Admissions</div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: "auto", paddingTop: "60px", borderTop: "1px solid rgba(31, 73, 91, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "rgba(31, 73, 91, 0.4)", fontFamily: "Arial, sans-serif" }}>
                        <div>© {year} Jianshan Academy. All rights reserved.</div>
                        <div style={{ letterSpacing: "0.1em" }}>APP ID: {appId}</div>
                    </div>
                </div>
            </div>
        );
    }
);
