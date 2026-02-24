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
    serverTimestamp,
} from 'firebase/firestore';
import { Application } from '@/lib/types';

const COLLECTION = 'applications';

export const dbService = {
    // Get user's application
    async getMyApplication(userId: string): Promise<Application | null> {
        const docRef = doc(db, COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
            id: docSnap.id,
            userId: data.userId,
            status: data.status,
            submittedAt: data.submittedAt,
            createdAt: data.createdAt,
            lastUpdatedAt: data.lastUpdatedAt,
            personalInfo: {
                firstName: data.personalInfo?.firstName || '',
                lastName: data.personalInfo?.lastName || '',
                email: data.personalInfo?.email || '',
                phone: data.personalInfo?.phone || '',
                dateOfBirth: data.personalInfo?.dateOfBirth || '',
                nationality: data.personalInfo?.nationality || '',
                gender: data.personalInfo?.gender || '',
                university: data.personalInfo?.university || '',
                college: data.personalInfo?.college || '',
                department: data.personalInfo?.department || '',
                programme: data.personalInfo?.programme || '',
                yearOfStudy: data.personalInfo?.yearOfStudy || '',
                subjects: data.personalInfo?.subjects || [],
                otherSubject: data.personalInfo?.otherSubject || '',
            },
            essays: {
                motivation: data.essays?.motivation || '',
                experience: data.essays?.experience || '',
                additionalInfo: data.essays?.additionalInfo || '',
            },
            misc: {
                availability: data.misc?.availability || [],
                dietaryRestrictions: data.misc?.dietaryRestrictions || '',
                referralSource: data.misc?.referralSource || '',
                agreedToTerms: data.misc?.agreedToTerms || false,
            },
            adminData: data.adminData,
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
            personalInfo: {
                firstName: currentUser.displayName?.split(' ')[0] || '',
                lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
                email: email || currentUser.email || '',
                university: '',
                college: '',
                department: '',
                programme: '',
                yearOfStudy: '',
                subjects: [],
            },
            createdAt: timestamp,
            lastUpdatedAt: timestamp,
            essays: {},
            misc: {
                availability: [],
                dietaryRestrictions: '',
                referralSource: '',
                agreedToTerms: false,
            },
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

        const updates: Record<string, any> = {
            lastUpdatedAt: timestamp,
        };

        if (data.personalInfo) {
            // Flatten personalInfo for Firestore update
            Object.entries(data.personalInfo).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates[`personalInfo.${key}`] = value;
                }
            });
        }

        if (data.essays) {
            Object.entries(data.essays).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates[`essays.${key}`] = value;
                }
            });
        }

        if (data.misc) {
            Object.entries(data.misc).forEach(([key, value]) => {
                if (value !== undefined) {
                    updates[`misc.${key}`] = value;
                }
            });
        }

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
                const email = data.personalInfo?.email;
                const name = `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim();

                if (email) {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: 'Application Received – Cambridge Tutor Programme',
                            type: 'submission',
                            name,
                        }),
                    }).catch(err => console.error("Failed to send submission email:", err));
                }
            }
        } catch (err) {
            console.error("Notification error:", err);
        }
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
                const email = data.personalInfo?.email;
                const name = `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim();
                if (email) {
                    try {
                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: email,
                                subject: 'Application Update – Cambridge Tutor Programme',
                                type: 'decision',
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
    async setInternalDecision(userId: string, decision: 'accepted' | 'rejected' | 'waitlisted' | null) {
        const timestamp = new Date().toISOString();
        const docRef = doc(db, COLLECTION, userId);
        await updateDoc(docRef, {
            'adminData.internalDecision': decision,
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

        if (decision === 'accepted') publicStatus = 'accepted';
        if (decision === 'rejected') publicStatus = 'rejected';
        if (decision === 'waitlisted') publicStatus = 'waitlisted';

        await updateDoc(docRef, {
            status: publicStatus,
            lastUpdatedAt: timestamp,
        });

        // Send email notification
        const email = data.personalInfo?.email;
        const name = `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim();

        if (email) {
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email,
                        subject: 'Application Update – Cambridge Tutor Programme',
                        type: 'decision',
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
};
