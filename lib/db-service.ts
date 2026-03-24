import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    arrayUnion,
    deleteField,
} from 'firebase/firestore';
import { Application } from '@/lib/types';
import { getSyncedInternalDecision } from '@/lib/admin-workflow';

const COLLECTION = 'applications';

function getDecisionEmailType(status: string) {
    if (status === 'accepted') return 'decision_accepted';
    if (status === 'rejected') return 'decision_rejected';
    if (status === 'waitlisted') return 'decision_waitlisted';
    return null;
}

function getNotificationRecipients(data: Record<string, any>): string[] {
    const personalEmail = data.section1_personal?.personal_email;
    const cambridgeEmail = data.section1_personal?.cambridge_email;

    return [personalEmail, cambridgeEmail]
        .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)
        .map((email) => email.trim())
        .filter((email, index, emails) => emails.indexOf(email) === index);
}

async function triggerAiReviewGeneration(applicationId: string, round: 'round1' | 'round2') {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Unable to trigger AI review: User is not authenticated.");
    }

    const token = await currentUser.getIdToken();
    const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            applicationId,
            round,
        }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || `Failed to trigger AI review for ${round}.`);
    }
}

export const dbService = {
    // Get user's application
    async getMyApplication(userId: string): Promise<Application | null> {
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
        } as Application;
    },

    // Create a new draft application
    async createApplication(userId: string, email?: string): Promise<Application> {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("Unable to create application: User is not authenticated.");
        }
        if (currentUser.uid !== userId) {
            throw new Error("Unable to create application: Authentication mismatch.");
        }

        const timestamp = new Date().toISOString();
        const initialData = {
            userId,
            status: 'draft',
            section1_personal: {
                full_name: currentUser.displayName || '',
                personal_email: email || currentUser.email || '',
            },
            createdAt: timestamp,
            lastUpdatedAt: timestamp,
        };

        const docRef = doc(db, COLLECTION, userId);
        await setDoc(docRef, initialData);

        return {
            id: userId,
            ...initialData,
        } as Application;
    },

    // Save application data
    async saveApplication(userId: string, data: Partial<Application>) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        const updates: Record<string, unknown> = {
            lastUpdatedAt: timestamp,
        };

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'id' || key === 'userId' || key === 'lastUpdatedAt') return;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Flatten nested objects for Firestore dot notation update
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (subValue !== undefined) {
                        updates[`${key}.${subKey}`] = subValue;
                    }
                });
            } else if (value !== undefined) {
                updates[key] = value;
            }
        });

        await updateDoc(docRef, updates);
    },

    // Submit application
    async submitApplication(userId: string) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        await updateDoc(docRef, {
            status: 'under_review',
            submittedAt: timestamp,
            lastUpdatedAt: timestamp,
        });

        // Email notification via API route
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const recipients = getNotificationRecipients(data);
                const name = data.section1_personal?.full_name || '';

                if (recipients.length > 0) {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: recipients,
                            subject: 'Application Update - Jianshan Scholarship 2026',
                            type: 'submission',
                            name,
                        }),
                    }).catch(err => console.error("Failed to send submission email:", err));
                }
            }
        } catch (err) {
            console.error("Notification error:", err);
        }

        try {
            await triggerAiReviewGeneration(userId, 'round1');
        } catch (err) {
            console.error("Round 1 AI review trigger failed:", err);
        }
    },

    // Submit round 2 application
    async submitRound2Application(userId: string, round2Data: NonNullable<Application['section6_round_2']>) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        await updateDoc(docRef, {
            status: 'round_2_under_review',
            'adminData.internalDecision': null,
            section6_round_2: round2Data,
            lastUpdatedAt: timestamp,
        });

        // Email notification via API route
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const recipients = getNotificationRecipients(data);
                const name = data.section1_personal?.full_name || '';

                if (recipients.length > 0) {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: recipients,
                            subject: 'Final Round Submission Received - Jianshan Scholarship 2026',
                            type: 'round2_submission',
                            name,
                        }),
                    }).catch(err => console.error("Failed to send round 2 submission email:", err));
                }
            }
        } catch (err) {
            console.error("Round 2 notification error:", err);
        }

        try {
            await triggerAiReviewGeneration(userId, 'round2');
        } catch (err) {
            console.error("Round 2 AI review trigger failed:", err);
        }
    },

    // Save round 2 draft without changing the application status
    async saveRound2Draft(userId: string, round2Data: Partial<NonNullable<Application['section6_round_2']>>) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        await updateDoc(docRef, {
            section6_round_2: round2Data,
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Get all applications (requires admin token)
    async getAllApplications(): Promise<Application[]> {
        // This should be called from server-side or via API route for security
        // For client-side admin, we use Firestore rules with Custom Claims
        const querySnapshot = await getDocs(collection(db, COLLECTION));
        const apps: Application[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            apps.push({
                id: docSnap.id,
                ...data,
            } as Application);
        });
        return apps;
    },

    // Admin: Update application status directly
    async updateApplicationStatus(applicationId: string, newStatus: string) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, applicationId);
        await updateDoc(docRef, {
            status: newStatus,
            lastUpdatedAt: timestamp,
        });

        // Send email notification for decisions
        if (['accepted', 'rejected', 'waitlisted'].includes(newStatus)) {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const recipients = getNotificationRecipients(data);
                const name = data.section1_personal?.full_name || '';
                const emailType = getDecisionEmailType(newStatus);
                if (recipients.length > 0) {
                    try {
                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: recipients,
                                subject: 'Application Update - Jianshan Scholarship 2026',
                                type: emailType,
                                name,
                                decision: newStatus,
                            }),
                        });
                    } catch (err) {
                        console.error("Failed to send decision email:", err);
                    }
                }
            }
        }
    },

    // Admin: Add note to application
    async addAdminNote(applicationId: string, content: string, author: string) {
        const timestamp = new Date().toISOString();
        const newNote = { content, author, createdAt: timestamp };
        const docRef = doc(db, COLLECTION, applicationId);
        await updateDoc(docRef, {
            'adminData.notes': arrayUnion(newNote),
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Add Note (legacy method name)
    async addApplicationNote(userId: string, note: string, author: string) {
        const timestamp = new Date().toISOString();
        const newNote = { content: note, author, date: timestamp };
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            'adminData.notes': arrayUnion(newNote),
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Set Internal Decision
    async setInternalDecision(userId: string, decision: 'shortlisted' | 'accepted' | 'rejected' | 'waitlisted' | null) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            'adminData.internalDecision': decision,
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Set application rating
    async setApplicationRating(
        applicationId: string,
        input: { adminUid: string; adminName: string; adminEmail: string; score: number },
    ) {
        if (!Number.isInteger(input.score) || input.score < 1 || input.score > 10) {
            throw new Error("Rating score must be an integer between 1 and 10.");
        }

        if (!input.adminUid) {
            throw new Error("Admin UID is required to save a rating.");
        }

        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, applicationId);
        await updateDoc(docRef, {
            [`adminData.ratings.${input.adminUid}.score`]: input.score,
            [`adminData.ratings.${input.adminUid}.adminName`]: input.adminName || "",
            [`adminData.ratings.${input.adminUid}.adminEmail`]: input.adminEmail || "",
            [`adminData.ratings.${input.adminUid}.updatedAt`]: timestamp,
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Release Result
    async releaseResult(userId: string) {
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const decision = data.adminData?.internalDecision;
        if (!decision) {
            throw new Error("No internal decision marked to release.");
        }

        let publicStatus = '';
        const timestamp = new Date().toISOString();

        if (decision === 'shortlisted') publicStatus = 'shortlisted';
        if (decision === 'accepted') publicStatus = 'accepted';
        if (decision === 'rejected') publicStatus = 'rejected';
        if (decision === 'waitlisted') publicStatus = 'waitlisted';

        await updateDoc(docRef, {
            status: publicStatus,
            decisionReleasedAt: timestamp,
            lastUpdatedAt: timestamp,
        });

        // Send email notification
        const recipients = getNotificationRecipients(data);
        const name = data.section1_personal?.full_name || '';

        if (recipients.length > 0) {
            try {
                const emailType = publicStatus === 'shortlisted'
                    ? 'round2'
                    : getDecisionEmailType(publicStatus);
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipients,
                        subject: 'Application Update - Jianshan Scholarship 2026',
                        type: emailType,
                        name,
                        decision: publicStatus,
                    }),
                });
            } catch (err) {
                console.error("Failed to send decision email:", err);
            }
        }
    },

    // Admin: Delete Application
    async deleteApplication(userId: string) {
        const docRef = doc(db, COLLECTION, userId);
        await deleteDoc(docRef);
    },

    // Dev Tool: Reset Application
    async resetApplication(userId: string) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            status: 'draft',
            lastUpdatedAt: timestamp,
            submittedAt: deleteField(),
        });
    },

    // Applicant: Start acceptance flow (accepted → accepted_pending_payment)
    async startOfferAcceptance(userId: string) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error("Application not found.");
        }

        const data = docSnap.data();
        const currentStatus = data.status;

        await updateDoc(docRef, {
            status: currentStatus === 'accepted_paid' ? 'accepted_paid' : 'accepted_pending_payment',
            'offerAcceptance.startedAt': data.offerAcceptance?.startedAt || timestamp,
            lastUpdatedAt: timestamp,
        });
    },

    // Applicant: Submit deposit confirmation and passport details
    async submitOfferAcceptance(userId: string, acceptanceData: NonNullable<Application['offerAcceptance']>) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        await updateDoc(docRef, {
            status: 'accepted_paid',
            'offerAcceptance.full_name_on_passport': acceptanceData.full_name_on_passport || '',
            'offerAcceptance.nationality': acceptanceData.nationality || '',
            'offerAcceptance.passport_number': acceptanceData.passport_number || '',
            'offerAcceptance.transfer_confirmed': !!acceptanceData.transfer_confirmed,
            'offerAcceptance.startedAt': acceptanceData.startedAt || timestamp,
            'offerAcceptance.submittedAt': timestamp,
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Confirm transfer has actually been received
    async confirmPaymentReceived(userId: string) {
        await this.moveApplicationStatus(userId, 'payment_received');
    },

    // Applicant: Explicitly decline the offer after acceptance is released
    async declineOffer(userId: string) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);

        await updateDoc(docRef, {
            status: 'offer_declined',
            lastUpdatedAt: timestamp,
        });
    },

    // Admin: Move application to any workflow status and sync internal decision
    async moveApplicationStatus(userId: string, newStatus: Application['status']) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("Application not found.");
        }

        const syncedDecision = getSyncedInternalDecision(newStatus);

        const updates: Record<string, unknown> = {
            status: newStatus,
            'adminData.internalDecision': syncedDecision,
            lastUpdatedAt: timestamp,
        };

        await updateDoc(docRef, updates);
    },

    // Applicant: Confirm Enrollment (legacy alias)
    async confirmEnrollment(userId: string) {
        await this.startOfferAcceptance(userId);
    },

    // Admin: Progress application to under_review
    async progressApplication(userId: string) {
        await this.moveApplicationStatus(userId, 'under_review');
    },
};
