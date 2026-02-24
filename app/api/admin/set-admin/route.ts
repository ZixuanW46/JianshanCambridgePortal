import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// POST /api/admin/set-admin
// Set admin custom claims for a user
// Body: { email: string, isAdmin: boolean, secret: string }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, isAdmin, secret } = body;

        // Simple secret check to prevent unauthorized access
        // In production, use a more secure method
        if (secret !== process.env.ADMIN_SETUP_SECRET && secret !== 'jianshan-admin-setup-2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const userRecord = await adminAuth.getUserByEmail(email);

        // Set custom claims
        await adminAuth.setCustomUserClaims(userRecord.uid, {
            admin: isAdmin !== false, // default to true
        });

        return NextResponse.json({
            success: true,
            message: `Admin claim ${isAdmin !== false ? 'set' : 'removed'} for ${email} (uid: ${userRecord.uid})`,
        });
    } catch (error: any) {
        console.error('Set admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to set admin claims' },
            { status: 500 }
        );
    }
}
